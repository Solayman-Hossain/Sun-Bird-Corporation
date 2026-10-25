import 'express';
import { Types } from 'mongoose';

/**
 * Augmented Express Request interface for Sun Bird Corporation ERP.
 * Attaches authenticated user context (JWT payload + populated fields)
 * and correlation IDs to every incoming request.
 */

export interface AuthenticatedUser {
  /** User's MongoDB ObjectId (from JWT `sub` claim) */
  userId: string;
  /** User classification: CUSTOMER | STAFF | DIRECTOR | SUPER_ADMIN | VENDOR | RESELLER */
  userType: string;
  /** Assigned RBAC role ObjectId (from JWT `roleId` claim) */
  roleId?: string;
  /** Assigned branch ObjectId (from JWT `branchId` claim) */
  branchId?: string;
  /** Assigned warehouse ObjectId (populated from User record) */
  warehouseId?: string;
  /** Whether the user is currently active */
  isActive?: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    id?: string;
    /** Populated by authGuard middleware after JWT verification */
    user?: AuthenticatedUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      id?: string;
      /** Populated by authGuard middleware after JWT verification */
      user?: AuthenticatedUser;
    }
  }
}

export {};
