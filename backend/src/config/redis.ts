import Redis, { Redis as RedisClient, RedisOptions } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import env from './env';
import logger from './logger';

/**
 * Enterprise ioredis configuration featuring exponential backoff reconnection,
 * cluster-aware failover reconnect, and BullMQ compatibility.
 */
export function calculateBackoffDelay(times: number): number {
  return Math.min(50 * Math.pow(2, Math.min(times, 6)), 3000);
}

export const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null, // Critical requirement for BullMQ queues and reliable background jobs
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times: number) {
    if (env.NODE_ENV === 'development' && hasLoggedOfflineWarning) {
      return null; // Stop reconnecting immediately in dev mode once offline notice is issued
    }
    const delay = calculateBackoffDelay(times);
    if (env.NODE_ENV !== 'development') {
      logger.warn(`Redis connection disconnected. Reconnecting attempt #${times} in ${delay}ms...`);
    }
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET'];
    if (targetErrors.some((target) => err.message.includes(target))) {
      logger.warn(`Redis reconnectOnError triggered for error: ${err.message}`);
      return true;
    }
    return false;
  },
};

/**
 * Singleton ioredis client instance.
 */
export const redis: RedisClient = new Redis(env.REDIS_URL, redisOptions);

let hasLoggedOfflineWarning = false;

// Bind lifecycle event listeners to ioredis client
redis.on('connect', () => {
  hasLoggedOfflineWarning = false;
  logger.info('Redis socket connection initiated');
});

redis.on('ready', () => {
  hasLoggedOfflineWarning = false;
  const sanitizedUrl = env.REDIS_URL.replace(/:[^:@]+@/, ':***@');
  logger.info('Redis client connected and ready to process commands', {
    endpoint: sanitizedUrl,
    status: redis.status,
  });
});

redis.on('error', (err: Error) => {
  if (env.NODE_ENV === 'development') {
    if (!hasLoggedOfflineWarning) {
      hasLoggedOfflineWarning = true;
      logger.warn(
        `Redis is offline at ${env.REDIS_URL}. Running with local in-memory fallback cache & locks.`,
        { hint: 'To connect live Redis, launch a Redis instance on port 6379 or update REDIS_URL in backend/.env' }
      );
    }
    return;
  }

  logger.error('Redis client error encountered', {
    error: err.message,
    stack: err.stack,
  });
});

redis.on('close', () => {
  if (env.NODE_ENV !== 'development' || !hasLoggedOfflineWarning) {
    logger.warn('Redis socket connection closed');
  }
});

redis.on('reconnecting', (delay: number) => {
  if (env.NODE_ENV !== 'development') {
    logger.info(`Redis client reconnecting in ${delay}ms...`);
  }
});

redis.on('end', () => {
  if (env.NODE_ENV !== 'development') {
    logger.info('Redis client connection terminated');
  }
});

/**
 * In-memory fallback cache and distributed lock store for local development
 * when Redis is not running locally.
 */
interface MemoryCacheItem {
  value: string;
  expiresAt: number | null;
}
const memoryCache = new Map<string, MemoryCacheItem>();
const memoryLocks = new Map<string, { token: string; expiresAt: number }>();

function cleanExpiredMemoryKeys(): void {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiresAt !== null && item.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
  for (const [key, lock] of memoryLocks.entries()) {
    if (lock.expiresAt <= now) {
      memoryLocks.delete(key);
    }
  }
}

/**
 * Explicitly connects to Redis server if not already connected.
 */
export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready' || redis.status === 'connect') {
    logger.debug('Redis client already connected or connecting', { status: redis.status });
    return;
  }

  try {
    await redis.connect();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Redis is already connecting/connected')) {
      return;
    }
    if (env.NODE_ENV === 'development') {
      // In dev mode, gracefully suppress and activate in-memory fallback
      return;
    }
    throw err;
  }
}

/**
 * Closes the active Redis connection cleanly for graceful shutdown.
 */
export async function disconnectRedis(): Promise<void> {
  if (redis.status === 'end') {
    return;
  }

  try {
    await redis.quit();
    logger.info('Redis connection closed successfully via quit()');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (env.NODE_ENV !== 'development') {
      logger.warn('Redis quit() failed, falling back to disconnect()', { error: message });
    }
    redis.disconnect();
  }
}

/**
 * Checks whether Redis is currently connected and ready.
 */
export function isRedisConnected(): boolean {
  return redis.status === 'ready';
}

/* ==========================================================================
 * Helper Utilities: Key/Value Get/Set with TTL
 * ========================================================================== */

/**
 * Retrieves a key and automatically deserializes JSON values if applicable.
 */
export async function get<T = unknown>(key: string): Promise<T | null> {
  if (isRedisConnected()) {
    const rawValue = await redis.get(key);
    if (rawValue === null) return null;
    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return rawValue as unknown as T;
    }
  }

  // In-memory fallback
  cleanExpiredMemoryKeys();
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiresAt !== null && item.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  try {
    return JSON.parse(item.value) as T;
  } catch {
    return item.value as unknown as T;
  }
}

/**
 * Sets a key with an optional TTL in seconds.
 * Automatically serializes non-string objects to JSON.
 */
export async function set(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<'OK' | null> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);

  if (isRedisConnected()) {
    if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
      return await redis.set(key, serialized, 'EX', ttlSeconds);
    }
    return await redis.set(key, serialized);
  }

  // In-memory fallback
  const expiresAt = typeof ttlSeconds === 'number' && ttlSeconds > 0
    ? Date.now() + ttlSeconds * 1000
    : null;
  memoryCache.set(key, { value: serialized, expiresAt });
  return 'OK';
}

/**
 * Deletes one or more keys from Redis.
 */
export async function del(keys: string | string[]): Promise<number> {
  const keyList = Array.isArray(keys) ? keys : [keys];
  if (keyList.length === 0) return 0;

  if (isRedisConnected()) {
    return await redis.del(...keyList);
  }

  // In-memory fallback
  let count = 0;
  for (const k of keyList) {
    if (memoryCache.delete(k)) count++;
  }
  return count;
}

/**
 * Checks whether a key exists in Redis.
 */
export async function exists(key: string): Promise<boolean> {
  if (isRedisConnected()) {
    const count = await redis.exists(key);
    return count > 0;
  }

  cleanExpiredMemoryKeys();
  return memoryCache.has(key);
}

/**
 * Sets an expiration TTL in seconds on a key.
 */
export async function expire(key: string, ttlSeconds: number): Promise<boolean> {
  if (isRedisConnected()) {
    const result = await redis.expire(key, ttlSeconds);
    return result === 1;
  }

  const item = memoryCache.get(key);
  if (!item) return false;
  item.expiresAt = Date.now() + ttlSeconds * 1000;
  return true;
}

/**
 * Returns the remaining time to live (TTL) in seconds for a key.
 * -1 if key exists without TTL, -2 if key does not exist.
 */
export async function ttl(key: string): Promise<number> {
  if (isRedisConnected()) {
    return await redis.ttl(key);
  }

  const item = memoryCache.get(key);
  if (!item) return -2;
  if (item.expiresAt === null) return -1;
  const remaining = Math.round((item.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : -2;
}

/**
 * Batch retrieves multiple keys and parses them.
 */
export async function mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];

  if (isRedisConnected()) {
    const rawValues = await redis.mget(...keys);
    return rawValues.map((val) => {
      if (val === null) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    });
  }

  // In-memory fallback
  return keys.map((key) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expiresAt !== null && item.expiresAt <= Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.value) as T;
    } catch {
      return item.value as unknown as T;
    }
  });
}

/**
 * Scans and deletes all keys matching a given glob pattern (e.g. "cache:*").
 */
export async function flushPattern(pattern: string): Promise<number> {
  if (isRedisConnected()) {
    let cursor = '0';
    let totalDeleted = 0;

    do {
      const [nextCursor, matchingKeys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;

      if (matchingKeys.length > 0) {
        const deleted = await redis.del(...matchingKeys);
        totalDeleted += deleted;
      }
    } while (cursor !== '0');

    return totalDeleted;
  }

  // In-memory regex matching
  const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  let deletedCount = 0;
  for (const key of memoryCache.keys()) {
    if (regexPattern.test(key)) {
      memoryCache.delete(key);
      deletedCount++;
    }
  }
  return deletedCount;
}

/* ==========================================================================
 * Distributed Lock Utilities (Atomic SET NX PX + Lua Script Release)
 * ========================================================================== */

const RELEASE_LOCK_LUA_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

const EXTEND_LOCK_LUA_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("pexpire", KEYS[1], ARGV[2])
else
  return 0
end
`;

export interface LockOptions {
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Acquires a distributed lock using atomic Redis SET NX PX.
 */
export async function acquireLock(
  lockKey: string,
  ttlMs: number = 10000,
  options: LockOptions = {}
): Promise<string | null> {
  const retryAttempts = options.retryAttempts ?? 10;
  const retryDelayMs = options.retryDelayMs ?? 150;
  const lockToken = uuidv4();

  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    if (isRedisConnected()) {
      const acquired = await redis.set(lockKey, lockToken, 'PX', ttlMs, 'NX');
      if (acquired === 'OK') {
        return lockToken;
      }
    } else {
      // In-memory fallback lock
      cleanExpiredMemoryKeys();
      const existing = memoryLocks.get(lockKey);
      if (!existing || existing.expiresAt <= Date.now()) {
        memoryLocks.set(lockKey, { token: lockToken, expiresAt: Date.now() + ttlMs });
        return lockToken;
      }
    }

    if (attempt < retryAttempts) {
      const jitter = Math.floor(Math.random() * (retryDelayMs * 0.4));
      const sleepTime = retryDelayMs + jitter;
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }
  }

  logger.warn('Failed to acquire distributed lock within timeout', {
    lockKey,
    attempts: retryAttempts + 1,
    ttlMs,
  });

  return null;
}

/**
 * Safely releases a distributed lock using an atomic Lua script.
 */
export async function releaseLock(lockKey: string, lockToken: string): Promise<boolean> {
  if (isRedisConnected()) {
    try {
      const result = await redis.eval(RELEASE_LOCK_LUA_SCRIPT, 1, lockKey, lockToken);
      return result === 1;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Error releasing distributed lock', { lockKey, error: message });
      return false;
    }
  }

  // In-memory fallback
  const lock = memoryLocks.get(lockKey);
  if (lock && lock.token === lockToken) {
    memoryLocks.delete(lockKey);
    return true;
  }
  return false;
}

/**
 * Extends the TTL of an active lock if the current caller holds it.
 */
export async function extendLock(
  lockKey: string,
  lockToken: string,
  ttlMs: number
): Promise<boolean> {
  if (isRedisConnected()) {
    try {
      const result = await redis.eval(
        EXTEND_LOCK_LUA_SCRIPT,
        1,
        lockKey,
        lockToken,
        ttlMs.toString()
      );
      return result === 1;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Error extending distributed lock', { lockKey, error: message });
      return false;
    }
  }

  // In-memory fallback
  const lock = memoryLocks.get(lockKey);
  if (lock && lock.token === lockToken) {
    lock.expiresAt = Date.now() + ttlMs;
    return true;
  }
  return false;
}

/**
 * Executes an async task while holding a distributed lock on the specified resource.
 */
export async function withLock<T>(
  lockKey: string,
  ttlMs: number,
  task: (lockToken: string) => Promise<T>,
  options: LockOptions = {}
): Promise<T> {
  const lockToken = await acquireLock(lockKey, ttlMs, options);

  if (!lockToken) {
    throw new Error(`Failed to acquire distributed lock for resource: ${lockKey}`);
  }

  try {
    return await task(lockToken);
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

export default {
  redis,
  connectRedis,
  disconnectRedis,
  isRedisConnected,
  get,
  set,
  del,
  exists,
  expire,
  ttl,
  mget,
  flushPattern,
  acquireLock,
  releaseLock,
  extendLock,
  withLock,
};
