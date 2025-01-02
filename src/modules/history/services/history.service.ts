import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History, ActionType } from '../entities/history.entity';
import { CreateHistoryDto } from '../dto/create-history.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,
  ) {}

  async create(user: User, createHistoryDto: CreateHistoryDto): Promise<History> {
    try {
      const history = this.historyRepository.create({
        userId: user.id,
        ...createHistoryDto,
      });

      return await this.historyRepository.save(history);
    } catch (error) {
      this.logger.error(`Error creating history entry: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(options: {
    userId?: string;
    entityType?: string;
    actionType?: ActionType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ items: History[]; total: number }> {
    try {
      const {
        userId,
        entityType,
        actionType,
        startDate,
        endDate,
        limit = 10,
        offset = 0,
      } = options;

      const queryBuilder = this.historyRepository
        .createQueryBuilder('history')
        .leftJoinAndSelect('history.user', 'user');

      if (userId) {
        queryBuilder.andWhere('history.userId = :userId', { userId });
      }

      if (entityType) {
        queryBuilder.andWhere('history.entityType = :entityType', { entityType });
      }

      if (actionType) {
        queryBuilder.andWhere('history.actionType = :actionType', { actionType });
      }

      if (startDate) {
        queryBuilder.andWhere('history.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('history.createdAt <= :endDate', { endDate });
      }

      const [items, total] = await queryBuilder
        .orderBy('history.createdAt', 'DESC')
        .take(limit)
        .skip(offset)
        .getManyAndCount();

      return { items, total };
    } catch (error) {
      this.logger.error(`Error finding history entries: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<History> {
    try {
      const history = await this.historyRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!history) {
        throw new Error(`History entry with ID ${id} not found`);
      }

      return history;
    } catch (error) {
      this.logger.error(`Error finding history entry: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByUser(userId: string, options: {
    entityType?: string;
    actionType?: ActionType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ items: History[]; total: number }> {
    return this.findAll({ ...options, userId });
  }

  async findByEntity(entityId: string, entityType: string): Promise<History[]> {
    try {
      return await this.historyRepository.find({
        where: { entityId, entityType },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error finding history entries by entity: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteOldEntries(days: number = 30): Promise<void> {
    try {
      const date = new Date();
      date.setDate(date.getDate() - days);

      await this.historyRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt <= :date', { date })
        .execute();
    } catch (error) {
      this.logger.error(`Error deleting old history entries: ${error.message}`, error.stack);
      throw error;
    }
  }
} 