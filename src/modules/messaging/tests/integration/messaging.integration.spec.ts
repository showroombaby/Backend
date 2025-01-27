import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestDatabaseModule } from '../../../../common/test/database.module';
import { Category } from '../../../categories/entities/category.entity';
import { Product } from '../../../products/entities/product.entity';
import { ProductCondition } from '../../../products/enums/product-condition.enum';
import { User } from '../../../users/entities/user.entity';
import { Message } from '../../entities/message.entity';
import { MessagingService } from '../../services/messaging.service';
import { MessagingTestModule } from '../messaging-test.module';

describe('MessagingService (Integration)', () => {
  let moduleFixture: TestingModule;
  let messagingService: MessagingService;
  let messageRepository: Repository<Message>;
  let userRepository: Repository<User>;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [TestDatabaseModule, MessagingTestModule],
    }).compile();

    messagingService = moduleFixture.get<MessagingService>(MessagingService);
    messageRepository = moduleFixture.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    categoryRepository = moduleFixture.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
  });

  beforeEach(async () => {
    await messageRepository.delete({});
    await userRepository.delete({});
    await productRepository.delete({});
    await categoryRepository.delete({});
  });

  afterAll(async () => {
    if (moduleFixture) {
      await moduleFixture.close();
    }
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const user = await userRepository.save({
        email: 'test@example.com',
        password: 'password',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      });

      const category = await categoryRepository.save({
        name: 'Test Category',
        description: 'Test Category Description',
      });

      const product = await productRepository.save({
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        sellerId: user.id,
        categoryId: category.id,
        condition: ProductCondition.NEW,
      });

      const message = await messagingService.createMessage(user.id, {
        recipientId: user.id,
        content: 'Test message',
        productId: product.id,
      });

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.content).toBe('Test message');
      expect(message.senderId).toBe(user.id);
      expect(message.recipientId).toBe(user.id);
      expect(message.productId).toBe(product.id);
    });
  });
});
