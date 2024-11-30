import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

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
    example: 'https://example.com/avatar.jpg',
    description: "URL de l'avatar de l'utilisateur",
    required: false,
  })
  @IsUrl({}, { message: "L'URL de l'avatar doit être une URL valide" })
  @IsOptional()
  avatar?: string;
}
