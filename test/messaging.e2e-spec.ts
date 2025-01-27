import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { io, Socket } from 'socket.io-client';
import * as request from 'supertest';
import { DeepPartial, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Category } from '../src/modules/categories/entities/category.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { ProductCondition } from '../src/modules/products/enums/product-condition.enum';
import { ProductStatus } from '../src/modules/products/enums/product-status.enum';
import { User } from '../src/modules/users/entities/user.entity';
import { testConfig } from './test-config';

describe('Messaging (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;

  let user1: User;
  let user2: User;
  let product: Product;
  let jwtToken1: string;
  let jwtToken2: string;
  let wsClient1: Socket;
  let wsClient2: Socket;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(testConfig), AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0); // Port dynamique pour les tests

    const httpServer = app.getHttpServer();
    const port = httpServer.address().port;

    userRepository = moduleFixture.get(getRepositoryToken(User));
    productRepository = moduleFixture.get(getRepositoryToken(Product));
    categoryRepository = moduleFixture.get(getRepositoryToken(Category));

    // Créer les utilisateurs de test via le endpoint d'inscription
    const registerUser1 = await request(httpServer)
      .post('/auth/register')
      .send({
        email: 'user1@test.com',
        password: 'password123',
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
      });
    user1 = registerUser1.body.user;

    const registerUser2 = await request(httpServer)
      .post('/auth/register')
      .send({
        email: 'user2@test.com',
        password: 'password123',
        username: 'user2',
        firstName: 'User',
        lastName: 'Two',
      });
    user2 = registerUser2.body.user;

    // Créer une catégorie et un produit de test
    const categoryData: DeepPartial<Category> = {
      name: 'Test Category',
      description: 'Test Category Description',
    };
    const category = await categoryRepository.save(categoryData);

    const productData: DeepPartial<Product> = {
      title: 'Test Product',
      description: 'Test Product Description',
      price: 100,
      condition: ProductCondition.NEW,
      status: ProductStatus.PUBLISHED,
      seller: user1,
      category: category,
    };
    product = await productRepository.save(productData);

    // Connecter les utilisateurs
    const loginUser1 = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'user1@test.com', password: 'password123' });
    jwtToken1 = loginUser1.body.access_token;

    const loginUser2 = await request(httpServer)
      .post('/auth/login')
      .send({ email: 'user2@test.com', password: 'password123' });
    jwtToken2 = loginUser2.body.access_token;

    // Initialiser les clients WebSocket
    wsClient1 = io(`http://localhost:${port}`, {
      auth: { token: jwtToken1 },
    });

    wsClient2 = io(`http://localhost:${port}`, {
      auth: { token: jwtToken2 },
    });

    // Attendre la connexion des clients WebSocket
    await Promise.all([
      new Promise<void>((resolve) => wsClient1.on('connect', () => resolve())),
      new Promise<void>((resolve) => wsClient2.on('connect', () => resolve())),
    ]);
  });

  afterAll(async () => {
    if (wsClient1) wsClient1.close();
    if (wsClient2) wsClient2.close();
    await app.close();
  });

  it('should allow complete message exchange flow', async () => {
    const messageContent = 'Interested in your product!';
    const replyContent = 'Yes, it is still available!';

    // Créer des promesses pour les événements WebSocket
    const messagePromise = new Promise<void>((resolve) => {
      wsClient2.on('newMessage', async (message) => {
        expect(message.content).toBe(messageContent);
        expect(message.senderId).toBe(user1.id);
        expect(message.productId).toBe(product.id);

        // Répondre au message
        await request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${jwtToken2}`)
          .send({
            recipientId: user1.id,
            content: replyContent,
            productId: product.id,
          })
          .expect(201);

        resolve();
      });
    });

    const replyPromise = new Promise<void>((resolve) => {
      wsClient1.on('newMessage', (message) => {
        expect(message.content).toBe(replyContent);
        expect(message.senderId).toBe(user2.id);
        expect(message.productId).toBe(product.id);
        resolve();
      });
    });

    // Envoyer le premier message
    await request(app.getHttpServer())
      .post('/messages')
      .set('Authorization', `Bearer ${jwtToken1}`)
      .send({
        recipientId: user2.id,
        content: messageContent,
        productId: product.id,
      })
      .expect(201);

    // Attendre que toutes les promesses soient résolues avec un timeout de 10 secondes
    await Promise.race([
      Promise.all([messagePromise, replyPromise]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), 10000),
      ),
    ]);
  }, 15000); // Augmenter le timeout du test à 15 secondes
});
