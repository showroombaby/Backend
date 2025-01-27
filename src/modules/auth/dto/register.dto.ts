import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Role } from '../../users/enums/role.enum';

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
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "Email de l'utilisateur",
  })
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  email: string;

  @ApiProperty({
    example: 'johndoe',
    description: "Nom d'utilisateur unique",
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
  username: string;

  @ApiProperty({
    example: 'Password123!',
    description: "Mot de passe de l'utilisateur",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'John',
    description: "Prénom de l'utilisateur",
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: "Nom de l'utilisateur",
    required: false,
  })
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

  @ApiProperty({
    description: "Rôle de l'utilisateur",
    enum: Role,
    default: Role.USER,
    required: false,
  })
  @IsOptional()
  role?: Role;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: "Image de profil de l'utilisateur",
    required: false,
  })
  @IsOptional()
  avatar?: Express.Multer.File;
}
