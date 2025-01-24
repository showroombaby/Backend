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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Role } from '../../users/enums/role.enum';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Category } from '../entities/category.entity';
import { CategoriesService } from '../services/categories.service';

@ApiTags('categories')
@Controller('categories')
@ApiBearerAuth()
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle catégorie' })
  @ApiResponse({
    status: 201,
    description: 'Catégorie créée avec succès',
    type: Category,
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé - Réservé aux administrateurs',
  })
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
  @ApiOperation({ summary: 'Récupérer toutes les catégories' })
  @ApiResponse({
    status: 200,
    description: 'Liste des catégories',
    type: [Category],
  })
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
  @ApiOperation({ summary: 'Récupérer une catégorie par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Catégorie trouvée',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie non trouvée',
  })
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
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une catégorie' })
  @ApiResponse({
    status: 200,
    description: 'Catégorie mise à jour avec succès',
    type: Category,
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé - Réservé aux administrateurs',
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie non trouvée',
  })
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
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  @ApiResponse({
    status: 200,
    description: 'Catégorie supprimée avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: 'Non autorisé - Réservé aux administrateurs',
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie non trouvée',
  })
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
