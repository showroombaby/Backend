import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { testConfig } from '../../../config/test.config';
import { AuthModule } from '../../auth/auth.module';
import { EmailModule } from '../../email/email.module';
import { EmailService } from '../../email/services/email.service';
import { StorageService } from '../../storage/services/storage.service';
import { User } from '../../users/entities/user.entity';
import { UsersModule } from '../../users/users.module';
import { Category } from '../entities/category.entity';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/product.entity';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductsModule } from '../products.module';

export { TestingModule } from '@nestjs/testing';

export interface TestProduct {
  title: string;
  description: string;
  price: number;
  condition: ProductCondition;
  categoryId: string;
  images?: Express.Multer.File[];
}

export const createTestingModule = async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: 'src/config/test.env',
      }),
      TypeOrmModule.forRoot(testConfig),
      TypeOrmModule.forFeature([User, Product, Category, ProductImage]),
      EmailModule,
      UsersModule,
      AuthModule,
      ProductsModule,
    ],
  })
    .overrideProvider(EmailService)
    .useValue({
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    })
    .overrideProvider(StorageService)
    .useValue({
      uploadFile: jest.fn().mockResolvedValue('test-image.jpg'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    })
    .compile();

  return moduleRef;
};

export const initializeTestApp = async (module: TestingModule) => {
  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
};

export const createTestProduct = (
  overrides: Partial<TestProduct> = {},
): TestProduct => ({
  title: 'Test Product',
  description: 'A test product description',
  price: 99.99,
  condition: ProductCondition.NEW,
  categoryId: 'test-category-id',
  ...overrides,
});

export const cleanupDatabase = async (app: INestApplication) => {
  try {
    const productRepository = app.get(getRepositoryToken(Product));
    const categoryRepository = app.get(getRepositoryToken(Category));
    const userRepository = app.get(getRepositoryToken(User));

    await productRepository.query('DELETE FROM products');
    await categoryRepository.query('DELETE FROM categories');
    await userRepository.query('DELETE FROM users');
  } catch (error) {
    console.error('Erreur lors du nettoyage de la base de données:', error);
  }
};

export const createTestCategory = async (app: INestApplication) => {
  const categoryRepository = app.get(getRepositoryToken(Category));
  const category = categoryRepository.create({
    name: 'Test Category',
    description: 'A test category',
  });
  return await categoryRepository.save(category);
};
