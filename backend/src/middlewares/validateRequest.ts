import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Generic request validation middleware accepting Zod schemas for body, query, and params.
 * On validation failure, extracts field and issue for each fault, formatting into RFC 7807 ValidationError.
 *
 * @param schemas Object containing optional Zod schemas for body, query, and/or params
 */
export function validateRequest(schemas: RequestValidationSchemas): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as any;
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as any;
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const validationDetails = error.issues.map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
          return {
            field: path,
            issue: issue.message,
          };
        });

        return next(new ValidationError(validationDetails));
      }
      next(error);
    }
  };
}

export default validateRequest;
