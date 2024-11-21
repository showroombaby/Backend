import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../../auth.module';
import { UsersModule } from '../../../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../users/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('/auth/register (POST) - success', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.email).toBe('test@example.com');
        expect(res.body.message).toBe('Registration successful');
      });
  });

  it('/auth/register (POST) - email exists', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'password123',
      })
      .expect(409);
  });

  it('/auth/register (POST) - invalid data', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'invalid-email',
        password: '123',
      })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
