import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import { Product } from '../entities/product.entity';
import { CreateReportDto } from '../dto/create-report.dto';

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
} 