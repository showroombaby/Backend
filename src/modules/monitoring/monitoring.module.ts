import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { MetricsController } from './controllers/metrics.controller';
import { MonitoringService } from './services/monitoring.service';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `[${timestamp}] ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`;
            }),
          ),
        }),
      ],
    }),
  ],
  controllers: [MetricsController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
