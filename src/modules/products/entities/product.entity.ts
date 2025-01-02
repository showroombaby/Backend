import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductImage } from './product-image.entity';
import { ProductView } from './product-view.entity';
import { ProductFavorite } from './product-favorite.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SOLD = 'sold',
  ARCHIVED = 'archived',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'varchar',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
    name: 'status',
  })
  status: ProductStatus;

  @Column({
    type: 'varchar',
    enum: ProductCondition,
    nullable: false,
    name: 'condition',
  })
  condition: ProductCondition;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  zipCode?: string;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
  })
  images: ProductImage[];

  @OneToMany(() => ProductView, (view) => view.product)
  views: ProductView[];

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProductFavorite, favorite => favorite.product)
  favorites: ProductFavorite[];
}
