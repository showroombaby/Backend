import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../modules/auth/strategies/jwt.strategy';
import { UsersModule } from '../../modules/users/users.module';

const TEST_JWT_SECRET = 'test-secret';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [() => ({ JWT_SECRET: TEST_JWT_SECRET })],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: TEST_JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule, JwtStrategy],
})
export class TestJwtModule {}
