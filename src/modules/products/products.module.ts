import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductView } from './entities/product-view.entity';
import { ProductFavorite } from './entities/product-favorite.entity';
import { Category } from './entities/category.entity';
import { SavedFilter } from './entities/saved-filter.entity';
import { ProductsController } from './controllers/products.controller';
import { SavedFiltersController } from './controllers/saved-filters.controller';
import { FavoritesController } from './controllers/favorites.controller';
import { ProductsService } from './services/products.service';
import { ProductImagesService } from './services/product-images.service';
import { ProductViewsService } from './services/product-views.service';
import { SavedFiltersService } from './services/saved-filters.service';
import { ProductFavoritesService } from './services/product-favorites.service';
import { CategoriesModule } from '../categories/categories.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      ProductView,
      ProductFavorite,
      Category,
      SavedFilter,
    ]),
    CategoriesModule,
    StorageModule,
  ],
  controllers: [
    ProductsController,
    SavedFiltersController,
    FavoritesController,
  ],
  providers: [
    ProductsService,
    ProductImagesService,
    ProductViewsService,
    SavedFiltersService,
    ProductFavoritesService,
  ],
  exports: [
    ProductsService,
    ProductViewsService,
    SavedFiltersService,
    ProductFavoritesService,
  ],
})
export class ProductsModule {}
