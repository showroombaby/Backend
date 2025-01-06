import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../../../categories/entities/category.entity';
import { CategoriesService } from '../../../categories/services/categories.service';
import { Message } from '../../../messaging/entities/message.entity';
import { StorageService } from '../../../storage/storage.service';
import { User } from '../../../users/entities/user.entity';
import { ProductDetailsController } from '../../controllers/product-details.controller';
import { ProductsController } from '../../controllers/products.controller';
import { SavedFiltersController } from '../../controllers/saved-filters.controller';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductView } from '../../entities/product-view.entity';
import { Product } from '../../entities/product.entity';
import { SavedFilter } from '../../entities/saved-filter.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductFavoritesService } from '../../services/product-favorites.service';
import { ProductImagesService } from '../../services/product-images.service';
import { ProductsService } from '../../services/products.service';
import { SavedFiltersService } from '../../services/saved-filters.service';

const mockProduct = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Product',
  description: 'Test Description',
  price: 100,
  condition: ProductCondition.NEW,
  categoryId: '123e4567-e89b-12d3-a456-426614174001',
};

const mockSimilarProducts = [
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Similar Product 1',
    price: 110,
    condition: ProductCondition.NEW,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Similar Product 2',
    price: 90,
    condition: ProductCondition.NEW,
  },
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'test_db',
        entities: [
          Product,
          ProductImage,
          ProductView,
          SavedFilter,
          Category,
          User,
          Message,
        ],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
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
  controllers: [
    ProductsController,
    ProductDetailsController,
    SavedFiltersController,
  ],
  providers: [
    {
      provide: ProductsService,
      useValue: {
        findOne: jest.fn().mockResolvedValue(mockProduct),
        findSimilarProducts: jest.fn().mockResolvedValue(mockSimilarProducts),
        create: jest.fn().mockResolvedValue(mockProduct),
        update: jest.fn().mockResolvedValue(mockProduct),
        remove: jest.fn().mockResolvedValue(undefined),
      },
    },
    {
      provide: ProductImagesService,
      useValue: {
        getProductImages: jest.fn().mockResolvedValue([]),
        addImageToProduct: jest.fn().mockResolvedValue(undefined),
        removeImageFromProduct: jest.fn().mockResolvedValue(undefined),
      },
    },
    {
      provide: CategoriesService,
      useValue: {
        findOne: jest.fn().mockResolvedValue({}),
        findAll: jest.fn().mockResolvedValue([]),
      },
    },
    {
      provide: ProductFavoritesService,
      useValue: {
        addToFavorites: jest.fn().mockResolvedValue({}),
        removeFromFavorites: jest.fn().mockResolvedValue({}),
        isFavorite: jest.fn().mockResolvedValue(false),
      },
    },
    {
      provide: SavedFiltersService,
      useValue: {
        create: jest.fn().mockResolvedValue({}),
        findAll: jest.fn().mockResolvedValue([]),
        remove: jest.fn().mockResolvedValue({}),
      },
    },
    ConfigService,
    {
      provide: StorageService,
      useValue: {
        uploadFile: jest.fn().mockResolvedValue('test-file-url'),
        deleteFile: jest.fn().mockResolvedValue(true),
      },
    },
    {
      provide: getRepositoryToken(ProductImage),
      useValue: {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    },
    {
      provide: getRepositoryToken(Product),
      useValue: {
        find: jest.fn().mockResolvedValue(mockSimilarProducts),
        findOne: jest.fn().mockResolvedValue(mockProduct),
        save: jest.fn().mockResolvedValue(mockProduct),
        delete: jest.fn().mockResolvedValue({}),
      },
    },
  ],
  exports: [
    ProductsService,
    ProductImagesService,
    CategoriesService,
    ProductFavoritesService,
    SavedFiltersService,
    StorageService,
    ConfigService,
  ],
})
export class TestModule {}
