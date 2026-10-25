import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  ApprovalRequestModel,
  IApprovalRequest,
  DirectorQuorumRole,
} from '../models/ApprovalRequest';
import { CounterService } from '../services/CounterService';
import { NotFoundError, UnauthorizedError, ValidationError } from '../errors/AppError';

export class ApprovalRequestController {
  /**
   * @route   GET /api/v1/erp/approvals/requests
   * @desc    Lists workflow approval requests (Tiers 1 & 2 Maker-Checker queue)
   * @access  Bearer JWT (approvals:CHECKER / approvals:READ)
   */
  public static async getRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query: any = {};
      if (req.query.documentType) query.documentType = req.query.documentType;
      if (req.query.currentStatus) query.currentStatus = req.query.currentStatus;
      if (req.query.requestedBy) {
        query.requestedBy = new Types.ObjectId(String(req.query.requestedBy));
      }

      const requests = await ApprovalRequestModel.find(query)
        .populate('requestedBy', 'fullName email userType')
        .populate('approvals.directorId', 'fullName email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Approval requests retrieved successfully',
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/requests
   * @desc    Creates a new workflow approval request
   * @access  Bearer JWT (approvals:CREATE)
   */
  public static async createRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const requestCode = await CounterService.getNextSequence('AR');

      const approval = new ApprovalRequestModel({
        requestCode,
        documentType: req.body.documentType,
        documentId: new Types.ObjectId(req.body.documentId),
        documentRef: req.body.documentRef,
        requestedBy: new Types.ObjectId(req.user.userId),
        requestedAt: new Date(),
        currentQuorumTier: req.body.currentQuorumTier || 1,
        quorumRequired: req.body.quorumRequired || 1,
        approvals: [],
        currentStatus: 'PENDING',
      });

      await approval.save();

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Approval request submitted successfully',
        data: approval,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/approvals/requests/:id/action
   * @desc    Checker action on workflow approval request (APPROVE or REJECT)
   * @access  Bearer JWT (approvals:CHECKER)
   */
  public static async actionRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const { status, comment } = req.body;
      if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
        throw new ValidationError('Action status must be APPROVED or REJECTED');
      }

      const request = await ApprovalRequestModel.findById(req.params.id);
      if (!request) {
        throw new NotFoundError(`Approval request with ID ${req.params.id} not found`);
      }

      if (request.currentStatus !== 'PENDING') {
        throw new ValidationError(
          `Request has already been processed with status '${request.currentStatus}'`
        );
      }

      const directorRole: DirectorQuorumRole =
        (req.user as any).directorRole || 'DIRECTOR_ADMIN';

      request.approvals.push({
        directorId: new Types.ObjectId(req.user.userId),
        directorRole,
        status,
        signedAt: new Date(),
        signatureHash: `SIG-${Date.now()}-${req.user.userId}`,
        comment: comment?.trim(),
      });

      if (status === 'REJECTED') {
        request.currentStatus = 'REJECTED';
      } else if (request.approvals.filter((a) => a.status === 'APPROVED').length >= request.quorumRequired) {
        request.quorumReached = true;
        request.currentStatus = 'APPROVED';
      }

      await request.save();

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Approval request ${status.toLowerCase()} successfully`,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ApprovalRequestController;
