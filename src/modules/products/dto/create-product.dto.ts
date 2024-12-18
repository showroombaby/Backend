import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductStatus } from '../entities/product.entity';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsNotEmpty()
  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.DRAFT;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  images?: Express.Multer.File[];
}
