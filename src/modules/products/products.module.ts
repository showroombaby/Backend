import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { ProductsController } from './controllers/products.controller';
import { Category } from './entities/category.entity';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { ProductImagesService } from './services/product-images.service';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, Category]),
    StorageModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductImagesService],
  exports: [ProductsService],
})
export class ProductsModule {}
