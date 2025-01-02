import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageHistoryService } from '../../services/message-history.service';
import { MessageHistory, MessageAction } from '../../entities/message-history.entity';
import { CreateMessageHistoryDto } from '../../dto/create-message-history.dto';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { NotFoundException } from '@nestjs/common';

describe('MessageHistoryService', () => {
  let service: MessageHistoryService;
  let repository: Repository<MessageHistory>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: Role.USER,
  };

  const mockMessageHistory: Partial<MessageHistory> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    senderId: mockUser.id,
    receiverId: '123e4567-e89b-12d3-a456-426614174002',
    messageId: '123e4567-e89b-12d3-a456-426614174003',
    action: MessageAction.SENT,
    content: 'Test message',
    createdAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockMessageHistory),
    save: jest.fn().mockResolvedValue(mockMessageHistory),
    findOne: jest.fn().mockResolvedValue(mockMessageHistory),
    find: jest.fn().mockResolvedValue([mockMessageHistory]),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockMessageHistory], 1]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageHistoryService,
        {
          provide: getRepositoryToken(MessageHistory),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MessageHistoryService>(MessageHistoryService);
    repository = module.get<Repository<MessageHistory>>(getRepositoryToken(MessageHistory));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a message history entry', async () => {
      const dto: CreateMessageHistoryDto = {
        receiverId: mockMessageHistory.receiverId,
        messageId: mockMessageHistory.messageId,
        action: mockMessageHistory.action,
        content: mockMessageHistory.content,
      };

      const result = await service.create(mockUser as User, dto);

      expect(result).toEqual(mockMessageHistory);
      expect(repository.create).toHaveBeenCalledWith({
        senderId: mockUser.id,
        ...dto,
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle errors when creating', async () => {
      jest.spyOn(repository, 'save').mockRejectedValueOnce(new Error('Database error'));

      const dto: CreateMessageHistoryDto = {
        receiverId: mockMessageHistory.receiverId,
        messageId: mockMessageHistory.messageId,
        action: mockMessageHistory.action,
        content: mockMessageHistory.content,
      };

      await expect(service.create(mockUser as User, dto)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return paginated message history entries', async () => {
      const result = await service.findAll({
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        items: [mockMessageHistory],
        total: 1,
      });
    });

    it('should filter by user ID', async () => {
      const result = await service.findAll({
        userId: mockUser.id,
      });

      expect(result.items).toEqual([mockMessageHistory]);
    });

    it('should filter by action type', async () => {
      const result = await service.findAll({
        action: MessageAction.SENT,
      });

      expect(result.items).toEqual([mockMessageHistory]);
    });
  });

  describe('findOne', () => {
    it('should return a message history entry', async () => {
      const result = await service.findOne(mockMessageHistory.id);

      expect(result).toEqual(mockMessageHistory);
    });

    it('should throw NotFoundException when entry not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('should return user message history', async () => {
      const result = await service.findByUser(mockUser.id, {});

      expect(result.items).toEqual([mockMessageHistory]);
    });
  });

  describe('findByMessage', () => {
    it('should return message history entries', async () => {
      const result = await service.findByMessage(mockMessageHistory.messageId);

      expect(result).toEqual([mockMessageHistory]);
    });
  });
}); 