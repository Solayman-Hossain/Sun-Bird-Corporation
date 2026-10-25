import mongoose, { ClientSession, ConnectOptions } from 'mongoose';
import env from './env';
import logger from './logger';

/**
 * Mongoose connection options configured for enterprise resilience and connection pooling.
 * Conforms to architectural requirements: maxPoolSize: 50, minPoolSize: 10, serverSelectionTimeoutMS: 5000.
 */
export const mongooseOptions: ConnectOptions = {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  autoIndex: env.NODE_ENV !== 'production',
};

// Bind lifecycle event listeners to Mongoose connection
mongoose.connection.on('connected', () => {
  logger.info('MongoDB Atlas connection established successfully', {
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    readyState: mongoose.connection.readyState,
  });
});

mongoose.connection.on('error', (error: Error) => {
  logger.error('MongoDB connection error encountered', {
    error: error.message,
    stack: error.stack,
  });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB connection re-established successfully');
});

mongoose.connection.on('close', () => {
  logger.info('MongoDB connection closed cleanly');
});

/**
 * Initializes and establishes the connection to MongoDB Atlas.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    logger.debug('MongoDB already connected');
    return mongoose;
  }

  logger.info('Connecting to MongoDB Atlas with connection pooling...', {
    maxPoolSize: mongooseOptions.maxPoolSize,
    minPoolSize: mongooseOptions.minPoolSize,
    serverSelectionTimeoutMS: mongooseOptions.serverSelectionTimeoutMS,
  });

  return await mongoose.connect(env.MONGODB_URI, mongooseOptions);
}

/**
 * Closes the active MongoDB connection cleanly for graceful shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    logger.info('Closing MongoDB connection...');
    await mongoose.disconnect();
    logger.info('MongoDB connection closed successfully');
  }
}

/**
 * Checks whether the MongoDB connection is currently active and healthy.
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Helper to inspect whether an error contains a specific MongoDB error label.
 */
function hasErrorLabel(error: unknown, label: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { hasErrorLabel?: (l: string) => boolean; errorLabels?: string[] };
  if (typeof err.hasErrorLabel === 'function') {
    return err.hasErrorLabel(label);
  }
  if (Array.isArray(err.errorLabels)) {
    return err.errorLabels.includes(label);
  }
  return false;
}

/**
 * Internal helper to commit a transaction with automatic retry on UnknownTransactionCommitResult.
 */
async function commitWithRetry(session: ClientSession, maxCommitRetries: number = 3): Promise<void> {
  let commitAttempt = 0;
  while (commitAttempt < maxCommitRetries) {
    try {
      await session.commitTransaction();
      return;
    } catch (error: unknown) {
      commitAttempt++;
      if (hasErrorLabel(error, 'UnknownTransactionCommitResult') && commitAttempt < maxCommitRetries) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(
          `UnknownTransactionCommitResult encountered on commit. Retrying commit (attempt ${commitAttempt}/${maxCommitRetries})...`,
          { error: message }
        );
        continue;
      }
      throw error;
    }
  }
}

export interface TransactionOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Atomic multi-document transaction helper.
 * 
 * Executes arbitrary work inside a MongoDB ClientSession transaction with:
 * 1. Read concern 'snapshot' and write concern 'majority'.
 * 2. Automatic retry logic for TransientTransactionError (aborts and restarts full transaction).
 * 3. Automatic retry logic for UnknownTransactionCommitResult (retries commit phase).
 * 4. Deterministic session cleanup in finally block.
 *
 * @param work Function to execute inside the transaction session
 * @param options Optional retry parameters
 */
export async function runInTransaction<T>(
  work: (session: ClientSession) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.retryDelayMs ?? 100;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    const session = await mongoose.startSession();

    try {
      session.startTransaction({
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });

      const result = await work(session);

      // Attempt to commit with retry logic for UnknownTransactionCommitResult
      await commitWithRetry(session);

      return result;
    } catch (error: unknown) {
      // Abort active transaction before retry or bubbling
      if (session.inTransaction()) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          logger.warn('Failed to abort transaction cleanly', {
            error: abortError instanceof Error ? abortError.message : abortError,
          });
        }
      }

      // Check for TransientTransactionError
      if (hasErrorLabel(error, 'TransientTransactionError') && attempt < maxRetries) {
        const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), 2000);
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(
          `TransientTransactionError detected during transaction. Retrying (attempt ${attempt}/${maxRetries}) in ${delay}ms...`,
          { error: message }
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  throw new Error(`Transaction failed after exceeding maximum retry attempts (${maxRetries}).`);
}

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  runInTransaction,
  mongooseOptions,
};
