import { Request, Response, NextFunction, RequestHandler } from 'express';
import { IdempotencyKeyModel, IdempotencyResource } from '../models/IdempotencyKey';
import { IdempotencyConflictError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export interface IdempotencyOptions {
  required?: boolean;
  resource?: IdempotencyResource;
  ttlHours?: number;
}

/**
 * Derives the business resource type from the URL pathname.
 */
function resolveResource(path: string): IdempotencyResource {
  const normalized = path.toLowerCase();
  if (normalized.includes('order')) return 'ORDER';
  if (normalized.includes('payment') || normalized.includes('sslcommerz')) return 'PAYMENT';
  if (normalized.includes('payroll')) return 'PAYROLL';
  if (normalized.includes('loan')) return 'LOAN_REPAYMENT';
  return 'GENERAL';
}

/**
 * In-memory registry to track active in-flight locks in local dev / tests
 */
const inFlightMemoryLocks = new Set<string>();
const memoryResolvedSnapshots = new Map<string, { statusCode: number; body: any }>();

/**
 * Centralized Idempotency Guard Middleware.
 * Enforces atomic once-only execution on mutating HTTP methods (POST, PUT, PATCH).
 *
 * Behavior:
 * 1. Checks `X-Idempotency-Key` on mutating methods.
 * 2. If status is `RESOLVED`, returns cached status and response body directly with `X-Idempotent-Replay: true`.
 * 3. If status is `PROCESSING`, throws `IdempotencyConflictError` (HTTP 409).
 * 4. If new, acquires lock, executes route handler, intercepts `res.json()` / `res.send()`, and persists snapshot upon resolution.
 */
export function idempotency(options: IdempotencyOptions = {}): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only inspect mutating operations
    if (!['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
      return next();
    }

    const headerValue = req.headers['x-idempotency-key'] || req.headers['idempotency-key'];
    const key = typeof headerValue === 'string' ? headerValue.trim() : null;

    if (!key) {
      if (options.required) {
        return next(
          new ValidationError([
            {
              field: 'X-Idempotency-Key',
              issue: 'Mutating operations on this resource require a valid X-Idempotency-Key header',
            },
          ])
        );
      }
      return next();
    }

    const resource = options.resource || resolveResource(req.originalUrl || req.url);
    const ttlHours = options.ttlHours || 24;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    // Fast-path in-memory lock check for immediate concurrent collision detection
    if (inFlightMemoryLocks.has(key)) {
      logger.warn(`Idempotency in-flight memory collision detected for key: ${key}`);
      return next(new IdempotencyConflictError(key));
    }

    // Fast-path in-memory replay check
    if (memoryResolvedSnapshots.has(key)) {
      const cached = memoryResolvedSnapshots.get(key)!;
      logger.info(`Idempotency replay from memory cache for key: ${key}`);
      res.setHeader('X-Idempotent-Replay', 'true');
      res.setHeader('X-Idempotency-Key', key);
      res.status(cached.statusCode).json(cached.body);
      return;
    }

    // Acquire lock immediately for synchronous in-flight collision protection
    inFlightMemoryLocks.add(key);

    try {
      // 1. Query MongoDB for existing idempotency key
      const existing = await IdempotencyKeyModel.findOne({ key }).lean().exec();

      if (existing) {
        if (existing.status === 'RESOLVED') {
          inFlightMemoryLocks.delete(key);
          memoryResolvedSnapshots.set(key, {
            statusCode: existing.responseSnapshot?.statusCode || 200,
            body: existing.responseSnapshot?.body,
          });
          logger.info(`Idempotency replay from database snapshot for key: ${key}`);
          res.setHeader('X-Idempotent-Replay', 'true');
          res.setHeader('X-Idempotency-Key', key);
          const cachedStatus = existing.responseSnapshot?.statusCode || 200;
          const cachedBody = existing.responseSnapshot?.body;
          res.status(cachedStatus).json(cachedBody);
          return;
        }

        if (existing.status === 'PROCESSING') {
          logger.warn(`Idempotency conflict (processing) detected in database for key: ${key}`);
          return next(new IdempotencyConflictError(key));
        }

        // If previous attempt failed, allow atomic re-execution
        await IdempotencyKeyModel.updateOne(
          { key },
          { status: 'PROCESSING', expiresAt }
        ).exec();
      } else {
        // 2. Insert new record with status: 'PROCESSING'
        // Atomic uniqueness in MongoDB ensures that parallel racing requests collide here
        try {
          await IdempotencyKeyModel.create({
            key,
            resource,
            status: 'PROCESSING',
            expiresAt,
          });
        } catch (dbErr: any) {
          if (dbErr?.code === 11000) {
            logger.warn(`Idempotency race collision caught by E11000 unique index for key: ${key}`);
            return next(new IdempotencyConflictError(key));
          }
          throw dbErr;
        }
      }

      // 3. Intercept res.json & res.send to capture resolved snapshot
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      let captured = false;

      const persistSnapshot = async (statusCode: number, body: any) => {
        if (captured) return;
        captured = true;
        inFlightMemoryLocks.delete(key);

        const isSuccess = statusCode >= 200 && statusCode < 400;
        const newStatus = isSuccess ? 'RESOLVED' : 'FAILED';

        // Cache in memory
        if (isSuccess) {
          memoryResolvedSnapshots.set(key, { statusCode, body });
        }

        try {
          await IdempotencyKeyModel.updateOne(
            { key },
            {
              status: newStatus,
              responseSnapshot: {
                statusCode,
                body,
              },
            }
          ).exec();
        } catch (err: unknown) {
          logger.error(`Failed to update idempotency snapshot in MongoDB for key: ${key}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      };

      res.json = function (body: any) {
        persistSnapshot(res.statusCode, body);
        return originalJson(body);
      };

      res.send = function (body: any) {
        let parsed = body;
        if (typeof body === 'string') {
          try {
            parsed = JSON.parse(body);
          } catch {
            // Keep plain string
          }
        }
        persistSnapshot(res.statusCode, parsed);
        return originalSend(body);
      };

      next();
    } catch (err: unknown) {
      inFlightMemoryLocks.delete(key);
      next(err);
    }
  };
}

export default idempotency;
