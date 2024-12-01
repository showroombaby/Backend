import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'ancienMotDePasse123',
    description: 'Mot de passe actuel',
  })
  @IsString({
    message: 'Le mot de passe actuel doit être une chaîne de caractères',
  })
  currentPassword: string;

  @ApiProperty({
    example: 'nouveauMotDePasse123!',
    description: 'Nouveau mot de passe',
  })
  @IsString({
    message: 'Le nouveau mot de passe doit être une chaîne de caractères',
  })
  @MinLength(8, {
    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre et un caractère spécial',
  })
  newPassword: string;

  @ApiProperty({
    example: 'nouveauMotDePasse123!',
    description: 'Confirmation du nouveau mot de passe',
  })
  @IsString({
    message:
      'La confirmation du mot de passe doit être une chaîne de caractères',
  })
  confirmPassword: string;
}
