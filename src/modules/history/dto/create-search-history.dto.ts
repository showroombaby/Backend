import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsNumber, Min } from 'class-validator';

export class CreateSearchHistoryDto {
  @ApiProperty({ description: 'Terme de recherche' })
  @IsString()
  searchTerm: string;

  @ApiProperty({ description: 'Filtres appliqués à la recherche' })
  @IsObject()
  filters: Record<string, any>;

  @ApiProperty({ description: 'Nombre de résultats trouvés' })
  @IsNumber()
  @Min(0)
  resultsCount: number;

  @ApiProperty({ description: 'Catégorie de recherche' })
  @IsString()
  category: string;
} 