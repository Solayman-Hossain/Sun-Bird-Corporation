import http from 'http';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { IdempotencyKeySchema } from '../models/IdempotencyKey';

async function runValidationAndIdempotencyTests() {
  console.log('=== STARTING VALIDATION & IDEMPOTENCY GUARD VERIFICATION TESTS ===\n');
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

  // Section 1: Verify IdempotencyKey Schema Indexes (Database-Schema.md §7.7)
  console.log('--- 1. IdempotencyKey Schema & Index Configuration ---');
  const indexes = IdempotencyKeySchema.indexes();
  
  const keyIndex = indexes.find((idx: any) => idx[0]?.key === 1 && idx[1]?.unique === true);
  assert(Boolean(keyIndex), 'Unique index on key: 1 exists');

  const ttlIndex = indexes.find((idx: any) => idx[0]?.expiresAt === 1 && idx[1]?.expireAfterSeconds === 0);
  assert(Boolean(ttlIndex), 'TTL index on expiresAt: 1 with expireAfterSeconds: 0 exists');

  // Start internal test HTTP server
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, () => resolve()));
  const port = (testServer.address() as any).port;

  // Helper for HTTP requests
  function makeRequest(
    path: string,
    method: string,
    headers: Record<string, string>,
    payload?: any
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
    return new Promise((resolve, reject) => {
      const dataStr = payload ? JSON.stringify(payload) : undefined;
      const reqHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };
      if (dataStr) {
        reqHeaders['Content-Length'] = Buffer.byteLength(dataStr).toString();
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: reqHeaders,
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode || 0,
                headers: res.headers,
                body: raw ? JSON.parse(raw) : null,
              });
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.on('error', reject);
      if (dataStr) req.write(dataStr);
      req.end();
    });
  }

  try {
    // Connect to database for full end-to-end integration
    await connectDatabase().catch(() => {});

    // Section 2: Zod Schema Validation Middleware Tests
    console.log('\n--- 2. Zod Schema Validation Middleware (validateRequest) ---');
    
    // Test 2.1: Valid payload
    const validRes = await makeRequest(
      '/api/v1/test-error/validate-sample',
      'POST',
      {},
      { itemName: 'Medical Diagnostic Ultrasound', unitPrice: 450000 }
    );
    assert(validRes.status === 200, 'Valid payload returns HTTP 200');
    assert(validRes.body?.success === true, 'Valid payload returns success: true');

    // Test 2.2: Invalid payload failing Zod constraints
    const invalidRes = await makeRequest(
      '/api/v1/test-error/validate-sample',
      'POST',
      {},
      { itemName: 'EC', unitPrice: -100 }
    );
    assert(invalidRes.status === 400, 'Invalid payload returns HTTP 400 (Bad Request)');
    assert(invalidRes.body?.success === false, 'Invalid payload returns success: false');
    assert(invalidRes.body?.error?.code === 'VALIDATION_FAILED', 'Error code is VALIDATION_FAILED');
    assert(Array.isArray(invalidRes.body?.error?.details), 'Error details is an array of field faults');

    const itemIssue = invalidRes.body?.error?.details?.find((d: any) => d.field === 'itemName');
    const priceIssue = invalidRes.body?.error?.details?.find((d: any) => d.field === 'unitPrice');
    assert(Boolean(itemIssue), 'Details includes fault on itemName');
    assert(Boolean(priceIssue), 'Details includes fault on unitPrice');

    // Section 3: Concurrent In-Flight Idempotency Conflict Verification
    console.log('\n--- 3. Concurrent In-Flight Idempotency Conflict (HTTP 409) ---');
    const sharedIdempotencyKey = 'idem-concurrent-' + Date.now() + '-' + Math.random().toString(36).slice(2);

    // Launch two requests concurrently with the same idempotency key
    const [req1Promise, req2Promise] = [
      makeRequest(
        '/api/v1/test-error/idempotent-order',
        'POST',
        { 'X-Idempotency-Key': sharedIdempotencyKey },
        { sku: 'SONO-SCAN-2026', grandTotal: 250000 }
      ),
      makeRequest(
        '/api/v1/test-error/idempotent-order',
        'POST',
        { 'X-Idempotency-Key': sharedIdempotencyKey },
        { sku: 'SONO-SCAN-2026', grandTotal: 250000 }
      ),
    ];

    const [res1, res2] = await Promise.all([req1Promise, req2Promise]);

    const statuses = [res1.status, res2.status].sort();
    assert(
      statuses[0] === 201 && statuses[1] === 409,
      `Concurrent requests result in exactly one 201 Created and one 409 Conflict (got ${res1.status} and ${res2.status})`
    );

    const conflictRes = res1.status === 409 ? res1 : res2;
    const successRes = res1.status === 201 ? res1 : res2;

    assert(conflictRes.body?.success === false, 'Conflict response has success: false');
    assert(conflictRes.body?.error?.code === 'IDEMPOTENCY_CONFLICT', 'Conflict error code is IDEMPOTENCY_CONFLICT');
    assert(successRes.body?.success === true, 'Primary request has success: true');
    assert(successRes.body?.message === 'Order created successfully', 'Primary request processed successfully');

    // Section 4: Resolved Idempotency Key Replay Verification
    console.log('\n--- 4. Resolved Idempotency Snapshot Replay Verification ---');
    // Ensure primary request fully finalized
    await new Promise((resolve) => setTimeout(resolve, 50));

    const replayRes = await makeRequest(
      '/api/v1/test-error/idempotent-order',
      'POST',
      { 'X-Idempotency-Key': sharedIdempotencyKey },
      { sku: 'SONO-SCAN-2026', grandTotal: 250000 }
    );

    assert(replayRes.status === 201, 'Replay request returns original status HTTP 201');
    assert(replayRes.headers['x-idempotent-replay'] === 'true', 'Replay header X-Idempotent-Replay is true');
    assert(replayRes.body?.orderId === successRes.body?.orderId, 'Replay response returns identical cached orderId');

  } finally {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
    await disconnectDatabase().catch(() => {});
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runValidationAndIdempotencyTests().catch((err) => {
  console.error('Validation & Idempotency verification failed:', err);
  process.exit(1);
});
