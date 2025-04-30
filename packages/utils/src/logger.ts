import winston from 'winston';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'perena-whatsapp' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Export a function to create namespaced loggers
export function createLogger(namespace: string) {
  return {
    info: (message: string, meta?: any) => logger.info(`[${namespace}] ${message}`, meta),
    error: (message: string, error?: any) => logger.error(`[${namespace}] ${message}`, error),
    warn: (message: string, meta?: any) => logger.warn(`[${namespace}] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[${namespace}] ${message}`, meta),
  };
}
