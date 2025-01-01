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
        where: [
          { id: messageId, senderId: userId },
          { id: messageId, recipientId: userId },
        ],
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

    it('should archive message for recipient', async () => {
      const messageId = 'msg-123';
      const userId = 'user-123';
      const message = {
        id: messageId,
        senderId: 'other-123',
        recipientId: userId,
        archivedBySender: false,
        archivedByRecipient: false,
      };

      mockMessageRepository.findOne.mockResolvedValue(message);
      mockMessageRepository.save.mockResolvedValue({
        ...message,
        archivedByRecipient: true,
      });

      const result = await service.archiveMessage(messageId, userId);

      expect(result.archivedByRecipient).toBe(true);
      expect(result.archivedBySender).toBe(false);
    });
  });

  describe('unarchiveMessage', () => {
    it('should unarchive message', async () => {
      const messageId = 'msg-123';
      const userId = 'user-123';
      const message = {
        id: messageId,
        senderId: userId,
        recipientId: 'other-123',
        archivedBySender: true,
        archivedByRecipient: false,
      };

      mockMessageRepository.findOne.mockResolvedValue(message);
      mockMessageRepository.save.mockResolvedValue({
        ...message,
        archivedBySender: false,
      });

      const result = await service.unarchiveMessage(messageId, userId);

      expect(result.archivedBySender).toBe(false);
      expect(mockMessageRepository.findOne).toHaveBeenCalledWith({
        where: [
          { id: messageId, senderId: userId },
          { id: messageId, recipientId: userId },
        ],
      });
    });

    it('should throw NotFoundException when message is not found', async () => {
      const messageId = 'msg-123';
      const userId = 'user-123';

      mockMessageRepository.findOne.mockResolvedValue(null);

      await expect(service.unarchiveMessage(messageId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should unarchive message for recipient', async () => {
      const messageId = 'msg-123';
      const userId = 'user-123';
      const message = {
        id: messageId,
        senderId: 'other-123',
        recipientId: userId,
        archivedBySender: false,
        archivedByRecipient: true,
      };

      mockMessageRepository.findOne.mockResolvedValue(message);
      mockMessageRepository.save.mockResolvedValue({
        ...message,
        archivedByRecipient: false,
      });

      const result = await service.unarchiveMessage(messageId, userId);

      expect(result.archivedByRecipient).toBe(false);
      expect(result.archivedBySender).toBe(false);
    });
  });

  describe('archiveConversation', () => {
    it('should archive conversation', async () => {
      const userId = 'user-123';
      const otherUserId = 'other-123';

      await service.archiveConversation(userId, otherUserId);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        archivedBySender: expect.any(Function),
        archivedByRecipient: expect.any(Function),
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(sender_id = :userId AND recipient_id = :otherUserId) OR (sender_id = :otherUserId AND recipient_id = :userId)',
        { userId, otherUserId },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('unarchiveConversation', () => {
    it('should unarchive conversation', async () => {
      const userId = 'user-123';
      const otherUserId = 'other-123';

      await service.unarchiveConversation(userId, otherUserId);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({
        archivedBySender: expect.any(Function),
        archivedByRecipient: expect.any(Function),
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(sender_id = :userId AND recipient_id = :otherUserId) OR (sender_id = :otherUserId AND recipient_id = :userId)',
        { userId, otherUserId },
      );
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('getArchivedMessages', () => {
    it('should return paginated archived messages', async () => {
      const userId = 'user-123';
      const pagination = { page: 1, limit: 10 };
      const messages = [
        {
          id: 'msg-1',
          content: 'Test message 1',
          archivedBySender: true,
          senderId: userId,
        },
        {
          id: 'msg-2',
          content: 'Test message 2',
          archivedByRecipient: true,
          recipientId: userId,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([messages, 2]);

      const result = await service.getArchivedMessages(userId, pagination);

      expect(result.data).toEqual(messages);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        lastPage: 1,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(message.sender_id = :userId AND message.archived_by_sender = true) OR (message.recipient_id = :userId AND message.archived_by_recipient = true)',
        { userId },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should handle empty archived messages', async () => {
      const userId = 'user-123';
      const pagination = { page: 1, limit: 10 };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.getArchivedMessages(userId, pagination);

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        lastPage: 0,
      });
    });

    it('should handle pagination correctly', async () => {
      const userId = 'user-123';
      const pagination = { page: 2, limit: 5 };
      const messages = [{ id: 'msg-1', content: 'Test message' }];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([messages, 6]);

      const result = await service.getArchivedMessages(userId, pagination);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.meta).toEqual({
        total: 6,
        page: 2,
        lastPage: 2,
      });
    });

    it('should include relations in query', async () => {
      const userId = 'user-123';
      const pagination = { page: 1, limit: 10 };

      await service.getArchivedMessages(userId, pagination);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'message.sender',
        'sender',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'message.recipient',
        'recipient',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'message.product',
        'product',
      );
    });
  });

  describe('getArchivedConversations', () => {
    it('should return paginated archived conversations', async () => {
      const userId = 'user-123';
      const pagination = { page: 1, limit: 10 };
      const conversations = [
        {
          otherUserId: 'other-1',
          lastMessageDate: new Date(),
        },
      ];
      const otherUser = {
        id: 'other-1',
        firstName: 'John',
        lastName: 'Doe',
      };
      const lastMessage = {
        id: 'msg-1',
        content: 'Last message',
      };

      mockQueryBuilder.getRawMany.mockResolvedValue(conversations);
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockUserRepository.findOne.mockResolvedValue(otherUser);
      mockMessageRepository.findOne.mockResolvedValue(lastMessage);

      const result = await service.getArchivedConversations(userId, pagination);

      expect(result.data[0]).toEqual({
        otherUser,
        lastMessage,
        lastMessageDate: conversations[0].lastMessageDate,
      });
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        lastPage: 1,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(message.sender_id = :userId AND message.archived_by_sender = true) OR (message.recipient_id = :userId AND message.archived_by_recipient = true)',
        { userId },
      );
    });

    it('should handle empty archived conversations', async () => {
      const userId = 'user-123';
      const pagination = { page: 1, limit: 10 };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await service.getArchivedConversations(userId, pagination);

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        lastPage: 0,
      });
    });

    it('should handle pagination correctly', async () => {
      const userId = 'user-123';
      const pagination = { page: 2, limit: 5 };

      mockQueryBuilder.getRawMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(6);

      const result = await service.getArchivedConversations(userId, pagination);

      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
      expect(result.meta).toEqual({
        total: 6,
        page: 2,
        lastPage: 2,
      });
    });

    it('should handle user not found', async () => {
      const userId = 'user-123';
      const pagination = { page: 1, limit: 10 };
      const conversations = [
        {
          otherUserId: 'other-1',
          lastMessageDate: new Date(),
        },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(conversations);
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockMessageRepository.findOne.mockResolvedValue(null);

      const result = await service.getArchivedConversations(userId, pagination);

      expect(result.data[0].otherUser).toBeNull();
      expect(result.data[0].lastMessage).toBeNull();
    });
  });
});
