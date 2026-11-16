import { Types, ClientSession } from 'mongoose';
import { CounterService } from './CounterService';
import { ApprovalService } from './ApprovalService';
import { AccountingService } from './AccountingService';
import { StockLedgerService } from './StockLedgerService';
import { AuditLogService } from './AuditLogService';
import {
  NotFoundError,
  ValidationError,
} from '../errors/AppError';
import logger from '../config/logger';

// Dynamic model imports
let PurchaseReturnModel: any;
let ProductBatchModel: any;

async function getReturnModel() {
  if (!PurchaseReturnModel) {
    try {
      const mod = await import('../models/PurchaseReturn.js');
      PurchaseReturnModel = mod.PurchaseReturnModel;
    } catch {
      throw new Error('PurchaseReturn model not yet available.');
    }
  }
  return PurchaseReturnModel;
}

async function getBatchModel() {
  if (!ProductBatchModel) {
    try {
      const mod = await import('../models/ProductBatch.js');
      ProductBatchModel = mod.ProductBatchModel || mod.default;
    } catch {
      throw new Error('ProductBatch model not yet available.');
    }
  }
  return ProductBatchModel;
}

export interface CreateReturnDTO {
  supplierId: string;
  grnId?: string;
  invoiceId?: string;
  warehouseId: string;
  returnDate?: Date | string;
  reason: string;
  items: Array<{
    productId: string;
    sku: string;
    productName: string;
    batchNumber?: string;
    batchId?: string;
    returnedQty: number;
    uom: string;
    unitCost: number;
    returnReason?: string;
  }>;
  notes?: string;
  attachments?: string[];
}

export interface ReturnFilterDTO {
  status?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class PurchaseReturnService {
  /**
   * Create a purchase return in DRAFT status
   */
  public static async createReturn(dto: CreateReturnDTO, userId: string, orgId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new ValidationError('Invalid userId');
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');
    if (!dto.grnId && !dto.invoiceId) {
      throw new ValidationError('Either grnId or invoiceId must be provided.');
    }
    if (!dto.items || dto.items.length === 0) throw new ValidationError('At least one item is required.');
    if (!dto.reason || dto.reason.trim().length === 0) throw new ValidationError('Return reason is required.');

    const Model = await getReturnModel();

    // Validate source document and quantities
    if (dto.grnId) {
      if (!Types.ObjectId.isValid(dto.grnId)) throw new ValidationError('Invalid grnId');
      let GrnModel: any;
      try {
        const mod = await import('../models/GoodsReceiveNote.js');
        GrnModel = mod.GoodsReceiveNoteModel;
      } catch {
        throw new Error('GoodsReceiveNote model not available for return validation.');
      }

      const grn = await GrnModel.findOne({
        _id: new Types.ObjectId(dto.grnId),
        organizationId: new Types.ObjectId(orgId),
      });
      if (!grn) throw new NotFoundError('GoodsReceiveNote', dto.grnId);
      if (grn.status !== 'POSTED') {
        throw new ValidationError('Can only return items from POSTED GRNs.');
      }

      // Validate return quantities don't exceed received quantities
      for (const item of dto.items) {
        const grnItem = grn.items?.find((gi: any) => gi.sku === item.sku);
        if (!grnItem) throw new ValidationError(`SKU '${item.sku}' not found in GRN.`);
        const eligible = grnItem.acceptedQty; // simplification; full impl checks prior returns
        if (item.returnedQty > eligible) {
          throw new ValidationError(
            `Return qty (${item.returnedQty}) exceeds eligible qty (${eligible}) for SKU '${item.sku}'.`
          );
        }
      }
    }

    const returnNumber = await CounterService.getNextSequence('PRTN');
    const totalReturnValue = dto.items.reduce((s, i) => s + i.returnedQty * i.unitCost, 0);

    const lineItems = dto.items.map((item) => ({
      productId: new Types.ObjectId(item.productId),
      sku: item.sku,
      productName: item.productName,
      batchNumber: item.batchNumber,
      batchId: item.batchId ? new Types.ObjectId(item.batchId) : undefined,
      returnedQty: item.returnedQty,
      uom: item.uom,
      unitCost: item.unitCost,
      lineTotal: item.returnedQty * item.unitCost,
      returnReason: item.returnReason,
    }));

    const purchaseReturn = await Model.create({
      returnNumber,
      organizationId: new Types.ObjectId(orgId),
      supplierId: new Types.ObjectId(dto.supplierId),
      grnId: dto.grnId ? new Types.ObjectId(dto.grnId) : undefined,
      invoiceId: dto.invoiceId ? new Types.ObjectId(dto.invoiceId) : undefined,
      warehouseId: new Types.ObjectId(dto.warehouseId),
      returnDate: dto.returnDate ? new Date(dto.returnDate as string) : new Date(),
      reason: dto.reason,
      items: lineItems,
      totalReturnValue,
      notes: dto.notes,
      attachments: dto.attachments || [],
      status: 'DRAFT',
      createdBy: new Types.ObjectId(userId),
    });

    logger.info(`Purchase Return created: ${returnNumber}`);
    return purchaseReturn;
  }

  /**
   * Submit purchase return for approval
   */
  public static async submitReturn(id: string, userId: string) {
    const Model = await getReturnModel();
    const ret = await Model.findById(id);
    if (!ret) throw new NotFoundError('PurchaseReturn', id);
    if (ret.status !== 'DRAFT') {
      throw new ValidationError(`Cannot submit return in status '${ret.status}'.`);
    }

    const approvalRequest = await ApprovalService.createApprovalRequest(
      {
        documentType: 'PurchaseReturn',
        documentId: id,
        documentRef: ret.returnNumber,
        organizationId: ret.organizationId?.toString(),
        module: 'PURCHASE',
        transactionType: 'PURCHASE_RETURN',
        transactionAmount: ret.totalReturnValue,
        transactionSnapshot: ret.toObject(),
      },
      userId
    );

    ret.status = 'SUBMITTED';
    ret.approvalRequestId = approvalRequest._id;
    await ret.save();

    await AuditLogService.record({
      action: 'SUBMIT',
      targetCollection: 'purchasereturns',
      targetId: ret._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: ret.organizationId?.toString(),
    });

    return ret;
  }

  /**
   * Post purchase return: adjust stock, create JV, update status
   */
  public static async postReturn(id: string, userId: string, session: ClientSession) {
    const Model = await getReturnModel();
    const BatchModel = await getBatchModel();

    const ret = await Model.findById(id).session(session);
    if (!ret) throw new NotFoundError('PurchaseReturn', id);

    // IDEMPOTENCY CHECK
    if (ret.status === 'POSTED') {
      logger.warn(`Return ${ret.returnNumber} already posted — returning existing.`);
      return ret;
    }
    if (!['DRAFT', 'SUBMITTED', 'APPROVED'].includes(ret.status)) {
      throw new ValidationError(`Return cannot be posted in status '${ret.status}'.`);
    }

    for (const item of ret.items) {
      if (item.returnedQty <= 0) continue;

      // Find batch for stock deduction
      const batchQuery: Record<string, any> = { sku: item.sku, warehouseId: ret.warehouseId };
      if (item.batchId) batchQuery._id = item.batchId;
      else if (item.batchNumber) batchQuery.batchNumber = item.batchNumber;

      const batch = await BatchModel.findOne(batchQuery).session(session);

      if (batch) {
        // StockLedgerService.recordMovement atomically decrements ProductBatch.currentQty.
        // No separate findByIdAndUpdate needed.
        await StockLedgerService.recordMovement(
          {
            sku: item.sku,
            batchId: batch._id,
            warehouseId: ret.warehouseId,
            movementType: 'ADJUST',
            qtyChange: -item.returnedQty,
            unitCost: item.unitCost,
            referenceNo: ret.returnNumber,
            referenceType: 'ADJUSTMENT',
            createdBy: userId,
            notes: `Purchase Return: ${ret.reason}`,
          },
          session
        );
      } else {
        logger.warn(`Batch not found for SKU '${item.sku}' in return ${ret.returnNumber}. Stock not adjusted.`);
      }
    }

    // Journal Entry:
    // DR: Accounts Payable (reduce liability — supplier owes us)
    // CR: Inventory (reduce inventory)
    const apAccountCode = 2100;
    const inventoryAccountCode = 1300;

    await AccountingService.createJournalVoucher(
      {
        voucherType: 'PURCHASE',
        transactionDate: ret.returnDate || new Date(),
        sourceDocumentRef: ret.returnNumber,
        idempotencyKey: `PRTN-POST-${ret._id.toString()}`,
        notes: `Purchase Return: ${ret.returnNumber} | Reason: ${ret.reason}`,
        lines: [
          {
            accountCode: apAccountCode,
            accountName: 'Accounts Payable',
            debit: ret.totalReturnValue,
            credit: 0,
            description: `Return debit to supplier (${ret.returnNumber})`,
          },
          {
            accountCode: inventoryAccountCode,
            accountName: 'Inventory',
            debit: 0,
            credit: ret.totalReturnValue,
            description: `Inventory reduction on return (${ret.returnNumber})`,
          },
        ],
      },
      userId,
      session
    );

    ret.status = 'POSTED';
    ret.postedAt = new Date();
    await ret.save({ session });

    await AuditLogService.record({
      action: 'POST_RETURN',
      targetCollection: 'purchasereturns',
      targetId: ret._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: ret.organizationId?.toString(),
    });

    logger.info(`Purchase Return posted: ${ret.returnNumber}`);
    return ret;
  }

  /**
   * List returns with filters (org-scoped)
   */
  public static async listReturns(filters: ReturnFilterDTO, orgId: string) {
    const Model = await getReturnModel();
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const query: Record<string, any> = { organizationId: new Types.ObjectId(orgId) };
    if (filters.status) query.status = filters.status.toUpperCase();
    if (filters.supplierId && Types.ObjectId.isValid(filters.supplierId)) {
      query.supplierId = new Types.ObjectId(filters.supplierId);
    }
    if (filters.startDate || filters.endDate) {
      query.returnDate = {};
      if (filters.startDate) query.returnDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.returnDate.$lte = new Date(filters.endDate);
    }
    if (filters.search) query.returnNumber = new RegExp(filters.search, 'i');

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Model.find(query)
        .populate('supplierId', 'companyName supplierCode')
        .populate('grnId', 'grnNumber')
        .populate('invoiceId', 'invoiceNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get single return by ID (org-scoped)
   */
  public static async getReturnById(id: string, orgId: string) {
    const Model = await getReturnModel();
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('PurchaseReturn', id);

    const ret = await Model.findOne({
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(orgId),
    })
      .populate('supplierId', 'companyName supplierCode email phone')
      .populate('grnId', 'grnNumber receivingDate warehouseId')
      .populate('invoiceId', 'invoiceNumber grandTotal')
      .populate('warehouseId', 'name code')
      .lean();

    if (!ret) throw new NotFoundError('PurchaseReturn', id);
    return ret;
  }
}
