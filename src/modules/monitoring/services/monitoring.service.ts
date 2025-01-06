import { Inject, Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Logger } from 'winston';

interface DatabaseQueryMetrics {
  path: string;
  method: string;
  queryCount: number;
  duration: number;
  timestamp: Date;
}

interface PerformanceIssue {
  type: string;
  path: string;
  method: string;
  queryCount: number;
  duration: number;
  timestamp: Date;
}

interface HttpMetrics {
  method: string;
  url: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

@Injectable()
export class MonitoringService {
  constructor(
    @InjectMetric('database_queries_total')
    private databaseQueriesCounter: Counter<string>,
    @InjectMetric('database_query_duration_seconds')
    private databaseQueryDuration: Histogram<string>,
    @InjectMetric('http_request_duration_seconds')
    private httpRequestDuration: Histogram<string>,
    @InjectMetric('http_requests_total')
    private httpRequestsCounter: Counter<string>,
    @Inject('Logger')
    private readonly logger: Logger,
  ) {}

  recordHttpRequest(metrics: HttpMetrics): void {
    this.httpRequestsCounter.inc({
      method: metrics.method,
      status: metrics.statusCode.toString(),
    });

    this.httpRequestDuration.observe(
      {
        method: metrics.method,
        path: metrics.url,
      },
      metrics.duration / 1000,
    );

    this.logInfo('HTTP Request', metrics);
  }

  logHttpRequest(metrics: HttpMetrics): void {
    this.logger.info('HTTP Request', { ...metrics, context: 'HTTP' });
  }

  logDatabaseQuery(
    metrics: DatabaseQueryMetrics,
    context: string = 'Database',
  ): void {
    this.databaseQueriesCounter.inc({
      path: metrics.path,
      method: metrics.method,
    });

    this.databaseQueryDuration.observe(
      {
        path: metrics.path,
        method: metrics.method,
      },
      metrics.duration / 1000,
    );

    this.logger.info(`[${context}] Database Query Metrics`, {
      ...metrics,
      context,
    });
  }

  logPerformanceIssue(issue: PerformanceIssue): void {
    this.logger.warn(`[Performance] ${issue.type} detected`, {
      ...issue,
      context: 'Performance',
    });
  }

  logError(error: Error, context?: string): void {
    this.logger.error(error.message, {
      error,
      context: context || 'Application',
      stack: error.stack,
      timestamp: new Date(),
    });
  }

  logWarning(message: string, context?: string, data?: any): void {
    this.logger.warn(message, {
      ...data,
      context: context || 'Application',
      timestamp: new Date(),
    });
  }

  logInfo(message: string, data?: any): void {
    this.logger.info(message, {
      ...data,
      timestamp: new Date(),
    });
  }

  async checkHealth() {
    const metrics = await this.getMetrics();
    return {
      status: 'ok',
      timestamp: new Date(),
      metrics,
    };
  }

  async getMetrics() {
    return {
      httpRequests: await this.httpRequestsCounter.get(),
      httpLatency: await this.httpRequestDuration.get(),
      databaseQueries: await this.databaseQueriesCounter.get(),
      databaseLatency: await this.databaseQueryDuration.get(),
    };
  }
}
