import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Get,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ProductFavoritesService } from '../services/product-favorites.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FavoriteResponseDto } from '../dto/favorite.dto';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: ProductFavoritesService) {}

  @Post(':productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter un produit aux favoris' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Le produit a été ajouté aux favoris',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Le produit n\'existe pas',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Le produit est déjà dans les favoris',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé',
  })
  async addToFavorites(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.favoritesService.addToFavorites(userId, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retirer un produit des favoris' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Le produit a été retiré des favoris',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Le favori n\'existe pas',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé',
  })
  async removeFromFavorites(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.favoritesService.removeFromFavorites(userId, productId);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les favoris de l\'utilisateur' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des favoris récupérée avec succès',
    type: [FavoriteResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé',
  })
  async getUserFavorites(@CurrentUser('id') userId: string): Promise<FavoriteResponseDto[]> {
    return this.favoritesService.getUserFavorites(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un favori spécifique' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Favori trouvé',
    type: FavoriteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Favori non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé',
  })
  async getFavorite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<FavoriteResponseDto> {
    const favorite = await this.favoritesService.getFavorite(id, userId);
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
    return favorite;
  }
} 