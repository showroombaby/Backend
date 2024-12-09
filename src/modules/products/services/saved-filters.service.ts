import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SavedFilter } from '../entities/saved-filter.entity';

@Injectable()
export class SavedFiltersService {
  private readonly logger = new Logger(SavedFiltersService.name);

  constructor(
    @InjectRepository(SavedFilter)
    private readonly savedFilterRepository: Repository<SavedFilter>,
  ) {}

  async create(filter: Partial<SavedFilter>, user: User): Promise<SavedFilter> {
    try {
      const savedFilter = this.savedFilterRepository.create({
        ...filter,
        user,
      });
      return await this.savedFilterRepository.save(savedFilter);
    } catch (error) {
      this.logger.error('Erreur lors de la création du filtre:', error);
      throw error;
    }
  }

  async findAll(user: User): Promise<SavedFilter[]> {
    try {
      return await this.savedFilterRepository.find({
        where: { user: { id: user.id } },
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des filtres:', error);
      throw error;
    }
  }

  async findOne(id: string, user: User): Promise<SavedFilter> {
    try {
      const filter = await this.savedFilterRepository.findOne({
        where: { id, user: { id: user.id } },
      });

      if (!filter) {
        throw new NotFoundException('Filter not found');
      }

      return filter;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du filtre:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateDto: Partial<SavedFilter>,
    user: User,
  ): Promise<SavedFilter> {
    try {
      const filter = await this.findOne(id, user);
      Object.assign(filter, updateDto);
      return await this.savedFilterRepository.save(filter);
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du filtre:', error);
      throw error;
    }
  }

  async remove(id: string, user: User): Promise<void> {
    try {
      const filter = await this.findOne(id, user);
      await this.savedFilterRepository.remove(filter);
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du filtre:', error);
      throw error;
    }
  }
}
