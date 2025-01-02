import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID, IsOptional, IsObject } from 'class-validator';
import { ActionType } from '../entities/history.entity';

export class CreateHistoryDto {
  @ApiProperty({
    description: 'Type d\'action',
    enum: ActionType,
    example: ActionType.CREATE
  })
  @IsEnum(ActionType)
  @IsNotEmpty()
  actionType: ActionType;

  @ApiProperty({
    description: 'ID de l\'entité concernée',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'Type d\'entité',
    example: 'product'
  })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({
    description: 'Détails supplémentaires de l\'action',
    example: { field: 'status', oldValue: 'draft', newValue: 'published' },
    required: false
  })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  @ApiProperty({
    description: 'Adresse IP de l\'utilisateur',
    example: '192.168.1.1',
    required: false
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent du navigateur',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false
  })
  @IsString()
  @IsOptional()
  userAgent?: string;
} 