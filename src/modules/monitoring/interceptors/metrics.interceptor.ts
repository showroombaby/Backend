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
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          this.monitoringService.recordHttpRequest({
            method,
            url,
            duration,
            statusCode,
            timestamp: new Date(),
          });

          this.monitoringService.logInfo('Requête HTTP traitée', {
            method,
            url,
            duration,
            statusCode,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.monitoringService.recordHttpRequest({
            method,
            url,
            duration,
            statusCode,
            timestamp: new Date(),
          });

          this.monitoringService.logError(error, 'HTTP');
        },
      }),
    );
  }
}
