import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testConfig } from '../../config/test.config';

export interface TestModuleOptions {
  imports?: any[];
  providers?: any[];
  controllers?: any[];
  overrides?: Array<{
    provider: any;
    useValue: any;
  }>;
}

export const createTestingModule = async (options: TestModuleOptions = {}) => {
  const builder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: 'src/config/test.env',
      }),
      TypeOrmModule.forRoot({
        ...testConfig,
        autoLoadEntities: true,
      }),
      JwtModule.register({
        secret: 'test-secret',
        signOptions: { expiresIn: '1h' },
      }),
      ...(options.imports || []),
    ],
    providers: options.providers || [],
    controllers: options.controllers || [],
  });

  // Appliquer les overrides
  if (options.overrides) {
    for (const override of options.overrides) {
      builder.overrideProvider(override.provider).useValue(override.useValue);
    }
  }

  const moduleRef = await builder.compile();
  return moduleRef;
};

export const initializeTestApp = async (moduleRef: TestingModule) => {
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
};

export const cleanupDatabase = async (
  app: INestApplication,
  entities: any[],
) => {
  try {
    // Supprimer les données dans l'ordre inverse des dépendances
    for (const entity of entities.reverse()) {
      const repository = app.get(`${entity.name}Repository`);
      await repository.clear();
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage de la base de données:', error);
  }
};

export const createAuthenticatedApp = async (
  options: TestModuleOptions = {},
) => {
  const moduleRef = await createTestingModule(options);
  const app = await initializeTestApp(moduleRef);
  return { app, moduleRef };
};
