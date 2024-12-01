import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AuthModule } from '../../../auth/auth.module';
import { User } from '../../entities/user.entity';
import { UsersModule } from '../../users.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: Repository<User>;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            entities: [User],
            synchronize: true,
            logging: false,
          }),
        }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  });

  beforeEach(async () => {
    await userRepository.clear();

    // Créer un utilisateur de test
    testUser = userRepository.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });
    await testUser.hashPassword();
    testUser = await userRepository.save(testUser);

    // Générer un token JWT pour l'utilisateur
    const payload = { sub: testUser.id, email: testUser.email };
    authToken = jwtService.sign(payload);
  });

  describe('/users/profile (GET)', () => {
    it("devrait retourner le profil de l'utilisateur connecté", () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testUser.id);
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.firstName).toBe(testUser.firstName);
          expect(res.body.lastName).toBe(testUser.lastName);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('devrait retourner 401 sans token', () => {
      return request(app.getHttpServer()).get('/users/profile').expect(401);
    });

    it('devrait retourner 401 avec un token invalide', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/users/profile (PUT)', () => {
    it('devrait mettre à jour le profil avec succès', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
      expect(response.body.email).toBe(testUser.email);

      // Vérifier en base de données
      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
    });

    it('devrait échouer avec un email déjà utilisé', async () => {
      // Créer un autre utilisateur
      const otherUser = userRepository.create({
        email: 'other@example.com',
        password: 'password123',
      });
      await otherUser.hashPassword();
      await userRepository.save(otherUser);

      return request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'other@example.com' })
        .expect(409);
    });

    it('devrait échouer avec des données invalides', () => {
      return request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'J', // Trop court
          lastName: '123', // Caractères invalides
        })
        .expect(400);
    });

    it('devrait échouer avec un email invalide', () => {
      return request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('/users/profile (DELETE)', () => {
    it('devrait supprimer le compte avec succès', async () => {
      await request(app.getHttpServer())
        .delete('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Vérifier que l'utilisateur n'existe plus
      const deletedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('devrait retourner 401 sans token', () => {
      return request(app.getHttpServer()).delete('/users/profile').expect(401);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
