import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedFilter } from '../entities/saved-filter.entity';
import { CreateSavedFilterDto } from '../dto/create-saved-filter.dto';
import { UpdateSavedFilterDto } from '../dto/update-saved-filter.dto';

@Injectable()
export class SavedFiltersService {
  private readonly logger = new Logger(SavedFiltersService.name);

  constructor(
    @InjectRepository(SavedFilter)
    private readonly savedFilterRepository: Repository<SavedFilter>,
  ) {}

  async create(
    createDto: CreateSavedFilterDto & { userId: string },
  ): Promise<SavedFilter> {
    try {
      const savedFilter = this.savedFilterRepository.create({
        name: createDto.name,
        filters: {
          minPrice: createDto.filters.minPrice,
          maxPrice: createDto.filters.maxPrice,
          condition: createDto.filters.condition,
          categoryId: createDto.filters.categoryId,
        },
        userId: createDto.userId,
      });
      return await this.savedFilterRepository.save(savedFilter);
    } catch (error) {
      this.logger.error('Erreur lors de la création du filtre:', error);
      throw error;
    }
  }

  async findAll(userId: string): Promise<SavedFilter[]> {
    try {
      return await this.savedFilterRepository.find({
        where: { userId },
      });
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des filtres:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<SavedFilter> {
    try {
      const filter = await this.savedFilterRepository.findOne({
        where: { id, userId },
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
    updateDto: UpdateSavedFilterDto,
    userId: string,
  ): Promise<SavedFilter> {
    try {
      const filter = await this.findOne(id, userId);
      const updatedFilter = {
        ...filter,
        name: updateDto.name,
        filters: {
          minPrice: updateDto.filters.minPrice,
          maxPrice: updateDto.filters.maxPrice,
          condition: updateDto.filters.condition,
          categoryId: updateDto.filters.categoryId,
        },
      };

      return await this.savedFilterRepository.save(updatedFilter);
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du filtre:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const filter = await this.findOne(id, userId);
      await this.savedFilterRepository.remove(filter);
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du filtre:', error);
      throw error;
    }
  }
}
