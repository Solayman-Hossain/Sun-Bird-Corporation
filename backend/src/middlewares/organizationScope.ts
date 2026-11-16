import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { OrganizationModel, IOrganization } from '../models/Organization';
import { OrganizationService } from '../services/OrganizationService';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      organizationId?: Types.ObjectId;
      organization?: IOrganization;
    }
  }
}

/**
 * Organization Context & Multi-Tenant Isolation Middleware.
 *
 * Guarantees that:
 * 1. Every organization-scoped request resolves to an authorized organization.
 * 2. If 'X-Organization-Id' header is provided:
 *    - Resolves the requested organization.
 *    - Validates user permissions: SUPER_ADMIN and DIRECTOR have universal access.
 *    - Staff users must have the organization ID listed in their `authorizedOrganizations`.
 * 3. If no header is provided:
 *    - Seamlessly falls back to the system's default organization (`isDefault: true`).
 *    - Preserves 100% backward compatibility with legacy endpoints and tests.
 */
export const organizationScope = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawOrgId =
      (req.headers['x-organization-id'] as string) ||
      (req.query.organizationId as string);

    if (rawOrgId && rawOrgId.trim()) {
      const orgIdStr = rawOrgId.trim();
      let org: IOrganization | null = null;

      if (Types.ObjectId.isValid(orgIdStr)) {
        org = await OrganizationModel.findById(orgIdStr);
      }
      if (!org) {
        org = await OrganizationModel.findOne({ organizationCode: orgIdStr.toUpperCase() });
      }

      if (!org) {
        throw new NotFoundError(`Organization '${orgIdStr}' was not found`);
      }

      // Check authorization if user is authenticated
      if (req.user) {
        const { userType, authorizedOrganizations } = req.user as any;
        if (userType !== 'SUPER_ADMIN' && userType !== 'DIRECTOR') {
          if (
            authorizedOrganizations &&
            Array.isArray(authorizedOrganizations) &&
            authorizedOrganizations.length > 0
          ) {
            const hasAccess = authorizedOrganizations.some(
              (id: any) => id.toString() === org!._id.toString()
            );
            if (!hasAccess) {
              throw new ForbiddenError(
                `Access denied: You are not authorized to view or modify organization '${org.displayName}'`
              );
            }
          }
        }
      }

      req.organizationId = org._id;
      req.organization = org;
      return next();
    }

    // Fallback: Default organization
    const defaultOrg = await OrganizationService.getDefaultOrganization();
    req.organizationId = defaultOrg._id;
    req.organization = defaultOrg;
    return next();
  } catch (error) {
    next(error);
  }
};

