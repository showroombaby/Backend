import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Manager } from 'socket.io-client';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestJwtModule } from '../../../../common/test/jwt.module';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Product } from '../../../products/entities/product.entity';
import { User } from '../../../users/entities/user.entity';
import { Message } from '../../entities/message.entity';
import { MessagingModule } from '../../messaging.module';

describe('MessagingController (Integration)', () => {
  let app: INestApplication;
  let messageRepository: Repository<Message>;
  let userRepository: Repository<User>;
  let testUser: User;
  let otherUser: User;
  let thirdUser: User;
  let testUserToken: string;
  let socket: any;
  let authToken: string;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockJwtGuard = {
    canActivate: (context) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: 'src/config/test.env',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT, 10),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [Message, User, Product],
          synchronize: true,
        }),
        TestJwtModule,
        MessagingModule,
      ],
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: mockJwtGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    messageRepository = moduleFixture.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Create test users
    testUser = await userRepository.save({
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    });

    otherUser = await userRepository.save({
      email: 'other@example.com',
      password: 'password123',
      username: 'otheruser',
    });

    thirdUser = await userRepository.save({
      email: 'third@example.com',
      password: 'password123',
      username: 'thirduser',
    });

    // Generate JWT token
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    testUserToken = jwtService.sign({ sub: testUser.id });

    const serverUrl = `http://localhost:${process.env.PORT || 3000}`;
    const manager = new Manager(serverUrl);
    socket = manager.socket('/', {
      auth: {
        token: authToken,
      },
    });

    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    await messageRepository.delete({});
    await userRepository.delete({});
    socket.disconnect();
    await app.close();
  });

  describe('POST /messages', () => {
    it('should create a new message', () => {
      const createMessageDto = {
        recipientId: 'recipient-123',
        content: 'Test message',
        productId: 'product-123',
      };

      return request(app.getHttpServer())
        .post('/messages')
        .send(createMessageDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe(createMessageDto.content);
          expect(res.body.senderId).toBe(mockUser.id);
          expect(res.body.recipientId).toBe(createMessageDto.recipientId);
        });
    });
  });

  describe('GET /messages/conversations', () => {
    it('should return paginated conversations', () => {
      return request(app.getHttpServer())
        .get('/messages/conversations')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('lastPage');
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty('otherUser');
            expect(res.body.data[0]).toHaveProperty('lastMessage');
            expect(res.body.data[0]).toHaveProperty('unreadCount');
            expect(res.body.data[0]).toHaveProperty('lastMessageDate');
          }
        });
    });
  });

  describe('GET /messages/conversation/:userId', () => {
    it('should return paginated conversation messages', () => {
      const otherUserId = 'other-123';

      return request(app.getHttpServer())
        .get(`/messages/conversation/${otherUserId}`)
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('lastPage');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('POST /messages/:messageId/read', () => {
    it('should mark message as read', () => {
      const messageId = 'message-123';

      return request(app.getHttpServer())
        .post(`/messages/${messageId}/read`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('status', 'READ');
        });
    });
  });

  describe('GET /messages/search', () => {
    it('should return paginated search results', () => {
      const searchQuery = {
        query: 'test',
        userId: 'other-123',
        productId: 'product-123',
        page: 1,
        limit: 10,
      };

      return request(app.getHttpServer())
        .get('/messages/search')
        .query(searchQuery)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('lastPage');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('POST /messages/:messageId/archive', () => {
    it("devrait archiver un message pour l'expéditeur", () => {
      const messageId = 'message-123';

      return request(app.getHttpServer())
        .post(`/messages/${messageId}/archive`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('archivedBySender', true);
        });
    });

    it('devrait archiver un message pour le destinataire', () => {
      const messageId = 'message-123';

      return request(app.getHttpServer())
        .post(`/messages/${messageId}/archive`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('archivedByRecipient', true);
        });
    });
  });

  describe('POST /messages/:messageId/unarchive', () => {
    it("devrait désarchiver un message pour l'expéditeur", () => {
      const messageId = 'message-123';

      return request(app.getHttpServer())
        .post(`/messages/${messageId}/unarchive`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('archivedBySender', false);
        });
    });

    it('devrait désarchiver un message pour le destinataire', () => {
      const messageId = 'message-123';

      return request(app.getHttpServer())
        .post(`/messages/${messageId}/unarchive`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('archivedByRecipient', false);
        });
    });
  });

  describe('GET /messages/archived', () => {
    it('devrait retourner les messages archivés paginés', () => {
      return request(app.getHttpServer())
        .get('/messages/archived')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('lastPage');
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty('id');
            expect(res.body.data[0]).toHaveProperty('content');
            expect(res.body.data[0]).toHaveProperty('senderId');
            expect(res.body.data[0]).toHaveProperty('recipientId');
            expect(res.body.data[0]).toHaveProperty('archivedBySender');
            expect(res.body.data[0]).toHaveProperty('archivedByRecipient');
          }
        });
    });
  });

  describe('WebSocket Events', () => {
    it('should receive new message event', (done) => {
      socket.on('newMessage', (message) => {
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('content');
        expect(message).toHaveProperty('senderId');
        expect(message).toHaveProperty('recipientId');
        done();
      });

      // Simulate sending a message that would trigger the newMessage event
      const createMessageDto = {
        recipientId: mockUser.id,
        content: 'Test WebSocket message',
        productId: 'product-123',
      };

      request(app.getHttpServer()).post('/messages').send(createMessageDto);
    });

    it('should receive message read event', (done) => {
      socket.on('messageRead', (data) => {
        expect(data).toHaveProperty('messageId');
        done();
      });

      // Simulate marking a message as read that would trigger the messageRead event
      const messageId = 'message-123';
      request(app.getHttpServer()).post(`/messages/${messageId}/read`);
    });

    it("devrait recevoir l'événement d'archivage de message", (done) => {
      socket.on('messageArchived', (data) => {
        expect(data).toHaveProperty('messageId');
        expect(data).toHaveProperty('archivedBySender');
        expect(data).toHaveProperty('archivedByRecipient');
        done();
      });

      // Simuler l'archivage d'un message qui déclencherait l'événement messageArchived
      const messageId = 'message-123';
      request(app.getHttpServer()).post(`/messages/${messageId}/archive`);
    });

    it("devrait recevoir l'événement de désarchivage de message", (done) => {
      socket.on('messageUnarchived', (data) => {
        expect(data).toHaveProperty('messageId');
        expect(data).toHaveProperty('archivedBySender');
        expect(data).toHaveProperty('archivedByRecipient');
        done();
      });

      // Simuler le désarchivage d'un message qui déclencherait l'événement messageUnarchived
      const messageId = 'message-123';
      request(app.getHttpServer()).post(`/messages/${messageId}/unarchive`);
    });

    it('should emit archive event when message is archived', async () => {
      const message = await messageRepository.save({
        content: 'Test message',
        senderId: testUser.id,
        recipientId: otherUser.id,
        archivedBySender: false,
        archivedByRecipient: false,
      });

      let receivedEvent = false;
      socket.on('messageArchived', (data) => {
        expect(data.messageId).toBe(message.id);
        expect(data.userId).toBe(testUser.id);
        receivedEvent = true;
      });

      await request(app.getHttpServer())
        .patch(`/messages/${message.id}/archive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      // Wait for WebSocket event
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(receivedEvent).toBe(true);
    });

    it('should emit unarchive event when message is unarchived', async () => {
      const message = await messageRepository.save({
        content: 'Test message',
        senderId: testUser.id,
        recipientId: otherUser.id,
        archivedBySender: true,
        archivedByRecipient: false,
      });

      let receivedEvent = false;
      socket.on('messageUnarchived', (data) => {
        expect(data.messageId).toBe(message.id);
        expect(data.userId).toBe(testUser.id);
        receivedEvent = true;
      });

      await request(app.getHttpServer())
        .patch(`/messages/${message.id}/unarchive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      // Wait for WebSocket event
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(receivedEvent).toBe(true);
    });

    it('should not emit events for unauthorized archive attempts', async () => {
      const message = await messageRepository.save({
        content: 'Test message',
        senderId: otherUser.id,
        recipientId: thirdUser.id,
        archivedBySender: false,
        archivedByRecipient: false,
      });

      let receivedEvent = false;
      socket.on('messageArchived', () => {
        receivedEvent = true;
      });

      await request(app.getHttpServer())
        .patch(`/messages/${message.id}/archive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      // Wait to ensure no event was emitted
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(receivedEvent).toBe(false);
    });

    it('should not emit events for unauthorized unarchive attempts', async () => {
      const message = await messageRepository.save({
        content: 'Test message',
        senderId: otherUser.id,
        recipientId: thirdUser.id,
        archivedBySender: true,
        archivedByRecipient: false,
      });

      let receivedEvent = false;
      socket.on('messageUnarchived', () => {
        receivedEvent = true;
      });

      await request(app.getHttpServer())
        .patch(`/messages/${message.id}/unarchive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);

      // Wait to ensure no event was emitted
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(receivedEvent).toBe(false);
    });
  });

  describe('Archive Messages', () => {
    it('should archive a message', async () => {
      const message = await messageRepository.save({
        content: 'Test message',
        senderId: testUser.id,
        recipientId: otherUser.id,
        archivedBySender: false,
        archivedByRecipient: false,
      });

      const response = await request(app.getHttpServer())
        .patch(`/messages/${message.id}/archive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.archivedBySender).toBe(true);
      expect(response.body.archivedByRecipient).toBe(false);
    });

    it('should return 404 when archiving non-existent message', async () => {
      await request(app.getHttpServer())
        .patch('/messages/non-existent-id/archive')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);
    });

    it('should return 403 when archiving message from another user', async () => {
      const message = await messageRepository.save({
        content: 'Test message',
        senderId: otherUser.id,
        recipientId: thirdUser.id,
        archivedBySender: false,
        archivedByRecipient: false,
      });

      await request(app.getHttpServer())
        .patch(`/messages/${message.id}/archive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);
    });
  });

  describe('Unarchive Messages', () => {
    it('should unarchive a message', async () => {
      const message = await messageRepository.save({
        content: 'Test message',
        senderId: testUser.id,
        recipientId: otherUser.id,
        archivedBySender: true,
        archivedByRecipient: false,
      });

      const response = await request(app.getHttpServer())
        .patch(`/messages/${message.id}/unarchive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.archivedBySender).toBe(false);
      expect(response.body.archivedByRecipient).toBe(false);
    });

    it('should return 404 when unarchiving non-existent message', async () => {
      await request(app.getHttpServer())
        .patch('/messages/non-existent-id/unarchive')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);
    });

    it('should return 403 when unarchiving message from another user', async () => {
      const message = await messageRepository.save({
        content: 'Test message',
        senderId: otherUser.id,
        recipientId: thirdUser.id,
        archivedBySender: true,
        archivedByRecipient: false,
      });

      await request(app.getHttpServer())
        .patch(`/messages/${message.id}/unarchive`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(403);
    });
  });

  describe('Get Archived Messages', () => {
    it('should get archived messages with pagination', async () => {
      // Create multiple archived messages
      await Promise.all([
        messageRepository.save({
          content: 'Archived message 1',
          senderId: testUser.id,
          recipientId: otherUser.id,
          archivedBySender: true,
          archivedByRecipient: false,
        }),
        messageRepository.save({
          content: 'Archived message 2',
          senderId: testUser.id,
          recipientId: otherUser.id,
          archivedBySender: true,
          archivedByRecipient: false,
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/messages/archived')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toEqual({
        total: 2,
        page: 1,
        lastPage: 1,
      });
    });

    it('should return empty array when no archived messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/archived')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta).toEqual({
        total: 0,
        page: 1,
        lastPage: 0,
      });
    });
  });

  describe('Get Archived Conversations', () => {
    it('should get archived conversations with pagination', async () => {
      // Create multiple messages to form archived conversations
      await messageRepository.save([
        {
          content: 'Conversation 1 Message 1',
          senderId: testUser.id,
          recipientId: otherUser.id,
          archivedBySender: true,
          archivedByRecipient: false,
        },
        {
          content: 'Conversation 1 Message 2',
          senderId: otherUser.id,
          recipientId: testUser.id,
          archivedBySender: false,
          archivedByRecipient: true,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/messages/archived-conversations')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toEqual({
        total: 1,
        page: 1,
        lastPage: 1,
      });
      expect(response.body.data[0].otherUser).toBeDefined();
      expect(response.body.data[0].lastMessage).toBeDefined();
    });

    it('should return empty array when no archived conversations', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/archived-conversations')
        .set('Authorization', `Bearer ${testUserToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta).toEqual({
        total: 0,
        page: 1,
        lastPage: 0,
      });
    });
  });
});
