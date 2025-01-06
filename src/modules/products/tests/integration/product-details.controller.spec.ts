import { ProductDetailsController } from '@modules/products/controllers/product-details.controller';
import { ProductCondition } from '@modules/products/enums/product-condition.enum';
import { ProductsService } from '@modules/products/services/products.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TestModule } from './test.module';

describe('ProductDetailsController', () => {
  let controller: ProductDetailsController;
  let productsService: ProductsService;
  let module: TestingModule;

  const mockProduct = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    condition: ProductCondition.NEW,
    categoryId: '123e4567-e89b-12d3-a456-426614174001',
  };

  const mockSimilarProducts = [
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Similar Product 1',
      price: 110,
      condition: ProductCondition.NEW,
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174003',
      name: 'Similar Product 2',
      price: 90,
      condition: ProductCondition.NEW,
    },
  ];

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    controller = module.get<ProductDetailsController>(ProductDetailsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return product details', async () => {
      const result = await controller.findOne(mockProduct.id);
      expect(result).toEqual(mockProduct);
      expect(productsService.findOne).toHaveBeenCalledWith(mockProduct.id);
    });
  });

  describe('findSimilarProducts', () => {
    it('should return similar products', async () => {
      const result = await controller.findSimilarProducts(mockProduct.id);
      expect(result).toEqual(mockSimilarProducts);
      expect(productsService.findSimilarProducts).toHaveBeenCalledWith(
        mockProduct.id,
      );
    });
  });
});
