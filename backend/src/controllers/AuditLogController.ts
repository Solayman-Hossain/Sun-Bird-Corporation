import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/AuditLogService';
import { AuditService } from '../services/AuditService';

export class AuditLogController {
  /**
   * @route   GET /api/v1/erp/audit-logs
   * @desc    Queries chronological immutable database audit trail
   * @access  Bearer JWT (audit:READ — Director / Super Admin / Audit Committee)
   */
  public static async getAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 25;

      const result = await AuditService.listAuditLogs(
        {
          actorId: req.query.actorId ? String(req.query.actorId) : undefined,
          action: req.query.action ? String(req.query.action) : undefined,
          module: req.query.module ? String(req.query.module) : undefined,
          organizationId: req.query.organizationId ? String(req.query.organizationId) : undefined,
          targetCollection: req.query.targetCollection ? String(req.query.targetCollection) : undefined,
          targetId: req.query.targetId ? String(req.query.targetId) : undefined,
          search: req.query.search ? String(req.query.search) : undefined,
          startDate: req.query.startDate ? String(req.query.startDate) : undefined,
          endDate: req.query.endDate ? String(req.query.endDate) : undefined,
        },
        page,
        limit
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Audit logs retrieved successfully',
        data: result.logs,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/audit-logs/reports
   * @desc    Aggregate compliance audit reports
   * @access  Bearer JWT (audit:READ)
   */
  public static async getAuditReports(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const organizationId = req.query.organizationId ? String(req.query.organizationId) : undefined;
      const reports = await AuditService.getAuditReports(organizationId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/audit-logs/diff
   * @desc    Compute before-and-after field diffs
   * @access  Bearer JWT
   */
  public static async computeDiff(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { before, after } = req.body;
      const diffs = AuditService.computeFieldDiffs(before, after);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: diffs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/audit-logs/history/:collection/:id
   * @desc    Retrieves full chronological change history for a specific business document
   * @access  Bearer JWT (audit:READ)
   */
  public static async getResourceHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { collection, id } = req.params;
      const history = await AuditLogService.getHistoryForResource(
        String(collection),
        String(id)
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Resource audit history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/audit-logs/:id
   * @desc    Retrieve single audit record by ID
   * @access  Bearer JWT
   */
  public static async getAuditLogById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const log = await AuditService.getAuditLogById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuditLogController;
