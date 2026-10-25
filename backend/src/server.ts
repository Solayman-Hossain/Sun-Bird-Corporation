import http from 'http';
import app from './app';
import env from './config/env';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';

let server: http.Server;
let isShuttingDown = false;

/**
 * Initiates graceful shutdown sequence closing HTTP server, MongoDB, and Redis.
 */
export async function handleGracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress. Ignoring duplicate signal: ${signal}`);
    return;
  }
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Force shutdown timer if graceful teardown stalls (10s threshold)
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10 seconds. Forcing process exit.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    // 1. Stop receiving new HTTP requests
    if (server) {
      await new Promise<void>((resolve) => {
        server.close((err) => {
          if (err) {
            logger.error('Error encountered while closing HTTP server', { error: err.message });
          } else {
            logger.info('HTTP server closed cleanly, stopping inbound traffic');
          }
          resolve();
        });
      });
    }

    // 2. Disconnect from MongoDB Atlas
    await disconnectDatabase().catch((err) => {
      logger.warn('Error disconnecting from database during shutdown', { error: err?.message });
    });

    // 3. Disconnect from Redis Cache
    await disconnectRedis().catch((err) => {
      logger.warn('Error disconnecting from Redis during shutdown', { error: err?.message });
    });

    logger.info('All infrastructure connections closed cleanly. Process exiting successfully.');
    process.exit(0);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error encountered during graceful shutdown sequence', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

/**
 * Application Bootstrap Sequence.
 */
async function startServer(): Promise<void> {
  try {
    logger.info('Initializing Sun Bird Corporation ERP infrastructure...');

    // Initialize MongoDB Atlas connection with dev-resilient fallback
    try {
      if (env.MONGODB_URI.includes('<db_password>')) {
        logger.warn(
          '⚠️ Notice: MONGODB_URI contains "<db_password>" placeholder. Please enter your MongoDB Atlas password in backend/.env',
          { uriPattern: env.MONGODB_URI.replace(/:[^:@]+@/, ':***@') }
        );
      } else {
        await connectDatabase();
      }
    } catch (dbError: unknown) {
      const err = dbError as Error;
      if (env.NODE_ENV === 'production') {
        throw dbError;
      }
      logger.error('Failed to establish MongoDB Atlas connection during development bootstrap', {
        error: err.message,
        hint: 'Check your database password in backend/.env and ensure your IP is whitelisted on MongoDB Atlas Network Access.',
      });
    }

    // Initialize Redis cache connection with dev-resilient fallback
    try {
      await connectRedis();
    } catch (redisError: unknown) {
      const err = redisError as Error;
      if (env.NODE_ENV === 'production') {
        throw redisError;
      }
      logger.warn('Redis is not currently reachable during development bootstrap. Continuing in degraded mode.', {
        error: err.message,
        hint: 'Ensure Redis server is running locally on port 6379 or update REDIS_URL in backend/.env',
      });
    }

    // Start HTTP listener
    server = app.listen(env.PORT, () => {
      logger.info('Sun Bird Corporation ERP backend initialized successfully', {
        port: env.PORT,
        environment: env.NODE_ENV,
        url: `http://localhost:${env.PORT}`,
        healthCheck: `http://localhost:${env.PORT}/api/v1/health`,
      });
    });

    // Listen to termination signals for graceful shutdown
    process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Fatal error occurred during server bootstrap', {
      error: err.message,
      stack: err.stack,
    });
    // Attempt cleanup before exiting on startup failure
    await disconnectDatabase().catch(() => {});
    await disconnectRedis().catch(() => {});
    process.exit(1);
  }
}

// Global safety error handlers
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection detected', {
    error: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception occurred, triggering emergency shutdown', {
    error: error.message,
    stack: error.stack,
  });
  handleGracefulShutdown('UNCAUGHT_EXCEPTION').finally(() => {
    process.exit(1);
  });
});

// Launch Sun Bird Corporation ERP server
startServer();

export { server };
export default app;
