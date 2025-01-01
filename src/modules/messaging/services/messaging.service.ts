import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { PaginatedResponse, PaginationDto } from '../dto/pagination.dto';
import { SearchMessagesDto } from '../dto/search-messages.dto';
import { Message, MessageStatus } from '../entities/message.entity';
import {
  ConversationResult,
  ConversationWithDetails,
} from '../interfaces/conversation.interface';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const { recipientId, productId, content } = createMessageDto;

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
      content,
      senderId,
      recipientId,
      productId,
      status: MessageStatus.SENT,
    });

    return await this.messageRepository.save(message);
  }

  async getConversation(
    userId: string,
    otherUserId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<Message>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: [
        {
          senderId: userId,
          recipientId: otherUserId,
          archivedBySender: false,
        },
        {
          senderId: otherUserId,
          recipientId: userId,
          archivedByRecipient: false,
        },
      ],
      order: { createdAt: 'DESC' },
      relations: ['sender', 'recipient', 'product'],
      skip,
      take: pagination.limit,
    });

    const lastPage = Math.ceil(total / pagination.limit);

    return {
      data: messages,
      meta: {
        total,
        page: pagination.page,
        lastPage,
      },
    };
  }

  async getUserConversations(
    userId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<ConversationWithDetails>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const query = this.messageRepository
      .createQueryBuilder('message')
      .select([
        'CASE WHEN message.sender_id = :userId THEN message.recipient_id ELSE message.sender_id END as otherUserId',
        'MAX(message.created_at) as lastMessageDate',
        'COUNT(CASE WHEN message.status = :unreadStatus AND message.recipient_id = :userId THEN 1 END) as unreadCount',
      ])
      .where(
        '(message.sender_id = :userId AND message.archived_by_sender = false) OR (message.recipient_id = :userId AND message.archived_by_recipient = false)',
        { userId },
      )
      .setParameter('unreadStatus', MessageStatus.SENT)
      .groupBy('otherUserId')
      .orderBy('lastMessageDate', 'DESC')
      .offset(skip)
      .limit(pagination.limit);

    const [rawConversations, total] = await Promise.all([
      query.getRawMany(),
      query.getCount(),
    ]);

    const conversationsWithDetails = await Promise.all(
      rawConversations.map(async (conv: ConversationResult) => {
        const otherUser = await this.userRepository.findOne({
          where: { id: conv.otherUserId },
          select: ['id', 'firstName', 'lastName', 'email', 'avatar'],
        });

        const lastMessage = await this.messageRepository.findOne({
          where: [
            { senderId: userId, recipientId: conv.otherUserId },
            { senderId: conv.otherUserId, recipientId: userId },
          ],
          order: { createdAt: 'DESC' },
        });

        return {
          otherUser,
          lastMessage,
          unreadCount: parseInt(conv.unreadCount?.toString() || '0'),
          lastMessageDate: conv.lastMessageDate,
        };
      }),
    );

    const lastPage = Math.ceil(total / pagination.limit);

    return {
      data: conversationsWithDetails,
      meta: {
        total,
        page: pagination.page,
        lastPage,
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

    message.status = MessageStatus.READ;
    return await this.messageRepository.save(message);
  }

  async markConversationAsRead(
    userId: string,
    otherUserId: string,
  ): Promise<void> {
    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.READ })
      .where('recipient_id = :userId AND sender_id = :otherUserId', {
        userId,
        otherUserId,
      })
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
      '(message.sender_id = :userId AND message.archived_by_sender = false) OR (message.recipient_id = :userId AND message.archived_by_recipient = false)',
      { userId },
    );

    if (searchDto.query) {
      queryBuilder.andWhere('message.content ILIKE :query', {
        query: `%${searchDto.query}%`,
      });
    }

    if (searchDto.productId) {
      queryBuilder.andWhere('message.product_id = :productId', {
        productId: searchDto.productId,
      });
    }

    if (searchDto.userId) {
      queryBuilder.andWhere(
        '(message.sender_id = :otherUserId OR message.recipient_id = :otherUserId)',
        { otherUserId: searchDto.userId },
      );
    }

    queryBuilder
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .leftJoinAndSelect('message.product', 'product')
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(pagination.limit);

    const [messages, total] = await queryBuilder.getManyAndCount();
    const lastPage = Math.ceil(total / pagination.limit);

    return {
      data: messages,
      meta: {
        total,
        page: pagination.page,
        lastPage,
      },
    };
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
          'CASE WHEN sender_id = :userId THEN true ELSE archived_by_sender END',
        archivedByRecipient: () =>
          'CASE WHEN recipient_id = :userId THEN true ELSE archived_by_recipient END',
      })
      .where(
        '(sender_id = :userId AND recipient_id = :otherUserId) OR (sender_id = :otherUserId AND recipient_id = :userId)',
        { userId, otherUserId },
      )
      .execute();
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
          'CASE WHEN sender_id = :userId THEN false ELSE archived_by_sender END',
        archivedByRecipient: () =>
          'CASE WHEN recipient_id = :userId THEN false ELSE archived_by_recipient END',
      })
      .where(
        '(sender_id = :userId AND recipient_id = :otherUserId) OR (sender_id = :otherUserId AND recipient_id = :userId)',
        { userId, otherUserId },
      )
      .execute();
  }

  async getArchivedConversations(
    userId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<ConversationWithDetails>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const query = this.messageRepository
      .createQueryBuilder('message')
      .select([
        'CASE WHEN message.sender_id = :userId THEN message.recipient_id ELSE message.sender_id END as otherUserId',
        'MAX(message.created_at) as lastMessageDate',
      ])
      .where(
        '(message.sender_id = :userId AND message.archived_by_sender = true) OR (message.recipient_id = :userId AND message.archived_by_recipient = true)',
        { userId },
      )
      .groupBy('otherUserId')
      .orderBy('lastMessageDate', 'DESC')
      .offset(skip)
      .limit(pagination.limit);

    const [rawConversations, total] = await Promise.all([
      query.getRawMany(),
      query.getCount(),
    ]);

    const conversationsWithDetails = await Promise.all(
      rawConversations.map(async (conv: ConversationResult) => {
        const otherUser = await this.userRepository.findOne({
          where: { id: conv.otherUserId },
          select: ['id', 'firstName', 'lastName', 'email', 'avatar'],
        });

        const lastMessage = await this.messageRepository.findOne({
          where: [
            { senderId: userId, recipientId: conv.otherUserId },
            { senderId: conv.otherUserId, recipientId: userId },
          ],
          order: { createdAt: 'DESC' },
        });

        return {
          otherUser,
          lastMessage,
          lastMessageDate: conv.lastMessageDate,
        };
      }),
    );

    const lastPage = Math.ceil(total / pagination.limit);

    return {
      data: conversationsWithDetails,
      meta: {
        total,
        page: pagination.page,
        lastPage,
      },
    };
  }

  async archiveMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: [
        { id: messageId, senderId: userId },
        { id: messageId, recipientId: userId },
      ],
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    if (message.senderId === userId) {
      message.archivedBySender = true;
    }
    if (message.recipientId === userId) {
      message.archivedByRecipient = true;
    }

    return await this.messageRepository.save(message);
  }

  async unarchiveMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: [
        { id: messageId, senderId: userId },
        { id: messageId, recipientId: userId },
      ],
    });

    if (!message) {
      throw new NotFoundException('Message non trouvé');
    }

    if (message.senderId === userId) {
      message.archivedBySender = false;
    }
    if (message.recipientId === userId) {
      message.archivedByRecipient = false;
    }

    return await this.messageRepository.save(message);
  }

  async getArchivedMessages(
    userId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResponse<Message>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const queryBuilder = this.messageRepository.createQueryBuilder('message');

    queryBuilder
      .where(
        '(message.sender_id = :userId AND message.archived_by_sender = true) OR (message.recipient_id = :userId AND message.archived_by_recipient = true)',
        { userId },
      )
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .leftJoinAndSelect('message.product', 'product')
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(pagination.limit);

    const [messages, total] = await queryBuilder.getManyAndCount();
    const lastPage = Math.ceil(total / pagination.limit);

    return {
      data: messages,
      meta: {
        total,
        page: pagination.page,
        lastPage,
      },
    };
  }
}
