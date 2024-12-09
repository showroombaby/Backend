import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../../../../app.module';
import {
  createTestUser,
  generateTestToken,
} from '../../../auth/tests/test-utils';
import { User } from '../../../users/entities/user.entity';
import { SavedFilter } from '../../entities/saved-filter.entity';
import { ProductCondition } from '../../enums/product-condition.enum';

describe('SavedFilters (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let savedFilterRepository: Repository<SavedFilter>;
  let testUser: User;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    savedFilterRepository = moduleFixture.get(getRepositoryToken(SavedFilter));

    // Créer un utilisateur de test
    testUser = await createTestUser(userRepository);
    jwtToken = generateTestToken(moduleFixture.get('JwtService'), testUser);
  });

  afterAll(async () => {
    await userRepository.delete({ id: testUser.id });
    await app.close();
  });

  afterEach(async () => {
    await savedFilterRepository.delete({});
  });

  describe('/saved-filters (POST)', () => {
    it('should create a new saved filter', () => {
      const createDto = {
        name: 'Mes filtres favoris',
        filter: {
          categoryId: '123',
          minPrice: 10,
          maxPrice: 100,
          condition: ProductCondition.GOOD,
          latitude: 48.8566,
          longitude: 2.3522,
          radius: 10,
        },
      };

      return request(app.getHttpServer())
        .post('/saved-filters')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(createDto.name);
          expect(res.body.categoryId).toBe(createDto.filter.categoryId);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/saved-filters')
        .send({})
        .expect(401);
    });
  });

  describe('/saved-filters (GET)', () => {
    beforeEach(async () => {
      // Créer quelques filtres de test
      const filters = [
        {
          name: 'Filtre 1',
          user: testUser,
          categoryId: '123',
          minPrice: 10,
          maxPrice: 100,
        },
        {
          name: 'Filtre 2',
          user: testUser,
          categoryId: '456',
          minPrice: 20,
          maxPrice: 200,
        },
      ];

      await savedFilterRepository.save(filters);
    });

    it('should return all saved filters for the authenticated user', () => {
      return request(app.getHttpServer())
        .get('/saved-filters')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('categoryId');
        });
    });
  });

  describe('/saved-filters/:id (GET)', () => {
    let savedFilter: SavedFilter;

    beforeEach(async () => {
      savedFilter = await savedFilterRepository.save({
        name: 'Test Filter',
        user: testUser,
        categoryId: '123',
        minPrice: 10,
        maxPrice: 100,
      });
    });

    it('should return a specific saved filter', () => {
      return request(app.getHttpServer())
        .get(`/saved-filters/${savedFilter.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(savedFilter.id);
          expect(res.body.name).toBe(savedFilter.name);
        });
    });

    it('should return 404 for non-existent filter', () => {
      return request(app.getHttpServer())
        .get('/saved-filters/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });
  });

  describe('/saved-filters/:id (PUT)', () => {
    let savedFilter: SavedFilter;

    beforeEach(async () => {
      savedFilter = await savedFilterRepository.save({
        name: 'Test Filter',
        user: testUser,
        categoryId: '123',
        minPrice: 10,
        maxPrice: 100,
      });
    });

    it('should update a saved filter', () => {
      const updateDto = {
        name: 'Updated Filter',
        filter: {
          categoryId: '456',
          minPrice: 20,
          maxPrice: 200,
        },
      };

      return request(app.getHttpServer())
        .put(`/saved-filters/${savedFilter.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateDto.name);
          expect(res.body.categoryId).toBe(updateDto.filter.categoryId);
        });
    });
  });

  describe('/saved-filters/:id (DELETE)', () => {
    let savedFilter: SavedFilter;

    beforeEach(async () => {
      savedFilter = await savedFilterRepository.save({
        name: 'Test Filter',
        user: testUser,
        categoryId: '123',
        minPrice: 10,
        maxPrice: 100,
      });
    });

    it('should delete a saved filter', () => {
      return request(app.getHttpServer())
        .delete(`/saved-filters/${savedFilter.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });

    it('should return 404 when trying to delete non-existent filter', () => {
      return request(app.getHttpServer())
        .delete('/saved-filters/999999')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });
  });
});
