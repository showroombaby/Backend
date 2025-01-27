import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({
    description: "ID de l'utilisateur à noter",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Note entre 0 et 5',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Commentaire optionnel',
    example: 'Très bon vendeur, je recommande !',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
