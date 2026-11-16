import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/OrganizationService';
import { OrganizationStatus } from '../models/Organization';

export class OrganizationController {
  /**
   * GET /api/v1/erp/organizations
   */
  public static async getOrganizations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { search, status } = req.query;
      const user = req.user as any;

      const orgs = await OrganizationService.getOrganizations({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        userType: user?.userType,
        userAuthorizedOrgIds: user?.authorizedOrganizations,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Organizations retrieved successfully',
        data: orgs,
        total: orgs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/stats
   */
  public static async getDashboardStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await OrganizationService.getDashboardStats();
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Organization dashboard metrics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/default
   */
  public static async getDefaultOrganization(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const defaultOrg = await OrganizationService.getDefaultOrganization();
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Default organization retrieved successfully',
        data: defaultOrg,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/:id
   */
  public static async getOrganizationById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const org = await OrganizationService.getOrganizationById(id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Organization details retrieved successfully',
        data: org,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/erp/organizations
   */
  public static async createOrganization(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const newOrg = await OrganizationService.createOrganization(req.body, actorId, actorRole);
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Organization created successfully',
        data: newOrg,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/erp/organizations/:id
   */
  public static async updateOrganization(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.updateOrganization(
        id,
        req.body,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Organization profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/erp/organizations/:id/status
   */
  public static async setStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.setStatus(
        id,
        status as OrganizationStatus,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Organization status set to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/erp/organizations/:id/default
   */
  public static async setDefault(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.setDefault(id, actorId, actorRole);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Organization marked as default company',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/:id/branding
   */
  public static async getBranding(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const org = await OrganizationService.getOrganizationById(id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Organization branding retrieved',
        data: org.branding,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/erp/organizations/:id/branding
   */
  public static async updateBranding(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.updateBranding(
        id,
        req.body,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Branding updated successfully',
        data: updated.branding,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/:id/banks
   */
  public static async getBankAccounts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const org = await OrganizationService.getOrganizationById(id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bank accounts retrieved successfully',
        data: org.bankAccounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/erp/organizations/:id/banks
   */
  public static async addBankAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.addBankAccount(
        id,
        req.body,
        actorId,
        actorRole
      );
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Bank account added successfully',
        data: updated.bankAccounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/erp/organizations/:id/banks/:bankId
   */
  public static async updateBankAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const bankId = String(req.params.bankId);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.updateBankAccount(
        id,
        bankId,
        req.body,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bank account updated successfully',
        data: updated.bankAccounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/erp/organizations/:id/banks/:bankId
   */
  public static async deleteBankAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const bankId = String(req.params.bankId);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.deleteBankAccount(
        id,
        bankId,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Bank account removed successfully',
        data: updated.bankAccounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/:id/signatures
   */
  public static async getSignatories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const org = await OrganizationService.getOrganizationById(id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Signatories retrieved successfully',
        data: org.signatories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/erp/organizations/:id/signatures
   */
  public static async addSignatory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.addSignatory(
        id,
        req.body,
        actorId,
        actorRole
      );
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Authorized signatory added',
        data: updated.signatories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/erp/organizations/:id/signatures/:sigId
   */
  public static async updateSignatory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const sigId = String(req.params.sigId);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.updateSignatory(
        id,
        sigId,
        req.body,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Signatory updated',
        data: updated.signatories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/erp/organizations/:id/signatures/:sigId
   */
  public static async deleteSignatory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const sigId = String(req.params.sigId);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.deleteSignatory(
        id,
        sigId,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Signatory removed',
        data: updated.signatories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/:id/stamps
   */
  public static async getStamps(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const org = await OrganizationService.getOrganizationById(id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Stamps retrieved successfully',
        data: org.stamps,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/erp/organizations/:id/stamps
   */
  public static async addStamp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.addStamp(
        id,
        req.body,
        actorId,
        actorRole
      );
      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Stamp added successfully',
        data: updated.stamps,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/erp/organizations/:id/stamps/:stampId
   */
  public static async updateStamp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const stampId = String(req.params.stampId);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.updateStamp(
        id,
        stampId,
        req.body,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Stamp updated successfully',
        data: updated.stamps,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/erp/organizations/:id/stamps/:stampId
   */
  public static async deleteStamp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const stampId = String(req.params.stampId);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.deleteStamp(
        id,
        stampId,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Stamp removed successfully',
        data: updated.stamps,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/:id/documents
   */
  public static async getDocumentConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const org = await OrganizationService.getOrganizationById(id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Document configuration retrieved',
        data: org.documentConfig,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/erp/organizations/:id/documents
   */
  public static async updateDocumentConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.updateDocumentConfig(
        id,
        req.body,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Document configuration updated',
        data: updated.documentConfig,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/:id/financials
   */
  public static async getFinancialSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const org = await OrganizationService.getOrganizationById(id);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Financial settings retrieved',
        data: org.financialSettings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/erp/organizations/:id/financials
   */
  public static async updateFinancialSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user as any;
      const actorId = user?.userId || user?._id || 'SYSTEM';
      const actorRole = user?.userType || 'SUPER_ADMIN';

      const updated = await OrganizationService.updateFinancialSettings(
        id,
        req.body,
        actorId,
        actorRole
      );
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Financial settings updated',
        data: updated.financialSettings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/erp/organizations/:id/logs
   */
  public static async getActivityLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const logs = await OrganizationService.getActivityLogs(id, limit);
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Organization activity logs retrieved',
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}
