import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { CreateMessageDto, MessageResponseDto, ConversationDto } from '../dto/message.dto';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createMessage(senderId: string, createMessageDto: CreateMessageDto): Promise<MessageResponseDto> {
    const { receiverId, content, productId } = createMessageDto;

    const [sender, receiver] = await Promise.all([
      this.userRepository.findOne({ where: { id: senderId } }),
      this.userRepository.findOne({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    let product = undefined;
    if (productId) {
      product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['images'],
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    const message = this.messageRepository.create({
      content,
      senderId,
      receiverId,
      productId,
      sender,
      receiver,
      product,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);
    return this.transformToMessageResponse(savedMessage);
  }

  async getConversations(userId: string): Promise<ConversationDto[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .leftJoinAndSelect('message.product', 'product')
      .leftJoinAndSelect('product.images', 'images')
      .where('message.senderId = :userId OR message.receiverId = :userId', {
        userId,
      })
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    const conversationMap = new Map<string, ConversationDto>();

    for (const message of messages) {
      const otherUser =
        message.sender.id === userId ? message.receiver : message.sender;
      const conversationKey = otherUser.id;

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          userId: otherUser.id,
          username: otherUser.username,
          avatarUrl: otherUser.avatarUrl,
          name: otherUser.name,
          email: otherUser.email,
          rating: otherUser.rating,
          lastMessage: message.content,
          unreadCount: 0,
          lastMessageDate: message.createdAt,
          productId: message.product?.id,
          productTitle: message.product?.title,
          productImage: message.product?.images[0]?.url,
        });
      }
    }

    return Array.from(conversationMap.values());
  }

  async getConversation(userId: string, otherUserId: string): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository.find({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      relations: ['sender', 'receiver', 'product', 'product.images'],
      order: { createdAt: 'ASC' },
    });

    // Marquer les messages comme lus
    const unreadMessages = messages.filter(m => !m.isRead && m.senderId === otherUserId);
    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(message => {
          message.isRead = true;
          return this.messageRepository.save(message);
        }),
      );
    }

    return messages.map(message => this.transformToMessageResponse(message));
  }

  private transformToMessageResponse(message: Message): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      sender: {
        id: message.sender.id,
        username: message.sender.username || 'Anonymous',
        avatarUrl: message.sender.avatarUrl,
        name: message.sender.name,
        email: message.sender.email,
        rating: message.sender.rating,
      },
      receiver: {
        id: message.receiver.id,
        username: message.receiver.username || 'Anonymous',
        avatarUrl: message.receiver.avatarUrl,
        name: message.receiver.name,
        email: message.receiver.email,
        rating: message.receiver.rating,
      },
      product: message.product ? {
        id: message.product.id,
        title: message.product.title,
        price: message.product.price,
        images: message.product.images || [],
      } : undefined,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  private async buildMessageResponse(message: Message): Promise<MessageResponseDto> {
    return {
      id: message.id,
      content: message.content,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        avatarUrl: message.sender.avatarUrl,
        name: message.sender.name,
        email: message.sender.email,
        rating: message.sender.rating,
      },
      receiver: {
        id: message.receiver.id,
        username: message.receiver.username,
        avatarUrl: message.receiver.avatarUrl,
        name: message.receiver.name,
        email: message.receiver.email,
        rating: message.receiver.rating,
      },
      product: message.product
        ? {
            id: message.product.id,
            title: message.product.title,
            price: message.product.price,
            images: message.product.images,
          }
        : undefined,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  private async buildConversationResponse(
    otherUser: User,
    message: Message,
  ): Promise<ConversationDto> {
    return {
      userId: otherUser.id,
      username: otherUser.username,
      avatarUrl: otherUser.avatarUrl,
      name: otherUser.name,
      email: otherUser.email,
      rating: otherUser.rating,
      lastMessage: message.content,
      unreadCount: 0,
      lastMessageDate: message.createdAt,
      productId: message.product?.id,
      productTitle: message.product?.title,
      productImage: message.product?.images[0]?.url,
    };
  }
} 