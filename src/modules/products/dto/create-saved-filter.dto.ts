import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCondition } from '../enums/product-condition.enum';

class FilterOptionsDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @IsEnum(ProductCondition)
  @IsOptional()
  condition?: ProductCondition;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class CreateSavedFilterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @ValidateNested()
  @Type(() => FilterOptionsDto)
  filters: FilterOptionsDto;
}
