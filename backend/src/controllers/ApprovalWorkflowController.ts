import { Request, Response, NextFunction } from 'express';
import { ApprovalWorkflowService } from '../services/ApprovalWorkflowService';
import { ApprovalDelegationService } from '../services/ApprovalDelegationService';
import { UnauthorizedError } from '../errors/AppError';

export class ApprovalWorkflowController {
  /**
   * @route   GET /api/v1/erp/approval-workflows
   */
  public static async listWorkflows(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { organizationId, module, transactionType, isActive, search } = req.query;
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

      const result = await ApprovalWorkflowService.listWorkflows(
        {
          organizationId: organizationId ? String(organizationId) : undefined,
          module: module ? String(module) : undefined,
          transactionType: transactionType ? String(transactionType) : undefined,
          isActive: isActive !== undefined ? String(isActive) === 'true' : undefined,
          search: search ? String(search) : undefined,
        },
        page,
        limit
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.workflows,
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
   * @route   GET /api/v1/erp/approval-workflows/:id
   */
  public static async getWorkflowById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const workflow = await ApprovalWorkflowService.getWorkflowById(id);

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approval-workflows
   */
  public static async createWorkflow(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorId = (req as any).user?.userId || (req as any).user?._id;
      const workflow = await ApprovalWorkflowService.createWorkflow(req.body, actorId);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Approval workflow created successfully',
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/approval-workflows/:id
   */
  public static async updateWorkflow(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?.userId || (req as any).user?._id;
      const workflow = await ApprovalWorkflowService.updateWorkflow(id, req.body, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Approval workflow updated successfully',
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/v1/erp/approval-workflows/:id
   */
  public static async deleteWorkflow(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?.userId || (req as any).user?._id;
      const result = await ApprovalWorkflowService.deleteWorkflow(id, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approval-workflows/seed
   */
  public static async seedWorkflows(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorId = (req as any).user?.userId || (req as any).user?._id;
      const result = await ApprovalWorkflowService.seedDefaultWorkflows(actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Standard approval workflows verified. Created: ${result.created.length}, Existing: ${result.existing.length}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/approval-workflows/delegations
   */
  public static async listDelegations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { originalApproverId, delegatedApproverId, organizationId, isActive } = req.query;
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

      const result = await ApprovalDelegationService.listDelegations(
        {
          originalApproverId: originalApproverId ? String(originalApproverId) : undefined,
          delegatedApproverId: delegatedApproverId ? String(delegatedApproverId) : undefined,
          organizationId: organizationId ? String(organizationId) : undefined,
          isActive: isActive !== undefined ? String(isActive) === 'true' : undefined,
        },
        page,
        limit
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        data: result.delegations,
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
   * @route   POST /api/v1/erp/approval-workflows/delegations
   */
  public static async createDelegation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const actorId = (req as any).user?.userId || (req as any).user?._id;
      const delegation = await ApprovalDelegationService.createDelegation(req.body, actorId);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Approval delegation established successfully',
        data: delegation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/v1/erp/approval-workflows/delegations/:id
   */
  public static async revokeDelegation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const actorId = (req as any).user?.userId || (req as any).user?._id;
      const result = await ApprovalDelegationService.revokeDelegation(id, actorId);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ApprovalWorkflowController;

