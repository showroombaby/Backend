import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { StorageModule } from '../storage/storage.module';
import { ProductsController } from './controllers/products.controller';
import { SavedFiltersController } from './controllers/saved-filters.controller';
import { Category } from './entities/category.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductView } from './entities/product-view.entity';
import { Product } from './entities/product.entity';
import { SavedFilter } from './entities/saved-filter.entity';
import { ProductImagesService } from './services/product-images.service';
import { ProductViewsService } from './services/product-views.service';
import { ProductsService } from './services/products.service';
import { SavedFiltersService } from './services/saved-filters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      Category,
      ProductView,
      SavedFilter,
    ]),
    StorageModule,
    CategoriesModule,
  ],
  controllers: [ProductsController, SavedFiltersController],
  providers: [
    ProductsService,
    ProductImagesService,
    ProductViewsService,
    SavedFiltersService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
