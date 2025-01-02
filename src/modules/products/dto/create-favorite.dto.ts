import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'ID du produit à ajouter aux favoris',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  productId: string;
} 