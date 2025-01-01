import { testConfig } from '@config/test.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '@config/test.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(testConfig),
  ],
  exports: [TypeOrmModule],
})
export class TestDatabaseModule {}
