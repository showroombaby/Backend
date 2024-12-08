import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum ProductSortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
}

export class SearchProductsDto {
  @ApiProperty({
    description: 'Terme de recherche',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'ID de la catégorie',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Prix minimum',
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({
    description: 'Prix maximum',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({
    description: 'Trier par',
    required: false,
    enum: ProductSortBy,
    default: ProductSortBy.DATE_DESC,
  })
  @IsEnum(ProductSortBy)
  @IsOptional()
  sortBy?: ProductSortBy = ProductSortBy.DATE_DESC;

  @ApiProperty({
    description: 'Numéro de page',
    required: false,
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: "Nombre d'éléments par page",
    required: false,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
