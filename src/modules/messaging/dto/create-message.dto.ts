import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Contenu du message',
    example: 'Bonjour, est-ce que ce produit est toujours disponible ?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: "ID de l'utilisateur destinataire",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({
    description: 'ID du produit concerné (optionnel)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  productId?: string;
}
