import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Message } from '../../entities/message.entity';
import { User } from '../../../users/entities/user.entity';
import { Product } from '../../../products/entities/product.entity';
import { MessagingController } from '../../controllers/messaging.controller';
import { MessagingService } from '../../services/messaging.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

describe('Messaging (e2e)', () => {
  let app: INestApplication;
  let messagingService: MessagingService;

  const mockUser = {
    id: 'user123',
    username: 'Test User',
    avatarUrl: 'avatar.jpg',
    rating: 4.5,
  };

  const mockReceiver = {
    id: 'receiver123',
    username: 'Test Receiver',
    avatarUrl: 'receiver-avatar.jpg',
    rating: 4.5,
  };

  const mockProduct = {
    id: 'product123',
    title: 'Test Product',
    price: 99.99,
    images: [{ url: 'test-image.jpg' }],
  };

  const mockMessage = {
    id: 'msg123',
    content: 'Hello!',
    senderId: mockUser.id,
    receiverId: mockReceiver.id,
    productId: mockProduct.id,
    isRead: false,
    createdAt: new Date(),
    sender: mockUser,
    receiver: mockReceiver,
    product: mockProduct,
  };

  const mockConversation = {
    userId: mockReceiver.id,
    username: mockReceiver.username,
    avatarUrl: mockReceiver.avatarUrl,
    lastMessage: 'Hello!',
    unreadCount: 0,
    lastMessageDate: expect.any(String),
    productId: 'product123',
    productTitle: 'Test Product',
    productImage: 'test-image.jpg',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MessagingController],
      providers: [
        MessagingService,
        {
          provide: getRepositoryToken(Message),
          useValue: {
            create: jest.fn().mockReturnValue(mockMessage),
            save: jest.fn().mockResolvedValue(mockMessage),
            find: jest.fn().mockResolvedValue([mockMessage]),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockMessage]),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockImplementation((options) => {
              if (options.where.id === mockUser.id) return mockUser;
              if (options.where.id === mockReceiver.id) return mockReceiver;
              return null;
            }),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockProduct),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    messagingService = moduleFixture.get<MessagingService>(MessagingService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /messages', () => {
    it('should create a new message', async () => {
      const createMessageDto = {
        content: 'Hello!',
        receiverId: mockReceiver.id,
        productId: mockProduct.id,
      };

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('user-id', mockUser.id)
        .send(createMessageDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        content: createMessageDto.content,
        sender: {
          id: mockUser.id,
          username: mockUser.username,
          avatarUrl: mockUser.avatarUrl,
          rating: mockUser.rating,
        },
        receiver: {
          id: mockReceiver.id,
          username: mockReceiver.username,
          avatarUrl: mockReceiver.avatarUrl,
          rating: mockReceiver.rating,
        },
        product: {
          id: mockProduct.id,
          title: mockProduct.title,
          price: mockProduct.price,
          images: mockProduct.images,
        },
        isRead: false,
        createdAt: expect.any(String),
      });
    });
  });

  describe('GET /messages/conversations', () => {
    it('should return user conversations', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/conversations')
        .set('user-id', mockUser.id)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        userId: mockReceiver.id,
        username: mockReceiver.username,
        avatarUrl: mockReceiver.avatarUrl,
        lastMessage: 'Hello!',
        unreadCount: 0,
        lastMessageDate: expect.any(String),
        productId: 'product123',
        productTitle: 'Test Product',
        productImage: 'test-image.jpg',
      });
    });
  });

  describe('GET /messages/:userId', () => {
    it('should return messages with a specific user', async () => {
      const mockReceiver = {
        id: 'receiver123',
        username: 'Test Receiver',
        avatarUrl: 'receiver-avatar.jpg',
        rating: 4.5,
      };

      const response = await request(app.getHttpServer())
        .get(`/messages/${mockReceiver.id}`)
        .set('user-id', mockUser.id)
        .expect(200);

      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        content: mockMessage.content,
        sender: {
          id: mockUser.id,
          username: mockUser.username,
          avatarUrl: mockUser.avatarUrl,
          rating: mockUser.rating,
        },
        receiver: {
          id: mockReceiver.id,
          username: mockReceiver.username,
          avatarUrl: mockReceiver.avatarUrl,
          rating: mockReceiver.rating,
        },
        product: {
          id: mockProduct.id,
          title: mockProduct.title,
          price: mockProduct.price,
          images: mockProduct.images,
        },
        isRead: false,
        createdAt: expect.any(String),
      });
    });
  });
}); 