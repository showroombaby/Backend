import { AppModule } from '@/app.module';
import {
  createTestUser,
  generateTestToken,
} from '@/modules/auth/tests/test-utils';
import { User } from '@/modules/users/entities/user.entity';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Récupérer les services nécessaires
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    jwtService = moduleRef.get<JwtService>(JwtService);

    // Créer un utilisateur test et générer son token
    const user = await createTestUser(userRepository);
    authToken = generateTestToken(jwtService, user);
  });

  describe('POST /products', () => {
    it('devrait créer un produit avec succès', async () => {
      const testImage = Buffer.from('fake-image-data');

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Poussette Yoyo')
        .field('description', 'Poussette en excellent état')
        .field('price', '299.99')
        .field('categoryId', 'valid-category-id')
        .attach('images', testImage, 'test-image.jpg')
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            title: 'Poussette Yoyo',
            status: 'published',
            images: expect.arrayContaining([
              expect.objectContaining({
                url: expect.any(String),
              }),
            ]),
          });
        });
    });

    it('devrait créer un brouillon via preview', async () => {
      const testImage = Buffer.from('fake-image-data');

      await request(app.getHttpServer())
        .post('/products/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Poussette Yoyo')
        .field('description', 'Poussette en excellent état')
        .field('price', '299.99')
        .field('categoryId', 'valid-category-id')
        .attach('images', testImage, 'test-image.jpg')
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            status: 'draft',
          });
        });
    });

    it('devrait rejeter une création sans images', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Poussette Yoyo')
        .field('description', 'Poussette en excellent état')
        .field('price', '299.99')
        .field('categoryId', 'valid-category-id')
        .expect(400);
    });
  });

  describe('GET /products', () => {
    it('devrait rechercher des produits avec des filtres', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .query({
          search: 'poussette',
          categoryId: 'valid-category-id',
          minPrice: 100,
          maxPrice: 500,
          sortBy: 'price_desc',
          page: 1,
          limit: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            items: expect.any(Array),
            total: expect.any(Number),
            page: 1,
            limit: 10,
            pages: expect.any(Number),
          });
        });
    });

    it('devrait retourner une erreur pour des paramètres invalides', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .query({
          minPrice: -100, // Prix négatif invalide
          page: 0, // Page invalide
          limit: 1000, // Limite trop élevée
        })
        .expect(400);
    });

    it('devrait retourner une liste vide pour une recherche sans résultats', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .query({
          search: 'produit_inexistant_xyz',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            items: [],
            total: 0,
            pages: 0,
          });
        });
    });
  });

  describe('GET /products/my-listings', () => {
    it('devrait retourner les annonces du vendeur', async () => {
      // Créer quelques produits
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Produit 1')
        .field('description', 'Description 1')
        .field('price', '99.99')
        .field('categoryId', 'valid-category-id')
        .attach('images', Buffer.from('fake-image'), 'test1.jpg');

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Produit 2')
        .field('description', 'Description 2')
        .field('price', '149.99')
        .field('categoryId', 'valid-category-id')
        .attach('images', Buffer.from('fake-image'), 'test2.jpg');

      const response = await request(app.getHttpServer())
        .get('/products/my-listings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.items[0].title).toBe('Produit 2');
      expect(response.body.items[1].title).toBe('Produit 1');
    });

    it('devrait retourner 401 sans authentification', () => {
      return request(app.getHttpServer())
        .get('/products/my-listings')
        .expect(401);
    });
  });

  describe('PATCH /products/:id/status', () => {
    let productId: string;

    beforeEach(async () => {
      // Créer un produit pour les tests
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Produit Test')
        .field('description', 'Description Test')
        .field('price', '99.99')
        .field('categoryId', 'valid-category-id')
        .attach('images', Buffer.from('fake-image'), 'test.jpg');

      productId = response.body.id;
    });

    it('devrait mettre à jour le statut en "vendu"', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/products/${productId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'sold' })
        .expect(200);

      expect(response.body.status).toBe('sold');
    });

    it('devrait retourner 400 pour un statut invalide', () => {
      return request(app.getHttpServer())
        .patch(`/products/${productId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });
  });

  describe('GET /products/:id/stats', () => {
    let productId: string;

    beforeEach(async () => {
      // Créer un produit pour les tests
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Produit Test')
        .field('description', 'Description Test')
        .field('price', '99.99')
        .field('categoryId', 'valid-category-id')
        .attach('images', Buffer.from('fake-image'), 'test.jpg');

      productId = response.body.id;

      // Simuler quelques vues
      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('User-Agent', 'test-agent-1');

      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('User-Agent', 'test-agent-2');
    });

    it('devrait retourner les statistiques de vues', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.uniqueViews).toBe(2);
      expect(response.body.totalViews).toBe(2);
      expect(response.body.viewsByDay).toHaveLength(1);
    });

    it('devrait retourner 401 sans authentification', () => {
      return request(app.getHttpServer())
        .get(`/products/${productId}/stats`)
        .expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
