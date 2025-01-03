import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDurationHistogram: Histogram<string>,
    @InjectMetric('http_requests_total')
    private readonly requestsCounter: Counter<string>,
    @InjectMetric('active_connections')
    private readonly activeConnectionsGauge: Gauge<string>,
    @InjectMetric('error_rate')
    private readonly errorRateGauge: Gauge<string>,
    @InjectMetric('websocket_event_duration_seconds')
    private readonly wsEventDurationHistogram: Histogram<string>,
    @InjectMetric('database_query_duration_seconds')
    private readonly dbQueryDurationHistogram: Histogram<string>,
  ) {}

  registerRequestDurationMetric() {
    // Les métriques sont automatiquement enregistrées par le décorateur @InjectMetric
  }

  registerActiveConnectionsMetric() {
    // Les métriques sont automatiquement enregistrées par le décorateur @InjectMetric
  }

  registerErrorRateMetric() {
    // Les métriques sont automatiquement enregistrées par le décorateur @InjectMetric
  }

  recordRequestDuration(method: string, path: string, duration: number) {
    this.requestDurationHistogram.labels(method, path).observe(duration);
  }

  incrementRequestCount(method: string, path: string, statusCode: number) {
    this.requestsCounter.labels(method, path, statusCode.toString()).inc();
  }

  updateActiveConnections(count: number) {
    this.activeConnectionsGauge.set(count);
  }

  incrementErrorCount(statusCode: number) {
    this.errorRateGauge.inc();
  }

  recordWebSocketEventDuration(event: string, duration: number) {
    this.wsEventDurationHistogram.labels(event).observe(duration);
  }

  recordDatabaseQueryDuration(query: string, duration: number) {
    this.dbQueryDurationHistogram.labels(query).observe(duration);
  }

  async getMetrics() {
    const errorRate = await this.errorRateGauge.get();
    const activeConnections = await this.activeConnectionsGauge.get();
    const requestDurations = await this.requestDurationHistogram.get();

    const averageResponseTime =
      requestDurations.values.reduce((acc, val) => acc + val.value, 0) /
      requestDurations.values.length;

    return {
      errorRate: errorRate.values[0]?.value || 0,
      activeConnections: activeConnections.values[0]?.value || 0,
      averageResponseTime: averageResponseTime || 0,
    };
  }
}
