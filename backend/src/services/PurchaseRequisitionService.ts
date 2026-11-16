import { Types, ClientSession } from 'mongoose';
import { CounterService } from './CounterService';
import { ApprovalService } from './ApprovalService';
import { AuditLogService } from './AuditLogService';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from '../errors/AppError';
import logger from '../config/logger';

// Dynamic imports — models created by backend-models worker
let PurchaseRequisitionModel: any;
let IPurchaseRequisition: any;

async function getModel() {
  if (!PurchaseRequisitionModel) {
    try {
      const mod = await import('../models/PurchaseRequisition.js');
      PurchaseRequisitionModel = mod.PurchaseRequisitionModel;
    } catch (err) {
      throw new Error('PurchaseRequisition model not yet available. Ensure backend-models worker has completed.');
    }
  }
  return PurchaseRequisitionModel;
}

export interface CreateRequisitionDTO {
  department: string;
  requiredDeliveryDate: Date | string;
  warehouseId: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  items: Array<{
    productId: string;
    sku: string;
    productName: string;
    variantId?: string;
    requestedQty: number;
    uom: string;
    estimatedUnitPrice?: number;
    reason?: string;
  }>;
  attachments?: string[];
  notes?: string;
  requisitionDate?: Date | string;
}

export interface RequisitionFilterDTO {
  status?: string;
  department?: string;
  requestedBy?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class PurchaseRequisitionService {
  /**
   * Create a new Purchase Requisition with status DRAFT
   */
  public static async createRequisition(
    dto: CreateRequisitionDTO,
    userId: string,
    orgId: string
  ) {
    if (!Types.ObjectId.isValid(userId)) throw new ValidationError('Invalid userId');
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');
    if (!dto.items || dto.items.length === 0) throw new ValidationError('At least one item is required');

    const Model = await getModel();
    const requisitionNumber = await CounterService.getNextSequence('PR-REQ');

    const estimatedItems = dto.items.map((item) => ({
      productId: new Types.ObjectId(item.productId),
      sku: item.sku,
      productName: item.productName,
      variantId: item.variantId ? new Types.ObjectId(item.variantId) : undefined,
      requestedQty: item.requestedQty,
      uom: item.uom,
      estimatedUnitPrice: item.estimatedUnitPrice || 0,
      estimatedTotal: (item.requestedQty || 0) * (item.estimatedUnitPrice || 0),
      reason: item.reason,
      convertedQty: 0,
    }));

    const requisition = await Model.create({
      requisitionNumber,
      organizationId: new Types.ObjectId(orgId),
      department: dto.department,
      requestedBy: new Types.ObjectId(userId),
      requisitionDate: dto.requisitionDate ? new Date(dto.requisitionDate) : new Date(),
      requiredDeliveryDate: new Date(dto.requiredDeliveryDate),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      priority: dto.priority || 'NORMAL',
      items: estimatedItems,
      attachments: dto.attachments || [],
      notes: dto.notes,
      status: 'DRAFT',
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });

    logger.info(`PR created: ${requisitionNumber} by user ${userId}`);
    return requisition;
  }

  /**
   * Submit requisition: DRAFT → SUBMITTED, create ApprovalRequest
   */
  public static async submitRequisition(id: string, userId: string) {
    const Model = await getModel();
    const req = await Model.findById(id);
    if (!req) throw new NotFoundError('PurchaseRequisition', id);
    if (req.status !== 'DRAFT') {
      throw new ValidationError(`Cannot submit requisition in status '${req.status}'. Must be DRAFT.`);
    }

    const approvalRequest = await ApprovalService.createApprovalRequest(
      {
        documentType: 'PurchaseRequisition',
        documentId: id,
        documentRef: req.requisitionNumber,
        organizationId: req.organizationId?.toString(),
        module: 'PURCHASE',
        transactionType: 'PURCHASE_REQUISITION',
        transactionAmount: req.items.reduce(
          (sum: number, i: any) => sum + (i.estimatedTotal || 0),
          0
        ),
        transactionSnapshot: req.toObject(),
      },
      userId
    );

    req.status = 'SUBMITTED';
    req.approvalRequestId = approvalRequest._id;
    req.updatedBy = new Types.ObjectId(userId);
    await req.save();

    await AuditLogService.record({
      action: 'SUBMIT',
      targetCollection: 'purchaserequisitions',
      targetId: req._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: req.organizationId?.toString(),
    });

    return req;
  }

  /**
   * Approve a requisition: SUBMITTED/PENDING_APPROVAL → APPROVED
   */
  public static async approveRequisition(id: string, userId: string) {
    const Model = await getModel();
    const req = await Model.findById(id);
    if (!req) throw new NotFoundError('PurchaseRequisition', id);
    if (!['SUBMITTED', 'PENDING_APPROVAL'].includes(req.status)) {
      throw new ValidationError(`Cannot approve requisition in status '${req.status}'.`);
    }

    req.status = 'APPROVED';
    req.updatedBy = new Types.ObjectId(userId);
    await req.save();

    await AuditLogService.record({
      action: 'APPROVE',
      targetCollection: 'purchaserequisitions',
      targetId: req._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: req.organizationId?.toString(),
    });

    return req;
  }

  /**
   * Reject a requisition: → REJECTED with reason
   */
  public static async rejectRequisition(id: string, userId: string, reason: string) {
    const Model = await getModel();
    const req = await Model.findById(id);
    if (!req) throw new NotFoundError('PurchaseRequisition', id);
    if (!['SUBMITTED', 'PENDING_APPROVAL'].includes(req.status)) {
      throw new ValidationError(`Cannot reject requisition in status '${req.status}'.`);
    }
    if (!reason || reason.trim().length === 0) throw new ValidationError('Rejection reason is required.');

    req.status = 'REJECTED';
    req.updatedBy = new Types.ObjectId(userId);
    req.notes = reason;
    await req.save();

    await AuditLogService.record({
      action: 'REJECT',
      targetCollection: 'purchaserequisitions',
      targetId: req._id,
      actorId: userId,
      module: 'PURCHASE',
      diff: { reason },
      organizationId: req.organizationId?.toString(),
    });

    return req;
  }

  /**
   * Return a requisition for correction
   */
  public static async returnRequisition(id: string, userId: string, reason: string) {
    const Model = await getModel();
    const req = await Model.findById(id);
    if (!req) throw new NotFoundError('PurchaseRequisition', id);
    if (!['SUBMITTED', 'PENDING_APPROVAL'].includes(req.status)) {
      throw new ValidationError(`Cannot return requisition in status '${req.status}'.`);
    }
    if (!reason || reason.trim().length === 0) throw new ValidationError('Return reason is required.');

    req.status = 'RETURNED';
    req.updatedBy = new Types.ObjectId(userId);
    req.notes = reason;
    await req.save();

    await AuditLogService.record({
      action: 'RETURN',
      targetCollection: 'purchaserequisitions',
      targetId: req._id,
      actorId: userId,
      module: 'PURCHASE',
      diff: { reason },
      organizationId: req.organizationId?.toString(),
    });

    return req;
  }

  /**
   * Cancel a requisition: only allowed from DRAFT or SUBMITTED
   */
  public static async cancelRequisition(id: string, userId: string, reason: string) {
    const Model = await getModel();
    const req = await Model.findById(id);
    if (!req) throw new NotFoundError('PurchaseRequisition', id);
    if (!['DRAFT', 'SUBMITTED'].includes(req.status)) {
      throw new ValidationError(`Cannot cancel requisition in status '${req.status}'. Only DRAFT/SUBMITTED allowed.`);
    }
    if (!reason || reason.trim().length === 0) throw new ValidationError('Cancellation reason is required.');

    req.status = 'CANCELLED';
    req.updatedBy = new Types.ObjectId(userId);
    req.notes = reason;
    await req.save();

    await AuditLogService.record({
      action: 'CANCEL',
      targetCollection: 'purchaserequisitions',
      targetId: req._id,
      actorId: userId,
      module: 'PURCHASE',
      diff: { reason },
      organizationId: req.organizationId?.toString(),
    });

    return req;
  }

  /**
   * Convert approved requisition to PO metadata
   * Returns metadata for PO creation — does NOT create the PO itself
   */
  public static async convertToPurchaseOrder(
    id: string,
    selectedItems: Array<{ itemIndex: number; convertQty: number }>,
    userId: string
  ) {
    const Model = await getModel();
    const req = await Model.findById(id);
    if (!req) throw new NotFoundError('PurchaseRequisition', id);
    if (req.status !== 'APPROVED') {
      throw new ValidationError(`Requisition must be APPROVED to convert to PO. Current: '${req.status}'.`);
    }

    const poItems: any[] = [];

    for (const sel of selectedItems) {
      const item = req.items[sel.itemIndex];
      if (!item) throw new ValidationError(`Item at index ${sel.itemIndex} not found.`);

      const remaining = item.requestedQty - (item.convertedQty || 0);
      if (sel.convertQty > remaining) {
        throw new ValidationError(
          `Convert qty (${sel.convertQty}) exceeds remaining qty (${remaining}) for SKU ${item.sku}.`
        );
      }
      if (sel.convertQty <= 0) throw new ValidationError(`Convert qty must be > 0 for SKU ${item.sku}.`);

      item.convertedQty = (item.convertedQty || 0) + sel.convertQty;
      poItems.push({
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        variantId: item.variantId,
        requestedQty: sel.convertQty,
        uom: item.uom,
        estimatedUnitPrice: item.estimatedUnitPrice,
      });
    }

    // Update conversion status
    const allConverted = req.items.every(
      (i: any) => i.convertedQty >= i.requestedQty
    );
    req.status = allConverted ? 'FULLY_CONVERTED' : 'PARTIALLY_CONVERTED';
    req.updatedBy = new Types.ObjectId(userId);
    await req.save();

    await AuditLogService.record({
      action: 'CONVERT_TO_PO',
      targetCollection: 'purchaserequisitions',
      targetId: req._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: req.organizationId?.toString(),
    });

    return {
      requisitionId: req._id,
      requisitionNumber: req.requisitionNumber,
      organizationId: req.organizationId,
      warehouseId: req.warehouseId,
      items: poItems,
    };
  }

  /**
   * List requisitions with filters and pagination (org-scoped)
   */
  public static async listRequisitions(
    filters: RequisitionFilterDTO,
    orgId: string
  ) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const query: Record<string, any> = { organizationId: new Types.ObjectId(orgId) };

    if (filters.status) query.status = filters.status.toUpperCase();
    if (filters.department) query.department = new RegExp(filters.department, 'i');
    if (filters.priority) query.priority = filters.priority.toUpperCase();
    if (filters.requestedBy && Types.ObjectId.isValid(filters.requestedBy)) {
      query.requestedBy = new Types.ObjectId(filters.requestedBy);
    }
    if (filters.startDate || filters.endDate) {
      query.requisitionDate = {};
      if (filters.startDate) query.requisitionDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.requisitionDate.$lte = new Date(filters.endDate);
    }
    if (filters.search) {
      query.$or = [
        { requisitionNumber: new RegExp(filters.search, 'i') },
        { department: new RegExp(filters.search, 'i') },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Model.find(query)
        .populate('requestedBy', 'fullName email')
        .populate('warehouseId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get single requisition by ID with org check
   */
  public static async getRequisitionById(id: string, orgId: string) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('PurchaseRequisition', id);
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const req = await Model.findOne({
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(orgId),
    })
      .populate('requestedBy', 'fullName email mobile')
      .populate('warehouseId', 'name code address')
      .populate('approvalRequestId')
      .lean();

    if (!req) throw new NotFoundError('PurchaseRequisition', id);
    return req;
  }

  /**
   * Dashboard stats: aggregate counts by status for org
   */
  public static async getDashboardStats(
    orgId: string,
    dateFilter?: { startDate?: string; endDate?: string }
  ) {
    const Model = await getModel();
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const matchStage: Record<string, any> = { organizationId: new Types.ObjectId(orgId) };
    if (dateFilter?.startDate || dateFilter?.endDate) {
      matchStage.requisitionDate = {};
      if (dateFilter.startDate) matchStage.requisitionDate.$gte = new Date(dateFilter.startDate);
      if (dateFilter.endDate) matchStage.requisitionDate.$lte = new Date(dateFilter.endDate);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: { $sum: '$items.estimatedTotal' } },
        },
      },
    ];

    const result = await Model.aggregate(pipeline);

    const stats: Record<string, any> = {
      DRAFT: 0, SUBMITTED: 0, PENDING_APPROVAL: 0, APPROVED: 0,
      REJECTED: 0, RETURNED: 0, PARTIALLY_CONVERTED: 0, FULLY_CONVERTED: 0, CANCELLED: 0,
      total: 0,
    };

    for (const r of result) {
      if (stats[r._id] !== undefined) stats[r._id] = r.count;
      stats.total += r.count;
    }

    return stats;
  }
}
