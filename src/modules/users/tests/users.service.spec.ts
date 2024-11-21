import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException when email already exists', async () => {
      const registerDto = { email: 'test@test.com', password: 'password' };
      jest.spyOn(repo, 'findOne').mockResolvedValue({ id: '1' } as User);

      await expect(service.create(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });
});
