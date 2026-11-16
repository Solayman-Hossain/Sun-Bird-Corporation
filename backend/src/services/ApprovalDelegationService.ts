import { Types } from 'mongoose';
import {
  ApprovalDelegationModel,
  IApprovalDelegation,
} from '../models/ApprovalDelegation';
import { UserModel } from '../models/User';
import { AuditLogService } from './AuditLogService';
import {
  NotFoundError,
  ValidationError,
} from '../errors/AppError';

function getSafeActorId(actorId?: string | Types.ObjectId): Types.ObjectId {
  if (actorId && Types.ObjectId.isValid(actorId.toString()) && actorId.toString().length === 24) {
    return new Types.ObjectId(actorId.toString());
  }
  return new Types.ObjectId('000000000000000000000001');
}

export class ApprovalDelegationService {
  /**
   * List delegations
   */
  public static async listDelegations(
    filterParams: {
      originalApproverId?: string;
      delegatedApproverId?: string;
      organizationId?: string;
      isActive?: boolean;
    } = {},
    page: number = 1,
    limit: number = 50
  ) {
    const query: Record<string, any> = {};

    if (filterParams.originalApproverId && Types.ObjectId.isValid(filterParams.originalApproverId)) {
      query.originalApproverId = new Types.ObjectId(filterParams.originalApproverId);
    }
    if (filterParams.delegatedApproverId && Types.ObjectId.isValid(filterParams.delegatedApproverId)) {
      query.delegatedApproverId = new Types.ObjectId(filterParams.delegatedApproverId);
    }
    if (filterParams.organizationId && Types.ObjectId.isValid(filterParams.organizationId)) {
      query.$or = [
        { organizationId: new Types.ObjectId(filterParams.organizationId) },
        { organizationId: null },
      ];
    }
    if (filterParams.isActive !== undefined) {
      query.isActive = filterParams.isActive;
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [delegations, total] = await Promise.all([
      ApprovalDelegationModel.find(query)
        .populate('originalApproverId', 'fullName email userType designation')
        .populate('delegatedApproverId', 'fullName email userType designation')
        .populate('organizationId', 'organizationCode displayName legalName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ApprovalDelegationModel.countDocuments(query),
    ]);

    return {
      delegations,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /**
   * Create delegation with strict circular delegation detection
   */
  public static async createDelegation(data: {
    originalApproverId: string;
    delegatedApproverId: string;
    organizationId?: string;
    moduleScope?: string[];
    startDate: string | Date;
    endDate: string | Date;
    reason: string;
  }, actorId?: string): Promise<IApprovalDelegation> {
    if (!Types.ObjectId.isValid(data.originalApproverId)) {
      throw new ValidationError(`Invalid originalApproverId: ${data.originalApproverId}`);
    }
    if (!Types.ObjectId.isValid(data.delegatedApproverId)) {
      throw new ValidationError(`Invalid delegatedApproverId: ${data.delegatedApproverId}`);
    }

    if (data.originalApproverId === data.delegatedApproverId) {
      throw new ValidationError('You cannot delegate approval authority to yourself.');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid start or end date for delegation.');
    }
    if (end <= start) {
      throw new ValidationError('Delegation end date must be after start date.');
    }

    // Verify both users exist
    const [origUser, targetUser] = await Promise.all([
      UserModel.findById(data.originalApproverId),
      UserModel.findById(data.delegatedApproverId),
    ]);
    if (!origUser) throw new NotFoundError('User', data.originalApproverId);
    if (!targetUser) throw new NotFoundError('User', data.delegatedApproverId);

    // ── Circular Delegation Check ───────────────────────────────────────────
    // Check if targetUser has an active delegation chain leading back to origUser
    const isCircular = await this.detectCircularDelegation(
      data.delegatedApproverId,
      data.originalApproverId
    );
    if (isCircular) {
      throw new ValidationError(
        `Circular delegation detected: User '${targetUser.fullName}' already delegates authority back to '${origUser.fullName}'.`
      );
    }

    const delegation = await ApprovalDelegationModel.create({
      originalApproverId: new Types.ObjectId(data.originalApproverId),
      delegatedApproverId: new Types.ObjectId(data.delegatedApproverId),
      organizationId: data.organizationId ? new Types.ObjectId(data.organizationId) : undefined,
      moduleScope: data.moduleScope ? data.moduleScope.map((m) => m.toUpperCase().trim()) : [],
      startDate: start,
      endDate: end,
      reason: data.reason.trim(),
      isActive: true,
      createdBy: getSafeActorId(actorId),
    });

    await AuditLogService.logAction({
      action: 'APPROVAL_DELEGATION_CREATE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'approval_delegations',
      targetId: delegation._id,
      notes: `Delegated approval from ${origUser.fullName} to ${targetUser.fullName} until ${end.toISOString()}`,
    });

    return delegation;
  }

  /**
   * Revoke delegation
   */
  public static async revokeDelegation(id: string, actorId?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('ApprovalDelegation', id);
    }

    const delegation = await ApprovalDelegationModel.findById(id);
    if (!delegation) {
      throw new NotFoundError('ApprovalDelegation', id);
    }

    delegation.isActive = false;
    await delegation.save();

    await AuditLogService.logAction({
      action: 'APPROVAL_DELEGATION_REVOKE',
      actorId: getSafeActorId(actorId),
      actorRole: 'ADMIN',
      targetCollection: 'approval_delegations',
      targetId: delegation._id,
      notes: `Revoked delegation ID ${id}`,
    });

    return { revoked: true, message: 'Delegation revoked successfully' };
  }

  /**
   * Checks if candidate is an authorized delegate of the original approver
   */
  public static async isDelegatedApprover(
    candidateUserId: string | Types.ObjectId,
    originalApproverId: string | Types.ObjectId,
    organizationId?: string | Types.ObjectId,
    module?: string
  ): Promise<boolean> {
    const now = new Date();

    const query: Record<string, any> = {
      originalApproverId: new Types.ObjectId(originalApproverId.toString()),
      delegatedApproverId: new Types.ObjectId(candidateUserId.toString()),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (organizationId && Types.ObjectId.isValid(organizationId.toString())) {
      query.$or = [
        { organizationId: new Types.ObjectId(organizationId.toString()) },
        { organizationId: null },
        { organizationId: { $exists: false } },
      ];
    }

    const activeDelegations = await ApprovalDelegationModel.find(query);
    if (activeDelegations.length === 0) return false;

    if (!module) return true;

    // Check module scope
    const modUpper = module.toUpperCase().trim();
    for (const del of activeDelegations) {
      if (!del.moduleScope || del.moduleScope.length === 0) return true;
      if (del.moduleScope.includes(modUpper)) return true;
    }

    return false;
  }

  /**
   * Helper to detect recursive cycles (depth-first search up to 5 levels)
   */
  private static async detectCircularDelegation(
    currentUserId: string,
    targetUserId: string,
    visited: Set<string> = new Set()
  ): Promise<boolean> {
    if (currentUserId === targetUserId) return true;
    if (visited.has(currentUserId) || visited.size > 5) return false;
    visited.add(currentUserId);

    const now = new Date();
    const activeDelegations = await ApprovalDelegationModel.find({
      originalApproverId: new Types.ObjectId(currentUserId),
      isActive: true,
      endDate: { $gte: now },
    });

    for (const d of activeDelegations) {
      const nextId = d.delegatedApproverId.toString();
      if (nextId === targetUserId) return true;
      const subCycle = await this.detectCircularDelegation(nextId, targetUserId, new Set(visited));
      if (subCycle) return true;
    }

    return false;
  }
}

export default ApprovalDelegationService;

