import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { MonitoringService } from './services/monitoring.service';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      defaultLabels: {
        app: 'baby-api',
      },
    }),
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    }),
  ],
  providers: [
    MonitoringService,
    {
      provide: 'PROMETHEUS_METRICS',
      useFactory: () => ({
        databaseQueriesCounter: {
          name: 'database_queries_total',
          help: 'Total number of database queries',
          labelNames: ['path', 'method'],
        },
        databaseQueryDuration: {
          name: 'database_query_duration_seconds',
          help: 'Duration of database queries in seconds',
          labelNames: ['path', 'method'],
        },
      }),
    },
  ],
  exports: [MonitoringService],
})
export class MonitoringModule {}
