import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MonitoringService } from '../services/monitoring.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;

          // Enregistrer les métriques HTTP
          this.monitoringService.recordHttpRequest(
            method,
            url,
            statusCode,
            duration / 1000, // Convertir en secondes
          );

          // Logger la requête
          this.monitoringService.logInfo(
            `${method} ${url} ${statusCode} ${duration}ms`,
            'HTTP',
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Enregistrer les métriques d'erreur
          this.monitoringService.recordHttpRequest(
            method,
            url,
            statusCode,
            duration / 1000,
          );

          // Logger l'erreur
          this.monitoringService.logError(error, 'HTTP');
        },
      }),
    );
  }
}
