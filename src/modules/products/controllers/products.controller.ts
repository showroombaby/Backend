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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { SearchProductsDto } from '../dto/search-products.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsService } from '../services/products.service';
import { Product } from '../entities/product.entity';
import { ProductDetailDto } from '../dto/product-detail.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images'))
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
  findAll(@Query() searchProductsDto: SearchProductsDto) {
    return this.productsService.findAll(searchProductsDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user?: User }): Promise<ProductDetailDto> {
    const userId = req.user?.id;
    return this.productsService.getProductDetails(id, userId);
  }

  @Get(':id/similar')
  async findSimilar(@Param('id') id: string) {
    return this.productsService.findSimilarProducts(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images'))
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
  remove(@Param('id') id: string, @Req() req: { user: User }) {
    return this.productsService.remove(id, req.user.id);
  }
}
