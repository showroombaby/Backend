import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  name: string;

  @Column()
  @IsString()
  description: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
