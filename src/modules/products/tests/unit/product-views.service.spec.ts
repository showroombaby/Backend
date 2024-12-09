import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductView } from '../../entities/product-view.entity';
import { Product } from '../../entities/product.entity';
import { ProductViewsService } from '../../services/product-views.service';

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any, any>;
};

describe('ProductViewsService', () => {
  let service: ProductViewsService;
  let productViewRepository: MockType<Repository<ProductView>>;
  let productRepository: MockType<Repository<Product>>;

  const mockProductId = '123';
  const mockIp = '127.0.0.1';
  const mockUserAgent = 'test-agent';

  const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(
    () => ({
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      increment: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
        getOne: jest.fn(),
      }),
    }),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductViewsService,
        {
          provide: getRepositoryToken(ProductView),
          useFactory: repositoryMockFactory,
        },
        {
          provide: getRepositoryToken(Product),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<ProductViewsService>(ProductViewsService);
    productViewRepository = module.get(getRepositoryToken(ProductView));
    productRepository = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordView', () => {
    it('devrait créer une nouvelle vue', async () => {
      const mockView = {
        ip: mockIp,
        product: { id: mockProductId },
        userAgent: mockUserAgent,
      };

      productViewRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      productViewRepository.create.mockReturnValue(mockView);
      productViewRepository.save.mockResolvedValue(mockView);
      productRepository.increment.mockResolvedValue({});

      await service.recordView(mockProductId, mockIp, mockUserAgent);

      expect(productViewRepository.create).toHaveBeenCalledWith({
        ip: mockIp,
        product: { id: mockProductId },
        userAgent: mockUserAgent,
      });
      expect(productViewRepository.save).toHaveBeenCalled();
      expect(productRepository.increment).toHaveBeenCalledWith(
        { id: mockProductId },
        'viewCount',
        1,
      );
    });

    it('ne devrait pas créer de vue si une vue existe dans les dernières 24h', async () => {
      const existingView = {
        id: '1',
        ip: mockIp,
        product: { id: mockProductId },
        userAgent: mockUserAgent,
        createdAt: new Date(),
      };

      productViewRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingView),
      });

      await service.recordView(mockProductId, mockIp, mockUserAgent);

      expect(productViewRepository.create).not.toHaveBeenCalled();
      expect(productViewRepository.save).not.toHaveBeenCalled();
      expect(productRepository.increment).not.toHaveBeenCalled();
    });
  });

  describe('getViewStats', () => {
    it('devrait retourner les statistiques de vues', async () => {
      const mockStats = {
        uniqueViews: '10',
        totalViews: '20',
      };

      const mockViewsByDay = [
        { date: '2024-03-08', views: '5' },
        { date: '2024-03-07', views: '3' },
      ];

      const queryBuilder = productViewRepository.createQueryBuilder();
      queryBuilder.getRawOne.mockResolvedValue(mockStats);
      queryBuilder.getRawMany.mockResolvedValue(mockViewsByDay);

      const result = await service.getViewStats(mockProductId);

      expect(result).toEqual({
        uniqueViews: 10,
        totalViews: 20,
        viewsByDay: mockViewsByDay,
      });
    });
  });
});
