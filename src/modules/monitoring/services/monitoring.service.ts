import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram,
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter,
    @InjectMetric('active_users_gauge')
    private readonly activeUsersGauge: Gauge,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: Logger,
  ) {}

  // Métriques HTTP
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
    this.httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
  }

  // Métriques utilisateurs
  updateActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }

  // Logging
  logError(error: Error, context?: string) {
    this.winstonLogger.error(error.message, {
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  logInfo(message: string, context?: string) {
    this.winstonLogger.log({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  logWarning(message: string, context?: string) {
    this.winstonLogger.warn(message, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  logDebug(message: string, context?: string) {
    this.winstonLogger.debug(message, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Métriques personnalisées
  recordDatabaseQuery(operation: string, duration: number) {
    this.httpRequestDuration.labels('database', operation).observe(duration);
  }

  recordWebSocketEvent(event: string) {
    this.httpRequestsTotal.labels('websocket', event).inc();
  }
}
