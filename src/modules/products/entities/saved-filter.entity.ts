import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

interface FilterOptions {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  query?: string;
  sortBy?: string;
}

@Entity('saved_filters')
export class SavedFilter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('json', { default: '{}' })
  filters: FilterOptions;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;
}
