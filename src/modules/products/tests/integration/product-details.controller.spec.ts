import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { TestJwtModule } from '../../../../common/test/jwt.module';
import { TestStorageModule } from '../../../../common/test/storage.module';
import { Category } from '../../../categories/entities/category.entity';
import { User } from '../../../users/entities/user.entity';
import { Product } from '../../entities/product.entity';
import { ProductsModule } from '../../products.module';

describe('Product Details (Integration)', () => {
  let app: INestApplication;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let userRepository: Repository<User>;
  let user: User;
  let category: Category;
  let product: Product;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        TestJwtModule,
        TestStorageModule,
        ProductsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    productRepository = moduleFixture.get('ProductRepository');
    categoryRepository = moduleFixture.get('CategoryRepository');
    userRepository = moduleFixture.get('UserRepository');
    await app.init();

    // Créer les données de test
    user = await userRepository.save({
      email: 'test@example.com',
      password: 'password',
      username: 'testuser',
    });

    category = await categoryRepository.save({
      name: 'Test Category',
      description: 'Test Description',
    });

    product = await productRepository.save({
      title: 'Test Product',
      description: 'Test Description',
      price: 100,
      seller: user,
      category,
    });
  });

  afterAll(async () => {
    await productRepository.query('DELETE FROM products');
    await categoryRepository.query('DELETE FROM categories');
    await userRepository.query('DELETE FROM users');
    await app.close();
  });

  describe('GET /products/:id/details', () => {
    it('devrait retourner les détails du produit', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}/details`)
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        seller: {
          id: user.id,
          username: user.username,
        },
        category: {
          id: category.id,
          name: category.name,
        },
      });
    });

    it('devrait échouer pour un produit inexistant', () => {
      return request(app.getHttpServer())
        .get('/products/999999/details')
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(404);
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .get(`/products/${product.id}/details`)
        .expect(401);
    });
  });

  describe('GET /products/:id/similar', () => {
    beforeEach(async () => {
      await productRepository.save([
        {
          title: 'Similar Product 1',
          description: 'Similar Description 1',
          price: 90,
          seller: user,
          category,
        },
        {
          title: 'Similar Product 2',
          description: 'Similar Description 2',
          price: 110,
          seller: user,
          category,
        },
      ]);
    });

    it('devrait retourner les produits similaires', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}/similar`)
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0].category.id).toBe(category.id);
    });

    it('devrait échouer pour un produit inexistant', () => {
      return request(app.getHttpServer())
        .get('/products/999999/similar')
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(404);
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .get(`/products/${product.id}/similar`)
        .expect(401);
    });
  });
});

function generateTestToken(user: User): string {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
    }),
  ).toString('base64')}.test-signature`;
}
