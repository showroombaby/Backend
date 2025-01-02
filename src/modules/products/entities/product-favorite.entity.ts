import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('product_favorites')
@Unique(['userId', 'productId'])
export class ProductFavorite {
  @ApiProperty({
    description: 'ID unique du favori',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'ID du produit',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @Column({ name: 'product_id' })
  productId: string;

  @ApiProperty({
    description: 'Relation avec l\'utilisateur',
    type: () => User
  })
  @ManyToOne(() => User, user => user.favorites, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Relation avec le produit',
    type: () => Product
  })
  @ManyToOne(() => Product, product => product.favorites, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({
    description: 'Date de création du favori',
    example: '2024-01-02T12:00:00Z'
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 