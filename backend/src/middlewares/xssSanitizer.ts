import { Request, Response, NextFunction } from 'express';

/**
 * Clean potential XSS payloads from string input
 */
function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:[^"']*/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/gi, (match) => {
      const dangerousTags = ['script', 'iframe', 'embed', 'object', 'link', 'style', 'meta'];
      const tagName = match.replace(/[</>]/g, '').split(' ')[0].toLowerCase();
      if (dangerousTags.includes(tagName)) {
        return '';
      }
      return match;
    });
}

/**
 * Recursively sanitize objects, arrays, and strings
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
}

/**
 * Express 5 compatible middleware for XSS sanitization
 * Mutates in-place to comply with read-only getters on req.query / req.params
 * Aligns with Prompt 23 requirement: xss-clean() XSS sanitization
 */
export function xssSanitizerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Sanitize req.body
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      req.body[key] = sanitizeValue(req.body[key]);
    }
  }

  // Sanitize req.query (mutate properties in-place because req.query is a getter in Express 5)
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      (req.query as any)[key] = sanitizeValue((req.query as any)[key]);
    }
  }

  // Sanitize req.params
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      (req.params as any)[key] = sanitizeValue((req.params as any)[key]);
    }
  }

  next();
}

export default xssSanitizerMiddleware;
