import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchHistory } from '../entities/search-history.entity';
import { CreateSearchHistoryDto } from '../dto/create-search-history.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class SearchHistoryService {
  private readonly logger = new Logger(SearchHistoryService.name);

  constructor(
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  async create(user: User, createSearchHistoryDto: CreateSearchHistoryDto): Promise<SearchHistory> {
    try {
      const searchHistory = this.searchHistoryRepository.create({
        userId: user.id,
        ...createSearchHistoryDto,
      });

      return await this.searchHistoryRepository.save(searchHistory);
    } catch (error) {
      this.logger.error('Error creating search history:', error.message);
      throw error;
    }
  }

  async findAll(options: {
    userId?: string;
    category?: string;
    searchTerm?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      const query = this.searchHistoryRepository.createQueryBuilder('searchHistory')
        .leftJoinAndSelect('searchHistory.user', 'user');

      if (options.userId) {
        query.andWhere('searchHistory.userId = :userId', { userId: options.userId });
      }

      if (options.category) {
        query.andWhere('searchHistory.category = :category', { category: options.category });
      }

      if (options.searchTerm) {
        query.andWhere('searchHistory.searchTerm ILIKE :searchTerm', { searchTerm: `%${options.searchTerm}%` });
      }

      if (options.startDate) {
        query.andWhere('searchHistory.createdAt >= :startDate', { startDate: options.startDate });
      }

      if (options.endDate) {
        query.andWhere('searchHistory.createdAt <= :endDate', { endDate: options.endDate });
      }

      query.orderBy('searchHistory.createdAt', 'DESC')
        .skip(options.offset || 0)
        .take(options.limit || 10);

      const [items, total] = await query.getManyAndCount();

      return {
        items,
        total,
      };
    } catch (error) {
      this.logger.error('Error finding search history:', error.message);
      throw error;
    }
  }

  async findOne(id: string): Promise<SearchHistory> {
    try {
      const searchHistory = await this.searchHistoryRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!searchHistory) {
        throw new NotFoundException(`Search history with ID ${id} not found`);
      }

      return searchHistory;
    } catch (error) {
      this.logger.error('Error finding search history:', error.message);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error finding search history: ${error.message}`);
    }
  }

  async findByUser(userId: string, options: {
    category?: string;
    searchTerm?: string;
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

  async findPopularSearches(options: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<{ searchTerm: string; count: number }[]> {
    try {
      const query = this.searchHistoryRepository.createQueryBuilder('searchHistory')
        .select('searchHistory.searchTerm', 'searchTerm')
        .addSelect('COUNT(*)', 'count')
        .groupBy('searchHistory.searchTerm');

      if (options.category) {
        query.andWhere('searchHistory.category = :category', { category: options.category });
      }

      if (options.startDate) {
        query.andWhere('searchHistory.createdAt >= :startDate', { startDate: options.startDate });
      }

      if (options.endDate) {
        query.andWhere('searchHistory.createdAt <= :endDate', { endDate: options.endDate });
      }

      query.orderBy('count', 'DESC')
        .limit(options.limit || 10);

      const results = await query.getRawMany();

      return results.map(result => ({
        searchTerm: result.searchTerm,
        count: parseInt(result.count, 10),
      }));
    } catch (error) {
      this.logger.error('Error finding popular searches:', error.message);
      throw error;
    }
  }
} 