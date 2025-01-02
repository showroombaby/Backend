import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import * as supertest from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report, ReportReason } from '../../entities/report.entity';
import { Product } from '../../entities/product.entity';
import { ReportsController } from '../../controllers/reports.controller';
import { ReportsService } from '../../services/reports.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let reportsService: ReportsService;
  let jwtGuardMock: { canActivate: jest.Mock };

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProductId = '123e4567-e89b-12d3-a456-426614174001';

  const mockProduct = {
    id: mockProductId,
    title: 'Test Product',
  };

  const mockReport = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    reporterId: mockUserId,
    productId: mockProductId,
    reason: ReportReason.INAPPROPRIATE,
    description: 'Test report description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createReportDto = {
    productId: mockProductId,
    reason: ReportReason.INAPPROPRIATE,
    description: 'Test report description',
  };

  beforeEach(async () => {
    jwtGuardMock = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: {
            create: jest.fn().mockReturnValue(mockReport),
            save: jest.fn().mockResolvedValue(mockReport),
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
      .useValue(jwtGuardMock)
      .overrideGuard(ThrottlerGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Configure validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    reportsService = moduleFixture.get<ReportsService>(ReportsService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /reports', () => {
    it('should create a report', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/reports')
        .set('user-id', mockUserId)
        .send(createReportDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: mockReport.id,
        reporterId: mockUserId,
        productId: mockProductId,
        reason: ReportReason.INAPPROPRIATE,
        description: 'Test report description',
      });
    });

    it('should return 404 when product does not exist', async () => {
      jest.spyOn(reportsService, 'create').mockRejectedValue(new NotFoundException('Product not found'));

      await supertest(app.getHttpServer())
        .post('/reports')
        .set('user-id', mockUserId)
        .send({
          ...createReportDto,
          productId: '123e4567-e89b-12d3-a456-426614174999',
        })
        .expect(404);
    });

    it('should return 400 for invalid report reason', async () => {
      await supertest(app.getHttpServer())
        .post('/reports')
        .set('user-id', mockUserId)
        .send({
          ...createReportDto,
          reason: 'invalid_reason',
        })
        .expect(400);
    });

    it('should return 400 for description too short', async () => {
      await supertest(app.getHttpServer())
        .post('/reports')
        .set('user-id', mockUserId)
        .send({
          ...createReportDto,
          description: 'short',
        })
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      jwtGuardMock.canActivate.mockImplementation(() => {
        throw new UnauthorizedException();
      });

      await supertest(app.getHttpServer())
        .post('/reports')
        .send(createReportDto)
        .expect(401);
    });
  });
}); 