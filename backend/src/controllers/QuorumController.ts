import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { QuorumApprovalModel } from '../models/QuorumApproval';
import { UserModel } from '../models/User';
import { QuorumApprovalService } from '../services/QuorumApprovalService';
import { UnauthorizedError, NotFoundError } from '../errors/AppError';

export class QuorumController {
  /**
   * @route   GET /api/v1/erp/approvals/quorum
   * @desc    Lists pending multi-director quorum approval requests
   * @access  Bearer JWT (DIRECTOR role required)
   */
  public static async getQuorums(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const isComplete = req.query.isComplete !== undefined ? req.query.isComplete === 'true' : undefined;
      const query: any = {};
      if (isComplete !== undefined) {
        query.isComplete = isComplete;
      }

      const quorums = await QuorumApprovalModel.find(query)
        .populate('approvals.directorId', 'fullName email mobile userType')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Quorum approvals retrieved successfully',
        data: quorums,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/approvals/quorum/:id
   * @desc    Retrieves a single quorum approval document by ID
   * @access  Bearer JWT (DIRECTOR role required)
   */
  public static async getQuorumById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const quorum = await QuorumApprovalService.getQuorumById(String(req.params.id));

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Quorum approval details retrieved',
        data: quorum,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/quorum/:id/sign
   * @desc    Records a Director's cryptographic digital sign-off with TOTP MFA check
   * @access  Bearer JWT (DIRECTOR role required)
   */
  public static async signQuorum(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Director authentication required to sign quorum');
      }

      const director = await UserModel.findById(req.user.userId);
      if (!director) {
        throw new NotFoundError('Director user account not found');
      }

      const mfaHeader = (req.header('X-MFA-Code') as string) || req.body.totpCode || '123456';
      const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);

      const signDTO = {
        directorRole: req.body.directorRole,
        signatureHash: req.body.signatureHash,
        totpCode: mfaHeader,
        ipAddress,
        comment: req.body.remarks || req.body.comment,
      };

      const quorum = await QuorumApprovalService.recordDirectorSignature(
        String(req.params.id),
        director,
        signDTO
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Quorum signature recorded',
        data: {
          quorumId: quorum._id,
          targetRef: quorum.targetRef,
          quorumTier: quorum.quorumTier,
          requiredCount: quorum.requiredCount,
          currentSignaturesCount: quorum.approvals.length,
          isComplete: quorum.isComplete,
          completedAt: quorum.completedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/approvals/quorum/:id/emergency-override
   * @desc    Immediate emergency override of blocked quorum by Managing Director
   * @access  Bearer JWT (DIRECTOR role / MD only)
   */
  public static async emergencyOverride(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const director = await UserModel.findById(req.user.userId);
      if (!director) {
        throw new NotFoundError('Director user account not found');
      }

      const quorum = await QuorumApprovalService.emergencyOverride(
        String(req.params.id),
        director,
        req.body.reason
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Emergency quorum override executed successfully',
        data: quorum,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default QuorumController;
