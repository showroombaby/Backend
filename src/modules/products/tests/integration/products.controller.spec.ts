import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestModule } from '../../../../common/test/test.module';
import { Category } from '../../../categories/entities/category.entity';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { Product } from '../../entities/product.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductsModule } from '../../products.module';

describe('ProductsController (Integration)', () => {
  let app: INestApplication;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let userRepository: Repository<User>;
  let user: User;
  let category: Category;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule.forRoot(), ProductsModule],
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
      role: Role.USER,
    });

    category = await categoryRepository.save({
      name: 'Test Category',
      description: 'Test Description',
    });
  });

  afterAll(async () => {
    if (app) {
      await productRepository.query('DELETE FROM products');
      await categoryRepository.query('DELETE FROM categories');
      await userRepository.query('DELETE FROM users');
      await app.close();
    }
  });

  describe('POST /products', () => {
    it('devrait créer un nouveau produit', async () => {
      const productDto = {
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        condition: ProductCondition.NEW,
        categoryId: category.id,
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .send(productDto)
        .expect(201);

      expect(response.body).toMatchObject({
        title: productDto.title,
        description: productDto.description,
        price: productDto.price,
        condition: productDto.condition,
        category: {
          id: category.id,
          name: category.name,
        },
        seller: {
          id: user.id,
          username: user.username,
        },
      });
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({
          title: 'Test Product',
          description: 'Test Description',
          price: 100,
          condition: ProductCondition.NEW,
          categoryId: category.id,
        })
        .expect(401);
    });
  });

  describe('GET /products', () => {
    beforeEach(async () => {
      await productRepository.save([
        {
          title: 'Product 1',
          description: 'Description 1',
          price: 100,
          condition: ProductCondition.NEW,
          category,
          seller: user,
        },
        {
          title: 'Product 2',
          description: 'Description 2',
          price: 200,
          condition: ProductCondition.LIKE_NEW,
          category,
          seller: user,
        },
      ]);
    });

    it('devrait retourner la liste des produits', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('category');
      expect(response.body[0]).toHaveProperty('seller');
    });
  });

  describe('GET /products/:id', () => {
    let product: Product;

    beforeEach(async () => {
      product = await productRepository.save({
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        condition: ProductCondition.NEW,
        category,
        seller: user,
      });
    });

    it('devrait retourner un produit spécifique', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        condition: product.condition,
        category: {
          id: category.id,
          name: category.name,
        },
        seller: {
          id: user.id,
          username: user.username,
        },
      });
    });

    it('devrait retourner 404 pour un produit inexistant', () => {
      return request(app.getHttpServer()).get('/products/999999').expect(404);
    });
  });

  describe('PUT /products/:id', () => {
    let product: Product;

    beforeEach(async () => {
      product = await productRepository.save({
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        condition: ProductCondition.NEW,
        category,
        seller: user,
      });
    });

    it('devrait mettre à jour un produit', async () => {
      const updateDto = {
        title: 'Updated Product',
        description: 'Updated Description',
        price: 200,
        condition: ProductCondition.LIKE_NEW,
      };

      const response = await request(app.getHttpServer())
        .put(`/products/${product.id}`)
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: product.id,
        ...updateDto,
      });
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .put(`/products/${product.id}`)
        .send({
          title: 'Updated Product',
        })
        .expect(401);
    });
  });

  describe('DELETE /products/:id', () => {
    let product: Product;

    beforeEach(async () => {
      product = await productRepository.save({
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        condition: ProductCondition.NEW,
        category,
        seller: user,
      });
    });

    it('devrait supprimer un produit', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(200);

      const deletedProduct = await productRepository.findOne({
        where: { id: product.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .expect(401);
    });

    it('devrait échouer pour un produit inexistant', () => {
      return request(app.getHttpServer())
        .delete('/products/999999')
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(404);
    });
  });
});

function generateTestToken(user: User): string {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
    }),
  ).toString('base64')}.test-signature`;
}
