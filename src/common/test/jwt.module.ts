import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

export const JWT_CONFIG = {
  secret: 'test-secret-key',
  signOptions: { expiresIn: '24h' },
};

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_CONFIG.secret,
      signOptions: JWT_CONFIG.signOptions,
    }),
  ],
  exports: [JwtModule],
})
export class TestJwtModule {}
