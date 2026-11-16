import { Request, Response, NextFunction } from 'express';
import { ApprovalService } from '../services/ApprovalService';
import { ValidationError, UnauthorizedError } from '../errors/AppError';

export class ApprovalController {
  /**
   * @route   GET /api/v1/erp/approvals/dashboard
   * @desc    Live statistics for Central Approval Dashboard
   * @access  Bearer JWT
   */
  public static async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      const { organizationId, module } = req.query;

      const stats = await ApprovalService.getDashboardStats({
        organizationId: organizationId ? String(organizationId) : undefined,
        module: module ? String(module) : undefined,
        currentUserId: currentUserId ? String(currentUserId) : undefined,
      });

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/approvals/pending
   * @desc    List requests awaiting action by current user (Checker queue)
   * @access  Bearer JWT
   */
  public static async getMyPendingApprovals(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      if (!currentUserId) throw new UnauthorizedError('Authentication required');

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
      const organizationId = req.query.organizationId ? String(req.query.organizationId) : undefined;

      const result = await ApprovalService.getMyPendingApprovals(
        String(currentUserId),
        organizationId,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.requests,
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
   * @route   GET /api/v1/erp/approvals/submitted
   * @desc    List requests submitted by current user (Maker queue)
   * @access  Bearer JWT
   */
  public static async getMySubmittedRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      if (!currentUserId) throw new UnauthorizedError('Authentication required');

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

      const result = await ApprovalService.getMySubmittedRequests(
        String(currentUserId),
        page,
        limit
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.requests,
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
   * @route   GET /api/v1/erp/approvals
   * @desc    Lists all workflow approval requests with filters
   * @access  Bearer JWT
   */
  public static async listRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        organizationId,
        module,
        transactionType,
        currentStatus,
        priority,
        requestedBy,
        assignedApproverId,
        isOverdue,
        search,
        startDate,
        endDate,
      } = req.query;

      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

      const result = await ApprovalService.listRequests(
        {
          organizationId: organizationId ? String(organizationId) : undefined,
          module: module ? String(module) : undefined,
          transactionType: transactionType ? String(transactionType) : undefined,
          currentStatus: currentStatus ? String(currentStatus) : undefined,
          priority: priority ? String(priority) : undefined,
          requestedBy: requestedBy ? String(requestedBy) : undefined,
          assignedApproverId: assignedApproverId ? String(assignedApproverId) : undefined,
          isOverdue: isOverdue !== undefined ? String(isOverdue) === 'true' : undefined,
          search: search ? String(search) : undefined,
          startDate: startDate ? String(startDate) : undefined,
          endDate: endDate ? String(endDate) : undefined,
        },
        page,
        limit
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.requests,
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
   * @route   GET /api/v1/erp/approvals/:id
   * @desc    Retrieve single approval request by ID
   * @access  Bearer JWT
   */
  public static async getRequestById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const request = await ApprovalService.getRequestById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals
   * @desc    Create/submit a new workflow approval request
   * @access  Bearer JWT
   */
  public static async createRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      const currentUserName = (req as any).user?.fullName || 'Staff Member';
      if (!currentUserId) throw new UnauthorizedError('Authentication required');

      const request = await ApprovalService.createApprovalRequest(
        req.body,
        String(currentUserId),
        currentUserName
      );

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Approval request submitted successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/:id/approve
   * @desc    Checker approves request
   * @access  Bearer JWT
   */
  public static async approveRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      const currentUserName = (req as any).user?.fullName || 'Authorized Approver';
      const currentUserRole = (req as any).user?.userType || 'CHECKER';
      if (!currentUserId) throw new UnauthorizedError('Authentication required');

      const { comment, signatureHash } = req.body;

      const request = await ApprovalService.processDecision(
        id,
        'APPROVE',
        String(currentUserId),
        currentUserName,
        currentUserRole,
        comment,
        signatureHash
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Request approved successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/:id/reject
   * @desc    Checker rejects request
   * @access  Bearer JWT
   */
  public static async rejectRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      const currentUserName = (req as any).user?.fullName || 'Authorized Approver';
      const currentUserRole = (req as any).user?.userType || 'CHECKER';
      if (!currentUserId) throw new UnauthorizedError('Authentication required');

      const { comment, signatureHash } = req.body;
      if (!comment || !comment.trim()) {
        throw new ValidationError('A comment stating the reason for rejection is required.');
      }

      const request = await ApprovalService.processDecision(
        id,
        'REJECT',
        String(currentUserId),
        currentUserName,
        currentUserRole,
        comment,
        signatureHash
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Request rejected successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/:id/return
   * @desc    Checker returns request for correction
   * @access  Bearer JWT
   */
  public static async returnRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      const currentUserName = (req as any).user?.fullName || 'Authorized Approver';
      const currentUserRole = (req as any).user?.userType || 'CHECKER';
      if (!currentUserId) throw new UnauthorizedError('Authentication required');

      const { comment } = req.body;
      if (!comment || !comment.trim()) {
        throw new ValidationError('Please specify what corrections are required.');
      }

      const request = await ApprovalService.processDecision(
        id,
        'RETURN',
        String(currentUserId),
        currentUserName,
        currentUserRole,
        comment
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Request returned for correction',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/:id/request-information
   * @desc    Checker requests more information
   * @access  Bearer JWT
   */
  public static async requestInformation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      const currentUserName = (req as any).user?.fullName || 'Authorized Approver';
      const currentUserRole = (req as any).user?.userType || 'CHECKER';
      if (!currentUserId) throw new UnauthorizedError('Authentication required');

      const { comment } = req.body;
      const request = await ApprovalService.processDecision(
        id,
        'REQUEST_INFO',
        String(currentUserId),
        currentUserName,
        currentUserRole,
        comment
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Information request noted and status updated to Under Review',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/:id/cancel
   * @desc    Maker cancels request
   * @access  Bearer JWT
   */
  public static async cancelRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const currentUserId = (req as any).user?.userId || (req as any).user?._id;
      if (!currentUserId) throw new UnauthorizedError('Authentication required');

      const { reason } = req.body;
      const request = await ApprovalService.cancelRequest(
        id,
        String(currentUserId),
        reason || 'Cancelled by requester'
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Approval request cancelled successfully',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/check-overdue
   * @desc    Trigger scan for overdue deadlines & auto-escalation
   * @access  Bearer JWT
   */
  public static async checkOverdueEscalations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await ApprovalService.checkAndEscalateOverdue();

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Overdue scan completed. Overdue: ${result.overdueCount}, Escalated: ${result.escalatedCount}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ApprovalController;

