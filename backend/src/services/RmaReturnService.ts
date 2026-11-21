import { Types } from 'mongoose';
import { RmaRequest, IRmaRequest, IRmaItem, RmaStatus } from '../models/RmaRequest';
import { ReturnInspection, IReturnInspection, IInspectionItem } from '../models/ReturnInspection';
import { SupportSettings } from '../models/SupportSettings';
import { CounterService } from './CounterService';
import { SupportAiService } from './SupportAiService';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';

export interface CreateRmaDTO {
  organizationId: string;
  ticketId?: string;
  orderId?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  purchaseDate?: Date | string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  returnType: IRmaRequest['returnType'];
  items: IRmaItem[];
  shippingMethod?: IRmaRequest['shippingMethod'];
  pickupAddress?: string;
  internalNotes?: string;
  actorId?: string;
}

export class RmaReturnService {
  /**
   * Create an RMA return request with automated AI policy eligibility check
   */
  public static async createRmaRequest(dto: CreateRmaDTO): Promise<IRmaRequest> {
    let rmaNumber = '';
    try {
      rmaNumber = await CounterService.getNextSequence('RMA');
    } catch {
      rmaNumber = `RMA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const settings = await SupportSettings.findOne({ organizationId: new Types.ObjectId(dto.organizationId) });
    const returnWindowDays = settings?.returnWindowDays || 14;

    // Run AI eligibility assessment
    const firstReason = dto.items[0]?.reason || 'DEFECTIVE';
    const pDate = dto.purchaseDate || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const aiAssessment = SupportAiService.assessReturnEligibility(pDate, firstReason, returnWindowDays);

    const totalReturnAmount = dto.items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);

    const rma = new RmaRequest({
      organizationId: new Types.ObjectId(dto.organizationId),
      rmaNumber,
      ticketId: dto.ticketId ? new Types.ObjectId(dto.ticketId) : undefined,
      orderId: dto.orderId ? new Types.ObjectId(dto.orderId) : undefined,
      orderNumber: dto.orderNumber,
      invoiceNumber: dto.invoiceNumber,
      customerId: dto.customerId ? new Types.ObjectId(dto.customerId) : undefined,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      items: dto.items,
      returnType: dto.returnType,
      status: 'SUBMITTED',
      approvalStatus: 'PENDING',
      shippingMethod: dto.shippingMethod || 'COURIER_PICKUP',
      pickupAddress: dto.pickupAddress,
      totalReturnAmount,
      refundStatus: dto.returnType === 'RETURN_FOR_REFUND' ? 'PENDING_APPROVAL' : 'NOT_APPLICABLE',
      aiEligibilityAssessment: {
        isEligible: aiAssessment.isEligible,
        confidenceScore: aiAssessment.confidenceScore,
        policyViolations: aiAssessment.policyViolations,
        recommendedAction: aiAssessment.recommendedAction,
        riskLevel: aiAssessment.riskLevel,
      },
      internalNotes: dto.internalNotes,
    });

    await rma.save();

    const safeActorId = Types.ObjectId.isValid(dto.actorId || '') ? new Types.ObjectId(dto.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'RMA_CREATED',
      actorId: safeActorId,
      actorRole: 'SUPPORT_AGENT',
      organizationId: dto.organizationId,
      targetCollection: 'rma_requests',
      targetId: rma._id,
      afterSnapshot: { rmaNumber, returnType: rma.returnType, totalReturnAmount },
    });

    return rma;
  }

  /**
   * List RMA requests with filters & pagination
   */
  public static async getRmaRequests(
    organizationId: string,
    query: {
      status?: string;
      approvalStatus?: string;
      returnType?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ rmas: IRmaRequest[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (query.status && query.status !== 'ALL') filter.status = query.status;
    if (query.approvalStatus && query.approvalStatus !== 'ALL') filter.approvalStatus = query.approvalStatus;
    if (query.returnType && query.returnType !== 'ALL') filter.returnType = query.returnType;

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { rmaNumber: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { orderNumber: searchRegex },
        { invoiceNumber: searchRegex },
        { courierTrackingNumber: searchRegex },
      ];
    }

    const [rmas, total] = await Promise.all([
      RmaRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RmaRequest.countDocuments(filter),
    ]);

    return {
      rmas: rmas as any,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single RMA by ID with its inspection history
   */
  public static async getRmaById(
    organizationId: string,
    rmaId: string
  ): Promise<{ rma: IRmaRequest; inspections: IReturnInspection[] } | null> {
    const isObjectId = Types.ObjectId.isValid(rmaId);
    const filter: any = { organizationId: new Types.ObjectId(organizationId) };
    if (isObjectId) {
      filter.$or = [{ _id: new Types.ObjectId(rmaId) }, { rmaNumber: rmaId.toUpperCase() }];
    } else {
      filter.rmaNumber = rmaId.toUpperCase();
    }

    const rma = await RmaRequest.findOne(filter);
    if (!rma) return null;

    const inspections = await ReturnInspection.find({
      organizationId: rma.organizationId,
      rmaId: rma._id,
    }).sort({ inspectionDate: -1 }).lean();

    return { rma, inspections: inspections as any };
  }

  /**
   * Human approval / rejection of RMA request
   */
  public static async approveOrRejectRma(
    organizationId: string,
    rmaId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
    actorId?: string
  ): Promise<IRmaRequest | null> {
    const rma = await RmaRequest.findOne({
      _id: new Types.ObjectId(rmaId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!rma) return null;

    rma.approvalStatus = decision;
    rma.approvedBy = actorId ? new Types.ObjectId(actorId) : undefined;
    rma.approvedAt = new Date();

    if (decision === 'APPROVED') {
      rma.status = 'APPROVED';
    } else {
      rma.status = 'REJECTED';
      rma.rejectionReason = rejectionReason;
    }

    await rma.save();

    const safeActorId = Types.ObjectId.isValid(actorId || '') ? new Types.ObjectId(actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: decision === 'APPROVED' ? 'RMA_APPROVED' : 'RMA_REJECTED',
      actorId: safeActorId,
      actorRole: 'MANAGER',
      organizationId,
      targetCollection: 'rma_requests',
      targetId: rma._id,
      afterSnapshot: { rmaNumber: rma.rmaNumber, decision, rejectionReason },
    });

    return rma;
  }

  /**
   * Update shipping and pickup details
   */
  public static async updateShipping(
    organizationId: string,
    rmaId: string,
    data: {
      courierName?: string;
      courierTrackingNumber?: string;
      pickupScheduledDate?: Date | string;
      status?: RmaStatus;
      actorId?: string;
    }
  ): Promise<IRmaRequest | null> {
    const rma = await RmaRequest.findOne({
      _id: new Types.ObjectId(rmaId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!rma) return null;

    if (data.courierName) rma.courierName = data.courierName;
    if (data.courierTrackingNumber) rma.courierTrackingNumber = data.courierTrackingNumber;
    if (data.pickupScheduledDate) rma.pickupScheduledDate = new Date(data.pickupScheduledDate);
    if (data.status) rma.status = data.status;
    else if (!rma.status || rma.status === 'APPROVED') rma.status = 'SHIPPING_REQUESTED';

    await rma.save();
    return rma;
  }

  /**
   * Perform Physical / Quality Inspection on Returned Item
   */
  public static async createInspection(
    organizationId: string,
    rmaId: string,
    data: {
      inspectorId: string;
      inspectorName: string;
      items: IInspectionItem[];
      overallOutcome: IReturnInspection['overallOutcome'];
      restockApproved: boolean;
      photos?: string[];
      notes?: string;
    }
  ): Promise<IReturnInspection> {
    const rma = await RmaRequest.findOne({
      _id: new Types.ObjectId(rmaId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!rma) throw new Error('RMA request not found');

    let inspectionNumber = '';
    try {
      inspectionNumber = await CounterService.getNextSequence('INSP');
    } catch {
      inspectionNumber = `INSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const inspection = new ReturnInspection({
      organizationId: new Types.ObjectId(organizationId),
      inspectionNumber,
      rmaId: rma._id,
      inspectorId: new Types.ObjectId(data.inspectorId),
      inspectorName: data.inspectorName,
      inspectionDate: new Date(),
      items: data.items,
      overallOutcome: data.overallOutcome,
      restockApproved: data.restockApproved,
      photos: data.photos || [],
      notes: data.notes,
    });

    await inspection.save();

    // Update RMA status
    rma.status = 'INSPECTED';
    rma.receivedDate = new Date();
    await rma.save();

    const safeActorId = Types.ObjectId.isValid(data.inspectorId) ? new Types.ObjectId(data.inspectorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'RMA_INSPECTED',
      actorId: safeActorId,
      actorRole: 'INSPECTOR',
      organizationId,
      targetCollection: 'return_inspections',
      targetId: inspection._id,
      afterSnapshot: { inspectionNumber, overallOutcome: data.overallOutcome, restockApproved: data.restockApproved },
    });

    return inspection;
  }

  /**
   * Process and finalize refund
   */
  public static async processRefund(
    organizationId: string,
    rmaId: string,
    data: { refundVoucherNumber?: string; actorId?: string }
  ): Promise<IRmaRequest | null> {
    const rma = await RmaRequest.findOne({
      _id: new Types.ObjectId(rmaId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!rma) return null;

    let voucherNumber = data.refundVoucherNumber;
    if (!voucherNumber) {
      try {
        voucherNumber = await CounterService.getNextSequence('JV');
      } catch {
        voucherNumber = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    rma.refundStatus = 'REFUNDED';
    rma.refundVoucherNumber = voucherNumber;
    rma.status = 'COMPLETED';
    await rma.save();

    const safeActorId = Types.ObjectId.isValid(data.actorId || '') ? new Types.ObjectId(data.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'RMA_REFUNDED',
      actorId: safeActorId,
      actorRole: 'ACCOUNTS_OFFICER',
      organizationId,
      targetCollection: 'rma_requests',
      targetId: rma._id,
      afterSnapshot: { rmaNumber: rma.rmaNumber, refundAmount: rma.totalReturnAmount, voucherNumber },
    });

    return rma;
  }

  /**
   * Complete replacement or exchange order link
   */
  public static async completeReplacement(
    organizationId: string,
    rmaId: string,
    data: { replacementOrderNumber: string; replacementOrderId?: string; actorId?: string }
  ): Promise<IRmaRequest | null> {
    const rma = await RmaRequest.findOne({
      _id: new Types.ObjectId(rmaId),
      organizationId: new Types.ObjectId(organizationId),
    });
    if (!rma) return null;

    rma.replacementOrderNumber = data.replacementOrderNumber;
    if (data.replacementOrderId && Types.ObjectId.isValid(data.replacementOrderId)) {
      rma.replacementOrderId = new Types.ObjectId(data.replacementOrderId);
    }
    rma.status = 'COMPLETED';
    await rma.save();

    const safeActorId = Types.ObjectId.isValid(data.actorId || '') ? new Types.ObjectId(data.actorId) : new Types.ObjectId('000000000000000000000001');
    await AuditLogService.logAction({
      action: 'RMA_REPLACEMENT_DISPATCHED',
      actorId: safeActorId,
      actorRole: 'DISPATCH_OFFICER',
      organizationId,
      targetCollection: 'rma_requests',
      targetId: rma._id,
      afterSnapshot: { rmaNumber: rma.rmaNumber, replacementOrderNumber: data.replacementOrderNumber },
    });

    return rma;
  }
}
