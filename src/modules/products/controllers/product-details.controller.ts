import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';

@ApiTags('product-details')
@Controller('products')
export class ProductDetailsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id')
  @ApiOperation({ summary: "Obtenir les détails d'un produit" })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Détails du produit trouvés' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException(
        `Le produit avec l'ID ${id} n'a pas été trouvé`,
      );
    }
    return product;
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Obtenir les produits similaires' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ status: 200, description: 'Produits similaires trouvés' })
  async findSimilarProducts(@Param('id') id: string) {
    return this.productsService.findSimilarProducts(id);
  }
}
