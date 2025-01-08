import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { CreateHistoryDto } from '../../dto/create-history.dto';
import { ActionType, History } from '../../entities/history.entity';
import { HistoryService } from '../../services/history.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let repository: Repository<History>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHistory: History = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: mockUser.id,
    actionType: ActionType.CREATE,
    entityId: '123e4567-e89b-12d3-a456-426614174002',
    entityType: 'product',
    details: { field: 'status', oldValue: 'draft', newValue: 'published' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    user: mockUser as User,
    createdAt: new Date(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockHistory], 1]),
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: getRepositoryToken(History),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
    repository = module.get<Repository<History>>(getRepositoryToken(History));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a history entry', async () => {
      const createHistoryDto: CreateHistoryDto = {
        actionType: ActionType.CREATE,
        entityId: '123e4567-e89b-12d3-a456-426614174002',
        entityType: 'product',
        details: { field: 'status', oldValue: 'draft', newValue: 'published' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      mockRepository.create.mockReturnValue(mockHistory);
      mockRepository.save.mockResolvedValue(mockHistory);

      const result = await service.create(mockUser as User, createHistoryDto);

      expect(repository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        ...createHistoryDto,
      });
      expect(repository.save).toHaveBeenCalledWith(mockHistory);
      expect(result).toEqual(mockHistory);
    });

    it('should throw an error if save fails', async () => {
      const createHistoryDto: CreateHistoryDto = {
        actionType: ActionType.CREATE,
        entityId: '123e4567-e89b-12d3-a456-426614174002',
        entityType: 'product',
      };

      const error = new Error('Save failed');
      mockRepository.save.mockRejectedValue(error);

      await expect(
        service.create(mockUser as User, createHistoryDto),
      ).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return paginated history entries', async () => {
      const options = {
        userId: mockUser.id,
        entityType: 'product',
        actionType: ActionType.CREATE,
        limit: 10,
        offset: 0,
      };

      const mockResult = {
        items: [mockHistory],
        total: 1,
      };

      const result = await service.findAll(options);

      expect(result).toEqual(mockResult);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'history.user',
        'user',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.user_id = :userId',
        { userId: mockUser.id },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.entity_type = :entityType',
        { entityType: 'product' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.action_type = :actionType',
        { actionType: ActionType.CREATE },
      );
    });
  });

  describe('findOne', () => {
    it('should return a history entry by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockHistory);

      const result = await service.findOne(mockHistory.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockHistory.id },
        relations: ['user'],
      });
      expect(result).toEqual(mockHistory);
    });

    it('should throw an error if history entry is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'History entry with ID non-existent-id not found',
      );
    });
  });

  describe('findByUser', () => {
    it('should return history entries for a user', async () => {
      const options = {
        entityType: 'product',
        actionType: ActionType.CREATE,
        limit: 10,
        offset: 0,
      };

      const mockResult = {
        items: [mockHistory],
        total: 1,
      };

      const result = await service.findByUser(mockUser.id, options);

      expect(result).toEqual(mockResult);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.user_id = :userId',
        { userId: mockUser.id },
      );
    });
  });

  describe('findByEntity', () => {
    it('should return history entries for an entity', async () => {
      mockRepository.find.mockResolvedValue([mockHistory]);

      const result = await service.findByEntity(
        mockHistory.entityId,
        mockHistory.entityType,
      );

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          entityId: mockHistory.entityId,
          entityType: mockHistory.entityType,
        },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockHistory]);
    });
  });

  describe('deleteOldEntries', () => {
    it('should delete entries older than specified days', async () => {
      await service.deleteOldEntries(30);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
