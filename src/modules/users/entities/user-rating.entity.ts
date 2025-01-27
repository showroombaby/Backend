import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_ratings')
export class UserRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  rater: User;

  @Column({ name: 'rater_id' })
  rater_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  rated: User;

  @Column({ name: 'rated_id' })
  rated_id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
