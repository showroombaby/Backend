import { User } from '@/modules/users/entities/user.entity';
import { Role } from '@/modules/users/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

export const createTestUser = async (
  userRepository: Repository<User>,
  overrides: Partial<User> = {},
): Promise<User> => {
  const user = userRepository.create({
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    role: Role.USER,
    isEmailVerified: true,
    ...overrides,
  });

  return userRepository.save(user);
};

export const generateTestToken = (
  jwtService: JwtService,
  user: User,
): string => {
  return jwtService.sign({ sub: user.id, email: user.email });
};
