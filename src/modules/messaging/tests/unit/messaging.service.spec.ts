import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../../products/entities/product.entity';
import { User } from '../../../users/entities/user.entity';
import { Message } from '../../entities/message.entity';
import { MessagingService } from '../../services/messaging.service';

describe('MessagingService', () => {
  let service: MessagingService;
  let mockMessageRepository;
  let mockUserRepository;
  let mockProductRepository;
  let mockQueryBuilder;

  beforeEach(async () => {
    mockQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockReturnThis(),
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getRawMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
    };

    mockMessageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockUserRepository = {
      findOne: jest.fn(),
    };

    mockProductRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessageRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  describe('archiveMessage', () => {
    it('should archive message', async () => {
      const messageId = 'msg-123';
      const userId = 'user-123';
      const message = {
        id: messageId,
        senderId: userId,
        recipientId: 'other-123',
        archivedBySender: false,
        archivedByRecipient: false,
      };

      mockMessageRepository.findOne.mockResolvedValue(message);
      mockMessageRepository.save.mockResolvedValue({
        ...message,
        archivedBySender: true,
      });

      const result = await service.archiveMessage(messageId, userId);

      expect(result.archivedBySender).toBe(true);
      expect(mockMessageRepository.findOne).toHaveBeenCalledWith({
        where: { id: messageId },
      });
    });

    it('should throw NotFoundException when message is not found', async () => {
      const messageId = 'msg-123';
      const userId = 'user-123';

      mockMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.archiveMessage(messageId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('archiveConversation', () => {
    it('should archive conversation', async () => {
      const userId = 'user-123';
      const otherUserId = 'other-123';

      await service.archiveConversation(userId, otherUserId);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      const setArg = mockQueryBuilder.set.mock.calls[0][0];
      expect(setArg).toHaveProperty('archivedBySender');
      expect(setArg).toHaveProperty('archivedByRecipient');
      expect(typeof setArg.archivedBySender).toBe('function');
      expect(typeof setArg.archivedByRecipient).toBe('function');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '("senderId" = :userId AND "recipientId" = :otherUserId) OR ("senderId" = :otherUserId AND "recipientId" = :userId)',
        { userId, otherUserId },
      );
    });
  });

  describe('getArchivedMessages', () => {
    it('should return paginated archived messages', async () => {
      const userId = 'user-123';
      const pagination = { page: 1, limit: 10 };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [
          {
            id: 'msg-1',
            content: 'Test message',
            senderId: userId,
            recipientId: 'other-123',
          },
        ],
        1,
      ]);

      const result = await service.getArchivedMessages(userId, pagination);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(message.senderId = :userId AND message.archivedBySender = true) OR (message.recipientId = :userId AND message.archivedByRecipient = true)',
        { userId },
      );
      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getArchivedConversations', () => {
    it('should return paginated archived conversations', async () => {
      const userId = 'user-123';
      const pagination = { page: 1, limit: 10 };
      const otherUser = {
        id: 'other-1',
        firstName: 'John',
        lastName: 'Doe',
      };
      const message = {
        id: 'msg-1',
        content: 'Last message',
        createdAt: new Date(),
        senderId: otherUser.id,
        recipientId: userId,
      };

      const conversationWithDetails = {
        otherUser,
        lastMessage: message,
        unreadCount: 2,
        lastMessageDate: message.createdAt,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[message], 1]);
      mockUserRepository.findOne.mockResolvedValue(otherUser);
      mockMessageRepository.count.mockResolvedValue(2);

      const result = await service.getArchivedConversations(userId, pagination);

      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(conversationWithDetails);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(message.senderId = :userId AND message.archivedBySender = true) OR (message.recipientId = :userId AND message.archivedByRecipient = true)',
        { userId },
      );

      expect(mockMessageRepository.count).toHaveBeenCalledWith({
        where: {
          senderId: otherUser.id,
          recipientId: userId,
          read: false,
        },
      });
    });
  });
});
