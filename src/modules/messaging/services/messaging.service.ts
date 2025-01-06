import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { PaginatedResponse, PaginationDto } from '../dto/pagination.dto';
import { SearchMessagesDto } from '../dto/search-messages.dto';
import { Message } from '../entities/message.entity';
import { ConversationWithDetails } from '../interfaces/conversation.interface';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async createMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const { recipientId, productId } = createMessageDto;

    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Destinataire non trouvé');
    }

    if (productId) {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException('Produit non trouvé');
      }
    }

    const message = this.messageRepository.create({
      content: createMessageDto.content,
      senderId: senderId,
      recipientId: createMessageDto.recipientId,
      productId: createMessageDto.productId,
      read: false,
      archivedBySender: false,
      archivedByRecipient: false,
    });

    return await this.messageRepository.save(message);
  }

  async getConversations(userId: string): Promise<Message[]> {
    return await this.messageRepository
      .createQueryBuilder('message')
      .where('(message.senderId = :userId OR message.recipientId = :userId)', {
        userId,
      })
      .orderBy('message.createdAt', 'DESC')
      .getMany();
  }

  async getUserConversations(
    userId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<ConversationWithDetails>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [conversations, total] = await this.messageRepository
      .createQueryBuilder('message')
      .where(
        '(message.senderId = :userId OR message.recipientId = :userId) AND NOT (message.archivedBySender = true AND message.senderId = :userId) AND NOT (message.archivedByRecipient = true AND message.recipientId = :userId)',
        { userId },
      )
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (message) => {
        const otherUserId =
          message.senderId === userId ? message.recipientId : message.senderId;
        const otherUser = await this.userRepository.findOne({
          where: { id: otherUserId },
          select: ['id', 'firstName', 'lastName', 'email', 'avatar'],
        });

        const unreadCount = await this.messageRepository.count({
          where: {
            senderId: otherUserId,
            recipientId: userId,
            read: false,
          },
        });

        return {
          otherUser,
          lastMessage: message,
          unreadCount,
          lastMessageDate: message.createdAt,
        };
      }),
    );

    return {
      data: conversationsWithDetails,
      meta: {
        total,
        page: pagination.page,
        lastPage: Math.ceil(total / pagination.limit),
      },
    };
  }

  async getConversation(
    userId: string,
    otherUserId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<Message>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [messages, total] = await this.messageRepository
      .createQueryBuilder('message')
      .where(
        '(message.senderId = :userId AND message.recipientId = :otherUserId) OR (message.senderId = :otherUserId AND message.recipientId = :userId)',
        { userId, otherUserId },
      )
      .orderBy('message.createdAt', 'ASC')
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      data: messages,
      meta: {
        total,
        page: pagination.page,
        lastPage: Math.ceil(total / pagination.limit),
      },
    };
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, recipientId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    message.read = true;
    return await this.messageRepository.save(message);
  }

  async markConversationAsRead(
    userId: string,
    otherUserId: string,
  ): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ read: true })
      .where(
        'recipientId = :userId AND senderId = :otherUserId AND read = false',
        {
          userId,
          otherUserId,
        },
      )
      .execute();
  }

  async searchMessages(
    userId: string,
    searchDto: SearchMessagesDto,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<Message>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const queryBuilder = this.messageRepository.createQueryBuilder('message');

    queryBuilder.where(
      '(message.senderId = :userId OR message.recipientId = :userId)',
      { userId },
    );

    if (searchDto.query) {
      queryBuilder.andWhere('message.content ILIKE :query', {
        query: `%${searchDto.query}%`,
      });
    }

    if (searchDto.productId) {
      queryBuilder.andWhere('message.productId = :productId', {
        productId: searchDto.productId,
      });
    }

    const [messages, total] = await queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      data: messages,
      meta: {
        total,
        page: pagination.page,
        lastPage: Math.ceil(total / pagination.limit),
      },
    };
  }

  async archiveMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    if (message.senderId === userId) {
      message.archivedBySender = true;
    } else if (message.recipientId === userId) {
      message.archivedByRecipient = true;
    } else {
      throw new NotFoundException('Message non trouvé');
    }

    return await this.messageRepository.save(message);
  }

  async archiveConversation(
    userId: string,
    otherUserId: string,
  ): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({
        archivedBySender: () =>
          'CASE WHEN "senderId" = :userId THEN true ELSE "archivedBySender" END',
        archivedByRecipient: () =>
          'CASE WHEN "recipientId" = :userId THEN true ELSE "archivedByRecipient" END',
      })
      .where(
        '("senderId" = :userId AND "recipientId" = :otherUserId) OR ("senderId" = :otherUserId AND "recipientId" = :userId)',
        { userId, otherUserId },
      )
      .execute();
  }

  async unarchiveMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    if (message.senderId === userId) {
      message.archivedBySender = false;
    } else if (message.recipientId === userId) {
      message.archivedByRecipient = false;
    } else {
      throw new NotFoundException('Message non trouvé');
    }

    return await this.messageRepository.save(message);
  }

  async unarchiveConversation(
    userId: string,
    otherUserId: string,
  ): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({
        archivedBySender: () =>
          'CASE WHEN "senderId" = :userId THEN false ELSE "archivedBySender" END',
        archivedByRecipient: () =>
          'CASE WHEN "recipientId" = :userId THEN false ELSE "archivedByRecipient" END',
      })
      .where(
        '("senderId" = :userId AND "recipientId" = :otherUserId) OR ("senderId" = :otherUserId AND "recipientId" = :userId)',
        { userId, otherUserId },
      )
      .execute();
  }

  async getArchivedMessages(
    userId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<Message>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [messages, total] = await this.messageRepository
      .createQueryBuilder('message')
      .where(
        '(message.senderId = :userId AND message.archivedBySender = true) OR (message.recipientId = :userId AND message.archivedByRecipient = true)',
        { userId },
      )
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      data: messages,
      meta: {
        total,
        page: pagination.page,
        lastPage: Math.ceil(total / pagination.limit),
      },
    };
  }

  async getArchivedConversations(
    userId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<ConversationWithDetails>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [conversations, total] = await this.messageRepository
      .createQueryBuilder('message')
      .where(
        '(message.senderId = :userId AND message.archivedBySender = true) OR (message.recipientId = :userId AND message.archivedByRecipient = true)',
        { userId },
      )
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (message) => {
        const otherUserId =
          message.senderId === userId ? message.recipientId : message.senderId;
        const otherUser = await this.userRepository.findOne({
          where: { id: otherUserId },
          select: ['id', 'firstName', 'lastName', 'email', 'avatar'],
        });

        const unreadCount = await this.messageRepository.count({
          where: {
            senderId: otherUserId,
            recipientId: userId,
            read: false,
          },
        });

        return {
          otherUser,
          lastMessage: message,
          unreadCount,
          lastMessageDate: message.createdAt,
        };
      }),
    );

    return {
      data: conversationsWithDetails,
      meta: {
        total,
        page: pagination.page,
        lastPage: Math.ceil(total / pagination.limit),
      },
    };
  }
}
