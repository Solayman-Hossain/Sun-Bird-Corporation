import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import env from './config/env';
import { morganMiddleware } from './config/logger';
import { requestIdMiddleware } from './middlewares/requestId';
import errorHandler from './middlewares/errorHandler';
import { NotFoundError } from './errors/AppError';
import apiV1Router from './routes';

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
const allowedOrigins = [
  env.CLIENT_STOREFRONT_URL,
  env.CLIENT_ERP_URL,
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Idempotency-Key',
      'X-TOTP-Code',
      'X-MFA-Code',
      'X-Device-Fingerprint',
      'X-API-Version',
      'X-Refresh-Token',
    ],
    exposedHeaders: ['X-Request-ID'],
  })
);

// Compression middleware for performance
app.use(compression());

// Parse incoming request payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse Cookie headers
app.use(cookieParser());

// Request correlation tracking
app.use(requestIdMiddleware);

// Correlated HTTP access logging
app.use(morganMiddleware);

// Root Service Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'Sun Bird Corporation ERP API',
    version: '1.0.0',
    status: 'ONLINE',
    healthCheck: '/api/v1/health',
    timestamp: new Date().toISOString(),
  });
});

// Mount API v1 router
app.use('/api/v1', apiV1Router);

// 404 Route Handler - routes into centralized error handler via NotFoundError
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Endpoint '${req.method} ${req.originalUrl}'`));
});

// Centralized RFC 7807 Error Middleware
app.use(errorHandler);

export default app;
