import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryController } from '../../controllers/history.controller';
import { HistoryService } from '../../services/history.service';
import { History, ActionType } from '../../entities/history.entity';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Role } from '../../../users/enums/role.enum';
import { User } from '../../../users/entities/user.entity';

describe('HistoryController (Integration)', () => {
  let app: INestApplication;
  let historyRepository: Repository<History>;

  const mockUser: Partial<User> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'test@example.com',
    role: Role.ADMIN,
  };

  const mockHistory: Partial<History> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: mockUser.id,
    user: mockUser as User,
    actionType: ActionType.CREATE,
    entityId: '123e4567-e89b-12d3-a456-426614174002',
    entityType: 'Product',
    details: {
      field: 'status',
      oldValue: 'draft',
      newValue: 'published',
    },
    ipAddress: '127.0.0.1',
    userAgent: 'Test Agent',
    createdAt: new Date(),
  };

  const mockJwtGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    }),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockHistoryRepository = {
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockHistory], 1]),
    })),
    findOne: jest.fn((options) => {
      if (options?.where?.id === mockHistory.id) {
        return Promise.resolve(mockHistory);
      }
      return Promise.resolve(null);
    }),
    find: jest.fn().mockResolvedValue([mockHistory]),
    findAndCount: jest.fn().mockResolvedValue([[mockHistory], 1]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [
        HistoryService,
        {
          provide: getRepositoryToken(History),
          useValue: mockHistoryRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    historyRepository = module.get<Repository<History>>(getRepositoryToken(History));

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /history', () => {
    it('should return paginated history entries', async () => {
      const response = await request(app.getHttpServer())
        .get('/history')
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body).toEqual({
        items: [{
          ...mockHistory,
          createdAt: mockHistory.createdAt.toISOString(),
        }],
        total: 1,
      });
    });

    it('should filter history by date range', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';

      const response = await request(app.getHttpServer())
        .get('/history')
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
    });

    it('should filter history by action type', async () => {
      const response = await request(app.getHttpServer())
        .get('/history')
        .query({ actionType: ActionType.CREATE })
        .expect(200);

      expect(response.body.items[0].actionType).toBe(ActionType.CREATE);
    });
  });

  describe('GET /history/export', () => {
    it('should export history as CSV', async () => {
      const response = await request(app.getHttpServer())
        .get('/history/export')
        .expect(200)
        .expect('Content-Type', /text\/csv/)
        .expect('Content-Disposition', 'attachment; filename=history.csv');

      expect(response.text).toContain(mockHistory.id);
      expect(response.text).toContain(mockHistory.actionType);
    });
  });

  describe('GET /history/user', () => {
    it('should return user history', async () => {
      const response = await request(app.getHttpServer())
        .get('/history/user')
        .expect(200);

      expect(response.body.items[0].userId).toBe(mockHistory.userId);
    });
  });

  describe('GET /history/:id', () => {
    it('should return history entry by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/history/${mockHistory.id}`)
        .expect(200);

      expect(response.body).toEqual({
        ...mockHistory,
        createdAt: mockHistory.createdAt.toISOString(),
      });
    });

    it('should return 404 when history entry not found', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      await request(app.getHttpServer())
        .get(`/history/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('GET /history/entity/:entityId', () => {
    it('should return entity history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/history/entity/${mockHistory.entityId}`)
        .query({ entityType: mockHistory.entityType })
        .expect(200);

      expect(response.body[0].entityId).toBe(mockHistory.entityId);
      expect(response.body[0].entityType).toBe(mockHistory.entityType);
    });
  });
}); 