import { Types, ClientSession } from 'mongoose';
import { CounterService } from './CounterService';
import { StockLedgerService } from './StockLedgerService';
import { AuditLogService } from './AuditLogService';
import {
  NotFoundError,
  ValidationError,
} from '../errors/AppError';
import logger from '../config/logger';

// Dynamic model imports — awaiting backend-models worker
let GoodsReceiveNoteModel: any;
let PurchaseOrderModel: any;
let ProductBatchModel: any;

async function getGrnModel() {
  if (!GoodsReceiveNoteModel) {
    try {
      const mod = await import('../models/GoodsReceiveNote.js');
      GoodsReceiveNoteModel = mod.GoodsReceiveNoteModel;
    } catch {
      throw new Error('GoodsReceiveNote model not yet available.');
    }
  }
  return GoodsReceiveNoteModel;
}

async function getPoModel() {
  if (!PurchaseOrderModel) {
    try {
      const mod = await import('../models/PurchaseOrder.js');
      PurchaseOrderModel = mod.PurchaseOrderModel || mod.default;
    } catch {
      throw new Error('PurchaseOrder model not yet available.');
    }
  }
  return PurchaseOrderModel;
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

function determineBatchCategory(expiryDate?: Date): 'EXPIRY_CONTROLLED' | 'NON_EXPIRING' {
  return expiryDate ? 'EXPIRY_CONTROLLED' : 'NON_EXPIRING';
}

export interface CreateGrnDTO {
  purchaseOrderId: string;
  supplierId: string;
  warehouseId: string;
  receivingDate?: Date | string;
  receivedBy?: string;
  items: Array<{
    productId: string;
    sku: string;
    productName: string;
    variantId?: string;
    orderedQty: number;
    previouslyReceivedQty?: number;
    currentReceivedQty: number;
    acceptedQty: number;
    rejectedQty?: number;
    damagedQty?: number;
    uom: string;
    batchNumber?: string;
    manufacturingDate?: Date | string;
    expiryDate?: Date | string;
    unitCost: number;
    inspectionStatus?: 'PENDING' | 'PASSED' | 'FAILED' | 'PARTIAL';
    notes?: string;
  }>;
  receivingNotes?: string;
  attachments?: string[];
}

export interface GrnFilterDTO {
  status?: string;
  supplierId?: string;
  purchaseOrderId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class GrnService {
  /**
   * Create a new GRN in DRAFT status
   */
  public static async createGrn(dto: CreateGrnDTO, userId: string, orgId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new ValidationError('Invalid userId');
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');
    if (!dto.items || dto.items.length === 0) throw new ValidationError('At least one item is required');

    const GrnModel = await getGrnModel();
    const PoModel = await getPoModel();

    // Validate PO
    const po = await PoModel.findOne({
      _id: new Types.ObjectId(dto.purchaseOrderId),
      organizationId: new Types.ObjectId(orgId),
    });
    if (!po) throw new NotFoundError('PurchaseOrder', dto.purchaseOrderId);
    if (!['APPROVED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
      throw new ValidationError(`PO status must be APPROVED or PARTIALLY_RECEIVED. Current: '${po.status}'.`);
    }

    // Validate quantities against PO remaining
    for (const item of dto.items) {
      const poItem = po.items?.find((pi: any) => pi.sku === item.sku);
      if (!poItem) throw new ValidationError(`SKU '${item.sku}' not found in PO.`);

      const received = poItem.receivedQty || 0;
      const ordered = poItem.orderedQty ?? poItem.quantity ?? 0;
      const remaining = ordered - received;
      if (item.currentReceivedQty > remaining) {
        throw new ValidationError(
          `Received qty (${item.currentReceivedQty}) exceeds remaining qty (${remaining}) for SKU '${item.sku}'.`
        );
      }
    }

    const grnNumber = await CounterService.getNextSequence('GRN');

    const lineItems = dto.items.map((item) => ({
      productId: new Types.ObjectId(item.productId),
      sku: item.sku,
      productName: item.productName,
      variantId: item.variantId ? new Types.ObjectId(item.variantId) : undefined,
      orderedQty: item.orderedQty,
      previouslyReceivedQty: item.previouslyReceivedQty || 0,
      currentReceivedQty: item.currentReceivedQty,
      acceptedQty: item.acceptedQty,
      rejectedQty: item.rejectedQty || 0,
      damagedQty: item.damagedQty || 0,
      uom: item.uom,
      batchNumber: item.batchNumber,
      manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate as string) : undefined,
      expiryDate: item.expiryDate ? new Date(item.expiryDate as string) : undefined,
      unitCost: item.unitCost,
      lineTotal: item.acceptedQty * item.unitCost,
      inspectionStatus: item.inspectionStatus || 'PENDING',
      notes: item.notes,
    }));

    const totalAcceptedValue = lineItems.reduce((s, i) => s + i.lineTotal, 0);

    const grn = await GrnModel.create({
      grnNumber,
      organizationId: new Types.ObjectId(orgId),
      supplierId: new Types.ObjectId(dto.supplierId),
      purchaseOrderId: new Types.ObjectId(dto.purchaseOrderId),
      receivingDate: dto.receivingDate ? new Date(dto.receivingDate as string) : new Date(),
      warehouseId: new Types.ObjectId(dto.warehouseId),
      receivedBy: dto.receivedBy ? new Types.ObjectId(dto.receivedBy) : new Types.ObjectId(userId),
      items: lineItems,
      totalAcceptedValue,
      receivingNotes: dto.receivingNotes,
      attachments: dto.attachments || [],
      status: 'DRAFT',
      createdBy: new Types.ObjectId(userId),
    });

    logger.info(`GRN created: ${grnNumber}`);
    return grn;
  }

  /**
   * Post a GRN: update stock ledger, batch quantities, PO status
   * Must be called within a MongoDB transaction session
   */
  public static async postGrn(id: string, userId: string, session: ClientSession) {
    const GrnModel = await getGrnModel();
    const PoModel = await getPoModel();
    const BatchModel = await getBatchModel();

    const grn = await GrnModel.findById(id).session(session);
    if (!grn) throw new NotFoundError('GoodsReceiveNote', id);

    // IDEMPOTENCY CHECK
    if (grn.status === 'POSTED') {
      logger.warn(`GRN ${grn.grnNumber} already posted — returning existing.`);
      return grn;
    }
    if (grn.status !== 'DRAFT') {
      throw new ValidationError(`GRN cannot be posted in status '${grn.status}'.`);
    }

    const po = await PoModel.findById(grn.purchaseOrderId).session(session);
    if (!po) throw new NotFoundError('PurchaseOrder', grn.purchaseOrderId.toString());

    for (const item of grn.items) {
      if (item.acceptedQty <= 0) continue;

      const expiryDate = item.expiryDate ? new Date(item.expiryDate) : undefined;
      const batchKey = {
        sku: item.sku,
        batchNumber: item.batchNumber || `${grn.grnNumber}-${item.sku}`,
        warehouseId: grn.warehouseId,
      };

      // Find or create ProductBatch
      let batch = await BatchModel.findOne(batchKey).session(session);

      // Note: StockLedgerService.recordMovement atomically updates ProductBatch.currentQty.
      // For existing batches: recordMovement handles the increment.
      // For new batches: create with currentQty=0, recordMovement will set it to acceptedQty.
      if (!batch) {
        // Create new batch with currentQty=0 — recordMovement below will increment it
        [batch] = await BatchModel.create(
          [
            {
              productId: item.productId,
              sku: item.sku,
              batchNumber: batchKey.batchNumber,
              category: determineBatchCategory(expiryDate),
              manufacturingDate: item.manufacturingDate,
              expiryDate,
              baseUom: item.uom || 'PIECE',
              unitCost: item.unitCost,
              currentQty: 0,
              warehouseId: grn.warehouseId,
            },
          ],
          { session }
        );
      }

      // Record stock ledger movement — also atomically updates ProductBatch.currentQty
      await StockLedgerService.recordMovement(
        {
          sku: item.sku,
          batchId: batch._id,
          warehouseId: grn.warehouseId,
          movementType: 'GRN_IN',
          qtyChange: item.acceptedQty,
          unitCost: item.unitCost,
          referenceNo: grn.grnNumber,
          referenceType: 'GRN',
          createdBy: userId,
        },
        session
      );

      // Update PO item receivedQty
      const poItem = po.items?.find((pi: any) => pi.sku === item.sku);
      if (poItem) {
        poItem.receivedQty = (poItem.receivedQty || 0) + item.acceptedQty;
      }
    }

    // Determine new PO status
    const allReceived = po.items?.every(
      (pi: any) => (pi.receivedQty || 0) >= pi.orderedQty
    );
    po.status = allReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
    await po.save({ session });

    // Update GRN status
    grn.status = 'POSTED';
    grn.postedAt = new Date();
    await grn.save({ session });

    await AuditLogService.record({
      action: 'POST_GRN',
      targetCollection: 'goodsreceivenotes',
      targetId: grn._id,
      actorId: userId,
      module: 'PURCHASE',
      organizationId: grn.organizationId?.toString(),
    });

    logger.info(`GRN posted: ${grn.grnNumber}`);
    return grn;
  }

  /**
   * Reverse a posted GRN: deduct stock via StockLedgerService
   */
  public static async reverseGrn(id: string, userId: string, reason: string, session: ClientSession) {
    const GrnModel = await getGrnModel();
    const BatchModel = await getBatchModel();

    const grn = await GrnModel.findById(id).session(session);
    if (!grn) throw new NotFoundError('GoodsReceiveNote', id);
    if (grn.status !== 'POSTED') {
      throw new ValidationError(`Only POSTED GRNs can be reversed. Current: '${grn.status}'.`);
    }
    if (!reason || reason.trim().length === 0) throw new ValidationError('Reversal reason is required.');

    for (const item of grn.items) {
      if (item.acceptedQty <= 0) continue;

      const batchKey = {
        sku: item.sku,
        batchNumber: item.batchNumber || `${grn.grnNumber}-${item.sku}`,
        warehouseId: grn.warehouseId,
      };

      const batch = await BatchModel.findOne(batchKey).session(session);
      if (batch) {
        // StockLedgerService.recordMovement atomically decrements currentQty.
        await StockLedgerService.recordMovement(
          {
            sku: item.sku,
            batchId: batch._id,
            warehouseId: grn.warehouseId,
            movementType: 'ADJUST',
            qtyChange: -item.acceptedQty,
            unitCost: item.unitCost,
            referenceNo: grn.grnNumber,
            referenceType: 'ADJUSTMENT',
            createdBy: userId,
            notes: `GRN Reversal: ${reason}`,
          },
          session
        );
      }
    }

    grn.status = 'REVERSED';
    grn.reversedAt = new Date();
    grn.reversalReason = reason;
    await grn.save({ session });

    await AuditLogService.record({
      action: 'REVERSE_GRN',
      targetCollection: 'goodsreceivenotes',
      targetId: grn._id,
      actorId: userId,
      module: 'PURCHASE',
      diff: { reason },
      organizationId: grn.organizationId?.toString(),
    });

    return grn;
  }

  /**
   * List GRNs with filters (org-scoped)
   */
  public static async listGrns(filters: GrnFilterDTO, orgId: string) {
    const GrnModel = await getGrnModel();
    if (!Types.ObjectId.isValid(orgId)) throw new ValidationError('Invalid orgId');

    const query: Record<string, any> = { organizationId: new Types.ObjectId(orgId) };
    if (filters.status) query.status = filters.status.toUpperCase();
    if (filters.supplierId && Types.ObjectId.isValid(filters.supplierId)) {
      query.supplierId = new Types.ObjectId(filters.supplierId);
    }
    if (filters.purchaseOrderId && Types.ObjectId.isValid(filters.purchaseOrderId)) {
      query.purchaseOrderId = new Types.ObjectId(filters.purchaseOrderId);
    }
    if (filters.startDate || filters.endDate) {
      query.receivingDate = {};
      if (filters.startDate) query.receivingDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.receivingDate.$lte = new Date(filters.endDate);
    }
    if (filters.search) {
      query.grnNumber = new RegExp(filters.search, 'i');
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      GrnModel.find(query)
        .populate('supplierId', 'companyName supplierCode')
        .populate('purchaseOrderId', 'poNumber status')
        .populate('warehouseId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GrnModel.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get single GRN by ID (org-scoped)
   */
  public static async getGrnById(id: string, orgId: string) {
    const GrnModel = await getGrnModel();
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError('GoodsReceiveNote', id);

    const grn = await GrnModel.findOne({
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(orgId),
    })
      .populate('supplierId', 'companyName supplierCode email phone')
      .populate('purchaseOrderId', 'poNumber status items')
      .populate('warehouseId', 'name code address')
      .populate('receivedBy', 'fullName email')
      .lean();

    if (!grn) throw new NotFoundError('GoodsReceiveNote', id);
    return grn;
  }
}
