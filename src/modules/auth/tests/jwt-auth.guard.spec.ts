import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = { id: 1, email: 'test@example.com' };
      const result = guard.handleRequest(null, user, null);
      expect(result).toBe(user);
    });

    it('should throw UnauthorizedException when no user', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error when error exists', () => {
      const error = new Error('Test error');
      expect(() => guard.handleRequest(error, null, null)).toThrow(error);
    });

    it('should throw UnauthorizedException with expired token message', () => {
      expect(() =>
        guard.handleRequest(null, null, { message: 'jwt expired' }),
      ).toThrow(new UnauthorizedException('Token expired'));
    });
  });
});
