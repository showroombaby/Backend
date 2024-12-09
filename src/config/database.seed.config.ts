import { config } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { AppDataSource } from './typeorm.config';

config();

export const dataSourceOptions: DataSourceOptions = {
  ...AppDataSource.options,
  synchronize: true,
};

export default AppDataSource;
