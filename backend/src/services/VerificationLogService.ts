import { Types } from 'mongoose';
import {
  VerificationLogModel,
  IVerificationLog,
  VerificationType,
  VerificationStatus,
  SubjectType,
  NidType,
  hashNid,
  maskNid,
} from '../models/VerificationLog';
import { BannedNidModel } from '../models/BannedNid';
import logger from '../config/logger';

export interface VerificationLogDTO {
  mobile: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  purpose: string;
  nid?: string;
  nidHash?: string;
  subject?: string;
  subjectType?: SubjectType;
  subjectId?: string | Types.ObjectId;
  nidType?: NidType;
  verificationProvider?: string;
  userId?: string | Types.ObjectId;
  customerId?: string | Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  attemptsCount?: number;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface VerificationLogFilterDTO {
  mobile?: string;
  nidHash?: string;
  subject?: string;
  subjectType?: SubjectType;
  subjectId?: string | Types.ObjectId;
  customerId?: string | Types.ObjectId;
  userId?: string | Types.ObjectId;
  verificationType?: VerificationType;
  status?: VerificationStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  limit?: number;
}

export class VerificationLogService {
  /**
   * Records an immutable entry in verification_logs collection.
   * Computes salted SHA-256 hash of NID if raw NID provided, ensuring privacy compliance.
   */
  public static async recordLog(dto: VerificationLogDTO): Promise<IVerificationLog> {
    try {
      const computedNidHash =
        dto.nidHash ||
        (dto.nid ? hashNid(dto.nid) : undefined);

      const computedNidMasked = dto.nid ? maskNid(dto.nid) : undefined;

      const entry = new VerificationLogModel({
        mobile: dto.mobile.trim(),
        nidHash: computedNidHash,
        subject: dto.subject || 'CUSTOMER',
        subjectType: dto.subjectType || 'CUSTOMER',
        subjectId: dto.subjectId ? new Types.ObjectId(dto.subjectId) : undefined,
        nidMasked: computedNidMasked,
        nidType: dto.nidType || 'UNKNOWN',
        verificationType: dto.verificationType,
        status: dto.status,
        purpose: dto.purpose || 'LOGIN',
        verificationProvider: dto.verificationProvider || 'INTERNAL_GATEWAY',
        userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
        customerId: dto.customerId ? new Types.ObjectId(dto.customerId) : undefined,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        attemptsCount: dto.attemptsCount || 1,
        failureReason: dto.failureReason,
        metadata: dto.metadata,
      });

      await entry.save();
      logger.info(
        `VerificationLog recorded: [${entry.verificationType}] [${entry.status}] for mobile ${entry.mobile} (Subject: ${entry.subject})`
      );

      return entry;
    } catch (error) {
      logger.error('Failed to persist VerificationLog entry:', error);
      throw error;
    }
  }

  /**
   * Specialized helper to record NID identity verification / KYC checks.
   */
  public static async recordNidVerification(params: {
    mobile: string;
    nid: string;
    nidType?: NidType;
    status: VerificationStatus;
    subject?: string;
    subjectType?: SubjectType;
    subjectId?: string | Types.ObjectId;
    verificationProvider?: string;
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
    metadata?: Record<string, any>;
  }): Promise<IVerificationLog> {
    const { mobile, nid, nidType, status, subject, subjectType, subjectId, verificationProvider, ipAddress, userAgent, failureReason, metadata } = params;

    return this.recordLog({
      mobile,
      nid,
      nidType: nidType || (nid.length === 10 ? 'NID_10' : nid.length === 13 ? 'NID_13' : nid.length === 17 ? 'NID_17' : 'UNKNOWN'),
      verificationType: 'NID_VERIFICATION',
      status,
      purpose: 'KYC_IDENTITY_CHECK',
      subject: subject || 'CUSTOMER',
      subjectType: subjectType || 'CUSTOMER',
      subjectId,
      verificationProvider: verificationProvider || 'PORICHOY_GATEWAY',
      ipAddress,
      userAgent,
      failureReason,
      metadata,
    });
  }

  /**
   * Queries chronological verification attempts by NID (using its salted SHA-256 hash).
   */
  public static async queryByNid(rawNid: string) {
    const targetHash = hashNid(rawNid);
    return VerificationLogModel.find({ nidHash: targetHash })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Queries verification logs with multi-field filtering and pagination.
   */
  public static async queryLogs(filter: VerificationLogFilterDTO = {}) {
    const query: any = {};

    if (filter.mobile) {
      query.mobile = filter.mobile.trim();
    }
    if (filter.nidHash) {
      query.nidHash = filter.nidHash.trim();
    }
    if (filter.subject) {
      query.subject = filter.subject.trim();
    }
    if (filter.subjectType) {
      query.subjectType = filter.subjectType;
    }
    if (filter.subjectId) {
      query.subjectId = new Types.ObjectId(filter.subjectId);
    }
    if (filter.customerId) {
      query.customerId = new Types.ObjectId(filter.customerId);
    }
    if (filter.userId) {
      query.userId = new Types.ObjectId(filter.userId);
    }
    if (filter.verificationType) {
      query.verificationType = filter.verificationType;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
      if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      VerificationLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      VerificationLogModel.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves customer-facing verification history (for customer portal profile security screen).
   */
  public static async getCustomerVerificationHistory(
    customerId: string | Types.ObjectId,
    limit: number = 10
  ) {
    return VerificationLogModel.find({ customerId: new Types.ObjectId(customerId) })
      .select('verificationType status purpose nidMasked ipAddress createdAt')
      .sort({ createdAt: -1 })
      .limit(Math.min(50, Math.max(1, limit)))
      .lean();
  }

  /**
   * Checks if an NID is blacklisted/banned in the banned_nids collection.
   */
  public static async isNidBanned(rawNid: string): Promise<boolean> {
    const targetHash = hashNid(rawNid);
    const banned = await BannedNidModel.findOne({ nidHash: targetHash }).lean();
    return Boolean(banned);
  }

  /**
   * Adds an NID to the banned_nids blacklist collection.
   */
  public static async banNid(params: {
    nid: string;
    reason: string;
    bannedBy: string | Types.ObjectId;
  }) {
    const { nid, reason, bannedBy } = params;
    const targetHash = hashNid(nid);

    return BannedNidModel.findOneAndUpdate(
      { nidHash: targetHash },
      {
        nidHash: targetHash,
        reason: reason.trim(),
        bannedBy: new Types.ObjectId(bannedBy),
        bannedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

export default VerificationLogService;
