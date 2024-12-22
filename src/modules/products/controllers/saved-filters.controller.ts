import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { SavedFilter } from '../entities/saved-filter.entity';
import { SavedFiltersService } from '../services/saved-filters.service';
import { CreateSavedFilterDto } from '../dto/create-saved-filter.dto';
import { UpdateSavedFilterDto } from '../dto/update-saved-filter.dto';

@ApiTags('saved-filters')
@Controller('saved-filters')
@UseGuards(JwtAuthGuard)
export class SavedFiltersController {
  constructor(private readonly savedFiltersService: SavedFiltersService) {}

  @Post()
  @HttpCode(201)
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
    return this.savedFiltersService.create({
      ...createDto,
      userId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les filtres sauvegardés' })
  @ApiResponse({
    status: 200,
    description: 'Liste des filtres sauvegardés',
    type: [SavedFilter],
  })
  findAll(@CurrentUser() user: User) {
    return this.savedFiltersService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un filtre sauvegardé par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Filtre sauvegardé trouvé',
    type: SavedFilter,
  })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.savedFiltersService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un filtre sauvegardé' })
  @ApiResponse({
    status: 200,
    description: 'Filtre sauvegardé mis à jour',
    type: SavedFilter,
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSavedFilterDto,
    @CurrentUser() user: User,
  ) {
    return this.savedFiltersService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un filtre sauvegardé' })
  @ApiResponse({ status: 204, description: 'Filtre supprimé avec succès' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.savedFiltersService.remove(id, user.id);
  }
}
