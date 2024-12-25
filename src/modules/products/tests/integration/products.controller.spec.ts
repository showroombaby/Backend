import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
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
import { TestJwtModule } from '@test/test-jwt.module';
import { AuthModule } from '../../../auth/auth.module';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { ValidationPipe } from '@nestjs/common';

describe('ProductsController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let productRepository: Repository<Product>;
  let jwtService: JwtService;
  let userToken: string;
  let user: User;
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
      imports: [
        TestModule.forRoot(),
        TestJwtModule,
        ProductsModule,
        AuthModule,
        TypeOrmModule.forFeature([User, Category, Product]),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    categoryRepository = moduleRef.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    productRepository = moduleRef.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    jwtService = moduleRef.get<JwtService>(JwtService);

    await app.init();

    // Créer le répertoire de test pour les images si nécessaire
    const testImageDir = path.dirname(testImagePath);
    if (!fs.existsSync(testImageDir)) {
      fs.mkdirSync(testImageDir, { recursive: true });
    }

    // Créer une image de test
    if (!fs.existsSync(testImagePath)) {
      fs.writeFileSync(testImagePath, Buffer.from('fake image data'));
    }
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await productRepository.query('DELETE FROM products');
    await categoryRepository.query('DELETE FROM categories');
    await userRepository.query('DELETE FROM users');

    // Créer l'utilisateur de test avec mot de passe hashé
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    user = await userRepository.save({
      ...testUser,
      password: hashedPassword,
    });

    // Créer la catégorie de test
    category = await categoryRepository.save(testCategory);

    // Générer le token
    userToken = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  });

  afterAll(async () => {
    // Nettoyer l'image de test
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    await productRepository.query('DELETE FROM products');
    await categoryRepository.query('DELETE FROM categories');
    await userRepository.query('DELETE FROM users');

    if (app) {
      await app.close();
    }
  });

  describe('POST /products', () => {
    it('devrait créer un nouveau produit', async () => {
      // Créer la catégorie
      const category = await categoryRepository.save({
        name: 'Test Category',
        description: 'Test Category Description',
      });

      // Vérifier que la catégorie a été créée
      expect(category).toBeDefined();
      expect(category.id).toBeDefined();

      // Créer l'utilisateur et générer le token
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      user = await userRepository.save({
        ...testUser,
        password: hashedPassword,
      });

      userToken = jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      // Créer une image JPEG valide
      const tempImagePath = path.join(__dirname, 'test-image.jpg');
      const imageBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        'base64',
      );
      fs.writeFileSync(tempImagePath, imageBuffer);

      const requestData = {
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        condition: ProductCondition.NEW,
        categoryId: category.id,
        status: ProductStatus.DRAFT,
      };

      console.log('Category ID:', category.id);
      console.log('Request data:', requestData);

      try {
        const response = await request(app.getHttpServer())
          .post('/products')
          .set('Authorization', `Bearer ${userToken}`)
          .field('title', requestData.title)
          .field('description', requestData.description)
          .field('price', requestData.price.toString())
          .field('condition', requestData.condition)
          .field('categoryId', requestData.categoryId)
          .field('status', requestData.status)
          .attach('images', tempImagePath, {
            filename: 'test-image.jpg',
            contentType: 'image/jpeg',
          })
          .expect((res) => {
            if (res.status !== 201) {
              console.log('Request data sent:', {
                title: requestData.title,
                description: requestData.description,
                price: requestData.price.toString(),
                condition: requestData.condition,
                categoryId: requestData.categoryId,
                status: requestData.status,
              });
              console.log('Response status:', res.status);
              console.log('Response body:', res.body);
            }
          })
          .expect(201);

        expect(response.body).toMatchObject({
          title: requestData.title,
          description: requestData.description,
          price: requestData.price,
          condition: requestData.condition,
          categoryId: requestData.categoryId,
          status: requestData.status,
        });
      } finally {
        // Nettoyage
        if (fs.existsSync(tempImagePath)) {
          fs.unlinkSync(tempImagePath);
        }
      }
    });

    it('devrait échouer sans authentification', async () => {
      // Créer une image JPEG valide
      const tempImagePath = path.join(__dirname, 'test-image.jpg');
      const imageBuffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        'base64',
      );
      fs.writeFileSync(tempImagePath, imageBuffer);

      try {
        await request(app.getHttpServer())
          .post('/products')
          .field('title', 'Test Product')
          .field('description', 'Test Description')
          .field('price', '99.99')
          .field('condition', ProductCondition.NEW)
          .field('categoryId', category.id)
          .field('status', ProductStatus.DRAFT)
          .attach('images', tempImagePath, {
            filename: 'test-image.jpg',
            contentType: 'image/jpeg',
          })
          .expect(401);
      } finally {
        // Nettoyage
        if (fs.existsSync(tempImagePath)) {
          fs.unlinkSync(tempImagePath);
        }
      }
    });
  });

  describe('GET /products', () => {
    it('devrait retourner la liste des produits', async () => {
      // Créer un produit de test
      const product = await productRepository.save({
        ...testProduct,
        category,
        user,
        seller: user,
        status: ProductStatus.PUBLISHED,
      });

      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items[0]).toMatchObject({
        title: product.title,
        description: product.description,
        price: product.price,
        condition: product.condition,
      });
    });
  });

  describe('GET /products/:id', () => {
    it('devrait retourner un produit spécifique', async () => {
      // Créer un produit de test
      const product = await productRepository.save({
        ...testProduct,
        category,
        user,
        seller: user,
        status: ProductStatus.PUBLISHED,
      });

      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        title: product.title,
        description: product.description,
        price: product.price,
        condition: product.condition,
      });
    });

    it('devrait retourner 404 pour un produit inexistant', async () => {
      await request(app.getHttpServer()).get('/products/999').expect(404);
    });
  });

  describe('PUT /products/:id', () => {
    it('devrait mettre à jour un produit', async () => {
      // Créer un produit de test
      const product = await productRepository.save({
        ...testProduct,
        category,
        user,
        seller: user,
        status: ProductStatus.PUBLISHED,
      });

      const updateData = {
        title: 'Updated Product',
        description: 'Updated Description',
        price: 149.99,
        condition: ProductCondition.GOOD,
        status: ProductStatus.PUBLISHED,
      };

      const response = await request(app.getHttpServer())
        .put(`/products/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
    });

    it('devrait échouer sans authentification', async () => {
      const product = await productRepository.save({
        ...testProduct,
        category,
        user,
        seller: user,
        status: ProductStatus.PUBLISHED,
      });

      await request(app.getHttpServer())
        .put(`/products/${product.id}`)
        .send({
          title: 'Updated Product',
        })
        .expect(401);
    });
  });

  describe('DELETE /products/:id', () => {
    it('devrait supprimer un produit', async () => {
      // Créer un produit de test
      const product = await productRepository.save({
        ...testProduct,
        category,
        user,
        seller: user,
        status: ProductStatus.PUBLISHED,
      });

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Vérifier que le produit a été supprimé
      const deletedProduct = await productRepository.findOne({
        where: { id: product.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it('devrait échouer sans authentification', async () => {
      const product = await productRepository.save({
        ...testProduct,
        category,
        user,
        seller: user,
        status: ProductStatus.PUBLISHED,
      });

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .expect(401);
    });

    it('devrait échouer pour un produit inexistant', async () => {
      await request(app.getHttpServer())
        .delete('/products/999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
