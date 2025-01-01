import { testConfig } from '@/config/test.config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../../categories/entities/category.entity';
import { CategoriesService } from '../../../categories/services/categories.service';
import { Message } from '../../../messaging/entities/message.entity';
import { StorageService } from '../../../storage/storage.service';
import { User } from '../../../users/entities/user.entity';
import { ProductsController } from '../../controllers/products.controller';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductView } from '../../entities/product-view.entity';
import { Product } from '../../entities/product.entity';
import { SavedFilter } from '../../entities/saved-filter.entity';
import { ProductFavoritesService } from '../../services/product-favorites.service';
import { ProductImagesService } from '../../services/product-images.service';
import { ProductsService } from '../../services/products.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(testConfig),
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      ProductView,
      SavedFilter,
      Category,
      User,
      Message,
    ]),
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductImagesService,
    CategoriesService,
    ProductFavoritesService,
    {
      provide: StorageService,
      useValue: {
        uploadFile: jest.fn().mockResolvedValue('test-file-url'),
        deleteFile: jest.fn().mockResolvedValue(true),
      },
    },
  ],
})
export class TestModule {}
