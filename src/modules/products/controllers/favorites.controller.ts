import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ProductFavoritesService } from '../services/product-favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: ProductFavoritesService) {}

  @Post(':productId')
  async addToFavorites(
    @Param('productId') productId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.favoritesService.addToFavorites(userId, productId);
  }

  @Delete(':productId')
  async removeFromFavorites(
    @Param('productId') productId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.favoritesService.removeFromFavorites(userId, productId);
  }

  @Get()
  async getUserFavorites(@CurrentUser('id') userId: string) {
    return this.favoritesService.getUserFavorites(userId);
  }
} 