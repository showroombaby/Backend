import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductFavorite } from '../entities/product-favorite.entity';
import { Product } from '../entities/product.entity';
import { FavoriteResponseDto } from '../dto/favorite.dto';

@Injectable()
export class ProductFavoritesService {
  private readonly logger = new Logger(ProductFavoritesService.name);

  constructor(
    @InjectRepository(ProductFavorite)
    private readonly favoriteRepository: Repository<ProductFavorite>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToFavorites(userId: string, productId: string): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['images'],
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const existingFavorite = await this.favoriteRepository.findOne({
        where: { userId, productId },
      });

      if (existingFavorite) {
        throw new ConflictException('Product is already in favorites');
      }

      const favorite = this.favoriteRepository.create({
        userId,
        productId,
      });

      await this.favoriteRepository.save(favorite);
    } catch (error) {
      this.logger.error(
        `⚠️ Error adding product ${productId} to favorites for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async removeFromFavorites(userId: string, productId: string): Promise<void> {
    try {
      const favorite = await this.favoriteRepository.findOne({
        where: { userId, productId },
      });

      if (!favorite) {
        throw new NotFoundException('Favorite not found');
      }

      await this.favoriteRepository.remove(favorite);
    } catch (error) {
      this.logger.error(
        `⚠️ Error removing product ${productId} from favorites for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    try {
      const favorite = await this.favoriteRepository.findOne({
        where: { userId, productId },
      });
      return !!favorite;
    } catch (error) {
      this.logger.error(
        `⚠️ Error checking favorite status for product ${productId} and user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getFavorite(
    id: string,
    userId: string,
  ): Promise<FavoriteResponseDto | null> {
    try {
      const favorite = await this.favoriteRepository.findOne({
        where: { id, userId },
        relations: ['product', 'product.images'],
      });

      if (!favorite) {
        return null;
      }

      return {
        id: favorite.id,
        userId: favorite.userId,
        productId: favorite.productId,
        createdAt: favorite.createdAt,
        product: {
          id: favorite.product.id,
          title: favorite.product.title,
          price: Number(favorite.product.price),
          images:
            favorite.product.images?.map((image) => ({ url: image.url })) || [],
        },
      };
    } catch (error) {
      this.logger.error(
        `⚠️ Error getting favorite ${id} for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getUserFavorites(userId: string): Promise<FavoriteResponseDto[]> {
    try {
      const favorites = await this.favoriteRepository.find({
        where: { userId },
        relations: ['product', 'product.images'],
      });

      return favorites.map((favorite) => ({
        id: favorite.id,
        userId: favorite.userId,
        productId: favorite.productId,
        createdAt: favorite.createdAt,
        product: {
          id: favorite.product.id,
          title: favorite.product.title,
          price: Number(favorite.product.price),
          images:
            favorite.product.images?.map((image) => ({ url: image.url })) || [],
        },
      }));
    } catch (error) {
      this.logger.error(
        `⚠️ Error getting favorites for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
