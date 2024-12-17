import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as path from 'path';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestModule } from '../../../../common/test/test.module';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { Category } from '../../entities/category.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductsModule } from '../../products.module';

describe('ProductsController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let productRepository: Repository<Product>;
  let userToken: string;
  let category: Category;

  const testUser = {
    id: '1',
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
  };

  const testCategory = {
    name: 'Test Category',
    description: 'Test Description',
  };

  const testProduct = {
    title: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    condition: ProductCondition.NEW,
  };

  const testImagePath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'test',
    'fixtures',
    'test-image.jpg',
  );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule, ProductsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    categoryRepository = moduleRef.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    productRepository = moduleRef.get<Repository<Product>>(
      getRepositoryToken(Product),
    );

    await app.init();

    // Créer l'utilisateur de test
    const user = userRepository.create(testUser);
    await userRepository.save(user);

    // Créer la catégorie de test
    category = await categoryRepository.save(testCategory);

    // Obtenir le token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    userToken = loginResponse.body.access_token;
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await productRepository.query('DELETE FROM products');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /products', () => {
    it('devrait créer un nouveau produit', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', testProduct.title)
        .field('description', testProduct.description)
        .field('price', testProduct.price)
        .field('condition', testProduct.condition)
        .field('categoryId', category.id)
        .attach('images', testImagePath)
        .expect(201);

      expect(response.body).toMatchObject({
        title: testProduct.title,
        description: testProduct.description,
        price: testProduct.price,
        condition: testProduct.condition,
        status: ProductStatus.DRAFT,
        categoryId: category.id,
      });
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .field('title', testProduct.title)
        .field('description', testProduct.description)
        .field('price', testProduct.price)
        .field('condition', testProduct.condition)
        .field('categoryId', category.id)
        .attach('images', testImagePath)
        .expect(401);
    });
  });

  describe('GET /products', () => {
    beforeEach(async () => {
      // Créer quelques produits de test
      await productRepository.save([
        {
          ...testProduct,
          sellerId: '1',
          categoryId: category.id,
          status: ProductStatus.PUBLISHED,
        },
        {
          ...testProduct,
          title: 'Another Product',
          sellerId: '1',
          categoryId: category.id,
          status: ProductStatus.PUBLISHED,
        },
      ]);
    });

    it('devrait retourner une liste de produits', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0]).toMatchObject({
        title: expect.any(String),
        description: expect.any(String),
        price: expect.any(Number),
        condition: expect.any(String),
        status: expect.any(String),
      });
    });

    it('devrait filtrer les produits par catégorie', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products?categoryId=${category.id}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].categoryId).toBe(category.id);
    });

    it('devrait filtrer les produits par prix', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?minPrice=50&maxPrice=150')
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].price).toBeGreaterThanOrEqual(50);
      expect(response.body.items[0].price).toBeLessThanOrEqual(150);
    });

    it('devrait filtrer les produits par condition', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products?condition=${ProductCondition.NEW}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].condition).toBe(ProductCondition.NEW);
    });
  });
});
