import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'src/config/test.env',
      isGlobal: true,
      expandVariables: true,
      cache: true,
    }),
  ],
  exports: [ConfigModule],
})
export class TestConfigModule {}
