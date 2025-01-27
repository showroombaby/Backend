import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from '../../auth/dto/register.dto';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "Email de l'utilisateur",
    required: false,
  })
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'johndoe',
    description: "Nom d'utilisateur unique",
    required: false,
  })
  @IsString({
    message: "Le nom d'utilisateur doit être une chaîne de caractères",
  })
  @MinLength(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères",
  })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres, des tirets et des underscores",
  })
  @IsOptional()
  username?: string;

  @ApiProperty({
    example: 'John',
    description: "Prénom de l'utilisateur",
    required: false,
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le prénom ne peut pas dépasser 50 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes',
  })
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: "Nom de l'utilisateur",
    required: false,
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom ne peut pas dépasser 50 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes',
  })
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: 'avatar.jpg',
    description: "Nom du fichier de l'avatar",
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    example: '/uploads/avatars/avatar.jpg',
    description: "URL de l'avatar",
    required: false,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: "Adresse de livraison de l'utilisateur",
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
