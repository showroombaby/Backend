import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from '../../services/reports.service';
import { Report, ReportReason, ReportStatus } from '../../entities/report.entity';
import { Product } from '../../entities/product.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: Repository<Report>;
  let productRepository: Repository<Product>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockProductId = '123e4567-e89b-12d3-a456-426614174001';
  const mockReportId = '123e4567-e89b-12d3-a456-426614174002';

  const mockProduct = {
    id: mockProductId,
    title: 'Test Product',
  };

  const mockReport = {
    id: mockReportId,
    reporterId: mockUserId,
    productId: mockProductId,
    reason: ReportReason.INAPPROPRIATE,
    description: 'Test report description',
    status: ReportStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: {
            create: jest.fn().mockReturnValue(mockReport),
            save: jest.fn().mockResolvedValue(mockReport),
            findOne: jest.fn().mockResolvedValue(mockReport),
            find: jest.fn().mockResolvedValue([mockReport]),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockProduct),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepository = module.get<Repository<Report>>(
      getRepositoryToken(Report),
    );
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  describe('create', () => {
    const createReportDto = {
      productId: mockProductId,
      reason: ReportReason.INAPPROPRIATE,
      description: 'Test report description',
    };

    it('should create a report', async () => {
      const result = await service.create(createReportDto, mockUserId);

      expect(result).toEqual(mockReport);
      expect(reportRepository.create).toHaveBeenCalledWith({
        ...createReportDto,
        reporterId: mockUserId,
      });
      expect(reportRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.create(createReportDto, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of reports', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockReport]);
      expect(reportRepository.find).toHaveBeenCalledWith({
        relations: ['reporter', 'product'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a report', async () => {
      const result = await service.findOne(mockReportId);

      expect(result).toEqual(mockReport);
      expect(reportRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockReportId },
        relations: ['reporter', 'product'],
      });
    });

    it('should throw NotFoundException when report does not exist', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne(mockReportId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateReportDto = {
      status: ReportStatus.REVIEWED,
      moderationNote: 'Report has been reviewed',
    };

    it('should update a report', async () => {
      const updatedReport = { ...mockReport, ...updateReportDto };
      jest.spyOn(reportRepository, 'save').mockResolvedValueOnce(updatedReport as Report);

      const result = await service.update(mockReportId, updateReportDto);

      expect(result).toEqual(updatedReport);
    });

    it('should throw BadRequestException when updating non-pending report', async () => {
      jest.spyOn(reportRepository, 'findOne').mockResolvedValueOnce({
        ...mockReport,
        status: ReportStatus.RESOLVED, 
      } as Report);

      await expect(service.update(mockReportId, updateReportDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserReports', () => {
    it('should return user reports', async () => {
      const result = await service.getUserReports(mockUserId);

      expect(result).toEqual([mockReport]);
      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { reporterId: mockUserId },
        relations: ['product'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getProductReports', () => {
    it('should return product reports', async () => {
      const result = await service.getProductReports(mockProductId);

      expect(result).toEqual([mockReport]);
      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { productId: mockProductId },
        relations: ['reporter'],
        order: { createdAt: 'DESC' },
      });
    });
  });
}); 