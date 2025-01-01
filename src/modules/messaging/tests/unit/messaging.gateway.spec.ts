import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { JWT_CONFIG } from '../../../../common/test/jwt.module';
import { WsJwtGuard } from '../../../auth/guards/ws-jwt.guard';
import { UsersService } from '../../../users/services/users.service';
import { CreateMessageDto } from '../../dto/create-message.dto';
import { Message } from '../../entities/message.entity';
import { MessagingGateway } from '../../gateways/messaging.gateway';
import { MessagingService } from '../../services/messaging.service';

describe('MessagingGateway', () => {
  let gateway: MessagingGateway;
  let mockMessagingService: Partial<MessagingService>;
  let mockUsersService: Partial<UsersService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    mockMessagingService = {
      createMessage: jest.fn(),
      markMessageAsRead: jest.fn(),
    };

    mockUsersService = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
    };

    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as any;

    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        headers: {},
        time: new Date().toString(),
        address: '127.0.0.1',
        xdomain: false,
        secure: true,
        issued: Date.now(),
        url: '/',
        query: {},
        auth: {
          user: {
            id: '1',
            email: 'test@example.com',
          },
        },
      },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_CONFIG.secret,
          signOptions: JWT_CONFIG.signOptions,
        }),
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
          provide: WsJwtGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    gateway = module.get<MessagingGateway>(MessagingGateway);
    gateway.server = mockServer;
  });

  describe('handleMessage', () => {
    const messageDto: CreateMessageDto = {
      recipientId: '2',
      content: 'Test message',
      productId: 'product-123',
    };

    it('devrait envoyer un message avec succès', async () => {
      const createdMessage = {
        id: 'msg-123',
        ...messageDto,
        senderId: '1',
      } as Message;

      (mockMessagingService.createMessage as jest.Mock).mockResolvedValue(
        createdMessage,
      );

      await gateway.handleMessage(
        mockSocket as Socket,
        messageDto,
        mockSocket.handshake?.auth.user,
      );

      expect(mockMessagingService.createMessage).toHaveBeenCalledWith(
        '1',
        messageDto,
      );
      expect(mockServer.to).toHaveBeenCalledWith('user_2');
      expect(mockServer.emit).toHaveBeenCalledWith('message', createdMessage);
    });

    it("devrait gérer les erreurs lors de l'envoi de message", async () => {
      const error = new Error('Test error');
      (mockMessagingService.createMessage as jest.Mock).mockRejectedValue(
        error,
      );

      await gateway.handleMessage(
        mockSocket as Socket,
        messageDto,
        mockSocket.handshake?.auth.user,
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: "Erreur lors de l'envoi du message",
      });
    });
  });

  describe('handleMarkAsRead', () => {
    const messageId = 'msg-123';

    it('devrait marquer un message comme lu avec succès', async () => {
      const updatedMessage = {
        id: messageId,
        senderId: '2',
        recipientId: '1',
        status: 'READ',
      } as Message;

      (mockMessagingService.markMessageAsRead as jest.Mock).mockResolvedValue(
        updatedMessage,
      );

      await gateway.handleMarkAsRead(
        mockSocket as Socket,
        { messageId },
        mockSocket.handshake?.auth.user,
      );

      expect(mockMessagingService.markMessageAsRead).toHaveBeenCalledWith(
        messageId,
        '1',
      );
      expect(mockServer.to).toHaveBeenCalledWith('user_2');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'messageRead',
        updatedMessage,
      );
    });

    it('devrait gérer les erreurs lors du marquage comme lu', async () => {
      const error = new Error('Test error');
      (mockMessagingService.markMessageAsRead as jest.Mock).mockRejectedValue(
        error,
      );

      await gateway.handleMarkAsRead(
        mockSocket as Socket,
        { messageId },
        mockSocket.handshake?.auth.user,
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Erreur lors du marquage du message comme lu',
      });
    });
  });

  describe('handleTyping', () => {
    it("devrait émettre l'événement de frappe", () => {
      const typingData = {
        recipientId: '2',
        isTyping: true,
      };

      gateway.handleTyping(
        mockSocket as Socket,
        typingData,
        mockSocket.handshake?.auth.user,
      );

      expect(mockServer.to).toHaveBeenCalledWith('user_2');
      expect(mockServer.emit).toHaveBeenCalledWith('typing', {
        userId: '1',
        recipientId: typingData.recipientId,
      });
    });
  });
});
