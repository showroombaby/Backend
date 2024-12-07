import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { StorageService } from '../../../storage/services/storage.service';
import { User } from '../../../users/entities/user.entity';
import { Category } from '../../entities/category.entity';
import { ProductImage } from '../../entities/product-image.entity';
import { Product } from '../../entities/product.entity';
import { ProductsModule } from '../../products.module';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let testUser: User;
  let testCategory: Category;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Product, ProductImage, Category, User],
          synchronize: true,
        }),
        ProductsModule,
      ],
    })
      .overrideProvider(StorageService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue('http://example.com/image.jpg'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );

    await app.init();

    // Créer un utilisateur et une catégorie de test
    testUser = await createTestUser(userRepository);
    testCategory = await createTestCategory(categoryRepository);
  });

  describe('POST /products', () => {
    it('devrait créer un nouveau produit avec succès', async () => {
      const createProductDto = {
        title: 'Poussette Yoyo',
        description: 'Poussette en excellent état',
        price: 299.99,
        categoryId: testCategory.id,
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .field('title', createProductDto.title)
        .field('description', createProductDto.description)
        .field('price', createProductDto.price)
        .field('categoryId', createProductDto.categoryId)
        .attach('images', Buffer.from('fake-image'), 'image.jpg')
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(201);

      expect(response.body).toMatchObject({
        title: createProductDto.title,
        description: createProductDto.description,
        price: createProductDto.price,
        seller: {
          id: testUser.id,
        },
        category: {
          id: testCategory.id,
        },
        images: expect.arrayContaining([
          expect.objectContaining({
            url: expect.any(String),
          }),
        ]),
      });
    });

    it('devrait échouer si les images sont manquantes', () => {
      const createProductDto = {
        title: 'Poussette Yoyo',
        description: 'Poussette en excellent état',
        price: 299.99,
        categoryId: testCategory.id,
      };

      return request(app.getHttpServer())
        .post('/products')
        .field('title', createProductDto.title)
        .field('description', createProductDto.description)
        .field('price', createProductDto.price)
        .field('categoryId', createProductDto.categoryId)
        .set('Authorization', `Bearer ${generateTestToken(testUser)}`)
        .expect(400);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

async function createTestUser(userRepository: Repository<User>): Promise<User> {
  const user = userRepository.create({
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  });
  return userRepository.save(user);
}

async function createTestCategory(
  categoryRepository: Repository<Category>,
): Promise<Category> {
  const category = categoryRepository.create({
    name: 'Poussettes',
    description: 'Catégorie pour les poussettes',
  });
  return categoryRepository.save(category);
}

function generateTestToken(user: User): string {
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'test-secret',
    signOptions: { expiresIn: '1h' },
  });
  return jwtService.sign({
    sub: user.id,
    email: user.email,
  });
}
