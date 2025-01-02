import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchHistoryService } from '../../services/search-history.service';
import { SearchHistory } from '../../entities/search-history.entity';
import { CreateSearchHistoryDto } from '../../dto/create-search-history.dto';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { NotFoundException } from '@nestjs/common';

describe('SearchHistoryService', () => {
  let service: SearchHistoryService;
  let repository: Repository<SearchHistory>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: Role.USER,
  };

  const mockSearchHistory: Partial<SearchHistory> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: mockUser.id,
    searchTerm: 'test search',
    category: 'products',
    filters: { price: { min: 0, max: 100 } },
    resultsCount: 42,
    createdAt: new Date(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockSearchHistory], 1]),
    getRawMany: jest.fn().mockResolvedValue([{ searchTerm: 'test', count: '5' }]),
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockSearchHistory),
    save: jest.fn().mockResolvedValue(mockSearchHistory),
    findOne: jest.fn().mockResolvedValue(mockSearchHistory),
    find: jest.fn().mockResolvedValue([mockSearchHistory]),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchHistoryService,
        {
          provide: getRepositoryToken(SearchHistory),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SearchHistoryService>(SearchHistoryService);
    repository = module.get<Repository<SearchHistory>>(getRepositoryToken(SearchHistory));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a search history entry', async () => {
      const dto: CreateSearchHistoryDto = {
        searchTerm: mockSearchHistory.searchTerm,
        category: mockSearchHistory.category,
        filters: mockSearchHistory.filters,
        resultsCount: mockSearchHistory.resultsCount,
      };

      const result = await service.create(mockUser as User, dto);

      expect(result).toEqual(mockSearchHistory);
      expect(repository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        ...dto,
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle errors when creating', async () => {
      jest.spyOn(repository, 'save').mockRejectedValueOnce(new Error('Database error'));

      const dto: CreateSearchHistoryDto = {
        searchTerm: mockSearchHistory.searchTerm,
        category: mockSearchHistory.category,
        filters: mockSearchHistory.filters,
        resultsCount: mockSearchHistory.resultsCount,
      };

      await expect(service.create(mockUser as User, dto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return paginated search history entries', async () => {
      const result = await service.findAll({
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        items: [mockSearchHistory],
        total: 1,
      });
    });

    it('should filter by user ID', async () => {
      const result = await service.findAll({
        userId: mockUser.id,
      });

      expect(result.items).toEqual([mockSearchHistory]);
    });

    it('should filter by category', async () => {
      const result = await service.findAll({
        category: 'products',
      });

      expect(result.items).toEqual([mockSearchHistory]);
    });

    it('should filter by search term', async () => {
      const result = await service.findAll({
        searchTerm: 'test',
      });

      expect(result.items).toEqual([mockSearchHistory]);
    });
  });

  describe('findOne', () => {
    it('should return a search history entry', async () => {
      const result = await service.findOne(mockSearchHistory.id);

      expect(result).toEqual(mockSearchHistory);
    });

    it('should throw NotFoundException when entry not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('should return user search history', async () => {
      const result = await service.findByUser(mockUser.id, {});

      expect(result.items).toEqual([mockSearchHistory]);
    });
  });

  describe('findPopularSearches', () => {
    it('should return popular searches', async () => {
      const result = await service.findPopularSearches({
        category: 'products',
        limit: 5,
      });

      expect(result).toEqual([
        { searchTerm: 'test', count: 5 },
      ]);
    });

    it('should handle errors when finding popular searches', async () => {
      mockQueryBuilder.getRawMany.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.findPopularSearches({})).rejects.toThrow('Database error');
    });
  });
}); 