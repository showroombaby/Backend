import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { testConfig } from '../src/config/test.config';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(testConfig), AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterEach(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123!',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      address: {
        street: '123 Test St',
        zipCode: '75000',
        city: 'Paris',
        additionalInfo: '',
      },
    };

    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.message).toBe('Registration successful');
    }, 30000);

    it('should not register a user with existing email', async () => {
      // First registration
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      // Try to register again with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Email already exists');
        });
    }, 30000);

    it('should login with valid credentials', async () => {
      // Register user first
      await request(app.getHttpServer()).post('/auth/register').send(testUser);

      // Try to login
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.message).toBe('Login successful');
    }, 30000);

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });
  });
});
