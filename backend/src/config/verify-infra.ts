import mongoose, { ClientSession } from 'mongoose';
import {
  mongooseOptions,
  runInTransaction,
  isDatabaseConnected,
  connectDatabase,
  disconnectDatabase,
} from './database';
import {
  redisOptions,
  calculateBackoffDelay,
  get,
  set,
  del,
  exists,
  expire,
  ttl,
  acquireLock,
  releaseLock,
  withLock,
  isRedisConnected,
  connectRedis,
  disconnectRedis,
} from './redis';

async function runTests() {
  console.log('=== STARTING INFRASTRUCTURE VERIFICATION TESTS ===\n');
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

  // Test 1: Mongoose connection pooling options
  console.log('\n--- 1. Database Connection Pooling Configuration ---');
  assert(mongooseOptions.maxPoolSize === 50, 'maxPoolSize is set to 50');
  assert(mongooseOptions.minPoolSize === 10, 'minPoolSize is set to 10');
  assert(mongooseOptions.serverSelectionTimeoutMS === 5000, 'serverSelectionTimeoutMS is set to 5000ms');

  // Test 2: Mongoose event listeners
  console.log('\n--- 2. Database Connection Event Listeners ---');
  const listeners = mongoose.connection.eventNames();
  assert(listeners.includes('connected'), 'connected event listener registered');
  assert(listeners.includes('error'), 'error event listener registered');
  assert(listeners.includes('disconnected'), 'disconnected event listener registered');
  assert(listeners.includes('reconnected'), 'reconnected event listener registered');

  // Test 3: Redis retryStrategy and options
  console.log('\n--- 3. Redis Exponential Backoff & Options ---');
  assert(redisOptions.maxRetriesPerRequest === null, 'maxRetriesPerRequest is null (BullMQ compatible)');
  assert(typeof redisOptions.retryStrategy === 'function', 'retryStrategy exponential backoff is configured');
  
  const delay1 = calculateBackoffDelay(1);
  const delay2 = calculateBackoffDelay(2);
  const delay3 = calculateBackoffDelay(3);
  const delay10 = calculateBackoffDelay(10);
  assert(delay1 <= delay2 && delay2 <= delay3, `Exponential growth: delay1=${delay1}ms, delay2=${delay2}ms, delay3=${delay3}ms`);
  assert(delay10 <= 3000, `Delay capped at ceiling of 3000ms: delay10=${delay10}ms`);

  // Test 4: Redis Cache & Distributed Lock utilities type-checking and interface
  console.log('\n--- 4. Redis Helper Utilities Interface ---');
  assert(typeof get === 'function', 'redis.get utility exported');
  assert(typeof set === 'function', 'redis.set utility exported');
  assert(typeof del === 'function', 'redis.del utility exported');
  assert(typeof exists === 'function', 'redis.exists utility exported');
  assert(typeof expire === 'function', 'redis.expire utility exported');
  assert(typeof ttl === 'function', 'redis.ttl utility exported');
  assert(typeof acquireLock === 'function', 'acquireLock utility exported');
  assert(typeof releaseLock === 'function', 'releaseLock utility exported');
  assert(typeof withLock === 'function', 'withLock utility exported');

  // Test 5: runInTransaction logic with simulated TransientTransactionError
  console.log('\n--- 5. runInTransaction TransientTransactionError Retry Logic ---');
  let mockSessionEndCalls = 0;
  let mockSessionAbortCalls = 0;
  let mockSessionCommitCalls = 0;
  let workInvocationCount = 0;

  // Mock startSession to test retry loop deterministically without live cluster
  const originalStartSession = mongoose.startSession;
  try {
    (mongoose as any).startSession = async () => {
      let inTx = false;
      const mockSession = {
        startTransaction: () => { inTx = true; },
        commitTransaction: async () => { inTx = false; mockSessionCommitCalls++; },
        abortTransaction: async () => { inTx = false; mockSessionAbortCalls++; },
        endSession: async () => { inTx = false; mockSessionEndCalls++; },
        inTransaction: () => inTx,
      };
      return mockSession as unknown as ClientSession;
    };

    // Simulate TransientTransactionError on attempt 1, then success on attempt 2
    const transientError: any = new Error('Write conflict in multi-document transaction');
    transientError.errorLabels = ['TransientTransactionError'];
    transientError.hasErrorLabel = (l: string) => l === 'TransientTransactionError';

    const result = await runInTransaction(async (_session: ClientSession) => {
      workInvocationCount++;
      if (workInvocationCount === 1) {
        throw transientError;
      }
      return 'TRANSACTION_SUCCESS';
    }, { maxRetries: 3, retryDelayMs: 20 });

    assert(result === 'TRANSACTION_SUCCESS', 'Transaction succeeded after transient retry');
    assert(workInvocationCount === 2, 'Work function was retried exactly once after TransientTransactionError');
    assert(mockSessionAbortCalls === 1, 'First failed session was aborted');
    assert(mockSessionCommitCalls === 1, 'Second successful session was committed');
    assert(mockSessionEndCalls === 2, 'Both sessions were deterministically ended in finally');

    // Test 6: UnknownTransactionCommitResult retry logic
    console.log('\n--- 6. runInTransaction UnknownTransactionCommitResult Retry Logic ---');
    let commitAttempts = 0;
    (mongoose as any).startSession = async () => {
      let inTx = false;
      const mockSession = {
        startTransaction: () => { inTx = true; },
        commitTransaction: async () => {
          commitAttempts++;
          if (commitAttempts === 1) {
            const commitErr: any = new Error('Network timeout during commit');
            commitErr.errorLabels = ['UnknownTransactionCommitResult'];
            commitErr.hasErrorLabel = (l: string) => l === 'UnknownTransactionCommitResult';
            throw commitErr;
          }
          inTx = false;
        },
        abortTransaction: async () => { inTx = false; },
        endSession: async () => { inTx = false; },
        inTransaction: () => inTx,
      };
      return mockSession as unknown as ClientSession;
    };

    const commitResult = await runInTransaction(async (_session: ClientSession) => {
      return 'COMMIT_RETRY_SUCCESS';
    }, { maxRetries: 3 });

    assert(commitResult === 'COMMIT_RETRY_SUCCESS', 'Transaction succeeded after commit retry');
    assert(commitAttempts === 2, 'Commit was retried after UnknownTransactionCommitResult');

  } finally {
    mongoose.startSession = originalStartSession;
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
