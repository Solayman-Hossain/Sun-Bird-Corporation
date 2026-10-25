import { Types, ClientSession } from 'mongoose';
import { ProductBatchModel, IProductBatch } from '../models/ProductBatch';
import { InsufficientStockError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';

export interface BatchAllocationResult {
  batchId: Types.ObjectId;
  batchNumber: string;
  allocatedQty: number;
  unitCost: number;
  expiryDate?: Date;
}

export class InventoryBatchService {
  /**
   * Allocates inventory stock following strict First-Expiry-First-Out (FEFO) rules.
   *
   * 1. Filters non-expired batches with `currentQty > 0` in the designated warehouse.
   * 2. Sorts ascending by `expiryDate: 1`.
   * 3. Validates that aggregate available stock fulfills `requiredQty`.
   * 4. Sequentially updates `currentQty` per batch atomically within the transaction session.
   *
   * @param sku Product SKU
   * @param warehouseId Target warehouse ObjectId
   * @param requiredQty Requested quantity in base UOM
   * @param session Optional Mongoose transaction ClientSession
   * @returns Array of allocated batch fragments
   */
  public static async allocateFefoStock(
    sku: string,
    warehouseId: string | Types.ObjectId,
    requiredQty: number,
    session?: ClientSession
  ): Promise<BatchAllocationResult[]> {
    if (requiredQty <= 0) {
      throw new ValidationError('Required allocation quantity must be greater than zero');
    }

    const normalizedSku = sku.toUpperCase().trim();
    const wId = new Types.ObjectId(warehouseId);
    const now = new Date();

    // Query active sellable batches for SKU in target warehouse
    const query = ProductBatchModel.find({
      sku: normalizedSku,
      warehouseId: wId,
      currentQty: { $gt: 0 },
      $or: [
        { category: 'NON_EXPIRING' },
        { category: 'EXPIRY_CONTROLLED', expiryDate: { $gt: now } },
      ],
    })
      .sort({ expiryDate: 1, createdAt: 1 });

    if (session) {
      query.session(session);
    }

    const batches = await query.exec();

    // Calculate total available stock across valid batches
    const totalAvailable = batches.reduce((sum, b) => sum + b.currentQty, 0);

    if (totalAvailable < requiredQty) {
      logger.warn(
        `Insufficient FEFO stock for SKU ${normalizedSku} in warehouse ${warehouseId}: requested ${requiredQty}, available ${totalAvailable}`
      );
      throw new InsufficientStockError(normalizedSku, requiredQty, totalAvailable);
    }

    const allocations: BatchAllocationResult[] = [];
    let remainingToAllocate = requiredQty;

    for (const batch of batches) {
      if (remainingToAllocate <= 0) break;

      const allocateFromBatch = Math.min(batch.currentQty, remainingToAllocate);

      // Decrement available currentQty on batch
      batch.currentQty -= allocateFromBatch;
      if (session) {
        await batch.save({ session });
      } else {
        await batch.save();
      }

      allocations.push({
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        allocatedQty: allocateFromBatch,
        unitCost: batch.unitCost,
        expiryDate: batch.expiryDate,
      });

      remainingToAllocate -= allocateFromBatch;
    }

    logger.info(
      `FEFO allocation completed for ${normalizedSku}: ${requiredQty} units across ${allocations.length} batch(es)`
    );

    return allocations;
  }

  /**
   * Calculates the new moving Weighted Average Cost (WAC) per unit.
   *
   * Formula:
   * New WAC = ((existingQty * existingWac) + (incomingQty * incomingUnitCost)) / (existingQty + incomingQty)
   *
   * Formatted to 2 decimal places for BDT currency precision.
   *
   * @param existingQty Current stock quantity
   * @param existingWac Current unit WAC cost
   * @param incomingQty Incoming stock quantity (e.g. from GRN / Purchase)
   * @param incomingUnitCost Incoming landed unit cost
   * @returns Computed moving WAC rounded to 2 decimal places
   */
  public static calculateNewWacCost(
    existingQty: number,
    existingWac: number,
    incomingQty: number,
    incomingUnitCost: number
  ): number {
    const totalQty = existingQty + incomingQty;

    if (totalQty <= 0) {
      return 0;
    }

    const totalValue =
      Math.max(0, existingQty) * Math.max(0, existingWac) +
      Math.max(0, incomingQty) * Math.max(0, incomingUnitCost);

    const newWac = totalValue / totalQty;
    return Math.round(newWac * 100) / 100;
  }
}

export default InventoryBatchService;
