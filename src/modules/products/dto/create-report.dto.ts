import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsString, MinLength, MaxLength } from 'class-validator';
import { ReportReason } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({
    description: 'ID du produit à signaler',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Raison du signalement',
    enum: ReportReason,
    example: ReportReason.INAPPROPRIATE
  })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({
    description: 'Description détaillée du signalement',
    example: 'Ce produit contient du contenu inapproprié',
    minLength: 10,
    maxLength: 1000
  })
  @IsString()
  @MinLength(10, { message: 'La description doit contenir au moins 10 caractères' })
  @MaxLength(1000, { message: 'La description ne peut pas dépasser 1000 caractères' })
  description: string;
} 