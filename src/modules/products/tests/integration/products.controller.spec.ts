import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../../../categories/entities/category.entity';
import { CategoriesService } from '../../../categories/services/categories.service';
import { User } from '../../../users/entities/user.entity';
import { ProductsController } from '../../controllers/products.controller';
import { CreateProductDto } from '../../dto/create-product.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ProductImage } from '../../entities/product-image.entity';
import { Product } from '../../entities/product.entity';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductStatus } from '../../enums/product-status.enum';
import { ProductFavoritesService } from '../../services/product-favorites.service';
import { ProductImagesService } from '../../services/product-images.service';
import { ProductsService } from '../../services/products.service';
import { Role } from '../../../users/enums/role.enum';

describe('ProductsController (Integration)', () => {
  let controller: ProductsController;

  const testUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
    avatar: null,
    avatarUrl: null,
    name: 'Test User',
    rating: 0,
    isEmailVerified: false,
    address: null,
    products: [],
    views: [],
    savedFilters: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: async () => {},
    validatePassword: async () => true,
  };

  const testCategory = {
    id: '1',
    name: 'Test Category',
  };

  const PRODUCT_ID = '123e4567-e89b-12d3-a456-426614174000';

  const testProduct = {
    id: PRODUCT_ID,
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    condition: ProductCondition.NEW,
    status: ProductStatus.PUBLISHED,
    category: testCategory,
    seller: testUser,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    viewCount: 2,
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[testProduct], 1]),
    getOne: jest.fn().mockResolvedValue(testProduct),
    setParameters: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
  };

  const mockProductRepository = {
    create: jest.fn().mockReturnValue(testProduct),
    save: jest.fn().mockResolvedValue(testProduct),
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.id === PRODUCT_ID) {
        return Promise.resolve({
          ...testProduct,
          seller: {
            id: testUser.id,
            email: testUser.email,
            username: testUser.username,
            name: testUser.name,
            avatarUrl: testUser.avatarUrl,
          },
        });
      }
      return Promise.resolve(null);
    }),
    find: jest.fn().mockResolvedValue([testProduct]),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue(testUser),
  };

  const mockCategoryRepository = {
    findOne: jest.fn().mockResolvedValue(testCategory),
  };

  const mockProductImageRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProductImagesService = {
    uploadImage: jest.fn(),
    uploadImages: jest.fn().mockResolvedValue(['image1.jpg']),
    deleteImage: jest.fn(),
    deleteImages: jest.fn(),
    createProductImage: jest.fn(),
  };

  const mockCategoriesService = {
    findOne: jest.fn().mockResolvedValue(testCategory),
  };

  const mockProductFavoritesService = {
    findOne: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    isFavorite: jest.fn().mockResolvedValue(false),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn().mockReturnValue({ sub: testUser.id }),
  };

  const mockProductsService = {
    create: jest.fn().mockResolvedValue(testProduct),
    findAll: jest.fn().mockResolvedValue({
      items: [testProduct],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    }),
    getProductDetails: jest.fn().mockResolvedValue({
      ...testProduct,
      isFavorite: false,
    }),
    update: jest.fn().mockResolvedValue(testProduct),
    remove: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: mockProductImageRepository,
        },
        {
          provide: ProductImagesService,
          useValue: mockProductImagesService,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
        {
          provide: ProductFavoritesService,
          useValue: mockProductFavoritesService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);

    // Reset les mocks avant chaque test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        price: 100,
        condition: ProductCondition.NEW,
        categoryId: '1',
        status: ProductStatus.PUBLISHED,
        userId: '1',
      };

      const result = await controller.create(createProductDto, [], {
        user: testUser as User,
      });

      expect(result).toEqual(testProduct);
      expect(mockProductsService.create).toHaveBeenCalledWith(
        expect.objectContaining(createProductDto),
        [],
        testUser.id,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const result = await controller.findAll({});

      expect(result).toEqual({
        items: [testProduct],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockProductsService.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      const result = await controller.findOne(PRODUCT_ID, {
        user: testUser as User,
      });

      expect(result).toEqual({
        ...testProduct,
        isFavorite: false,
      });
      expect(mockProductsService.getProductDetails).toHaveBeenCalledWith(
        PRODUCT_ID,
        testUser.id,
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        title: 'Updated Product',
        description: 'Updated Description',
        price: 200,
        condition: ProductCondition.LIKE_NEW,
        categoryId: '1',
        status: ProductStatus.PUBLISHED,
        userId: '1',
      };

      const result = await controller.update(PRODUCT_ID, updateProductDto, [], {
        user: testUser as User,
      });

      expect(result).toEqual(testProduct);
      expect(mockProductsService.update).toHaveBeenCalledWith(
        PRODUCT_ID,
        expect.objectContaining(updateProductDto),
        [],
        testUser.id,
      );
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const result = await controller.remove(PRODUCT_ID, {
        user: testUser as User,
      });

      expect(result).toEqual({ success: true });
      expect(mockProductsService.remove).toHaveBeenCalledWith(
        PRODUCT_ID,
        testUser.id,
      );
    });
  });
});
