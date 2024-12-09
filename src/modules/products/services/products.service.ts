import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../../categories/services/categories.service';
import { SearchProductsDto } from '../dto/search-products.dto';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/product.entity';
import { ProductImagesService } from './product-images.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly productImagesService: ProductImagesService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(
    createProductDto: Partial<Product>,
    images: Express.Multer.File[],
    userId: string,
  ): Promise<Product> {
    try {
      const category = await this.categoriesService.findOne(
        createProductDto.categoryId,
      );

      const product = this.productRepository.create({
        ...createProductDto,
        seller: { id: userId },
        category,
      });

      const savedProduct = await this.productRepository.save(product);

      if (images && images.length > 0) {
        const uploadedImageUrls =
          await this.productImagesService.uploadImages(images);
        const productImages = await Promise.all(
          uploadedImageUrls.map(async (url) => {
            const image = this.productImageRepository.create({
              url,
              filename: url.split('/').pop(),
              product: savedProduct,
            });
            return await this.productImageRepository.save(image);
          }),
        );
        savedProduct.images = productImages;
      }

      return savedProduct;
    } catch (error) {
      this.logger.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  }

  async findAll(searchDto: SearchProductsDto) {
    try {
      const {
        categoryId,
        minPrice,
        maxPrice,
        condition,
        latitude,
        longitude,
        radius,
        query,
        sortBy,
        page = 1,
        limit = 10,
      } = searchDto;

      const skip = (page - 1) * limit;

      const queryBuilder = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.images', 'images')
        .leftJoinAndSelect('product.seller', 'seller');

      if (categoryId) {
        queryBuilder.andWhere('product.categoryId = :categoryId', {
          categoryId,
        });
      }

      if (minPrice !== undefined) {
        queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
      }

      if (maxPrice !== undefined) {
        queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
      }

      if (condition) {
        queryBuilder.andWhere('product.condition = :condition', { condition });
      }

      if (query) {
        queryBuilder.andWhere(
          '(product.title ILIKE :query OR product.description ILIKE :query)',
          { query: `%${query}%` },
        );
      }

      if (latitude && longitude && radius) {
        queryBuilder
          .addSelect(
            `(6371 * acos(cos(radians(:latitude)) * cos(radians(product.latitude)) * cos(radians(product.longitude) - radians(:longitude)) + sin(radians(:latitude)) * sin(radians(product.latitude))))`,
            'distance',
          )
          .having('distance <= :radius')
          .setParameters({
            latitude,
            longitude,
            radius,
          });

        if (sortBy === 'distance') {
          queryBuilder.orderBy('distance', 'ASC');
        }
      }

      switch (sortBy) {
        case 'price':
          queryBuilder.orderBy('product.price', 'ASC');
          break;
        case 'date':
          queryBuilder.orderBy('product.createdAt', 'DESC');
          break;
        case 'views':
          queryBuilder.orderBy('product.viewCount', 'DESC');
          break;
        default:
          queryBuilder.orderBy('product.createdAt', 'DESC');
      }

      queryBuilder.skip(skip).take(limit);

      const [items, total] = await queryBuilder.getManyAndCount();

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Erreur lors de la recherche des produits:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: { id },
        relations: ['category', 'images', 'seller'],
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return product;
    } catch (error) {
      this.logger.error('Erreur lors de la recherche du produit:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateProductDto: Partial<Product>,
    images: Express.Multer.File[],
    userId: string,
  ): Promise<Product> {
    try {
      const product = await this.findOne(id);

      if (product.seller.id !== userId) {
        throw new UnauthorizedException(
          'You are not authorized to update this product',
        );
      }

      if (updateProductDto.categoryId) {
        const category = await this.categoriesService.findOne(
          updateProductDto.categoryId,
        );
        product.category = category;
      }

      Object.assign(product, updateProductDto);

      if (images && images.length > 0) {
        if (product.images && product.images.length > 0) {
          await this.productImagesService.deleteImages(product.images);
        }
        const uploadedImageUrls =
          await this.productImagesService.uploadImages(images);
        const productImages = await Promise.all(
          uploadedImageUrls.map(async (url) => {
            const image = this.productImageRepository.create({
              url,
              filename: url.split('/').pop(),
              product,
            });
            return await this.productImageRepository.save(image);
          }),
        );
        product.images = productImages;
      }

      return await this.productRepository.save(product);
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      const product = await this.findOne(id);

      if (product.seller.id !== userId) {
        throw new UnauthorizedException(
          'You are not authorized to delete this product',
        );
      }

      if (product.images && product.images.length > 0) {
        await this.productImagesService.deleteImages(product.images);
      }
      await this.productRepository.remove(product);
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  }
}
