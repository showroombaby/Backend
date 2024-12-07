import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Category } from '../entities/category.entity';
import { ProductImage } from '../entities/product-image.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductImagesService } from './product-images.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly productImagesService: ProductImagesService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    user: User,
    isDraft: boolean = false,
  ): Promise<Product> {
    try {
      this.logger.debug('Début de la création du produit');
      this.logger.debug(`Données reçues: ${JSON.stringify(createProductDto)}`);
      this.logger.debug(`Nombre de fichiers: ${files?.length}`);

      const category = await this.categoryRepository.findOneOrFail({
        where: { id: createProductDto.categoryId },
      });
      this.logger.debug(`Catégorie trouvée: ${category.name}`);

      this.logger.debug('Upload des images...');
      const imageUrls = await this.productImagesService.uploadImages(files);
      this.logger.debug(`URLs des images: ${JSON.stringify(imageUrls)}`);

      const productImages = imageUrls.map((url) => ({
        url,
        filename: url.split('/').pop(),
      })) as ProductImage[];

      this.logger.debug('Création du produit...');
      const product = this.productRepository.create({
        ...createProductDto,
        seller: user,
        category,
        images: productImages,
        status: isDraft ? ProductStatus.DRAFT : ProductStatus.PUBLISHED,
      });

      this.logger.debug('Sauvegarde du produit...');
      return this.productRepository.save(product);
    } catch (error) {
      this.logger.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  }

  async findAll({
    page = 1,
    limit = 10,
    category,
    search,
  }: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) {
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.seller', 'seller')
      .where('product.status = :status', { status: ProductStatus.PUBLISHED });

    if (category) {
      query.andWhere('category.id = :categoryId', { categoryId: category });
    }

    if (search) {
      query.andWhere(
        '(product.title ILIKE :search OR product.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'images', 'seller'],
    });

    if (!product) {
      throw new NotFoundException(`Le produit avec l'ID ${id} n'existe pas`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[] | undefined,
    user: User,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (product.seller.id !== user.id) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier ce produit",
      );
    }

    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOneOrFail({
        where: { id: updateProductDto.categoryId },
      });
      product.category = category;
    }

    if (files?.length) {
      // Supprimer les anciennes images
      await this.productImagesService.deleteImages(product.images);

      // Uploader les nouvelles images
      const imageUrls = await this.productImagesService.uploadImages(files);
      product.images = imageUrls.map((url) => ({
        url,
        filename: url.split('/').pop(),
      })) as ProductImage[];
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string, user: User): Promise<void> {
    const product = await this.findOne(id);

    if (product.seller.id !== user.id) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à supprimer ce produit",
      );
    }

    // Supprimer les images avant de supprimer le produit
    await this.productImagesService.deleteImages(product.images);
    await this.productRepository.remove(product);
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }
}
