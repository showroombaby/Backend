import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MonitoringService } from '../../modules/monitoring/services/monitoring.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
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

          // Enregistrer les métriques de performance
          this.monitoringService.recordHttpRequest(
            method,
            url,
            statusCode,
            duration,
          );

          // Loguer si la requête est lente (> 1s)
          if (duration > 1000) {
            this.monitoringService.logWarning(
              `Requête lente détectée: ${method} ${url} (${duration}ms)`,
              'Performance',
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Enregistrer les métriques d'erreur
          this.monitoringService.recordHttpRequest(
            method,
            url,
            statusCode,
            duration,
          );

          // Loguer l'erreur
          this.monitoringService.logError(error, 'Performance');
        },
      }),
    );
  }
}
