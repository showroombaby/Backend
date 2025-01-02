import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageHistory, MessageAction } from '../../entities/message-history.entity';
import { MessageHistoryController } from '../../controllers/message-history.controller';
import { MessageHistoryService } from '../../services/message-history.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';

describe('MessageHistoryController (e2e)', () => {
  let app: INestApplication;
  let mockUser: Partial<User>;

  const mockMessageHistory = {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    senderId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    receiverId: '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b',
    messageId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    action: MessageAction.SENT,
    content: 'Test message',
    createdAt: new Date(),
  };

  const mockMessageHistoryService = {
    findAll: jest.fn().mockResolvedValue({
      items: [mockMessageHistory],
      total: 1,
    }),
    findOne: jest.fn().mockImplementation((id) => {
      if (id === mockMessageHistory.id) {
        return Promise.resolve(mockMessageHistory);
      }
      throw new NotFoundException(`Message history with ID ${id} not found`);
    }),
    findByUser: jest.fn().mockResolvedValue({
      items: [mockMessageHistory],
      total: 1,
    }),
  };

  beforeAll(async () => {
    mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: Role.USER,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MessageHistoryController],
      providers: [
        {
          provide: MessageHistoryService,
          useValue: mockMessageHistoryService,
        },
        {
          provide: getRepositoryToken(MessageHistory),
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation((context) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /history/messages', () => {
    it('should return paginated message history', () => {
      return request(app.getHttpServer())
        .get('/history/messages')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            items: [
              {
                ...mockMessageHistory,
                createdAt: mockMessageHistory.createdAt.toISOString(),
              },
            ],
            total: 1,
          });
        });
    });

    it('should filter by user ID', () => {
      return request(app.getHttpServer())
        .get('/history/messages')
        .query({ userId: mockUser.id })
        .expect(200)
        .expect(res => {
          expect(mockMessageHistoryService.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ userId: mockUser.id }),
          );
        });
    });

    it('should filter by action type', () => {
      return request(app.getHttpServer())
        .get('/history/messages')
        .query({ action: 'sent' })
        .expect(200)
        .expect(res => {
          expect(mockMessageHistoryService.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'sent' }),
          );
        });
    });

    it('should apply pagination', () => {
      return request(app.getHttpServer())
        .get('/history/messages')
        .query({ limit: 5, offset: 10 })
        .expect(200)
        .expect(res => {
          expect(mockMessageHistoryService.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 5, offset: 10 }),
          );
        });
    });
  });

  describe('GET /history/messages/export', () => {
    it('should export message history to CSV', () => {
      return request(app.getHttpServer())
        .get('/history/messages/export')
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-Disposition', 'attachment; filename="message-history.csv"');
    });
  });

  describe('GET /history/messages/user', () => {
    it('should return user message history', () => {
      return request(app.getHttpServer())
        .get('/history/messages/user')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            items: [
              {
                ...mockMessageHistory,
                createdAt: mockMessageHistory.createdAt.toISOString(),
              },
            ],
            total: 1,
          });
        });
    });
  });

  describe('GET /history/messages/:id', () => {
    it('should return message history by ID', () => {
      return request(app.getHttpServer())
        .get(`/history/messages/${mockMessageHistory.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            ...mockMessageHistory,
            createdAt: mockMessageHistory.createdAt.toISOString(),
          });
        });
    });

    it('should return 400 when ID is not a valid UUID', () => {
      return request(app.getHttpServer())
        .get('/history/messages/invalid-id')
        .expect(400);
    });

    it('should return 404 when message history not found', () => {
      mockMessageHistoryService.findOne.mockRejectedValueOnce(new NotFoundException('Message history not found'));
      return request(app.getHttpServer())
        .get('/history/messages/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6a')
        .expect(404);
    });
  });
}); 