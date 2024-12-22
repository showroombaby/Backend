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
import { DataSource } from 'typeorm';
import { Express } from 'express';
import { User } from '../../../users/entities/user.entity';

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
    seller: { id: '1' } as User,
    category: {
      id: '1',
      name: 'Test Category',
      description: 'Test Description',
      products: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    categoryId: '1',
    images: [],
    views: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory: Category = {
    id: '1',
    name: 'Test Category',
    description: 'Test Description',
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockImages: Express.Multer.File[] = [
    {
      fieldname: 'images',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test'),
      size: 1024,
      stream: null,
      destination: '',
      filename: 'test.jpg',
      path: '',
    },
  ];

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
            uploadImages: jest.fn(),
            createProductImage: jest.fn(),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue({
              manager: {
                save: jest.fn(),
                findOne: jest.fn(),
              },
              release: jest.fn(),
            }),
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
        seller: { id: '1' },
        category: mockCategory,
      });
    });

    it("devrait échouer si la catégorie n'existe pas", async () => {
      // Arrange
      jest
        .spyOn(categoriesService, 'findOne')
        .mockRejectedValue(new NotFoundException('Category not found'));

      // Act & Assert
      await expect(
        service.create(createProductDto, mockImages, '1'),
      ).rejects.toThrow(NotFoundException);
      expect(categoriesService.findOne).toHaveBeenCalledWith('1');
    });

    it("devrait utiliser le service d'images de produits", async () => {
      jest.spyOn(categoriesService, 'findOne').mockResolvedValue(mockCategory);
      jest
        .spyOn(productImagesService, 'uploadImages')
        .mockResolvedValue(['image1.jpg']);
      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto, mockImages, '1');

      expect(productImagesService.uploadImages).toHaveBeenCalledWith(
        mockImages,
      );
      expect(result).toEqual(mockProduct);
    });

    it("devrait utiliser le depot d'images de produits", async () => {
      jest.spyOn(categoriesService, 'findOne').mockResolvedValue(mockCategory);
      jest
        .spyOn(productImagesService, 'uploadImages')
        .mockResolvedValue(['image1.jpg']);
      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);
      const result = await service.create(createProductDto, mockImages, '1');
      expect(productImageRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
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
        relations: ['category', 'images', 'seller'],
      });
    });

    it("devrait lever une exception si le produit n'existe pas", async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  it('should create product images', async () => {
    const productId = '1';
    const files: Express.Multer.File[] = [
      {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: 'uploads/',
        filename: 'test.jpg',
        path: 'uploads/test.jpg',
        size: 1024,
        buffer: Buffer.from('test image'),
        stream: {} as any,
      },
    ];

    const mockProductImage: ProductImage = {
      id: '1',
      url: 'uploads/test.jpg',
      productId,
      product: null,
      filename: 'test.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock responses
    jest
      .spyOn(productImagesService, 'uploadImages')
      .mockResolvedValue(['uploads/test.jpg']);
    jest
      .spyOn(productImagesService, 'createProductImage')
      .mockResolvedValue(mockProductImage);

    // Act
    const uploadedPaths = await productImagesService.uploadImages(files);
    const result = await productImagesService.createProductImage(
      uploadedPaths[0],
      productId,
    );

    // Assert
    expect(productImagesService.uploadImages).toHaveBeenCalledWith(files);
    expect(productImagesService.createProductImage).toHaveBeenCalledWith(
      'uploads/test.jpg',
      productId,
    );
    expect(result).toEqual(mockProductImage);
  });
});
