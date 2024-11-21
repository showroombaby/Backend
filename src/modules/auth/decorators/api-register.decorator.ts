import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterResponseDto } from '../dto/register-response.dto';

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({ summary: 'Register a new user' }),
    ApiResponse({
      status: 201,
      description: 'User successfully registered',
      type: RegisterResponseDto,
    }),
    ApiResponse({
      status: 409,
      description: 'Email already exists',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data',
    }),
  );
}
