import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from '../entities/report.entity';
import { Product } from '../entities/product.entity';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createReportDto: CreateReportDto, userId: string): Promise<Report> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: createReportDto.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const report = this.reportRepository.create({
        ...createReportDto,
        reporterId: userId,
      });

      return await this.reportRepository.save(report);
    } catch (error) {
      this.logger.error(
        `Error creating report for product ${createReportDto.productId} by user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async findAll(): Promise<Report[]> {
    try {
      return await this.reportRepository.find({
        relations: ['reporter', 'product'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Error fetching all reports:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Report> {
    try {
      const report = await this.reportRepository.findOne({
        where: { id },
        relations: ['reporter', 'product'],
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      return report;
    } catch (error) {
      this.logger.error(`Error fetching report ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, updateReportDto: UpdateReportDto): Promise<Report> {
    try {
      const report = await this.findOne(id);

      if (report.status !== ReportStatus.PENDING) {
        throw new BadRequestException('Can only update pending reports');
      }

      Object.assign(report, updateReportDto);
      return await this.reportRepository.save(report);
    } catch (error) {
      this.logger.error(`Error updating report ${id}:`, error);
      throw error;
    }
  }

  async getUserReports(userId: string): Promise<Report[]> {
    try {
      return await this.reportRepository.find({
        where: { reporterId: userId },
        relations: ['product'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error fetching reports for user ${userId}:`, error);
      throw error;
    }
  }

  async getProductReports(productId: string): Promise<Report[]> {
    try {
      return await this.reportRepository.find({
        where: { productId },
        relations: ['reporter'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error fetching reports for product ${productId}:`, error);
      throw error;
    }
  }
} 