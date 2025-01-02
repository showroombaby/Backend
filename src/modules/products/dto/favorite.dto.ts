import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
  @ApiProperty({
    description: 'ID du favori',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string;

  @ApiProperty({
    description: 'ID du produit',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  productId: string;

  @ApiProperty({
    description: 'Date de création',
    example: '2024-01-02T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Détails du produit',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'iPhone 12',
      price: 699.99,
      images: [{ url: 'https://example.com/image.jpg' }]
    }
  })
  product: {
    id: string;
    title: string;
    price: number;
    images: { url: string }[];
  };
} 