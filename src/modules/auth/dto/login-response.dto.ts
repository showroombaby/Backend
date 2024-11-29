import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
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
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({
    example: 'Login successful',
    description: 'Status message',
  })
  message: string;
}
