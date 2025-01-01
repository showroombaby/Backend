import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { TestJwtModule } from '../../../../common/test/jwt.module';
import { User } from '../../../users/entities/user.entity';
import { Message } from '../../entities/message.entity';
import { MessagingModule } from '../../messaging.module';

describe('MessagingController (Integration)', () => {
  let app: INestApplication;
  let messageRepository: Repository<Message>;
  let userRepository: Repository<User>;
  let sender: User;
  let receiver: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TestJwtModule, MessagingModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    messageRepository = moduleFixture.get('MessageRepository');
    userRepository = moduleFixture.get('UserRepository');
    await app.init();

    // Créer les utilisateurs de test
    sender = await userRepository.save({
      email: 'sender@example.com',
      password: 'password',
      username: 'sender',
    });

    receiver = await userRepository.save({
      email: 'receiver@example.com',
      password: 'password',
      username: 'receiver',
    });
  });

  afterAll(async () => {
    await messageRepository.query('DELETE FROM messages');
    await userRepository.query('DELETE FROM users');
    await app.close();
  });

  describe('POST /messages', () => {
    it('devrait créer un nouveau message', async () => {
      const messageDto = {
        content: 'Test message',
        receiverId: receiver.id,
      };

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${generateTestToken(sender)}`)
        .send(messageDto)
        .expect(201);

      expect(response.body).toMatchObject({
        content: messageDto.content,
        sender: { id: sender.id },
        receiver: { id: receiver.id },
      });
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer())
        .post('/messages')
        .send({
          content: 'Test message',
          receiverId: receiver.id,
        })
        .expect(401);
    });
  });

  describe('GET /messages', () => {
    beforeEach(async () => {
      await messageRepository.save([
        {
          content: 'Message 1',
          sender,
          receiver,
        },
        {
          content: 'Message 2',
          sender: receiver,
          receiver: sender,
        },
      ]);
    });

    it("devrait retourner les messages de l'utilisateur", async () => {
      const response = await request(app.getHttpServer())
        .get('/messages')
        .set('Authorization', `Bearer ${generateTestToken(sender)}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('sender');
      expect(response.body[0]).toHaveProperty('receiver');
    });

    it('devrait échouer sans authentification', () => {
      return request(app.getHttpServer()).get('/messages').expect(401);
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
