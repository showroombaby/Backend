import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Poussette Yoyo' })
  @IsString()
  @Length(3, 100)
  title: string;

  @ApiProperty({ example: 'Poussette en excellent état...' })
  @IsString()
  @Length(10, 2000)
  description: string;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @Min(0)
  @Max(99999)
  price: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  categoryId: string;
}
