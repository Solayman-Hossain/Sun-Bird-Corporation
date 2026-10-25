import http from 'http';
import app from '../app';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  MfaRequiredError,
  ForbiddenError,
  NotFoundError,
  DuplicateKeyError,
  IdempotencyConflictError,
  InsufficientStockError,
  BatchExpiredError,
  DoubleEntryImbalanceError,
  CreditLockedError,
  QuorumRequiredError,
  RateLimitExceededError,
} from './AppError';

async function runErrorVerificationTests() {
  console.log('=== STARTING ERROR HANDLING & EXCEPTION HIERARCHY TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Section 1: Verify all 13 custom exception subclasses have exact statusCodes and errorCodes
  console.log('--- 1. Exception Subclass Definitions & Status Codes ---');
  
  const valErr = new ValidationError([{ field: 'sku', issue: 'Required' }]);
  assert(valErr.statusCode === 400 && valErr.errorCode === 'VALIDATION_FAILED', 'ValidationError is 400 VALIDATION_FAILED');

  const unauthErr = new UnauthorizedError();
  assert(unauthErr.statusCode === 401 && unauthErr.errorCode === 'AUTH_UNAUTHORIZED', 'UnauthorizedError is 401 AUTH_UNAUTHORIZED');

  const mfaErr = new MfaRequiredError();
  assert(mfaErr.statusCode === 401 && mfaErr.errorCode === 'AUTH_MFA_REQUIRED', 'MfaRequiredError is 401 AUTH_MFA_REQUIRED');

  const forbErr = new ForbiddenError();
  assert(forbErr.statusCode === 403 && forbErr.errorCode === 'AUTH_FORBIDDEN', 'ForbiddenError is 403 AUTH_FORBIDDEN');

  const notFoundErr = new NotFoundError('Product', 'PROD-001');
  assert(notFoundErr.statusCode === 404 && notFoundErr.errorCode === 'RESOURCE_NOT_FOUND', 'NotFoundError is 404 RESOURCE_NOT_FOUND');

  const dupKeyErr = new DuplicateKeyError('email', 'admin@sunbird.com');
  assert(dupKeyErr.statusCode === 409 && dupKeyErr.errorCode === 'DUPLICATE_KEY_CONFLICT', 'DuplicateKeyError is 409 DUPLICATE_KEY_CONFLICT');

  const idempErr = new IdempotencyConflictError('key_123');
  assert(idempErr.statusCode === 409 && idempErr.errorCode === 'IDEMPOTENCY_CONFLICT', 'IdempotencyConflictError is 409 IDEMPOTENCY_CONFLICT');

  const stockErr = new InsufficientStockError('ECG Machine', 10, 3);
  assert(stockErr.statusCode === 422 && stockErr.errorCode === 'INSUFFICIENT_STOCK', 'InsufficientStockError is 422 INSUFFICIENT_STOCK');

  const batchErr = new BatchExpiredError('BATCH-2024-A', '2024-01-01');
  assert(batchErr.statusCode === 422 && batchErr.errorCode === 'BATCH_EXPIRED', 'BatchExpiredError is 422 BATCH_EXPIRED');

  const doubleEntryErr = new DoubleEntryImbalanceError(10000, 9500);
  assert(doubleEntryErr.statusCode === 422 && doubleEntryErr.errorCode === 'DOUBLE_ENTRY_IMBALANCE', 'DoubleEntryImbalanceError is 422 DOUBLE_ENTRY_IMBALANCE');

  const creditErr = new CreditLockedError('CUST-101', 500000, 650000);
  assert(creditErr.statusCode === 422 && creditErr.errorCode === 'CREDIT_LOCKED', 'CreditLockedError is 422 CREDIT_LOCKED');

  const quorumErr = new QuorumRequiredError(2, 2000000, 2);
  assert(quorumErr.statusCode === 422 && quorumErr.errorCode === 'QUORUM_REQUIRED', 'QuorumRequiredError is 422 QUORUM_REQUIRED');

  const rateErr = new RateLimitExceededError(60);
  assert(rateErr.statusCode === 429 && rateErr.errorCode === 'RATE_LIMIT_EXCEEDED', 'RateLimitExceededError is 429 RATE_LIMIT_EXCEEDED');

  // Section 2: DoubleEntryImbalanceError internal serialization & calculation details
  console.log('\n--- 2. DoubleEntryImbalanceError Details Calculation ---');
  const serializedDE = doubleEntryErr.serializeError();
  assert(serializedDE.code === 'DOUBLE_ENTRY_IMBALANCE', 'Serialized code is DOUBLE_ENTRY_IMBALANCE');
  assert(Array.isArray(serializedDE.details), 'Serialized details is an array');
  const debitEntry = serializedDE.details.find((d: any) => d.field === 'totalDebit');
  const creditEntry = serializedDE.details.find((d: any) => d.field === 'totalCredit');
  const varianceEntry = serializedDE.details.find((d: any) => d.field === 'varianceBDT');
  assert(debitEntry?.value === 10000, 'Debit is 10000');
  assert(creditEntry?.value === 9500, 'Credit is 9500');
  assert(varianceEntry?.value === 500, 'Variance is exactly 500 BDT');

  // Section 3: Live Express server integration test for DoubleEntryImbalanceError test route
  console.log('\n--- 3. Express Route Verification: DoubleEntryImbalanceError(10000, 9500) ---');
  const testServer = http.createServer(app);

  await new Promise<void>((resolve) => {
    testServer.listen(0, () => resolve());
  });

  const port = (testServer.address() as any).port;

  try {
    const responseData = await new Promise<{ status: number; body: any }>((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/v1/test-error/double-entry',
          method: 'GET',
          headers: { 'X-Request-ID': 'test-req-correlation-id-123' },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode || 0, body: JSON.parse(raw) });
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });

    assert(responseData.status === 422, `HTTP response status is 422 Unprocessable Entity (got ${responseData.status})`);
    assert(responseData.body.success === false, 'Envelope success is false');
    assert(responseData.body.statusCode === 422, 'Envelope statusCode is 422');
    assert(responseData.body.error?.code === 'DOUBLE_ENTRY_IMBALANCE', 'Envelope error code is DOUBLE_ENTRY_IMBALANCE');
    assert(responseData.body.requestId === 'test-req-correlation-id-123', 'Envelope preserves X-Request-ID');
    assert(typeof responseData.body.timestamp === 'string', 'Envelope includes ISO timestamp');
    assert(responseData.body.path === '/api/v1/test-error/double-entry', 'Envelope includes request path');

    const details = responseData.body.error?.details;
    assert(Array.isArray(details) && details.length === 3, 'Details contains totalDebit, totalCredit, and varianceBDT');

    // Section 4: 404 Route handled via NotFoundError into errorHandler
    console.log('\n--- 4. Express Route Verification: 404 Not Found Handling ---');
    const notFoundResponse = await new Promise<{ status: number; body: any }>((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/v1/non-existent-route',
          method: 'GET',
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode || 0, body: JSON.parse(raw) });
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.on('error', reject);
      req.end();
    });

    assert(notFoundResponse.status === 404, `404 route returns HTTP 404 (got ${notFoundResponse.status})`);
    assert(notFoundResponse.body.success === false, '404 envelope success is false');
    assert(notFoundResponse.body.error?.code === 'RESOURCE_NOT_FOUND', '404 envelope error code is RESOURCE_NOT_FOUND');

  } finally {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runErrorVerificationTests().catch((err) => {
  console.error('Error verification tests failed:', err);
  process.exit(1);
});
