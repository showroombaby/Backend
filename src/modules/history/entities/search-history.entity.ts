import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsObject, Min } from 'class-validator';

@Entity()
export class SearchHistory {
  @ApiProperty({ description: 'Identifiant unique de la recherche' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Identifiant de l\'utilisateur' })
  @Column()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Utilisateur ayant effectué la recherche' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'Terme de recherche' })
  @Column()
  @IsString()
  searchTerm: string;

  @ApiProperty({ description: 'Filtres appliqués à la recherche' })
  @Column('jsonb')
  @IsObject()
  filters: Record<string, any>;

  @ApiProperty({ description: 'Nombre de résultats trouvés' })
  @Column()
  @IsNumber()
  @Min(0)
  resultsCount: number;

  @ApiProperty({ description: 'Catégorie de recherche' })
  @Column()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Date de la recherche' })
  @CreateDateColumn()
  createdAt: Date;
} 