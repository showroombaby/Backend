import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestModule } from '../../../../common/test/test.module';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { SavedFilter } from '../../entities/saved-filter.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductsModule } from '../../products.module';

describe('SavedFiltersController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let savedFilterRepository: Repository<SavedFilter>;
  let userToken: string;
  let user: User;

  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
  };

  const testFilter = {
    name: 'Test Filter',
    minPrice: 50,
    maxPrice: 100,
    condition: ProductCondition.NEW,
    categoryId: '1',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule, ProductsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    savedFilterRepository = moduleRef.get<Repository<SavedFilter>>(
      getRepositoryToken(SavedFilter),
    );

    await app.init();

    // Créer l'utilisateur de test
    user = userRepository.create(testUser);
    await userRepository.save(user);

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
    await savedFilterRepository.query('DELETE FROM saved_filters');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /saved-filters', () => {
    it('devrait créer un nouveau filtre sauvegardé', async () => {
      const response = await request(app.getHttpServer())
        .post('/saved-filters')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testFilter)
        .expect(201);

      expect(response.body).toMatchObject({
        name: testFilter.name,
        minPrice: testFilter.minPrice,
        maxPrice: testFilter.maxPrice,
        condition: testFilter.condition,
        categoryId: testFilter.categoryId,
      });
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/saved-filters')
        .send(testFilter)
        .expect(401);
    });
  });

  describe('GET /saved-filters', () => {
    beforeEach(async () => {
      // Créer quelques filtres de test
      await savedFilterRepository.save([
        {
          ...testFilter,
          user,
        },
        {
          ...testFilter,
          name: 'Another Filter',
          user,
        },
      ]);
    });

    it('devrait retourner la liste des filtres sauvegardés', async () => {
      const response = await request(app.getHttpServer())
        .get('/saved-filters')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        name: expect.any(String),
        minPrice: expect.any(Number),
        maxPrice: expect.any(Number),
        condition: expect.any(String),
      });
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer()).get('/saved-filters').expect(401);
    });
  });

  describe('PUT /saved-filters/:id', () => {
    let filter: SavedFilter;

    beforeEach(async () => {
      filter = await savedFilterRepository.save({
        ...testFilter,
        user,
      });
    });

    it('devrait mettre à jour un filtre sauvegardé', async () => {
      const updateDto = {
        name: 'Updated Filter',
        minPrice: 75,
        maxPrice: 150,
      };

      const response = await request(app.getHttpServer())
        .put(`/saved-filters/${filter.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject(updateDto);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .put(`/saved-filters/${filter.id}`)
        .send({
          name: 'Updated Filter',
        })
        .expect(401);
    });

    it('devrait échouer pour un filtre inexistant', async () => {
      await request(app.getHttpServer())
        .put('/saved-filters/999')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Filter',
        })
        .expect(404);
    });
  });

  describe('DELETE /saved-filters/:id', () => {
    let filter: SavedFilter;

    beforeEach(async () => {
      filter = await savedFilterRepository.save({
        ...testFilter,
        user,
      });
    });

    it('devrait supprimer un filtre sauvegardé', async () => {
      await request(app.getHttpServer())
        .delete(`/saved-filters/${filter.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const deletedFilter = await savedFilterRepository.findOne({
        where: { id: filter.id },
      });
      expect(deletedFilter).toBeNull();
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .delete(`/saved-filters/${filter.id}`)
        .expect(401);
    });

    it('devrait échouer pour un filtre inexistant', async () => {
      await request(app.getHttpServer())
        .delete('/saved-filters/999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
