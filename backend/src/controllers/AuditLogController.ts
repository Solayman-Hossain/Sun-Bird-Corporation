import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/AuditLogService';

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
      const filter = {
        actorId: req.query.actorId ? String(req.query.actorId) : undefined,
        action: req.query.action ? String(req.query.action) : undefined,
        targetCollection: req.query.targetCollection
          ? String(req.query.targetCollection)
          : undefined,
        targetId: req.query.targetId ? String(req.query.targetId) : undefined,
        startDate: req.query.startDate ? String(req.query.startDate) : undefined,
        endDate: req.query.endDate ? String(req.query.endDate) : undefined,
        page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
      };

      const result = await AuditLogService.queryAuditLogs(filter);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Audit logs retrieved successfully',
        data: result.logs,
        pagination: result.pagination,
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
}

export default AuditLogController;
