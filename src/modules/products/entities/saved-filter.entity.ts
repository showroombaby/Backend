import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProductCondition } from '../enums/product-condition.enum';

@Entity()
export class SavedFilter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'float', nullable: true })
  minPrice?: number;

  @Column({ type: 'float', nullable: true })
  maxPrice?: number;

  @Column({
    type: 'varchar',
    enum: ProductCondition,
    nullable: true,
    name: 'condition',
  })
  condition?: ProductCondition;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => User, (user) => user.savedFilters)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
