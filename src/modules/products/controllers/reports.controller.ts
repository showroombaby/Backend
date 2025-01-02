import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateReportDto } from '../dto/create-report.dto';
import { ReportsService } from '../services/reports.service';
import { Report } from '../entities/report.entity';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau signalement' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Le signalement a été créé avec succès',
    type: Report,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Le produit n\'existe pas',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Trop de signalements en peu de temps',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé',
  })
  async create(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser('id') userId: string,
  ): Promise<Report> {
    return this.reportsService.create(createReportDto, userId);
  }
} 