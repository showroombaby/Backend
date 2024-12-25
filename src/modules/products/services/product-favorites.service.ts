import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductFavorite } from '../entities/product-favorite.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductFavoritesService {
  constructor(
    @InjectRepository(ProductFavorite)
    private readonly favoriteRepository: Repository<ProductFavorite>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addToFavorites(userId: string, productId: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const favorite = this.favoriteRepository.create({
      userId,
      productId,
    });

    await this.favoriteRepository.save(favorite);
  }

  async removeFromFavorites(userId: string, productId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });
    return !!favorite;
  }

  async getUserFavorites(userId: string): Promise<ProductFavorite[]> {
    return this.favoriteRepository.find({
      where: { userId },
      relations: ['product', 'product.images', 'product.seller', 'product.category'],
    });
  }
} 