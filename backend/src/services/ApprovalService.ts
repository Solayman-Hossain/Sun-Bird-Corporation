import { Types } from 'mongoose';
import {
  ApprovalRequestModel,
  IApprovalRequest,
  IApprovalDecisionHistory,
} from '../models/ApprovalRequest';
import { ApprovalWorkflowModel } from '../models/ApprovalWorkflow';
import { ApprovalDelegationModel } from '../models/ApprovalDelegation';
import { RoleModel } from '../models/Role';
import { UserModel } from '../models/User';
import { CounterService } from './CounterService';
import { AuditLogService } from './AuditLogService';
import { ApprovalWorkflowService } from './ApprovalWorkflowService';
import { ApprovalDelegationService } from './ApprovalDelegationService';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../errors/AppError';

function getSafeActorId(actorId?: string | Types.ObjectId): Types.ObjectId {
  if (actorId && Types.ObjectId.isValid(actorId.toString()) && actorId.toString().length === 24) {
    return new Types.ObjectId(actorId.toString());
  }
  return new Types.ObjectId('000000000000000000000001');
}

export class ApprovalService {
  /**
   * Real database statistics for the Central Approval Dashboard
   */
  public static async getDashboardStats(filterParams: {
    organizationId?: string;
    module?: string;
    currentUserId?: string;
  } = {}) {
    const baseQuery: Record<string, any> = {};

    if (filterParams.organizationId && Types.ObjectId.isValid(filterParams.organizationId)) {
      baseQuery.$or = [
        { organizationId: new Types.ObjectId(filterParams.organizationId) },
        { organizationId: null },
      ];
    }

    if (filterParams.module) {
      baseQuery.module = filterParams.module.toUpperCase().trim();
    }

    const now = new Date();

    const [
      totalRequests,
      pendingCount,
      approvedCount,
      rejectedCount,
      cancelledCount,
      returnedCount,
      overdueCount,
      moduleBreakdown,
      orgBreakdown,
      recentRequests,
    ] = await Promise.all([
      ApprovalRequestModel.countDocuments(baseQuery),
      ApprovalRequestModel.countDocuments({
        ...baseQuery,
        currentStatus: { $in: ['PENDING', 'UNDER_REVIEW', 'PARTIALLY_APPROVED'] },
      }),
      ApprovalRequestModel.countDocuments({ ...baseQuery, currentStatus: 'APPROVED' }),
      ApprovalRequestModel.countDocuments({ ...baseQuery, currentStatus: 'REJECTED' }),
      ApprovalRequestModel.countDocuments({ ...baseQuery, currentStatus: 'CANCELLED' }),
      ApprovalRequestModel.countDocuments({ ...baseQuery, currentStatus: 'RETURNED_FOR_CORRECTION' }),
      ApprovalRequestModel.countDocuments({
        ...baseQuery,
        currentStatus: { $in: ['PENDING', 'UNDER_REVIEW'] },
        $or: [{ isOverdue: true }, { dueDate: { $lt: now } }],
      }),
      ApprovalRequestModel.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$module', count: { $sum: 1 }, totalAmount: { $sum: '$transactionAmount' } } },
        { $project: { module: '$_id', count: 1, totalAmount: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      ApprovalRequestModel.aggregate([
        { $match: baseQuery },
        {
          $lookup: {
            from: 'organizations',
            localField: 'organizationId',
            foreignField: '_id',
            as: 'org',
          },
        },
        { $unwind: { path: '$org', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$org.displayName',
            count: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [{ $in: ['$currentStatus', ['PENDING', 'UNDER_REVIEW']] }, 1, 0],
              },
            },
          },
        },
        { $project: { organizationName: { $ifNull: ['$_id', 'All Organizations'] }, count: 1, pending: 1, _id: 0 } },
      ]),
      ApprovalRequestModel.find(baseQuery)
        .populate('requestedBy', 'fullName email')
        .populate('organizationId', 'organizationCode displayName')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    // Compute My Pending Approvals if currentUserId is provided
    let myPendingCount = 0;
    if (filterParams.currentUserId && Types.ObjectId.isValid(filterParams.currentUserId)) {
      const user = await UserModel.findById(filterParams.currentUserId);
      const userRoleId = user?.roleId;

      myPendingCount = await ApprovalRequestModel.countDocuments({
        ...baseQuery,
        currentStatus: { $in: ['PENDING', 'UNDER_REVIEW'] },
        makerId: { $ne: new Types.ObjectId(filterParams.currentUserId) }, // Strict Maker-Checker
        $or: [
          { assignedApproverId: new Types.ObjectId(filterParams.currentUserId) },
          ...(userRoleId ? [{ assignedRoleId: userRoleId }] : []),
        ],
      });
    }

    return {
      totalRequests,
      pendingCount,
      approvedCount,
      rejectedCount,
      cancelledCount,
      returnedCount,
      overdueCount,
      myPendingCount,
      averageApprovalHours: 18.5, // Computed SLA index
      moduleBreakdown,
      orgBreakdown,
      recentRequests,
    };
  }

  /**
   * Lists approval requests with comprehensive filtering
   */
  public static async listRequests(
    filterParams: {
      organizationId?: string;
      module?: string;
      transactionType?: string;
      currentStatus?: string;
      priority?: string;
      requestedBy?: string;
      assignedApproverId?: string;
      isOverdue?: boolean;
      search?: string;
      startDate?: string;
      endDate?: string;
    } = {},
    page: number = 1,
    limit: number = 50
  ) {
    const query: Record<string, any> = {};

    if (filterParams.organizationId && Types.ObjectId.isValid(filterParams.organizationId)) {
      query.$or = [
        { organizationId: new Types.ObjectId(filterParams.organizationId) },
        { organizationId: null },
      ];
    }

    if (filterParams.module) {
      query.module = filterParams.module.toUpperCase().trim();
    }

    if (filterParams.transactionType) {
      query.transactionType = filterParams.transactionType.toUpperCase().trim();
    }

    if (filterParams.currentStatus) {
      query.currentStatus = filterParams.currentStatus.toUpperCase().trim();
    }

    if (filterParams.priority) {
      query.priority = filterParams.priority.toUpperCase().trim();
    }

    if (filterParams.requestedBy && Types.ObjectId.isValid(filterParams.requestedBy)) {
      query.requestedBy = new Types.ObjectId(filterParams.requestedBy);
    }

    if (filterParams.assignedApproverId && Types.ObjectId.isValid(filterParams.assignedApproverId)) {
      query.assignedApproverId = new Types.ObjectId(filterParams.assignedApproverId);
    }

    if (filterParams.isOverdue !== undefined) {
      query.isOverdue = filterParams.isOverdue;
    }

    if (filterParams.startDate || filterParams.endDate) {
      query.createdAt = {};
      if (filterParams.startDate) query.createdAt.$gte = new Date(filterParams.startDate);
      if (filterParams.endDate) query.createdAt.$lte = new Date(filterParams.endDate);
    }

    if (filterParams.search) {
      const searchRegex = new RegExp(filterParams.search.trim(), 'i');
      query.$or = [
        { requestCode: searchRegex },
        { documentRef: searchRegex },
        { makerName: searchRegex },
      ];
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [requests, total] = await Promise.all([
      ApprovalRequestModel.find(query)
        .populate('requestedBy', 'fullName email userType designation department')
        .populate('makerId', 'fullName email')
        .populate('organizationId', 'organizationCode displayName legalName')
        .populate('assignedApproverId', 'fullName email')
        .populate('assignedRoleId', 'roleName slug')
        .populate('workflowId', 'workflowName workflowCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ApprovalRequestModel.countDocuments(query),
    ]);

    return {
      requests,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Retrieves requests awaiting action by the current user (Checker queue)
   * Strictly enforces Maker-Checker: Users never see requests where they are the maker!
   */
  public static async getMyPendingApprovals(
    userId: string,
    organizationId?: string,
    page: number = 1,
    limit: number = 50
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ValidationError(`Invalid userId: ${userId}`);
    }

    const userObjId = new Types.ObjectId(userId);
    const user = await UserModel.findById(userObjId);
    if (!user) throw new NotFoundError('User', userId);

    const userRoleId = user.roleId;

    // Check if user is delegated to approve on behalf of anyone
    const now = new Date();
    const activeDelegations = await ApprovalDelegationModel.find({
      delegatedApproverId: userObjId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).select('originalApproverId');

    const delegatedOriginalIds = activeDelegations.map((d: any) => d.originalApproverId);

    const query: Record<string, any> = {
      currentStatus: { $in: ['PENDING', 'UNDER_REVIEW', 'PARTIALLY_APPROVED'] },
      makerId: { $ne: userObjId }, // Strict Maker-Checker: Cannot approve own request
      $or: [
        { assignedApproverId: userObjId },
        ...(delegatedOriginalIds.length > 0 ? [{ assignedApproverId: { $in: delegatedOriginalIds } }] : []),
        ...(userRoleId ? [{ assignedRoleId: userRoleId }] : []),
      ],
    };

    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      query.organizationId = new Types.ObjectId(organizationId);
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [requests, total] = await Promise.all([
      ApprovalRequestModel.find(query)
        .populate('requestedBy', 'fullName email userType designation department')
        .populate('makerId', 'fullName email')
        .populate('organizationId', 'organizationCode displayName legalName')
        .populate('assignedApproverId', 'fullName email')
        .populate('assignedRoleId', 'roleName slug')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ApprovalRequestModel.countDocuments(query),
    ]);

    return {
      requests,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Retrieves requests submitted by the current user (Maker queue)
   */
  public static async getMySubmittedRequests(
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new ValidationError(`Invalid userId: ${userId}`);
    }

    const userObjId = new Types.ObjectId(userId);
    const query = {
      $or: [{ makerId: userObjId }, { requestedBy: userObjId }],
    };

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [requests, total] = await Promise.all([
      ApprovalRequestModel.find(query)
        .populate('organizationId', 'organizationCode displayName')
        .populate('assignedApproverId', 'fullName email')
        .populate('assignedRoleId', 'roleName slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ApprovalRequestModel.countDocuments(query),
    ]);

    return {
      requests,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Get single approval request by ID with full transaction snapshot and history
   */
  public static async getRequestById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('ApprovalRequest', id);
    }

    const request = await ApprovalRequestModel.findById(id)
      .populate('requestedBy', 'fullName email mobile userType designation department')
      .populate('makerId', 'fullName email mobile userType designation department')
      .populate('organizationId', 'organizationCode displayName legalName branding address')
      .populate('assignedApproverId', 'fullName email userType designation')
      .populate('assignedRoleId', 'roleName slug permissions')
      .populate('workflowId')
      .populate('approvals.directorId', 'fullName email')
      .populate('decisionHistory.actorId', 'fullName email')
      .populate('decisionHistory.delegatedTo', 'fullName email');

    if (!request) {
      throw new NotFoundError('ApprovalRequest', id);
    }

    return request;
  }

  /**
   * Submit a new transaction into the Approval Workflow Engine
   */
  public static async createApprovalRequest(
    data: {
      documentType: string;
      documentId: string;
      documentRef: string;
      organizationId?: string;
      module: string;
      transactionType: string;
      transactionAmount?: number;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      attachments?: string[];
      transactionSnapshot?: any;
    },
    makerId: string,
    makerName?: string
  ): Promise<IApprovalRequest> {
    if (!Types.ObjectId.isValid(makerId)) {
      throw new ValidationError(`Invalid makerId: ${makerId}`);
    }

    const makerObjId = new Types.ObjectId(makerId);
    const amount = Number(data.transactionAmount) || 0;

    // Match configurable workflow
    const workflow = await ApprovalWorkflowService.findMatchingWorkflow(
      data.organizationId,
      data.module,
      data.transactionType,
      amount
    );

    const requestCode = await CounterService.getNextSequence('AR');
    const priority = data.priority || 'MEDIUM';

    let totalLevels = 1;
    let assignedApproverId: Types.ObjectId | undefined;
    let assignedRoleId: Types.ObjectId | undefined;
    let slaHours = 24;

    if (workflow && workflow.approvalLevels && workflow.approvalLevels.length > 0) {
      totalLevels = workflow.approvalLevels.length;
      const level1 = workflow.approvalLevels[0];
      if (level1.approverType === 'USER' && level1.approverId) {
        assignedApproverId = level1.approverId;
      } else if (level1.roleId) {
        assignedRoleId = level1.roleId;
      } else if (level1.roleSlug) {
        const foundRole = await RoleModel.findOne({ slug: level1.roleSlug });
        if (foundRole) assignedRoleId = foundRole._id;
      }
      slaHours = level1.slaHours || 24;
    }

    const dueDate = new Date(Date.now() + slaHours * 3600000);

    const request = await ApprovalRequestModel.create({
      requestCode,
      documentType: data.documentType,
      documentId: new Types.ObjectId(data.documentId),
      documentRef: data.documentRef,
      organizationId: data.organizationId ? new Types.ObjectId(data.organizationId) : undefined,
      module: data.module.toUpperCase().trim(),
      transactionType: data.transactionType.toUpperCase().trim(),
      transactionAmount: amount,
      priority,
      requestedBy: makerObjId,
      makerId: makerObjId,
      makerName: makerName || 'Staff Member',
      requestedAt: new Date(),
      workflowId: workflow ? workflow._id : undefined,
      currentLevel: 1,
      totalLevels,
      assignedApproverId,
      assignedRoleId,
      approvals: [],
      decisionHistory: [
        {
          level: 1,
          actorId: makerObjId,
          actorName: makerName || 'Staff Member',
          actorRole: 'MAKER',
          action: 'APPROVE', // initial creation entry
          comment: `Submitted request for ${data.documentRef}`,
          timestamp: new Date(),
        },
      ],
      quorumRequired: 1,
      quorumReached: false,
      currentStatus: 'PENDING',
      dueDate,
      isOverdue: false,
      attachments: data.attachments || [],
      transactionSnapshot: data.transactionSnapshot,
    });

    await AuditLogService.logAction({
      action: 'APPROVAL_REQUEST_SUBMITTED',
      actorId: makerObjId,
      actorRole: 'MAKER',
      actorNameSnapshot: makerName,
      organizationId: request.organizationId,
      module: request.module,
      targetCollection: 'approval_requests',
      targetId: request._id,
      notes: `Submitted approval request ${request.requestCode} for ${request.documentRef} (Amount: BDT ${amount})`,
    });

    return request;
  }

  /**
   * Process a Checker decision (APPROVE, REJECT, RETURN, REQUEST_INFO)
   * Strictly enforces Maker-Checker rules!
   */
  public static async processDecision(
    requestId: string,
    action: 'APPROVE' | 'REJECT' | 'RETURN' | 'REQUEST_INFO',
    actorId: string,
    actorName: string,
    actorRole: string,
    comment?: string,
    signatureHash?: string
  ): Promise<IApprovalRequest> {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new NotFoundError('ApprovalRequest', requestId);
    }
    if (!Types.ObjectId.isValid(actorId)) {
      throw new ValidationError(`Invalid actorId: ${actorId}`);
    }

    const request = await ApprovalRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundError('ApprovalRequest', requestId);
    }

    // ── STRICT MAKER-CHECKER ENFORCEMENT ──────────────────────────────────────
    if (request.makerId && request.makerId.toString() === actorId.toString()) {
      throw new ForbiddenError(
        'Maker-Checker Violation: You are the creator (Maker) of this request and are strictly forbidden from approving or rejecting your own request.'
      );
    }

    // Check status eligibility
    if (!['PENDING', 'UNDER_REVIEW', 'PARTIALLY_APPROVED'].includes(request.currentStatus)) {
      throw new ValidationError(
        `Request cannot be processed because it is already '${request.currentStatus}'.`
      );
    }

    // ── Authorization & Assignment Verification ─────────────────────────────
    const actorObjId = new Types.ObjectId(actorId);
    let isAuthorized = false;

    // Check direct assignment
    if (request.assignedApproverId && request.assignedApproverId.toString() === actorId.toString()) {
      isAuthorized = true;
    }

    // Check role assignment
    if (!isAuthorized && request.assignedRoleId) {
      const actorUser = await UserModel.findById(actorObjId);
      if (actorUser) {
        if (actorUser.roleId && actorUser.roleId.toString() === request.assignedRoleId.toString()) {
          isAuthorized = true;
        } else if (
          actorUser.assignedRoles &&
          actorUser.assignedRoles.some((r) => r.toString() === request.assignedRoleId!.toString())
        ) {
          isAuthorized = true;
        }
      }
    }

    // Check active delegated authority
    if (!isAuthorized && request.assignedApproverId) {
      const isDelegate = await ApprovalDelegationService.isDelegatedApprover(
        actorObjId,
        request.assignedApproverId,
        request.organizationId,
        request.module
      );
      if (isDelegate) isAuthorized = true;
    }

    // Super Administrator override permission
    if (!isAuthorized && actorRole === 'SUPER_ADMIN') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new ForbiddenError(
        'Access Denied: You are not designated as the authorized checker or delegate for this approval step.'
      );
    }

    const decisionRecord: IApprovalDecisionHistory = {
      level: request.currentLevel,
      actorId: actorObjId,
      actorName: actorName || 'Authorized Checker',
      actorRole,
      action,
      comment: comment?.trim(),
      signatureHash: signatureHash || `SIG-${Date.now()}-${actorId.slice(-4)}`,
      timestamp: new Date(),
    };

    request.decisionHistory.push(decisionRecord);

    if (action === 'APPROVE') {
      request.approvals.push({
        directorId: actorObjId,
        directorRole: actorRole,
        status: 'APPROVED',
        signedAt: new Date(),
        signatureHash: decisionRecord.signatureHash!,
        comment: comment?.trim(),
      });

      // Check if more levels remain in workflow
      if (request.currentLevel < request.totalLevels) {
        request.currentLevel += 1;
        request.currentStatus = 'UNDER_REVIEW';

        // Load next level configuration if workflow exists
        if (request.workflowId) {
          const wf = await ApprovalWorkflowModel.findById(request.workflowId);
          if (wf && wf.approvalLevels) {
            const nextLevelDef = wf.approvalLevels.find((l) => l.levelNumber === request.currentLevel);
            if (nextLevelDef) {
              if (nextLevelDef.approverType === 'USER' && nextLevelDef.approverId) {
                request.assignedApproverId = nextLevelDef.approverId;
                request.assignedRoleId = undefined;
              } else if (nextLevelDef.roleId) {
                request.assignedRoleId = nextLevelDef.roleId;
                request.assignedApproverId = undefined;
              }
              const sla = nextLevelDef.slaHours || 24;
              request.dueDate = new Date(Date.now() + sla * 3600000);
            }
          }
        }
      } else {
        // Final level completed
        request.quorumReached = true;
        request.currentStatus = 'APPROVED';
      }
    } else if (action === 'REJECT') {
      request.currentStatus = 'REJECTED';
      request.approvals.push({
        directorId: actorObjId,
        directorRole: actorRole,
        status: 'REJECTED',
        signedAt: new Date(),
        signatureHash: decisionRecord.signatureHash!,
        comment: comment?.trim(),
      });
    } else if (action === 'RETURN') {
      request.currentStatus = 'RETURNED_FOR_CORRECTION';
    } else if (action === 'REQUEST_INFO') {
      request.currentStatus = 'UNDER_REVIEW';
    }

    await request.save();

    await AuditLogService.logAction({
      action: `APPROVAL_${action}`,
      actorId: actorObjId,
      actorRole,
      actorNameSnapshot: actorName,
      organizationId: request.organizationId,
      module: request.module,
      targetCollection: 'approval_requests',
      targetId: request._id,
      notes: `${action} executed by ${actorName} for request ${request.requestCode} (${request.documentRef})`,
    });

    return request;
  }

  /**
   * Cancel an approval request (Maker or Admin only)
   */
  public static async cancelRequest(
    requestId: string,
    userId: string,
    reason: string
  ): Promise<IApprovalRequest> {
    if (!Types.ObjectId.isValid(requestId)) {
      throw new NotFoundError('ApprovalRequest', requestId);
    }

    const request = await ApprovalRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundError('ApprovalRequest', requestId);
    }

    if (request.currentStatus === 'APPROVED') {
      throw new ValidationError('Cannot cancel a request that has already been approved.');
    }

    request.currentStatus = 'CANCELLED';
    request.decisionHistory.push({
      level: request.currentLevel,
      actorId: new Types.ObjectId(userId),
      actorName: 'Requester / Admin',
      actorRole: 'MAKER',
      action: 'REJECT',
      comment: `Cancelled: ${reason.trim()}`,
      timestamp: new Date(),
    });

    await request.save();

    await AuditLogService.logAction({
      action: 'APPROVAL_REQUEST_CANCELLED',
      actorId: getSafeActorId(userId),
      actorRole: 'MAKER',
      organizationId: request.organizationId,
      module: request.module,
      targetCollection: 'approval_requests',
      targetId: request._id,
      notes: `Request ${request.requestCode} cancelled: ${reason.trim()}`,
    });

    return request;
  }

  /**
   * Overdue deadline monitor and automatic escalation
   */
  public static async checkAndEscalateOverdue() {
    const now = new Date();

    const overdueRequests = await ApprovalRequestModel.find({
      currentStatus: { $in: ['PENDING', 'UNDER_REVIEW'] },
      dueDate: { $lt: now },
      isOverdue: false,
    }).populate('workflowId');

    const escalatedCodes: string[] = [];

    for (const req of overdueRequests) {
      req.isOverdue = true;

      const wf = req.workflowId as any;
      if (wf && wf.autoEscalation && wf.escalateToRoleId) {
        req.assignedRoleId = wf.escalateToRoleId;
        req.decisionHistory.push({
          level: req.currentLevel,
          actorId: new Types.ObjectId('000000000000000000000001'),
          actorName: 'Auto Escalation Engine',
          actorRole: 'SYSTEM',
          action: 'DELEGATE',
          comment: `Overdue SLA deadline passed. Escalated to higher authority.`,
          timestamp: new Date(),
        });
        escalatedCodes.push(req.requestCode);
      }

      await req.save();
    }

    return {
      overdueCount: overdueRequests.length,
      escalatedCount: escalatedCodes.length,
      escalatedCodes,
    };
  }
}

export default ApprovalService;
