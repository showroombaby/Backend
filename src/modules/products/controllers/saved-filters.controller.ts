import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { SearchProductsDto } from '../dto/search-products.dto';
import { SavedFilter } from '../entities/saved-filter.entity';
import { SavedFiltersService } from '../services/saved-filters.service';

class CreateSavedFilterDto {
  name: string;
  filter: SearchProductsDto;
}

@ApiTags('saved-filters')
@Controller('saved-filters')
@UseGuards(JwtAuthGuard)
export class SavedFiltersController {
  constructor(private readonly savedFiltersService: SavedFiltersService) {}

  @Post()
  @ApiOperation({ summary: 'Sauvegarder un filtre de recherche' })
  @ApiResponse({
    status: 201,
    description: 'Filtre sauvegardé avec succès',
    type: SavedFilter,
  })
  async create(
    @Body() createDto: CreateSavedFilterDto,
    @CurrentUser() user: User,
  ) {
    const filterData = {
      name: createDto.name,
      ...createDto.filter,
    };
    return this.savedFiltersService.create(filterData, user);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les filtres sauvegardés' })
  @ApiResponse({
    status: 200,
    description: 'Liste des filtres sauvegardés',
    type: [SavedFilter],
  })
  async findAll(@CurrentUser() user: User) {
    return this.savedFiltersService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un filtre sauvegardé par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Filtre trouvé',
    type: SavedFilter,
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.savedFiltersService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un filtre sauvegardé' })
  @ApiResponse({
    status: 200,
    description: 'Filtre mis à jour avec succès',
    type: SavedFilter,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: CreateSavedFilterDto,
    @CurrentUser() user: User,
  ) {
    return this.savedFiltersService.update(
      id,
      {
        name: updateDto.name,
        ...updateDto.filter,
      },
      user,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un filtre sauvegardé' })
  @ApiResponse({
    status: 200,
    description: 'Filtre supprim�� avec succès',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.savedFiltersService.remove(id, user);
  }
}
