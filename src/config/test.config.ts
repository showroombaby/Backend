import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const testConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  synchronize: true,
  dropSchema: true,
  logging: false,
  autoLoadEntities: true,
};

export const testIntegrationConfig: TypeOrmModuleOptions = {
  ...testConfig,
  database: ':memory:',
};
