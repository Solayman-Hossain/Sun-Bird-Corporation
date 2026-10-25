import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware that attaches a unique X-Request-ID (UUID v4) to each incoming request
 * and propagates it to the response headers for end-to-end distributed tracing.
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim().length > 0)
    ? incomingId.trim()
    : uuidv4();

  req.requestId = requestId;
  req.id = requestId;

  res.setHeader('X-Request-ID', requestId);

  next();
};

export default requestIdMiddleware;
