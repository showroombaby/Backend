import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductView } from '../entities/product-view.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductViewsService {
  private readonly logger = new Logger(ProductViewsService.name);

  constructor(
    @InjectRepository(ProductView)
    private readonly productViewRepository: Repository<ProductView>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async recordView(
    productId: string,
    ip: string,
    userAgent: string,
    viewerId?: string,
  ): Promise<void> {
    try {
      // Vérifier si une vue existe déjà pour cette IP dans les dernières 24h
      const existingView = await this.productViewRepository
        .createQueryBuilder('view')
        .where('view.product.id = :productId', { productId })
        .andWhere('view.ip = :ip', { ip })
        .andWhere('view.createdAt > :date', {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .getOne();

      if (!existingView) {
        // Créer une nouvelle vue
        const view = this.productViewRepository.create({
          product: { id: productId },
          ip,
          userAgent,
          viewerId,
        });

        await this.productViewRepository.save(view);

        // Incrémenter le compteur de vues du produit
        await this.productRepository.increment(
          { id: productId },
          'viewCount',
          1,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'enregistrement de la vue pour le produit ${productId}:`,
      );
      this.logger.error(error);
      throw error;
    }
  }

  async getViewStats(productId: string) {
    try {
      const stats = await this.productViewRepository
        .createQueryBuilder('view')
        .select('COUNT(DISTINCT view.ip)', 'uniqueViews')
        .addSelect('COUNT(*)', 'totalViews')
        .where('view.product.id = :productId', { productId })
        .getRawOne();

      const viewsByDay = await this.productViewRepository
        .createQueryBuilder('view')
        .select('DATE(view.createdAt)', 'date')
        .addSelect('COUNT(*)', 'views')
        .where('view.product.id = :productId', { productId })
        .groupBy('DATE(view.createdAt)')
        .orderBy('DATE(view.createdAt)', 'DESC')
        .limit(7)
        .getRawMany();

      return {
        uniqueViews: parseInt(stats.uniqueViews),
        totalViews: parseInt(stats.totalViews),
        viewsByDay,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des statistiques de vues pour le produit ${productId}:`,
      );
      this.logger.error(error);
      throw error;
    }
  }
}
