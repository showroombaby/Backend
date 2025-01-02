import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageHistory, MessageAction } from '../entities/message-history.entity';
import { CreateMessageHistoryDto } from '../dto/create-message-history.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class MessageHistoryService {
  private readonly logger = new Logger(MessageHistoryService.name);

  constructor(
    @InjectRepository(MessageHistory)
    private readonly messageHistoryRepository: Repository<MessageHistory>,
  ) {}

  async create(user: User, createMessageHistoryDto: CreateMessageHistoryDto): Promise<MessageHistory> {
    try {
      const messageHistory = this.messageHistoryRepository.create({
        senderId: user.id,
        ...createMessageHistoryDto,
      });

      return await this.messageHistoryRepository.save(messageHistory);
    } catch (error) {
      this.logger.error('Error creating message history:', error.message);
      throw error;
    }
  }

  async findAll(options: {
    userId?: string;
    action?: MessageAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      const query = this.messageHistoryRepository.createQueryBuilder('messageHistory')
        .leftJoinAndSelect('messageHistory.sender', 'sender')
        .leftJoinAndSelect('messageHistory.receiver', 'receiver');

      if (options.userId) {
        query.where('(messageHistory.senderId = :userId OR messageHistory.receiverId = :userId)', 
          { userId: options.userId });
      }

      if (options.action) {
        query.andWhere('messageHistory.action = :action', { action: options.action });
      }

      if (options.startDate) {
        query.andWhere('messageHistory.createdAt >= :startDate', { startDate: options.startDate });
      }

      if (options.endDate) {
        query.andWhere('messageHistory.createdAt <= :endDate', { endDate: options.endDate });
      }

      query.orderBy('messageHistory.createdAt', 'DESC')
        .skip(options.offset || 0)
        .take(options.limit || 10);

      const [items, total] = await query.getManyAndCount();

      return {
        items,
        total,
      };
    } catch (error) {
      this.logger.error('Error finding message history:', error.message);
      throw error;
    }
  }

  async findOne(id: string): Promise<MessageHistory> {
    try {
      const messageHistory = await this.messageHistoryRepository.findOne({
        where: { id },
        relations: ['sender', 'receiver'],
      });

      if (!messageHistory) {
        throw new NotFoundException(`Message history with ID ${id} not found`);
      }

      return messageHistory;
    } catch (error) {
      this.logger.error('Error finding message history:', error.message);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error finding message history: ${error.message}`);
    }
  }

  async findByUser(userId: string, options: {
    action?: MessageAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    return this.findAll({
      userId,
      ...options,
    });
  }

  async findByMessage(messageId: string): Promise<MessageHistory[]> {
    try {
      return await this.messageHistoryRepository.find({
        where: { messageId },
        relations: ['sender', 'receiver'],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error) {
      this.logger.error('Error finding message history:', error.message);
      throw error;
    }
  }
} 