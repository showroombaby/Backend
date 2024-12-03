import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({
    example: '123 rue de Paris',
    description: 'Numéro et nom de la rue',
  })
  @IsString()
  @IsNotEmpty({ message: 'La rue est requise' })
  street: string;

  @ApiProperty({
    example: '75001',
    description: 'Code postal (5 caractères)',
    minLength: 5,
    maxLength: 5,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le code postal est requis' })
  @Length(5, 5, { message: 'Le code postal doit contenir 5 caractères' })
  zipCode: string;

  @ApiProperty({
    example: 'Paris',
    description: 'Nom de la ville',
  })
  @IsString()
  @IsNotEmpty({ message: 'La ville est requise' })
  city: string;

  @ApiProperty({
    example: 'Appartement 4B',
    description: 'Informations complémentaires (étage, bâtiment, etc.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  additionalInfo?: string;
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: "Adresse de livraison de l'utilisateur",
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
