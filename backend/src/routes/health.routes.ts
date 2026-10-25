import { Router, Request, Response } from 'express';
import env from '../config/env';
import { isDatabaseConnected } from '../config/database';
import { isRedisConnected } from '../config/redis';

const router = Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health-check endpoint returning server status, uptime, system timestamp, and database/cache states
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  const uptimeSeconds = process.uptime();
  const dbConnected = isDatabaseConnected();
  const redisConnected = isRedisConnected();

  const redisServiceStatus = redisConnected
    ? 'CONNECTED'
    : env.NODE_ENV === 'development'
      ? 'IN_MEMORY_FALLBACK'
      : 'DISCONNECTED';

  // In development, active in-memory cache counts as operational
  const isHealthy = dbConnected && (redisConnected || env.NODE_ENV === 'development');

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'UP' : 'DEGRADED',
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    service: 'sunbird-erp-backend',
    requestId: req.requestId || null,
    services: {
      database: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
      redis: redisServiceStatus,
    },
  });
});

export default router;
