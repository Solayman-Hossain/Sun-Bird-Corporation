/// <reference path="../types/express.d.ts" />
import winston from 'winston';
import morgan from 'morgan';
import { Request, Response } from 'express';
import env from './env';

const { combine, timestamp, errors, json } = winston.format;

/**
 * Enterprise Winston Logger configured to output structured JSON logs with ISO timestamps.
 * Standardizes log format across production, staging, and development environments.
 */
const devFormat = combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message }) => {
    return `${level}: ${message}`;
  })
);

const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'sunbird-erp-backend' },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

/**
 * Morgan HTTP request logging middleware integrated with Winston.
 * Emits correlated JSON log entries with X-Request-ID and response times.
 */
export const morganMiddleware = morgan(
  (tokens, req: Request, res: Response) => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'http',
      message: `${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} - ${tokens['response-time'](req, res)} ms`,
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)) || 0,
      contentLength: tokens.res(req, res, 'content-length') || '0',
      responseTimeMs: Number(tokens['response-time'](req, res)) || 0,
      requestId: req.requestId || req.headers['x-request-id'] || res.getHeader('x-request-id') || null,
      remoteAddr: tokens['remote-addr'](req, res) || null,
      userAgent: tokens['user-agent'](req, res) || null,
    });
  },
  {
    stream: {
      write: (message: string) => {
        try {
          const { message: logMessage, ...meta } = JSON.parse(message);
          logger.http(logMessage, meta);
        } catch {
          logger.http(message.trim());
        }
      },
    },
  }
);

export default logger;
