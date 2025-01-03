import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ProductsService } from '../../products/services/products.service';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class OfflineService {
  private readonly logger = new Logger(OfflineService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async getOfflineData(userId: string) {
    try {
      // Récupérer les données utilisateur essentielles
      const userData = await this.usersService.findById(userId);
      await this.cacheManager.set(`user:${userId}`, userData, 3600); // Cache 1h

      // Récupérer les produits récents
      const recentProducts = await this.productsService.findAll({
        page: 1,
        limit: 10,
      });
      await this.cacheManager.set(
        `recent_products:${userId}`,
        recentProducts,
        3600,
      );

      // Récupérer les catégories (à partir des produits)
      const categories = recentProducts.items.reduce((acc, product) => {
        if (product.category && !acc.includes(product.category)) {
          acc.push(product.category);
        }
        return acc;
      }, []);
      await this.cacheManager.set(`categories:${userId}`, categories, 3600);

      return {
        userData: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar,
        },
        recentProducts: recentProducts.items,
        categories,
        lastSync: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des données offline: ${error.message}`,
      );
      throw error;
    }
  }

  async clearOfflineData(userId: string) {
    try {
      await Promise.all([
        this.cacheManager.del(`user:${userId}`),
        this.cacheManager.del(`recent_products:${userId}`),
        this.cacheManager.del(`categories:${userId}`),
      ]);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression des données offline: ${error.message}`,
      );
      throw error;
    }
  }
}
