import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductDetailDto } from '../dto/product-detail.dto';
import { SearchProductsDto } from '../dto/search-products.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Product } from '../entities/product.entity';
import { ProductsService } from '../services/products.service';

@ApiTags('products')
@Controller('products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Poussette bébé' },
        description: { type: 'string', example: 'Poussette en excellent état' },
        price: { type: 'number', example: 150.0 },
        condition: {
          type: 'string',
          enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'],
        },
        categoryId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Produit créé avec succès',
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: { user: User },
  ): Promise<Product> {
    const productData: Omit<CreateProductDto, 'images'> = {
      title: createProductDto.title,
      description: createProductDto.description,
      price: createProductDto.price,
      condition: createProductDto.condition,
      categoryId: createProductDto.categoryId,
      status: createProductDto.status,
      userId: createProductDto.userId,
    };
    return this.productsService.create(productData, files || [], req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Rechercher des produits' })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits',
    type: [Product],
  })
  findAll(@Query() searchProductsDto: SearchProductsDto) {
    return this.productsService.findAll(searchProductsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer les détails d'un produit" })
  @ApiResponse({
    status: 200,
    description: 'Détails du produit',
    type: ProductDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Produit non trouvé',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: { user?: User },
  ): Promise<ProductDetailDto> {
    const userId = req.user?.id;
    return this.productsService.getProductDetails(id, userId);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Récupérer les produits similaires' })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits similaires',
    type: [Product],
  })
  async findSimilar(@Param('id') id: string) {
    return this.productsService.findSimilarProducts(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Poussette bébé' },
        description: { type: 'string', example: 'Poussette en excellent état' },
        price: { type: 'number', example: 150.0 },
        condition: {
          type: 'string',
          enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'],
        },
        categoryId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Produit mis à jour avec succès',
    type: Product,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: "Non autorisé - Vous n'êtes pas le propriétaire du produit",
  })
  @ApiResponse({
    status: 404,
    description: 'Produit non trouvé',
  })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: { user: User },
  ): Promise<Product> {
    const productData: Omit<UpdateProductDto, 'images'> = {
      title: updateProductDto.title,
      description: updateProductDto.description,
      price: updateProductDto.price,
      condition: updateProductDto.condition,
      categoryId: updateProductDto.categoryId,
      status: updateProductDto.status,
      userId: updateProductDto.userId,
    };
    return this.productsService.update(
      id,
      productData,
      files || [],
      req.user.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer un produit' })
  @ApiResponse({
    status: 200,
    description: 'Produit supprimé avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 403,
    description: "Non autorisé - Vous n'êtes pas le propriétaire du produit",
  })
  @ApiResponse({
    status: 404,
    description: 'Produit non trouvé',
  })
  remove(@Param('id') id: string, @Req() req: { user: User }) {
    return this.productsService.remove(id, req.user.id);
  }
}
