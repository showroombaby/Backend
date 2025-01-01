import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { TestJwtModule } from '../../../../common/test/jwt.module';
import { User } from '../../entities/user.entity';
import { UsersModule } from '../../users.module';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TestJwtModule, UsersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get('UserRepository');
    await app.init();
  });

  afterAll(async () => {
    await userRepository.query('DELETE FROM users');
    await app.close();
  });

  describe('GET /users/profile', () => {
    it("devrait retourner le profil de l'utilisateur connecté", async () => {
      const user = await userRepository.save({
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'testuser',
      });

      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${generateTestToken(user)}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer()).get('/users/profile').expect(401);
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
