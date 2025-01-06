import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { JWT_CONFIG } from '../../../../common/test/jwt.module';
import { WsJwtGuard } from '../../../auth/guards/ws-jwt.guard';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { UsersService } from '../../../users/services/users.service';
import { UsersModule } from '../../../users/users.module';
import { CreateMessageDto } from '../../dto/create-message.dto';
import { MessagingGateway } from '../../gateways/messaging.gateway';
import { MessagingService } from '../../services/messaging.service';

describe('MessagingGateway', () => {
  let gateway: MessagingGateway;
  let messagingService: MessagingService;
  let module: TestingModule;

  const mockMessagingService = {
    createMessage: jest.fn(),
    markMessageAsRead: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ sub: 'user-id' }),
  };

  const mockUser: User = {
    id: 'sender-id',
    email: 'test@example.com',
    password: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
    avatar: null,
    avatarUrl: null,
    name: 'Test User',
    username: 'testuser',
    rating: 0,
    isEmailVerified: false,
    address: null,
    products: [],
    views: [],
    savedFilters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: async () => {},
    validatePassword: async () => true,
  };

  const mockServer = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  } as unknown as Server;

  const mockSocket = {
    id: 'socket-id',
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    handshake: {
      auth: {
        token: 'valid.jwt.token',
      },
    },
  } as unknown as Socket;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        JwtModule.register(JWT_CONFIG),
        UsersModule,
      ],
      providers: [
        MessagingGateway,
        {
          provide: MessagingService,
          useValue: mockMessagingService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        WsJwtGuard,
      ],
    }).compile();

    gateway = module.get<MessagingGateway>(MessagingGateway);
    messagingService = module.get<MessagingService>(MessagingService);
    gateway.server = mockServer;
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleMessage', () => {
    it('should store notification when recipient is offline', async () => {
      const mockMessage: CreateMessageDto = {
        recipientId: 'recipient-id',
        content: 'test message',
        productId: 'product-id',
      };

      mockMessagingService.createMessage.mockResolvedValue({
        id: 'message-id',
        ...mockMessage,
        senderId: mockUser.id,
      });

      await gateway.handleMessage(mockMessage, mockUser, mockSocket);

      expect(messagingService.createMessage).toHaveBeenCalledWith(
        mockUser.id,
        mockMessage,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'messageSent',
        expect.any(Object),
      );
    });
  });

  describe('handleReadMessage', () => {
    it('should emit messageRead to sender when online', async () => {
      const mockMessageId = { messageId: 'message-id' };
      const mockMessage = {
        id: mockMessageId.messageId,
        senderId: 'sender-id',
        recipientId: mockUser.id,
        status: 'READ',
      };

      mockMessagingService.markMessageAsRead.mockResolvedValue(mockMessage);
      jest.spyOn(gateway, 'isUserOnline').mockReturnValue(true);

      await gateway.handleReadMessage(mockMessageId, mockUser, mockSocket);

      expect(messagingService.markMessageAsRead).toHaveBeenCalledWith(
        mockMessageId.messageId,
        mockUser.id,
      );
      expect(mockServer.to).toHaveBeenCalledWith(
        `user_${mockMessage.senderId}`,
      );
    });

    it('should store notification when sender is offline', async () => {
      const mockMessageId = { messageId: 'message-id' };
      const mockMessage = {
        id: mockMessageId.messageId,
        senderId: 'sender-id',
        recipientId: mockUser.id,
        status: 'READ',
      };

      mockMessagingService.markMessageAsRead.mockResolvedValue(mockMessage);
      jest.spyOn(gateway, 'isUserOnline').mockReturnValue(false);

      await gateway.handleReadMessage(mockMessageId, mockUser, mockSocket);

      expect(messagingService.markMessageAsRead).toHaveBeenCalledWith(
        mockMessageId.messageId,
        mockUser.id,
      );
    });
  });
});
