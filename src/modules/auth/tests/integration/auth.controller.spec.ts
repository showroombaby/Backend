import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { TestModule } from '../../../../common/test/test.module';
import { UsersModule } from '../../../users/users.module';
import { AuthModule } from '../../auth.module';

describe('AuthController (Integration)', () => {
  let app: INestApplication;

  const userFixture = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule, AuthModule, UsersModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userFixture)
        .expect(201);

      expect(response.body).toEqual({
        message: 'Registration successful',
        user: {
          id: expect.any(String),
          email: userFixture.email,
          firstName: userFixture.firstName,
          lastName: userFixture.lastName,
          address: null,
        },
      });
    });

    it("devrait échouer si l'email existe déjà", async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userFixture)
        .expect(400);

      expect(response.body.message).toBe('Email already exists');
    });

    it("devrait valider le format de l'email", async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...userFixture,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.message).toEqual(['email must be an email']);
    });

    it('devrait valider la longueur du mot de passe', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...userFixture,
          password: '123',
        })
        .expect(400);

      expect(response.body.message).toEqual([
        'password must be longer than or equal to 8 characters',
      ]);
    });
  });

  describe('POST /auth/login', () => {
    it('devrait connecter un utilisateur avec succès', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userFixture.email,
          password: userFixture.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
    });

    it('devrait échouer avec un mot de passe incorrect', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userFixture.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('devrait échouer avec un email inexistant', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userFixture.password,
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it("devrait gérer l'option rememberMe", async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userFixture.email,
          password: userFixture.password,
          rememberMe: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
    });
  });
});
