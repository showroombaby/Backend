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

  afterAll(async () => {
    await app.close();
  });
});
