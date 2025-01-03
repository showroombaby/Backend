import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getManager } from 'typeorm';
import { MonitoringService } from '../../monitoring/services/monitoring.service';

@Injectable()
export class QueryOptimizationInterceptor implements NestInterceptor {
  private readonly QUERY_THRESHOLD = 5; // Seuil de requêtes pour détecter le problème N+1

  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const queryCount = { value: 0 };
    const startTime = Date.now();

    // Active le logging des requêtes
    getManager().connection.logger.logQuery = () => {
      queryCount.value++;
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const request = context.switchToHttp().getRequest();

          // Log les métriques
          this.monitoringService.logDatabaseQuery({
            path: request.url,
            method: request.method,
            queryCount: queryCount.value,
            duration,
            timestamp: new Date(),
          });

          // Détection des problèmes N+1
          if (queryCount.value > this.QUERY_THRESHOLD) {
            this.monitoringService.logPerformanceIssue({
              type: 'N+1 Query',
              path: request.url,
              method: request.method,
              queryCount: queryCount.value,
              duration,
              timestamp: new Date(),
            });
          }
        },
        finalize: () => {
          // Désactive le logging des requêtes
          getManager().connection.logger.logQuery = () => {};
        },
      }),
    );
  }
}
