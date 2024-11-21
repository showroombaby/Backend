import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    example: {
      id: '123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };

  @ApiProperty({
    example: 'Registration successful',
    description: 'Status message',
  })
  message: string;
}
