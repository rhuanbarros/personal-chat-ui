/**
 * Structured logging utility
 * Replaces scattered console.log statements with structured, level-based logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const fullContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      };
      console.error(this.formatMessage('ERROR', message, fullContext));
    }
  }

  // Service-specific loggers for better organization
  aiService = {
    debug: (message: string, context?: LogContext) => this.debug(`[AI Service] ${message}`, context),
    info: (message: string, context?: LogContext) => this.info(`[AI Service] ${message}`, context),
    warn: (message: string, context?: LogContext) => this.warn(`[AI Service] ${message}`, context),
    error: (message: string, error?: Error | any, context?: LogContext) => this.error(`[AI Service] ${message}`, error, context)
  };

  chatService = {
    debug: (message: string, context?: LogContext) => this.debug(`[Chat Service] ${message}`, context),
    info: (message: string, context?: LogContext) => this.info(`[Chat Service] ${message}`, context),
    warn: (message: string, context?: LogContext) => this.warn(`[Chat Service] ${message}`, context),
    error: (message: string, error?: Error | any, context?: LogContext) => this.error(`[Chat Service] ${message}`, error, context)
  };

  api = {
    debug: (message: string, context?: LogContext) => this.debug(`[API] ${message}`, context),
    info: (message: string, context?: LogContext) => this.info(`[API] ${message}`, context),
    warn: (message: string, context?: LogContext) => this.warn(`[API] ${message}`, context),
    error: (message: string, error?: Error | any, context?: LogContext) => this.error(`[API] ${message}`, error, context)
  };
}

export const logger = new Logger(); 