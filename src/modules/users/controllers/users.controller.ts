import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.usersService.create(registerDto);
  }
}
