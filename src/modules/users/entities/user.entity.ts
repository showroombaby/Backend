import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductView } from '../../products/entities/product-view.entity';
import { Product } from '../../products/entities/product.entity';
import { SavedFilter } from '../../products/entities/saved-filter.entity';
import { Role } from '../enums/role.enum';
import { Address } from '../interfaces/address.interface';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  name: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    name: 'rating',
  })
  rating: number;

  @Column({
    type: 'varchar',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: Address) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  address: Address;

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @OneToMany(() => ProductView, (view) => view.user)
  views: ProductView[];

  @OneToMany(() => SavedFilter, (filter) => filter.user)
  savedFilters: SavedFilter[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
      } catch (error) {
        Logger.error('Error hashing password', error);
        throw error;
      }
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      Logger.error('Error validating password', error);
      throw error;
    }
  }
}
