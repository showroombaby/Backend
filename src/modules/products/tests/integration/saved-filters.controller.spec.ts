import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { TestJwtModule } from '../../../../common/test/jwt.module';
import { User } from '../../../users/entities/user.entity';
import { SavedFilter } from '../../entities/saved-filter.entity';
import { ProductsModule } from '../../products.module';

describe('SavedFiltersController (Integration)', () => {
  let app: INestApplication;
  let savedFilterRepository: Repository<SavedFilter>;
  let userRepository: Repository<User>;
  let user: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TestJwtModule, ProductsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    savedFilterRepository = moduleFixture.get('SavedFilterRepository');
    userRepository = moduleFixture.get('UserRepository');
    await app.init();

    // Créer l'utilisateur de test
    user = await userRepository.save({
      email: 'test@example.com',
      password: 'password',
      username: 'testuser',
    });
  });

  afterAll(async () => {
    await savedFilterRepository.query('DELETE FROM saved_filters');
    await userRepository.query('DELETE FROM users');
    await app.close();
  });

  describe('POST /saved-filters', () => {
    it('devrait créer un nouveau filtre sauvegardé', async () => {
      const filterDto = {
        name: 'Test Filter',
        criteria: {
          minPrice: 100,
          maxPrice: 1000,
          category: 'electronics',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/saved-filters')
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .send(filterDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: filterDto.name,
        criteria: filterDto.criteria,
        user: { id: user.id },
      });
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .post('/saved-filters')
        .send({
          name: 'Test Filter',
          criteria: {},
        })
        .expect(401);
    });
  });

  describe('GET /saved-filters', () => {
    beforeEach(async () => {
      await savedFilterRepository.save([
        {
          name: 'Filter 1',
          criteria: { minPrice: 100 },
          user,
        },
        {
          name: 'Filter 2',
          criteria: { maxPrice: 1000 },
          user,
        },
      ]);
    });

    it("devrait retourner les filtres sauvegardés de l'utilisateur", async () => {
      const response = await request(app.getHttpServer())
        .get('/saved-filters')
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('criteria');
      expect(response.body[0].user.id).toBe(user.id);
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer()).get('/saved-filters').expect(401);
    });
  });

  describe('DELETE /saved-filters/:id', () => {
    let filter: SavedFilter;

    beforeEach(async () => {
      filter = await savedFilterRepository.save({
        name: 'Test Filter',
        criteria: { minPrice: 100 },
        user,
      });
    });

    it('devrait supprimer un filtre sauvegardé', async () => {
      await request(app.getHttpServer())
        .delete(`/saved-filters/${filter.id}`)
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(200);

      const deletedFilter = await savedFilterRepository.findOne({
        where: { id: filter.id },
      });
      expect(deletedFilter).toBeNull();
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .delete(`/saved-filters/${filter.id}`)
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
