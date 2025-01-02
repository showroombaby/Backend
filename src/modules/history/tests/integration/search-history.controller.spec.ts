import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchHistory } from '../../entities/search-history.entity';
import { SearchHistoryController } from '../../controllers/search-history.controller';
import { SearchHistoryService } from '../../services/search-history.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';

describe('SearchHistoryController (e2e)', () => {
  let app: INestApplication;
  let mockUser: Partial<User>;

  const mockSearchHistory = {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    userId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    searchTerm: 'test search',
    category: 'products',
    filters: {
      price: {
        min: 0,
        max: 100,
      },
    },
    resultsCount: 10,
    createdAt: new Date(),
  };

  const mockSearchHistoryService = {
    findAll: jest.fn().mockResolvedValue({
      items: [mockSearchHistory],
      total: 1,
    }),
    findOne: jest.fn().mockImplementation((id) => {
      if (id === mockSearchHistory.id) {
        return Promise.resolve(mockSearchHistory);
      }
      throw new NotFoundException(`Search history with ID ${id} not found`);
    }),
    findByUser: jest.fn().mockResolvedValue({
      items: [mockSearchHistory],
      total: 1,
    }),
    findPopularSearches: jest.fn().mockResolvedValue([
      {
        searchTerm: 'test search',
        count: 5,
      },
    ]),
  };

  beforeAll(async () => {
    mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: Role.USER,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SearchHistoryController],
      providers: [
        {
          provide: SearchHistoryService,
          useValue: mockSearchHistoryService,
        },
        {
          provide: getRepositoryToken(SearchHistory),
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

  describe('GET /history/searches', () => {
    it('should return paginated search history', () => {
      return request(app.getHttpServer())
        .get('/history/searches')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            items: [
              {
                ...mockSearchHistory,
                createdAt: mockSearchHistory.createdAt.toISOString(),
              },
            ],
            total: 1,
          });
        });
    });

    it('should filter by user ID', () => {
      return request(app.getHttpServer())
        .get('/history/searches')
        .query({ userId: mockUser.id })
        .expect(200)
        .expect(res => {
          expect(mockSearchHistoryService.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ userId: mockUser.id }),
          );
        });
    });

    it('should filter by category', () => {
      return request(app.getHttpServer())
        .get('/history/searches')
        .query({ category: 'products' })
        .expect(200)
        .expect(res => {
          expect(mockSearchHistoryService.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ category: 'products' }),
          );
        });
    });

    it('should filter by search term', () => {
      return request(app.getHttpServer())
        .get('/history/searches')
        .query({ searchTerm: 'test' })
        .expect(200)
        .expect(res => {
          expect(mockSearchHistoryService.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ searchTerm: 'test' }),
          );
        });
    });

    it('should apply pagination', () => {
      return request(app.getHttpServer())
        .get('/history/searches')
        .query({ limit: 5, offset: 10 })
        .expect(200)
        .expect(res => {
          expect(mockSearchHistoryService.findAll).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 5, offset: 10 }),
          );
        });
    });
  });

  describe('GET /history/searches/export', () => {
    it('should export search history to CSV', () => {
      return request(app.getHttpServer())
        .get('/history/searches/export')
        .expect(200)
        .expect('Content-Type', 'text/csv; charset=utf-8')
        .expect('Content-Disposition', 'attachment; filename="search-history.csv"');
    });
  });

  describe('GET /history/searches/popular', () => {
    it('should return popular searches', () => {
      return request(app.getHttpServer())
        .get('/history/searches/popular')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([
            {
              searchTerm: 'test search',
              count: 5,
            },
          ]);
        });
    });
  });

  describe('GET /history/searches/user', () => {
    it('should return user search history', () => {
      return request(app.getHttpServer())
        .get('/history/searches/user')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            items: [
              {
                ...mockSearchHistory,
                createdAt: mockSearchHistory.createdAt.toISOString(),
              },
            ],
            total: 1,
          });
        });
    });
  });

  describe('GET /history/searches/:id', () => {
    it('should return search history by ID', () => {
      return request(app.getHttpServer())
        .get(`/history/searches/${mockSearchHistory.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            ...mockSearchHistory,
            createdAt: mockSearchHistory.createdAt.toISOString(),
          });
        });
    });

    it('should return 400 when ID is not a valid UUID', () => {
      return request(app.getHttpServer())
        .get('/history/searches/invalid-id')
        .expect(400);
    });

    it('should return 404 when search history not found', () => {
      mockSearchHistoryService.findOne.mockRejectedValueOnce(new NotFoundException('Search history not found'));
      return request(app.getHttpServer())
        .get('/history/searches/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6a')
        .expect(404);
    });
  });
}); 