import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportDto {
  @ApiProperty({
    description: 'Statut du signalement',
    enum: ReportStatus,
    example: ReportStatus.REVIEWED,
    required: false
  })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiProperty({
    description: 'Note de modération',
    example: 'Signalement vérifié et validé',
    required: false,
    minLength: 10,
    maxLength: 1000
  })
  @IsString()
  @IsOptional()
  @MinLength(10, { message: 'La note doit contenir au moins 10 caractères' })
  @MaxLength(1000, { message: 'La note ne peut pas dépasser 1000 caractères' })
  moderationNote?: string;
} 