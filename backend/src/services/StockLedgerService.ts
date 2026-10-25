import { Types, ClientSession } from 'mongoose';
import { StockLedgerModel, IStockLedger, StockMovementType, StockReferenceType } from '../models/StockLedger';
import { ProductBatchModel } from '../models/ProductBatch';
import {
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface StockMovementDTO {
  sku: string;
  batchId: string | Types.ObjectId;
  warehouseId: string | Types.ObjectId;
  movementType: StockMovementType | 'GRN' | 'DISPATCH_CHALLAN' | 'PHYSICAL_ADJUSTMENT' | 'RETURN_RESTOCK';
  qtyChange: number;
  unitCost?: number;
  referenceNo: string;
  referenceType?: StockReferenceType;
  createdBy: string | Types.ObjectId;
  notes?: string;
}

export class StockLedgerService {
  /**
   * Maps client/business movement types to canonical schema enums.
   */
  public static mapMovementType(type: string): StockMovementType {
    const upper = type.toUpperCase().trim();
    switch (upper) {
      case 'GRN':
      case 'PURCHASE_RECEIPT':
        return 'GRN_IN';
      case 'DISPATCH_CHALLAN':
      case 'SALES_DISPATCH':
        return 'DISPATCH';
      case 'PHYSICAL_ADJUSTMENT':
      case 'ADJUSTMENT':
        return 'ADJUST';
      case 'RETURN_RESTOCK':
        return 'RETURN_RTO';
      default:
        return upper as StockMovementType;
    }
  }

  public static mapReferenceType(type?: string): StockReferenceType {
    if (!type) return 'ADJUSTMENT';
    const upper = type.toUpperCase().trim();
    switch (upper) {
      case 'PURCHASE_RECEIPT':
      case 'GRN':
        return 'GRN';
      case 'DISPATCH_CHALLAN':
      case 'CHALLAN':
        return 'CHALLAN';
      case 'SALES_ORDER':
      case 'ORDER':
        return 'ORDER';
      case 'PHYSICAL_ADJUSTMENT':
      case 'ADJUSTMENT':
        return 'ADJUSTMENT';
      case 'POS':
      case 'POS_BATCH':
        return 'POS_BATCH';
      default:
        return 'ADJUSTMENT';
    }
  }

  /**
   * Records an immutable stock movement in the ledger and atomically updates
   * the associated ProductBatch currentQty within an ACID transaction session.
   *
   * @param movementData Movement DTO containing batch, warehouse, quantity, and reference details
   * @param session Active Mongoose ClientSession for transaction atomicity
   * @returns Created IStockLedger document
   */
  public static async recordMovement(
    movementData: StockMovementDTO,
    session?: ClientSession
  ): Promise<IStockLedger> {
    const {
      sku,
      batchId,
      warehouseId,
      movementType,
      qtyChange,
      unitCost,
      referenceNo,
      referenceType,
      createdBy,
    } = movementData;

    if (!referenceNo || typeof referenceNo !== 'string') {
      throw new ValidationError('A valid string referenceNo is required for audit trail tracking');
    }

    if (qtyChange === 0) {
      throw new ValidationError('Quantity change cannot be zero');
    }

    const bId = new Types.ObjectId(batchId);
    const wId = new Types.ObjectId(warehouseId);
    const uId = new Types.ObjectId(createdBy);
    const canonicalMovementType = this.mapMovementType(movementType);

    // 1. Fetch batch within transaction session
    const batchQuery = ProductBatchModel.findById(bId);
    if (session) {
      batchQuery.session(session);
    }
    const batch = await batchQuery.exec();

    if (!batch) {
      throw new NotFoundError('ProductBatch', bId.toString());
    }

    // 2. Validate warehouse assignment matches
    if (batch.warehouseId.toString() !== wId.toString()) {
      throw new ValidationError(
        `Batch '${batch.batchNumber}' belongs to warehouse '${batch.warehouseId}', not '${wId}'`
      );
    }

    // 3. Stock deduction guard: prevent currentQty from dropping below zero
    const newQty = batch.currentQty + qtyChange;
    if (newQty < 0) {
      logger.warn(
        `Disallowed stock reduction for SKU ${sku} in batch ${batch.batchNumber}: requested deduction ${Math.abs(qtyChange)}, available ${batch.currentQty}`
      );
      throw new InsufficientStockError(
        sku,
        Math.abs(qtyChange),
        batch.currentQty
      );
    }

    // 4. Update batch currentQty atomically
    batch.currentQty = newQty;
    if (session) {
      await batch.save({ session });
    } else {
      await batch.save();
    }

    // 5. Append immutable entry to stock_ledger collection
    const ledgerPayload = {
      sku: sku.toUpperCase().trim(),
      batchId: bId,
      warehouseId: wId,
      movementType: canonicalMovementType,
      qtyChange,
      unitCost: unitCost !== undefined ? unitCost : batch.unitCost,
      referenceNo: referenceNo.trim(),
      referenceType: this.mapReferenceType(referenceType),
      createdBy: uId,
    };

    let createdLedger: IStockLedger;
    if (session) {
      const docs = await StockLedgerModel.create([ledgerPayload], { session });
      createdLedger = docs[0];
    } else {
      createdLedger = await StockLedgerModel.create(ledgerPayload);
    }

    logger.info(
      `Stock movement recorded: ${canonicalMovementType} for SKU ${sku} (Qty: ${qtyChange > 0 ? '+' : ''}${qtyChange}, Ref: ${referenceNo})`
    );

    return createdLedger;
  }
}

export default StockLedgerService;
