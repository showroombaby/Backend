import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './modules/monitoring/filters/exception.filter';
import { PerformanceInterceptor } from './modules/monitoring/interceptors/performance.interceptor';
import { MonitoringService } from './modules/monitoring/services/monitoring.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration de la sécurité
  app.use(helmet());
  app.use(compression());
  app.enableCors();

  // Configuration de la validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Configuration du monitoring
  const monitoringService = app.get(MonitoringService);
  app.useGlobalInterceptors(new PerformanceInterceptor(monitoringService));
  app.useGlobalFilters(new GlobalExceptionFilter(monitoringService));

  // Configuration de Swagger
  const config = new DocumentBuilder()
    .setTitle('Baby API')
    .setDescription("Documentation de l'API Baby")
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('users', 'Gestion des utilisateurs')
    .addTag('products', 'Gestion des annonces')
    .addTag('messages', 'Messagerie')
    .addTag('notifications', 'Notifications')
    .addTag('device-tokens', "Gestion des tokens d'appareils")
    .addTag('categories', 'Gestion des catégories')
    .addTag('favorites', 'Gestion des favoris')
    .addTag('reports', 'Gestion des signalements')
    .addTag('monitoring', 'Monitoring et métriques')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
