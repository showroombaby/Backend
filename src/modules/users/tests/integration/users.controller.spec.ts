import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestModule } from '../../../../common/test/test.module';
import { AuthModule } from '../../../auth/auth.module';
import { EmailModule } from '../../../email/email.module';
import { EmailService } from '../../../email/services/email.service';
import { User } from '../../entities/user.entity';
import { UsersModule } from '../../users.module';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authToken: string;

  const userFixture = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, AuthModule, EmailModule, UsersModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await userRepository.query('DELETE FROM users');

    // Créer un utilisateur et obtenir le token
    await request(app.getHttpServer()).post('/auth/register').send(userFixture);
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userFixture.email,
        password: userFixture.password,
      });
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /users/profile', () => {
    it("devrait retourner le profil de l'utilisateur connecté", async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: userFixture.email,
        firstName: userFixture.firstName,
        lastName: userFixture.lastName,
      });
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer()).get('/users/profile').expect(401);
    });
  });

  describe('PUT /users/profile', () => {
    const updateProfileDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('devrait mettre à jour le profil utilisateur', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateProfileDto)
        .expect(200);

      expect(response.body).toMatchObject(updateProfileDto);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .put('/users/profile')
        .send(updateProfileDto)
        .expect(401);
    });
  });

  describe('POST /users/change-password', () => {
    const changePasswordDto = {
      currentPassword: userFixture.password,
      newPassword: 'NewPassword123!',
    };

    it('devrait changer le mot de passe avec succès', async () => {
      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordDto)
        .expect(200);

      // Vérifier que le nouveau mot de passe fonctionne
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userFixture.email,
          password: changePasswordDto.newPassword,
        })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('access_token');
    });

    it('devrait échouer avec un mot de passe actuel incorrect', async () => {
      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer())
        .post('/users/change-password')
        .send(changePasswordDto)
        .expect(401);
    });
  });

  describe('DELETE /users/account', () => {
    it('devrait supprimer le compte utilisateur', async () => {
      await request(app.getHttpServer())
        .delete('/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Vérifier que le compte a été supprimé
      const deletedUser = await userRepository.findOne({
        where: { email: userFixture.email },
      });
      expect(deletedUser).toBeNull();
    });

    it('devrait échouer sans authentification', async () => {
      await request(app.getHttpServer()).delete('/users/account').expect(401);
    });
  });
});
