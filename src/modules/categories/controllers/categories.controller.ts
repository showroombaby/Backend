import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from '../../users/enums/role.enum';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoriesService } from '../services/categories.service';

@Controller('categories')
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      const category = await this.categoriesService.create(createCategoryDto);
      return {
        id: category.id,
        name: category.name,
        description: category.description,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    }
  }

  @Get()
  async findAll() {
    try {
      const categories = await this.categoriesService.findAll();
      return categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
      }));
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des catégories:',
        error,
      );
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const category = await this.categoriesService.findOne(id);
      return {
        id: category.id,
        name: category.name,
        description: category.description,
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération de la catégorie:',
        error,
      );
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      const category = await this.categoriesService.update(
        id,
        updateCategoryDto,
      );
      return {
        id: category.id,
        name: category.name,
        description: category.description,
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la mise à jour de la catégorie:',
        error,
      );
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    try {
      await this.categoriesService.remove(id);
      return {
        message: 'Category deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        'Erreur lors de la suppression de la catégorie:',
        error,
      );
      throw error;
    }
  }
}
