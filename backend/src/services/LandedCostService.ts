import { Types, ClientSession } from 'mongoose';
import {
  LandedCostModel,
  ILandedCost,
  ILandedCostAllocation,
  LandedCostAllocationMethod,
} from '../models/LandedCost';
import { ImportLCModel, IImportLC } from '../models/ImportLC';
import { PurchaseOrderModel } from '../models/PurchaseOrder';
import { ProductModel } from '../models/Product';
import { ProductBatchModel, IProductBatch } from '../models/ProductBatch';
import { StockLedgerModel } from '../models/StockLedger';
import { JournalEntryModel, IJournalEntry } from '../models/JournalEntry';
import { WarehouseModel } from '../models/Warehouse';
import { CounterService } from './CounterService';
import {
  NotFoundError,
  ValidationError,
  DuplicateKeyError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface LandedCostItemInput {
  productId: string | Types.ObjectId;
  sku: string;
  quantity: number;
  fobValueBDT: number;
  weightKg?: number;
  batchNumber?: string;
  warehouseId?: string | Types.ObjectId;
}

export interface CostBreakdownInput {
  fobValueBDT?: number;
  customsDuty?: number;
  regulatoryDuty?: number;
  advanceIncomeTax?: number;
  vatAmount?: number;
  cfAgentCharges?: number;
  portDemurragePenalty?: number;
  portHandlingCharges?: number;
  inlandFreight?: number;
  marineInsurance?: number;
  bankCharges?: number;
  otherCharges?: number;
}

export interface CreateLandedCostDTO {
  lcId: string | Types.ObjectId;
  costBreakdown: CostBreakdownInput;
  allocationMethod: LandedCostAllocationMethod;
  items: LandedCostItemInput[];
  reviewedBy?: string | Types.ObjectId;
}

export class LandedCostService {
  /**
   * Sums all import expenditure components:
   * Customs Duty + Regulatory Duty + AIT + VAT + C&F + Port Handling + Demurrage + Inland Freight + Marine Insurance + Bank Charges + Other Charges
   */
  public static calculateTotalImportExpenditure(costs: CostBreakdownInput): {
    totalExpenditureBDT: number;
    totalLandedCostBDT: number;
  } {
    const cd = costs.customsDuty || 0;
    const rd = costs.regulatoryDuty || 0;
    const ait = costs.advanceIncomeTax || 0;
    const vat = costs.vatAmount || 0;
    const cf = costs.cfAgentCharges || 0;
    const demurrage = costs.portDemurragePenalty || 0;
    const portHandling = costs.portHandlingCharges || 0;
    const freight = costs.inlandFreight || 0;
    const insurance = costs.marineInsurance || 0;
    const bank = costs.bankCharges || 0;
    const other = costs.otherCharges || 0;

    const totalExpenditureBDT = Number(
      (cd + rd + ait + vat + cf + demurrage + portHandling + freight + insurance + bank + other).toFixed(2)
    );

    const fob = costs.fobValueBDT || 0;
    const totalLandedCostBDT = Number((fob + totalExpenditureBDT).toFixed(2));

    return { totalExpenditureBDT, totalLandedCostBDT };
  }

  /**
   * Allocates import expenditure across consignment SKUs using the chosen method:
   * - BY_VALUE: Proportional to each SKU's FOB value in BDT
   * - BY_QUANTITY: Proportional to SKU unit quantity
   * - BY_WEIGHT: Proportional to SKU gross/net weight in kg
   *
   * Computes final landed unit cost: (fobValueBDT + allocatedCost) / quantity
   */
  public static computeAllocations(
    method: LandedCostAllocationMethod,
    items: LandedCostItemInput[],
    totalExpenditureBDT: number
  ): ILandedCostAllocation[] {
    if (!items || items.length === 0) {
      throw new ValidationError('At least one consignment item is required for landed cost allocation');
    }

    let divisorSum = 0;
    if (method === 'BY_VALUE') {
      divisorSum = items.reduce((acc, it) => acc + (it.fobValueBDT || 0), 0);
    } else if (method === 'BY_QUANTITY') {
      divisorSum = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    } else if (method === 'BY_WEIGHT') {
      divisorSum = items.reduce((acc, it) => acc + (it.weightKg || it.quantity || 1), 0);
    }

    if (divisorSum <= 0) {
      divisorSum = items.length; // Fallback to equal allocation if weights/values are zero
    }

    let allocatedRunningTotal = 0;

    const allocations: ILandedCostAllocation[] = items.map((item, idx) => {
      let weightRatio = 0;
      if (method === 'BY_VALUE') {
        weightRatio = (item.fobValueBDT || 0) / divisorSum;
      } else if (method === 'BY_QUANTITY') {
        weightRatio = (item.quantity || 0) / divisorSum;
      } else if (method === 'BY_WEIGHT') {
        weightRatio = (item.weightKg || item.quantity || 1) / divisorSum;
      }

      let allocatedCost = Number((totalExpenditureBDT * weightRatio).toFixed(2));
      // For last item, absorb rounding cent difference to ensure exact mathematical sum
      if (idx === items.length - 1) {
        allocatedCost = Number((totalExpenditureBDT - allocatedRunningTotal).toFixed(2));
      } else {
        allocatedRunningTotal += allocatedCost;
      }

      const totalItemLandedBDT = Number(((item.fobValueBDT || 0) + allocatedCost).toFixed(2));
      const landedUnitCost = Number((totalItemLandedBDT / (item.quantity || 1)).toFixed(2));

      return {
        productId: new Types.ObjectId(item.productId),
        sku: item.sku.trim().toUpperCase(),
        quantity: item.quantity,
        fobValueBDT: item.fobValueBDT,
        weightKg: item.weightKg,
        allocatedCost,
        landedUnitCost,
      };
    });

    return allocations;
  }

  /**
   * Registers or updates a Landed Cost sheet linked to an Import LC.
   */
  public static async createOrUpdateLandedCost(
    dto: CreateLandedCostDTO,
    session?: ClientSession
  ): Promise<ILandedCost> {
    const lc = await ImportLCModel.findById(dto.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', dto.lcId.toString());
    }

    // If LC has calculatedDemurragePenaltyBDT and not explicitly provided in breakdown, auto-adopt it
    const costBreakdown: CostBreakdownInput = { ...dto.costBreakdown };
    if (
      costBreakdown.portDemurragePenalty === undefined &&
      lc.calculatedDemurragePenaltyBDT &&
      lc.calculatedDemurragePenaltyBDT > 0
    ) {
      costBreakdown.portDemurragePenalty = lc.calculatedDemurragePenaltyBDT;
    }

    // Auto-calculate FOB in BDT if not provided (LC value FC * Opening exchange rate)
    if (!costBreakdown.fobValueBDT || costBreakdown.fobValueBDT <= 0) {
      const exchangeRate = lc.customsAssessmentRate || lc.openingExchangeRate || 120.0;
      costBreakdown.fobValueBDT = Number((lc.lcValueFC * exchangeRate).toFixed(2));
    }

    const { totalExpenditureBDT, totalLandedCostBDT } = this.calculateTotalImportExpenditure(costBreakdown);

    // Compute item allocations
    const allocations = this.computeAllocations(
      dto.allocationMethod,
      dto.items,
      totalExpenditureBDT
    );

    let landedCost = await LandedCostModel.findOne({ lcId: lc._id }).session(session || null);

    if (landedCost) {
      if (landedCost.isFinalized) {
        throw new ValidationError(
          `Landed Cost sheet for LC '${lc.lcNumber}' is already finalized and locked against modification`
        );
      }

      landedCost.fobValueBDT = costBreakdown.fobValueBDT;
      landedCost.customsDuty = costBreakdown.customsDuty || 0;
      landedCost.regulatoryDuty = costBreakdown.regulatoryDuty || 0;
      landedCost.advanceIncomeTax = costBreakdown.advanceIncomeTax || 0;
      landedCost.vatAmount = costBreakdown.vatAmount || 0;
      landedCost.cfAgentCharges = costBreakdown.cfAgentCharges || 0;
      landedCost.portDemurragePenalty = costBreakdown.portDemurragePenalty || 0;
      landedCost.portHandlingCharges = costBreakdown.portHandlingCharges || 0;
      landedCost.inlandFreight = costBreakdown.inlandFreight || 0;
      landedCost.marineInsurance = costBreakdown.marineInsurance || 0;
      landedCost.bankCharges = costBreakdown.bankCharges || 0;
      landedCost.otherCharges = costBreakdown.otherCharges || 0;
      landedCost.totalLandedCostBDT = totalLandedCostBDT;
      landedCost.allocationMethod = dto.allocationMethod;
      landedCost.allocations = allocations;
      if (dto.reviewedBy) {
        landedCost.reviewedBy = new Types.ObjectId(dto.reviewedBy);
      }

      await landedCost.save({ session });
    } else {
      const created = await LandedCostModel.create(
        [
          {
            lcId: lc._id,
            lcNumber: lc.lcNumber,
            fobValueBDT: costBreakdown.fobValueBDT,
            customsDuty: costBreakdown.customsDuty || 0,
            regulatoryDuty: costBreakdown.regulatoryDuty || 0,
            advanceIncomeTax: costBreakdown.advanceIncomeTax || 0,
            vatAmount: costBreakdown.vatAmount || 0,
            cfAgentCharges: costBreakdown.cfAgentCharges || 0,
            portDemurragePenalty: costBreakdown.portDemurragePenalty || 0,
            portHandlingCharges: costBreakdown.portHandlingCharges || 0,
            inlandFreight: costBreakdown.inlandFreight || 0,
            marineInsurance: costBreakdown.marineInsurance || 0,
            bankCharges: costBreakdown.bankCharges || 0,
            otherCharges: costBreakdown.otherCharges || 0,
            totalLandedCostBDT,
            allocationMethod: dto.allocationMethod,
            allocations,
            reviewedBy: dto.reviewedBy ? new Types.ObjectId(dto.reviewedBy) : undefined,
            isFinalized: false,
          },
        ],
        { session }
      );
      landedCost = created[0];
    }

    logger.info(
      `Landed Cost calculated for LC ${lc.lcNumber}: Total Expenditure: ${totalExpenditureBDT} BDT, Total Landed: ${totalLandedCostBDT} BDT (${dto.allocationMethod})`
    );

    return landedCost;
  }

  /**
   * Finalizes landed cost sheet upon customs port clearance & goods receipt:
   * 1. Capitalizes final landed unit cost into ProductBatch.unitCost.
   * 2. Recalculates and updates product moving WAC in ProductBatch.
   * 3. Triggers automatic Goods Receipt Note (GRN_IN) in stock_ledger.
   * 4. Generates a balanced double-entry accounting Journal Entry in journal_entries:
   *    - Debit: 1200 Inventory Asset — Merchandise
   *    - Credit: 2010 Accounts Payable & 2020 Customs/Clearing liabilities
   * 5. Locks LandedCost record (isFinalized = true).
   */
  public static async finalizeLandedCost(
    lcId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<{
    landedCost: ILandedCost;
    batches: IProductBatch[];
    journalEntry: IJournalEntry;
  }> {
    const landedCost = await LandedCostModel.findOne({
      $or: [{ lcId: new Types.ObjectId(lcId) }, { _id: new Types.ObjectId(lcId) }],
    }).session(session || null);

    if (!landedCost) {
      throw new NotFoundError('LandedCost', lcId.toString());
    }

    if (landedCost.isFinalized) {
      throw new ValidationError(`Landed cost sheet for LC '${landedCost.lcNumber}' is already finalized`);
    }

    const lc = await ImportLCModel.findById(landedCost.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', landedCost.lcId.toString());
    }

    // Resolve delivery warehouse
    let warehouse = await WarehouseModel.findOne({ isCentralHub: true }).session(session || null);
    if (!warehouse) {
      warehouse = await WarehouseModel.findOne().session(session || null);
    }
    if (!warehouse) {
      const createdWhs = await WarehouseModel.create(
        [
          {
            warehouseCode: 'WH-CENTRAL-01',
            name: 'Central Warehouse & Customs Depot',
            type: 'CENTRAL',
            address: 'Tejgaon I/A, Dhaka',
            district: 'Dhaka',
            isCentralHub: true,
            isActive: true,
          },
        ],
        { session }
      );
      warehouse = createdWhs[0];
    }

    const updatedBatches: IProductBatch[] = [];
    let totalInventoryCapitalizedBDT = 0;

    // 1. Process batch capitalization and stock ledger movements for each allocated item
    for (const alloc of landedCost.allocations) {
      const sku = alloc.sku || 'SKU-UNKNOWN';
      const incomingQty = alloc.quantity || 1;
      const landedUnitCost = alloc.landedUnitCost || 0;
      const lineCapitalized = Number((incomingQty * landedUnitCost).toFixed(2));
      totalInventoryCapitalizedBDT = Number((totalInventoryCapitalizedBDT + lineCapitalized).toFixed(2));

      const product = await ProductModel.findById(alloc.productId).session(session || null);
      const isExpirable = product?.isExpirable || false;
      const hasIndividualSerials = product?.isMedical || false;

      // Find or create batch for this import LC shipment
      const batchNumber = `BATCH-${lc.lcNumber}-${sku}`;
      let batch = await ProductBatchModel.findOne({
        sku,
        batchNumber,
        warehouseId: warehouse._id,
      }).session(session || null);

      if (batch) {
        // Update moving WAC formula:
        // newWac = ((existingQty * existingWac) + (incomingQty * landedUnitCost)) / (existingQty + incomingQty)
        const existingQty = batch.currentQty || 0;
        const existingWac = batch.unitCost || 0;
        const totalQty = existingQty + incomingQty;
        const newWac = totalQty > 0
          ? Number((((existingQty * existingWac) + (incomingQty * landedUnitCost)) / totalQty).toFixed(2))
          : landedUnitCost;

        batch.currentQty = totalQty;
        batch.unitCost = newWac;
        await batch.save({ session });
      } else {
        const createdBatches = await ProductBatchModel.create(
          [
            {
              productId: alloc.productId,
              sku,
              batchNumber,
              category: isExpirable ? 'EXPIRY_CONTROLLED' : 'NON_EXPIRING',
              baseUom: product?.baseUom || 'Piece',
              currentQty: incomingQty,
              reservedQty: 0,
              unitCost: landedUnitCost,
              hasIndividualSerials,
              warehouseId: warehouse._id,
              locationStatus: 'ON_HAND',
            },
          ],
          { session }
        );
        batch = createdBatches[0];
      }

      alloc.batchId = batch._id;
      updatedBatches.push(batch);

      // 2. Trigger automatic Goods Receipt Note (GRN) in stock_ledger
      await StockLedgerModel.create(
        [
          {
            sku,
            batchId: batch._id,
            warehouseId: warehouse._id,
            movementType: 'GRN_IN',
            qtyChange: incomingQty,
            unitCost: landedUnitCost,
            referenceNo: `GRN-${lc.lcNumber}`,
            referenceType: 'GRN',
            createdBy: new Types.ObjectId(userId),
          },
        ],
        { session }
      );
    }

    // 3. Generate balanced accounting Journal Entry in journal_entries:
    // Debit 1200 Inventory Asset — Merchandise (Total Capitalized Cost)
    // Credit 2010 Accounts Payable / Supplier (FOB value in BDT)
    // Credit 2020 Customs Duties & Port Charges Payable (Total import duties & clearing charges)
    const voucherNo = await CounterService.getNextSequence('JV', session);
    const fobCreditBDT = Number((landedCost.fobValueBDT || 0).toFixed(2));
    const dutiesClearingCreditBDT = Number(
      (totalInventoryCapitalizedBDT - fobCreditBDT).toFixed(2)
    );

    // Build balanced double-entry lines
    const journalLines = [
      {
        accountCode: 1200,
        accountName: 'Inventory Asset — Merchandise',
        debit: totalInventoryCapitalizedBDT,
        credit: 0.0,
        description: `Import LC Goods Receipt Capitalization: ${lc.lcNumber}`,
      },
      {
        accountCode: 2010,
        accountName: 'Accounts Payable — Trade Creditors',
        debit: 0.0,
        credit: fobCreditBDT,
        description: `FOB Commercial Invoiced Value for LC ${lc.lcNumber}`,
      },
    ];

    if (dutiesClearingCreditBDT > 0) {
      journalLines.push({
        accountCode: 2020,
        accountName: 'Customs Duties & Clearing Charges Payable',
        debit: 0.0,
        credit: dutiesClearingCreditBDT,
        description: `Customs duty, port demurrage, C&F and handling liabilities for LC ${lc.lcNumber}`,
      });
    }

    const journalDocs = await JournalEntryModel.create(
      [
        {
          voucherNo,
          voucherType: 'PURCHASE',
          transactionDate: new Date(),
          sourceDocumentRef: lc.lcNumber,
          lines: journalLines,
          totalDebit: totalInventoryCapitalizedBDT,
          totalCredit: totalInventoryCapitalizedBDT,
          status: 'POSTED',
          createdBy: new Types.ObjectId(userId),
          requiredQuorumTier: 1,
          isFullyApproved: true,
        },
      ],
      { session }
    );
    const journalEntry = journalDocs[0];

    // 4. Lock Landed Cost record and update LC stage to PORT_CLEARED / CUSTOMS_CLEARED
    landedCost.isFinalized = true;
    landedCost.journalEntryId = journalEntry._id;
    landedCost.reviewedBy = new Types.ObjectId(userId);
    await landedCost.save({ session });

    if (lc.status !== 'FINAL_SETTLEMENT' && lc.status !== 'SETTLED') {
      lc.status = 'PORT_CLEARED';
      await lc.save({ session });
    }

    logger.info(
      `Landed Cost finalized for LC ${lc.lcNumber}: Capitalized ${totalInventoryCapitalizedBDT} BDT across ${updatedBatches.length} batches. Posted JV ${voucherNo}.`
    );

    return {
      landedCost,
      batches: updatedBatches,
      journalEntry,
    };
  }

  /**
   * Retrieves Landed Cost by LC ObjectId or lcNumber.
   */
  public static async getByLcId(lcIdOrNumber: string | Types.ObjectId): Promise<ILandedCost> {
    const isObjectId = Types.ObjectId.isValid(lcIdOrNumber.toString());
    const query: Record<string, any> = isObjectId
      ? { $or: [{ lcId: new Types.ObjectId(lcIdOrNumber) }, { _id: new Types.ObjectId(lcIdOrNumber) }, { lcNumber: lcIdOrNumber.toString().toUpperCase() }] }
      : { lcNumber: lcIdOrNumber.toString().toUpperCase() };

    const landedCost = await LandedCostModel.findOne(query)
      .populate('lcId', 'lcNumber foreignCurrency lcValueFC openingExchangeRate status')
      .populate('allocations.productId', 'nameEn sku hsCode baseUom')
      .populate('allocations.batchId', 'batchNumber currentQty unitCost')
      .populate('journalEntryId', 'voucherNo totalDebit totalCredit status')
      .populate('reviewedBy', 'fullName email');

    if (!landedCost) {
      throw new NotFoundError('LandedCost for LC', lcIdOrNumber.toString());
    }

    return landedCost;
  }
}

export default LandedCostService;
