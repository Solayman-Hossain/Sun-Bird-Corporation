/**
 * Abstract base class for all domain-specific application exceptions.
 * Aligns with RFC 7807 (Problem Details for HTTP APIs) and enterprise architecture standards.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;

  constructor(message: string, public readonly details?: any) {
    super(message);
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializes the error into a standardized JSON structure.
   */
  abstract serializeError(): {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 400 Bad Request - Input validation failure (Zod, Joi, or custom business input rules).
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_FAILED';

  constructor(
    public readonly validationDetails: Array<{ field: string; issue: string }> | string,
    details?: any
  ) {
    super(
      typeof validationDetails === 'string' ? validationDetails : 'Input validation failed',
      typeof validationDetails === 'string' ? details : validationDetails
    );
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication token.
 */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'AUTH_UNAUTHORIZED';

  constructor(message: string = 'Authentication required to access this resource', details?: any) {
    super(message, details);
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 401 Unauthorized - Two-factor TOTP MFA challenge required.
 */
export class MfaRequiredError extends AppError {
  readonly statusCode = 401;
  readonly errorCode = 'AUTH_MFA_REQUIRED';

  constructor(message: string = 'Two-factor TOTP authentication code required in X-TOTP-Code header', details?: any) {
    super(message, details);
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 403 Forbidden - Authenticated user lacks necessary RBAC permissions or scope.
 */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly errorCode = 'AUTH_FORBIDDEN';

  constructor(message: string = 'Access denied: insufficient RBAC permissions', details?: any) {
    super(message, details);
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 404 Not Found - Requested resource was not found.
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'RESOURCE_NOT_FOUND';

  constructor(resource: string = 'Resource', identifier?: string | number) {
    const msg = identifier !== undefined
      ? `Resource '${resource}' with identifier '${identifier}' was not found`
      : `Resource '${resource}' was not found`;
    super(msg, identifier !== undefined ? { resource, identifier } : { resource });
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 409 Conflict - Duplicate unique key constraint collision (e.g., E11000).
 */
export class DuplicateKeyError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'DUPLICATE_KEY_CONFLICT';

  constructor(field: string = 'field', value?: any) {
    super(`Duplicate record conflict: '${field}' with value '${value ?? ''}' already exists`, [
      { field, value },
    ]);
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * 409 Conflict - Concurrent or conflicting mutation with identical Idempotency-Key.
 */
export class IdempotencyConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'IDEMPOTENCY_CONFLICT';

  constructor(
    key: string,
    message: string = 'A request with this Idempotency-Key is currently processing or already executed with different payload'
  ) {
    super(message, { idempotencyKey: key });
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * 422 Unprocessable Entity - Inventory allocation cannot be fulfilled due to shortage.
 */
export class InsufficientStockError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'INSUFFICIENT_STOCK';

  constructor(
    public readonly productName: string,
    public readonly requestedQty: number,
    public readonly availableQty: number
  ) {
    super(
      `Insufficient stock for product '${productName}': requested ${requestedQty}, but only ${availableQty} available`,
      { product: productName, requestedQty, availableQty }
    );
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * 422 Unprocessable Entity - Pharmaceutical/medical batch has expired past FEFO policy.
 */
export class BatchExpiredError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'BATCH_EXPIRED';

  constructor(batchNumber: string, expiryDate: string | Date) {
    const formattedDate = expiryDate instanceof Date ? expiryDate.toISOString().split('T')[0] : String(expiryDate);
    super(
      `Batch '${batchNumber}' has expired on ${formattedDate} and cannot be dispensed`,
      { batchNumber, expiryDate: formattedDate }
    );
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * 422 Unprocessable Entity - Double-entry accounting voucher balance assertion failure.
 * Total Debits must strictly equal Total Credits.
 */
export class DoubleEntryImbalanceError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'DOUBLE_ENTRY_IMBALANCE';

  constructor(public readonly totalDebit: number, public readonly totalCredit: number) {
    const variance = Math.abs(totalDebit - totalCredit);
    super(
      `Double-entry unbalanced: totalDebit (${totalDebit.toFixed(2)}) != totalCredit (${totalCredit.toFixed(2)}). Variance: ${variance.toFixed(2)} BDT`,
      [
        { field: 'totalDebit', value: totalDebit },
        { field: 'totalCredit', value: totalCredit },
        { field: 'varianceBDT', value: variance },
      ]
    );
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      details: [
        { field: 'totalDebit', value: this.totalDebit },
        { field: 'totalCredit', value: this.totalCredit },
        { field: 'varianceBDT', value: Math.abs(this.totalDebit - this.totalCredit) },
      ],
    };
  }
}

/**
 * 422 Unprocessable Entity - B2B customer total exposure exceeds approved credit limit.
 */
export class CreditLockedError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'CREDIT_LOCKED';

  constructor(
    public readonly customerId: string,
    public readonly creditLimit: number,
    public readonly totalExposure: number,
    customMessage?: string,
    customDetails?: any
  ) {
    super(
      customMessage ||
        `Dispatch blocked: Customer credit exposure (${totalExposure.toFixed(2)} BDT) exceeds approved limit (${creditLimit.toFixed(2)} BDT)`,
      customDetails || [
        { field: 'customerId', value: customerId },
        { field: 'creditLimitBDT', value: creditLimit },
        { field: 'currentExposureBDT', value: totalExposure },
      ]
    );
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      details: [
        { field: 'customerId', value: this.customerId },
        { field: 'creditLimitBDT', value: this.creditLimit },
        { field: 'currentExposureBDT', value: this.totalExposure },
      ],
    };
  }
}

/**
 * 422 Unprocessable Entity - Multi-Director cryptographic sign-off required for high-value transactions.
 */
export class QuorumRequiredError extends AppError {
  readonly statusCode = 422;
  readonly errorCode = 'QUORUM_REQUIRED';

  constructor(
    public readonly tier: number,
    public readonly grandTotal: number,
    public readonly requiredDirectors: number
  ) {
    super(
      `Quorum Approval required: Document grand total (${grandTotal.toFixed(2)} BDT) falls under Tier ${tier} policy requiring ${requiredDirectors} Director signatures`,
      [
        { field: 'quorumTier', value: tier },
        { field: 'requiredDirectorsCount', value: requiredDirectors },
        { field: 'grandTotalBDT', value: grandTotal },
      ]
    );
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      details: [
        { field: 'quorumTier', value: this.tier },
        { field: 'requiredDirectorsCount', value: this.requiredDirectors },
        { field: 'grandTotalBDT', value: this.grandTotal },
      ],
    };
  }
}

/**
 * 429 Too Many Requests - Rate limiting ceiling reached.
 */
export class RateLimitExceededError extends AppError {
  readonly statusCode = 429;
  readonly errorCode = 'RATE_LIMIT_EXCEEDED';

  constructor(
    retryAfterSeconds: number = 60,
    message: string = 'Too many requests, please try again later'
  ) {
    super(message, { retryAfterSeconds });
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * 502 Bad Gateway - External partner API failure (Pathao, Steadfast, SSLCOMMERZ, etc.).
 * Aligns with api-spec.md §1.5.
 */
export class GatewayError extends AppError {
  readonly statusCode = 502;
  readonly errorCode = 'GATEWAY_ERROR';

  constructor(
    public readonly gatewayName: string,
    message: string = `External ${gatewayName} gateway failure`,
    details?: any
  ) {
    super(`External gateway error [${gatewayName}]: ${message}`, details);
  }

  serializeError() {
    return {
      code: this.errorCode,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}
