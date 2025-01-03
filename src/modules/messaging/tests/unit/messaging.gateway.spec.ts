import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { CreateMessageDto } from '../../dto/create-message.dto';
import { Message } from '../../entities/message.entity';
import { MessagingGateway } from '../../gateways/messaging.gateway';
import { MessagingService } from '../../services/messaging.service';

describe('MessagingGateway', () => {
  let gateway: MessagingGateway;

  const mockUser: Partial<User> = {
    id: '123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    avatar: null,
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSocket = {
    emit: jest.fn(),
  } as unknown as Socket;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const mockMessagingService = {
    createMessage: jest.fn(),
    markMessageAsRead: jest.fn(),
    archiveMessage: jest.fn(),
    unarchiveMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingGateway,
        {
          provide: MessagingService,
          useValue: mockMessagingService,
        },
      ],
    }).compile();

    gateway = module.get<MessagingGateway>(MessagingGateway);
    gateway['server'] = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    const createMessageDto: CreateMessageDto = {
      content: 'Test message',
      recipientId: '456',
      productId: '789',
    };

    const mockMessage: Message = {
      id: '123',
      content: 'Test message',
      senderId: '123',
      recipientId: '456',
      productId: '789',
      read: false,
      archivedBySender: false,
      archivedByRecipient: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: null,
      recipient: null,
      product: null,
    };

    it('should emit newMessage to recipient when online', async () => {
      mockMessagingService.createMessage.mockResolvedValue(mockMessage);
      gateway['isUserOnline'] = jest.fn().mockReturnValue(true);

      await gateway.handleMessage(
        createMessageDto,
        mockUser as User,
        mockSocket,
      );

      expect(mockServer.to).toHaveBeenCalledWith('user_456');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', mockMessage);
      expect(mockSocket.emit).toHaveBeenCalledWith('messageSent', mockMessage);
    });

    it('should store notification when recipient is offline', async () => {
      mockMessagingService.createMessage.mockResolvedValue(mockMessage);
      gateway['isUserOnline'] = jest.fn().mockReturnValue(false);
      gateway['addNotification'] = jest.fn();

      await gateway.handleMessage(
        createMessageDto,
        mockUser as User,
        mockSocket,
      );

      expect(gateway['addNotification']).toHaveBeenCalledWith('456', {
        type: 'message',
        data: mockMessage,
      });
      expect(mockSocket.emit).toHaveBeenCalledWith('messageSent', mockMessage);
    });
  });

  describe('handleReadMessage', () => {
    const messageId = '123';
    const mockMessage: Message = {
      id: messageId,
      content: 'Test message',
      senderId: '456',
      recipientId: '123',
      productId: '789',
      read: true,
      archivedBySender: false,
      archivedByRecipient: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      sender: null,
      recipient: null,
      product: null,
    };

    it('should emit messageRead to sender when online', async () => {
      mockMessagingService.markMessageAsRead.mockResolvedValue(mockMessage);
      gateway['isUserOnline'] = jest.fn().mockReturnValue(true);

      await gateway.handleReadMessage(
        { messageId },
        mockUser as User,
        mockSocket,
      );

      expect(mockServer.to).toHaveBeenCalledWith('user_456');
      expect(mockServer.emit).toHaveBeenCalledWith('messageRead', {
        messageId: messageId,
      });
    });

    it('should store notification when sender is offline', async () => {
      mockMessagingService.markMessageAsRead.mockResolvedValue(mockMessage);
      gateway['isUserOnline'] = jest.fn().mockReturnValue(false);
      gateway['addNotification'] = jest.fn();

      await gateway.handleReadMessage(
        { messageId },
        mockUser as User,
        mockSocket,
      );

      expect(gateway['addNotification']).toHaveBeenCalledWith('456', {
        type: 'read',
        data: { messageId: messageId },
      });
    });
  });
});
