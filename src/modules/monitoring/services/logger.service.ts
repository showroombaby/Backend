import { Injectable } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

interface LogContext {
  timestamp: Date;
  [key: string]: any;
}

@Injectable()
export class LoggerService {
  private readonly logger: Logger;
  private readonly errorLogger: Logger;
  private readonly performanceLogger: Logger;
  private readonly securityLogger: Logger;

  constructor() {
    const defaultFormat = format.combine(format.timestamp(), format.json());

    // Logger principal
    this.logger = createLogger({
      format: defaultFormat,
      transports: [
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        }),
      ],
    });

    // Logger d'erreurs
    this.errorLogger = createLogger({
      format: defaultFormat,
      transports: [
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
        }),
      ],
    });

    // Logger de performance
    this.performanceLogger = createLogger({
      format: defaultFormat,
      transports: [
        new DailyRotateFile({
          filename: 'logs/performance-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });

    // Logger de sécurité
    this.securityLogger = createLogger({
      format: defaultFormat,
      transports: [
        new DailyRotateFile({
          filename: 'logs/security-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  setupErrorLogging() {
    process.on('unhandledRejection', (reason: Error) => {
      this.logError({
        error: reason,
        context: 'UnhandledRejection',
        timestamp: new Date(),
      });
    });

    process.on('uncaughtException', (error: Error) => {
      this.logError({
        error,
        context: 'UncaughtException',
        timestamp: new Date(),
      });
    });
  }

  setupPerformanceLogging() {
    // Configuration des seuils de performance
    const SLOW_REQUEST_THRESHOLD = 1000; // 1 seconde

    this.performanceLogger.on('data', (log) => {
      if (log.duration > SLOW_REQUEST_THRESHOLD) {
        this.logPerformanceIssue({
          type: 'SlowRequest',
          duration: log.duration,
          endpoint: log.url,
          timestamp: new Date(),
        });
      }
    });
  }

  setupSecurityLogging() {
    // Configuration de la journalisation de sécurité
  }

  logHttpRequest(context: LogContext) {
    this.logger.info('HTTP Request', context);
    this.performanceLogger.info('Request Performance', {
      type: 'HttpRequest',
      ...context,
    });
  }

  logWebSocketEvent(context: LogContext) {
    this.logger.info('WebSocket Event', context);
    this.performanceLogger.info('WebSocket Performance', {
      type: 'WebSocketEvent',
      ...context,
    });
  }

  logDatabaseQuery(context: LogContext) {
    this.performanceLogger.info('Database Query', {
      type: 'DatabaseQuery',
      ...context,
    });
  }

  logError(context: LogContext) {
    const { error, ...logContext } = context;
    this.errorLogger.error(error.message, {
      ...logContext,
      stack: error.stack,
    });
  }

  logPerformanceIssue(context: LogContext) {
    this.performanceLogger.warn('Performance Issue', context);
  }

  logSecurityEvent(context: LogContext) {
    this.securityLogger.warn('Security Event', context);
  }

  logInfo(message: string, context: LogContext) {
    this.logger.info(message, context);
  }

  logWarning(message: string, context: LogContext) {
    this.logger.warn(message, context);
  }

  logDebug(message: string, context: LogContext) {
    this.logger.debug(message, context);
  }
}
