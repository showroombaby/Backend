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
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          this.monitoringService.logHttpRequest({
            method,
            url,
            duration,
            statusCode,
            timestamp: new Date(),
          });

          if (duration > 1000) {
            this.monitoringService.logWarning(
              'Requête lente détectée',
              'Performance',
              { method, url, duration },
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.monitoringService.logHttpRequest({
            method,
            url,
            duration,
            statusCode,
            timestamp: new Date(),
          });

          this.monitoringService.logError(error, 'Performance');
        },
      }),
    );
  }
}
