import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import logger from '../config/logger';
import env from '../config/env';

/**
 * Centralized Express.js Error Handler Middleware.
 * Captures all domain exceptions, Mongoose validation errors, MongoDB duplicate keys,
 * and unhandled internal exceptions, formatting them into an RFC 7807-aligned JSON envelope.
 */
export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.requestId || (req.headers['x-request-id'] as string) || null;
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;

  // 1. Handle Known Domain Application Errors (AppError subclasses)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[${requestId || 'REQ'}] Domain Error ${err.statusCode} - ${err.errorCode}: ${err.message}`, {
        path,
        method: req.method,
        details: err.details,
      });
    } else {
      logger.warn(`[${requestId || 'REQ'}] Domain Error ${err.statusCode} - ${err.errorCode}: ${err.message}`, {
        path,
        method: req.method,
        details: err.details,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      error: err.serializeError(),
      requestId,
      timestamp,
      path,
    });
    return;
  }

  // 2. Handle Mongoose Validation Error (err.name === 'ValidationError')
  if (err?.name === 'ValidationError' && err?.errors) {
    const validationDetails = Object.values(err.errors).map((e: any) => ({
      field: e.path || e.name || 'field',
      issue: e.message || 'Validation error',
    }));

    logger.warn(`[${requestId || 'REQ'}] Mongoose Validation Error: ${err.message}`, {
      path,
      method: req.method,
      details: validationDetails,
    });

    res.status(400).json({
      success: false,
      statusCode: 400,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Mongoose schema validation failed',
        details: validationDetails,
      },
      requestId,
      timestamp,
      path,
    });
    return;
  }

  // 3. Handle MongoDB Duplicate Key (E11000)
  if (err?.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    const duplicateField = keys.length ? keys[0] : 'field';
    const duplicateValue = err.keyValue?.[duplicateField];

    logger.warn(`[${requestId || 'REQ'}] Duplicate Key Error: ${duplicateField} = ${duplicateValue}`, {
      path,
      method: req.method,
    });

    res.status(409).json({
      success: false,
      statusCode: 409,
      error: {
        code: 'DUPLICATE_KEY_CONFLICT',
        message: `Duplicate record conflict: '${duplicateField}' with value '${duplicateValue ?? ''}' already exists`,
        details: [{ field: duplicateField, value: duplicateValue }],
      },
      requestId,
      timestamp,
      path,
    });
    return;
  }

  // 4. Handle Unexpected 500 Server Errors
  logger.error(`[${requestId || 'REQ'}] Unhandled Exception: ${err.message || err}`, {
    stack: err.stack,
    path,
    method: req.method,
  });

  const isProd = env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    statusCode: 500,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProd
        ? 'An unexpected internal server error occurred. Please quote the requestId to support.'
        : (err.message || 'Internal Server Error'),
      ...(!isProd && err.stack ? { stack: err.stack } : {}),
    },
    requestId,
    timestamp,
    path,
  });
};

export default errorHandler;
