import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestModule } from '../../../../common/test/test.module';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { SavedFilter } from '../../entities/saved-filter.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductsModule } from '../../products.module';
import { TestJwtModule } from '@test/test-jwt.module';
import * as bcrypt from 'bcrypt';

describe('SavedFiltersController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let savedFilterRepository: Repository<SavedFilter>;
  let jwtService: JwtService;
  let userToken: string;
  let user: User;
  let savedFilter: SavedFilter;

  const testUser = {
    id: '1',
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
  };

  const testFilter = {
    name: 'Test Filter',
    filters: {
      minPrice: 50,
      maxPrice: 100,
      condition: ProductCondition.NEW,
      categoryId: '1',
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestModule.forRoot(),
        TestJwtModule,
        ProductsModule,
        TypeOrmModule.forFeature([User, SavedFilter]),
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

    userRepository = moduleRef.get(getRepositoryToken(User));
    savedFilterRepository = moduleRef.get(getRepositoryToken(SavedFilter));
    jwtService = moduleRef.get(JwtService);

    await app.init();

    // Create test user
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

    // Create test saved filter
    savedFilter = await savedFilterRepository.save({
      ...testFilter,
      userId: user.id,
    });
  });

  afterAll(async () => {
    await savedFilterRepository.query('DELETE FROM saved_filters');
    await userRepository.query('DELETE FROM users');
    await app.close();
  });

  describe('POST /saved-filters', () => {
    const newFilter = {
      name: 'New Test Filter',
      filters: {
        minPrice: 75,
        maxPrice: 200,
        condition: ProductCondition.LIKE_NEW,
        categoryId: '2',
      },
    };

    it('devrait créer un nouveau filtre sauvegardé', async () => {
      const response = await request(app.getHttpServer())
        .post('/saved-filters')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newFilter)
        .expect(201);

      expect(response.body).toMatchObject({
        name: newFilter.name,
        filters: newFilter.filters,
      });
      expect(response.body.userId).toBe(user.id);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/saved-filters')
        .send(newFilter)
        .expect(401);
    });
  });

  describe('GET /saved-filters', () => {
    it('devrait retourner la liste des filtres sauvegardés', async () => {
      const response = await request(app.getHttpServer())
        .get('/saved-filters')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toMatchObject({
        name: testFilter.name,
        filters: testFilter.filters,
        userId: user.id,
      });
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer()).get('/saved-filters').expect(401);
    });
  });

  describe('PUT /saved-filters/:id', () => {
    const updateData = {
      name: 'Updated Filter',
      filters: {
        minPrice: 100,
        maxPrice: 300,
        condition: ProductCondition.GOOD,
        categoryId: '3',
      },
    };

    it('devrait mettre à jour un filtre sauvegardé', async () => {
      const response = await request(app.getHttpServer())
        .put(`/saved-filters/${savedFilter.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        name: updateData.name,
        filters: updateData.filters,
        userId: user.id,
      });
    });

    it('devrait échouer pour un filtre inexistant', async () => {
      await request(app.getHttpServer())
        .put('/saved-filters/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /saved-filters/:id', () => {
    it('devrait supprimer un filtre sauvegardé', async () => {
      await request(app.getHttpServer())
        .delete(`/saved-filters/${savedFilter.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);

      const deletedFilter = await savedFilterRepository.findOne({
        where: { id: savedFilter.id },
      });
      expect(deletedFilter).toBeNull();
    });

    it('devrait échouer pour un filtre inexistant', async () => {
      await request(app.getHttpServer())
        .delete('/saved-filters/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
