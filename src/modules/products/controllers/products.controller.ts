import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { SearchProductsDto } from '../dto/search-products.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductsService } from '../services/products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Récupérer la liste des catégories' })
  @ApiResponse({
    status: 200,
    description: 'Liste des catégories récupérée avec succès',
    type: [Category],
  })
  async getCategories() {
    return this.productsService.findAllCategories();
  }

  @Get()
  @ApiOperation({ summary: 'Rechercher des produits' })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits trouvés',
    type: Product,
  })
  async findAll(@Query() searchDto: SearchProductsDto) {
    return this.productsService.findAll(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une annonce par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Annonce récupérée avec succès',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Créer une nouvelle annonce' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Annonce créée avec succès',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 8 }]))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @CurrentUser() user: User,
  ) {
    if (!files?.images?.length) {
      throw new BadRequestException('Au moins une image est requise');
    }
    return this.productsService.create(
      createProductDto,
      files.images,
      user,
      false,
    );
  }

  @Post('preview')
  @ApiOperation({ summary: 'Prévisualiser une annonce' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 8 }]))
  async preview(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @CurrentUser() user: User,
  ) {
    if (!files?.images?.length) {
      throw new BadRequestException('Au moins une image est requise');
    }
    return this.productsService.create(
      createProductDto,
      files.images,
      user,
      true,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mettre à jour une annonce' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 8 }]))
  @ApiResponse({
    status: 200,
    description: 'Annonce mise à jour avec succès',
    type: Product,
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @CurrentUser() user: User,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      files?.images,
      user,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer une annonce' })
  @ApiResponse({ status: 200, description: 'Annonce supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.remove(id, user);
  }
}
