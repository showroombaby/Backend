import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../../../categories/services/categories.service';
import { Category } from '../../entities/category.entity';
import { ProductImage } from '../../entities/product-image.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductImagesService } from '../../services/product-images.service';
import { ProductsService } from '../../services/products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let productImageRepository: Repository<ProductImage>;
  let productImagesService: ProductImagesService;
  let categoriesService: CategoriesService;

  const mockProduct: Partial<Product> = {
    id: '1',
    title: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    status: ProductStatus.DRAFT,
    condition: ProductCondition.NEW,
    sellerId: '1',
    categoryId: '1',
    images: [],
    views: [],
    seller: null,
    category: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory: Partial<Category> = {
    id: '1',
    name: 'Test Category',
    description: 'Test Description',
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockImages = [
    {
      fieldname: 'images',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
    },
  ] as Express.Multer.File[];

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: mockRepository,
        },
        {
          provide: ProductImagesService,
          useValue: {
            uploadImages: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    productImageRepository = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
    productImagesService =
      module.get<ProductImagesService>(ProductImagesService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    const createProductDto = {
      title: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      condition: ProductCondition.NEW,
      categoryId: '1',
    };

    it('devrait créer un nouveau produit avec succès', async () => {
      // Arrange
      jest.spyOn(categoriesService, 'findOne').mockResolvedValue(mockCategory);
      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      // Act
      const result = await service.create(createProductDto, mockImages, '1');

      // Assert
      expect(result).toEqual(mockProduct);
      expect(productRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        sellerId: '1',
        status: ProductStatus.DRAFT,
      });
    });

    it("devrait échouer si la catégorie n'existe pas", async () => {
      // Arrange
      jest.spyOn(categoriesService, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.create(createProductDto, mockImages, '1'),
      ).rejects.toThrow(NotFoundException);
      expect(categoriesService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('findOne', () => {
    it('devrait retourner un produit par son ID', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne('1');

      // Assert
      expect(result).toEqual(mockProduct);
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['images', 'seller', 'category'],
      });
    });

    it("devrait lever une exception si le produit n'existe pas", async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
