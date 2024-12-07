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
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Sécurité
    app.use(helmet());
    app.use(compression());

    // Validation globale
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Adaptateur WebSocket
    app.useWebSocketAdapter(new IoAdapter(app));

    // Filtres et intercepteurs globaux
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    // Configuration Swagger
    const config = new DocumentBuilder()
      .setTitle('ShowroomBaby API')
      .setDescription('API pour la plateforme ShowroomBaby')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentification')
      .addTag('users', 'Gestion des utilisateurs')
      .addTag('products', 'Gestion des produits')
      .addTag('messages', 'Messagerie en temps réel')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    });

    // Servir les fichiers statiques
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
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
