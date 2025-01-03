import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { MonitoringService } from './modules/monitoring/services/monitoring.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Sécurité
    app.use(helmet());
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    // Compression
    app.use(
      compression({
        threshold: 0, // Compresser toutes les réponses
        level: 6, // Niveau de compression (1-9)
      }),
    );

    // Validation globale
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Intercepteurs globaux
    const monitoringService = app.get(MonitoringService);
    app.useGlobalInterceptors(
      new TransformInterceptor(),
      new PerformanceInterceptor(monitoringService),
    );

    // Gestion des erreurs globale
    app.useGlobalFilters(new GlobalExceptionFilter());

    // WebSocket
    app.useWebSocketAdapter(new IoAdapter(app));

    // Documentation Swagger
    const config = new DocumentBuilder()
      .setTitle('ShowroomBaby API')
      .setDescription(
        `
API pour l'application ShowroomBaby.

Guide d'authentification :
1. Créez un compte via /auth/register
2. Connectez-vous via /auth/login pour obtenir un token JWT
3. Utilisez le token dans le header Authorization: Bearer <token>

Codes d'erreur globaux :
- 400: Requête invalide
- 401: Non authentifié
- 403: Non autorisé
- 404: Ressource non trouvée
- 429: Trop de requêtes
- 500: Erreur serveur

WebSocket :
Les événements WebSocket sont disponibles via Socket.IO.
Voir la documentation /api/docs#/messaging pour plus de détails.
      `,
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentification')
      .addTag('users', 'Gestion des utilisateurs')
      .addTag('products', 'Gestion des produits')
      .addTag('messages', 'Messagerie en temps réel')
      .addTag('monitoring', 'Métriques et monitoring')
      .addTag('offline', 'Mode hors-ligne')
      .addServer('http://localhost:3000', 'Serveur local')
      .addServer('https://api.showroombaby.com', 'Serveur de production')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Servir les fichiers statiques
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
      maxAge: '1d', // Cache client 1 jour
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Application lancée sur le port ${port}`);
  } catch (error) {
    logger.error(`Erreur lors du démarrage de l'application: ${error.message}`);
    throw error;
  }
}

bootstrap();
