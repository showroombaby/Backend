import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../../../categories/entities/category.entity';
import { CategoriesService } from '../../../categories/services/categories.service';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../users/enums/role.enum';
import { ProductImage } from '../../entities/product-image.entity';
import { Product, ProductStatus } from '../../entities/product.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductFavoritesService } from '../../services/product-favorites.service';
import { ProductImagesService } from '../../services/product-images.service';
import { ProductsService } from '../../services/products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let productImageRepository: Repository<ProductImage>;
  let productImagesService: ProductImagesService;
  let categoriesService: CategoriesService;
  let productFavoritesService: ProductFavoritesService;

  const mockProduct: Partial<Product> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    status: ProductStatus.DRAFT,
    condition: ProductCondition.NEW,
    viewCount: 1,
    seller: { id: '123e4567-e89b-12d3-a456-426614174001' } as User,
    category: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Test Category',
      description: 'Test Description',
      products: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    categoryId: '123e4567-e89b-12d3-a456-426614174002',
    images: [],
    views: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory: Category = {
    id: '123e4567-e89b-12d3-a456-426614174002',
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
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    }),
  };

  const mockUser: User = {
    id: '1',
    email: 'seller@test.com',
    username: 'seller',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'Seller',
    role: Role.USER,
    isEmailVerified: false,
    rating: 0,
    avatar: null,
    avatarUrl: null,
    name: 'Test Seller',
    address: {
      street: '123 Test St',
      zipCode: '75000',
      city: 'Paris',
    },
    products: [],
    views: [],
    savedFilters: [],
    hashPassword: async () => {},
    validatePassword: async () => true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
          provide: getRepositoryToken(User),
          useValue: {
            ...mockRepository,
            findOne: jest.fn().mockResolvedValue({
              id: '123e4567-e89b-12d3-a456-426614174001',
              email: 'seller@test.com',
              username: 'seller',
              firstName: 'Test',
              lastName: 'Seller',
            }),
          },
        },
        {
          provide: ProductImagesService,
          useValue: {
            uploadImages: jest.fn(),
            createProductImage: jest.fn(),
            deleteImages: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ProductFavoritesService,
          useValue: {
            isFavorite: jest.fn().mockResolvedValue(false),
            addToFavorites: jest.fn(),
            removeFromFavorites: jest.fn(),
            getUserFavorites: jest.fn(),
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
    productFavoritesService = module.get<ProductFavoritesService>(
      ProductFavoritesService,
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createProductDto = {
      title: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      condition: ProductCondition.NEW,
      categoryId: '1',
      seller: mockUser,
      category: mockCategory,
    };

    it('devrait créer un nouveau produit avec succès', async () => {
      // Arrange
      jest.spyOn(categoriesService, 'findOne').mockResolvedValue(mockCategory);
      mockRepository.create.mockReturnValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        status: ProductStatus.DRAFT,
        condition: ProductCondition.NEW,
        viewCount: 1,
        seller: mockUser,
        category: mockCategory,
        images: [],
        views: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockRepository.save.mockResolvedValue({
        ...mockProduct,
        seller: mockUser,
        category: mockCategory,
      });

      // Act
      const result = await service.create(createProductDto, mockImages, '1');

      // Assert
      expect(result).toEqual({
        ...mockProduct,
        seller: mockUser,
        category: mockCategory,
      });
      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          condition: ProductCondition.NEW,
          categoryId: '1',
          seller: mockUser,
          category: mockCategory,
        }),
      );
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
      const mockProduct = {
        id: '123e4567-e89b-12d3-a456-426614174000',
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

      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProduct.id);

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        relations: ['category', 'images', 'seller'],
      });
    });

    it("devrait lever une exception si le produit n'existe pas", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('123e4567-e89b-12d3-a456-426614174999'),
      ).rejects.toThrow(NotFoundException);
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

  describe('getProductDetails', () => {
    it('devrait retourner les détails du produit avec le statut favori', async () => {
      const productId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = '123e4567-e89b-12d3-a456-426614174001';

      const mockProductWithViews = {
        ...mockProduct,
        viewCount: 0,
        views: [{ id: '1', userId, productId, createdAt: new Date() }],
      };

      mockRepository.findOne.mockResolvedValue(mockProductWithViews);
      jest.spyOn(productFavoritesService, 'isFavorite').mockResolvedValue(true);
      mockRepository.save.mockResolvedValue({
        ...mockProductWithViews,
        isFavorite: true,
        viewCount: 1,
      });

      const result = await service.getProductDetails(productId, userId);

      expect(result).toBeDefined();
      expect(result.isFavorite).toBe(true);
      expect(result.viewCount).toBe(1);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: productId,
          viewCount: 1,
          views: expect.arrayContaining([
            expect.objectContaining({
              userId,
              productId,
            }),
          ]),
        }),
      );
    });

    it("devrait lever une exception si le produit n'existe pas", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getProductDetails('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSimilarProducts', () => {
    it('devrait retourner des produits similaires', async () => {
      const mockSimilarProducts = [
        { ...mockProduct, id: '123e4567-e89b-12d3-a456-426614174003' },
        { ...mockProduct, id: '123e4567-e89b-12d3-a456-426614174004' },
      ];

      // Mock findOne pour éviter l'erreur NotFoundException
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockProduct,
        id: '123e4567-e89b-12d3-a456-426614174000',
        categoryId: '123e4567-e89b-12d3-a456-426614174002',
      });

      mockRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSimilarProducts),
      });

      const result = await service.findSimilarProducts(mockProduct.id, 2);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('123e4567-e89b-12d3-a456-426614174003');
      expect(result[1].id).toBe('123e4567-e89b-12d3-a456-426614174004');
    });
  });

  describe('update', () => {
    const updateDto = {
      title: 'Updated Title',
      price: 199.99,
    };

    it('devrait mettre à jour le produit avec succès', async () => {
      const updatedProduct = {
        ...mockProduct,
        ...updateDto,
      };

      // Mock findOne pour le produit existant
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockProduct,
        seller: { id: '123e4567-e89b-12d3-a456-426614174001' },
      });
      mockRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(
        mockProduct.id,
        updateDto,
        [],
        '123e4567-e89b-12d3-a456-426614174001',
      );

      expect(result.title).toBe(updateDto.title);
      expect(result.price).toBe(updateDto.price);
    });

    it("devrait lever une exception si l'utilisateur n'est pas autorisé", async () => {
      // Mock findOne pour le produit existant avec un vendeur différent
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockProduct,
        seller: { id: '123e4567-e89b-12d3-a456-426614174001' },
      });

      await expect(
        service.update(
          mockProduct.id,
          updateDto,
          [],
          '123e4567-e89b-12d3-a456-426614174999',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('devrait mettre à jour les images si fournies', async () => {
      const newImages = [
        {
          fieldname: 'images',
          originalname: 'new.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
          size: 1024,
          stream: null,
          destination: '',
          filename: 'new.jpg',
          path: '',
        },
      ];

      // Mock findOne pour le produit existant
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockProduct,
        seller: { id: '123e4567-e89b-12d3-a456-426614174001' },
        images: [{ url: 'old-image.jpg' }],
      });

      mockRepository.save.mockResolvedValue({
        ...mockProduct,
        images: [{ url: 'new-image-url.jpg' }],
      });

      const result = await service.update(
        mockProduct.id,
        updateDto,
        newImages,
        '123e4567-e89b-12d3-a456-426614174001',
      );

      expect(productImagesService.uploadImages).toHaveBeenCalled();
      expect(productImagesService.deleteImages).toHaveBeenCalled();
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toBe('new-image-url.jpg');
    });
  });
});
