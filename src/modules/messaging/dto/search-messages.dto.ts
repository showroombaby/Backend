import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchMessagesDto {
  @ApiProperty({
    description: 'Terme de recherche dans le contenu des messages',
    example: 'prix',
    required: false,
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    description: 'ID du produit pour filtrer les messages',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({
    description: "ID de l'utilisateur pour filtrer les messages",
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
