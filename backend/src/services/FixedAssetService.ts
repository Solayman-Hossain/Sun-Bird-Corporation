import { ClientSession, Types } from 'mongoose';
import {
  FixedAssetModel,
  IFixedAsset,
  AssetStatus,
  DepreciationMethod,
} from '../models/FixedAsset';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { CounterService } from './CounterService';
import { AccountingService } from './AccountingService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface RegisterAssetDTO {
  assetCode?: string;
  assetName: string;
  category: string;
  serialTagNo?: string;
  purchaseDate?: Date | string;
  purchasePriceBDT?: number; // per prompt spec
  purchaseCost?: number;
  salvageValueBDT?: number; // per prompt spec
  residualValue?: number;
  usefulLifeMonths?: number;
  usefulLifeYears?: number;
  depreciationMethod?: DepreciationMethod;
  custodian?: Types.ObjectId | string;
  warehouseId?: Types.ObjectId | string;
  warrantyExpiry?: Date | string;
}

export interface AssetFilterDTO {
  status?: AssetStatus;
  category?: string;
  warehouseId?: Types.ObjectId | string;
  page?: number;
  limit?: number;
}

export interface DepreciationRunResult {
  fiscalMonthYear: string;
  processedAssetsCount: number;
  totalDepreciationAmount: number;
  depreciatedAssets: Array<{
    assetCode: string;
    assetName: string;
    depreciationAmount: number;
    newAccumulatedDepreciation: number;
    newNetBookValue: number;
  }>;
  journalVoucherNo?: string;
  journalEntryId?: Types.ObjectId;
}

export interface DisposeAssetDTO {
  disposalDate?: Date | string;
  disposalValue?: number;
  status?: 'DISPOSED' | 'SOLD';
  reason?: string;
}

export class FixedAssetService {
  /**
   * Registers a new Fixed Asset with automatic calculation of monthly depreciation
   * and book value adhering to Straight-Line Method (SLM).
   *
   * Monthly Depreciation = (purchasePriceBDT - salvageValueBDT) / usefulLifeMonths
   */
  public static async registerAsset(
    assetData: RegisterAssetDTO,
    session?: ClientSession
  ): Promise<IFixedAsset> {
    const {
      assetName,
      category,
      serialTagNo,
      depreciationMethod = 'SLM',
      custodian,
      warehouseId,
      warrantyExpiry,
    } = assetData;

    if (!assetName || !assetName.trim()) {
      throw new ValidationError('Asset name is required');
    }
    if (!category || !category.trim()) {
      throw new ValidationError('Asset category is required');
    }

    // Support both purchasePriceBDT and purchaseCost parameter names
    const purchaseCost =
      assetData.purchasePriceBDT !== undefined
        ? Number(assetData.purchasePriceBDT)
        : Number(assetData.purchaseCost ?? 0);

    if (isNaN(purchaseCost) || purchaseCost <= 0) {
      throw new ValidationError('Valid purchase price / cost greater than zero is required');
    }

    // Support both salvageValueBDT and residualValue
    const residualValue =
      assetData.salvageValueBDT !== undefined
        ? Number(assetData.salvageValueBDT)
        : Number(assetData.residualValue ?? 0);

    if (isNaN(residualValue) || residualValue < 0) {
      throw new ValidationError('Salvage / residual value must be a non-negative number');
    }

    if (residualValue >= purchaseCost) {
      throw new ValidationError('Salvage value must be strictly less than the purchase price');
    }

    // Determine useful life in months and years
    let usefulLifeMonths = assetData.usefulLifeMonths ? Number(assetData.usefulLifeMonths) : 0;
    let usefulLifeYears = assetData.usefulLifeYears ? Number(assetData.usefulLifeYears) : 0;

    if (usefulLifeMonths <= 0 && usefulLifeYears > 0) {
      usefulLifeMonths = Math.round(usefulLifeYears * 12);
    } else if (usefulLifeMonths > 0 && usefulLifeYears <= 0) {
      usefulLifeYears = Number((usefulLifeMonths / 12).toFixed(2));
    }

    if (usefulLifeMonths <= 0) {
      throw new ValidationError('Useful life in months (or years) greater than zero is required');
    }

    // Calculate Monthly Straight-Line Depreciation:
    // Monthly Depreciation = (purchasePriceBDT - salvageValueBDT) / usefulLifeMonths
    const depreciableAmount = purchaseCost - residualValue;
    const monthlyDepreciation = Number((depreciableAmount / usefulLifeMonths).toFixed(2));

    // Generate or format asset code
    let assetCode = assetData.assetCode?.trim().toUpperCase();
    if (!assetCode) {
      assetCode = await CounterService.getNextSequence('FA', session);
    }

    const purchaseDate = assetData.purchaseDate ? new Date(assetData.purchaseDate) : new Date();

    const createOptions = session ? { session } : {};
    const createdDocs = await FixedAssetModel.create(
      [
        {
          assetCode,
          assetName: assetName.trim(),
          category: category.trim(),
          serialTagNo: serialTagNo?.trim(),
          purchaseDate,
          purchaseCost,
          residualValue,
          usefulLifeMonths,
          usefulLifeYears,
          depreciationMethod,
          monthlyDepreciation,
          accumulatedDepreciation: 0,
          netBookValue: purchaseCost,
          currentBookValue: purchaseCost,
          custodian: custodian ? new Types.ObjectId(custodian.toString()) : undefined,
          warehouseId: warehouseId ? new Types.ObjectId(warehouseId.toString()) : undefined,
          warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
          status: 'ACTIVE',
        },
      ],
      createOptions
    );

    const asset = createdDocs[0];
    logger.info(
      `Fixed Asset registered: ${asset.assetCode} - ${asset.assetName} (Cost: ${purchaseCost} BDT, Monthly SLM Dep: ${monthlyDepreciation} BDT)`
    );

    return asset;
  }

  /**
   * Executes automated monthly Straight-Line Method (SLM) depreciation on all active fixed assets.
   *
   * 1. Iterates through active assets where accumulatedDepreciation < purchaseCost - residualValue.
   * 2. Updates accumulatedDepreciation and netBookValue / currentBookValue.
   * 3. Automatically posts a consolidated Journal Entry:
   *    - Debit: 6310 (or 6400) Depreciation Expense
   *    - Credit: 1590 (or 1890) Accumulated Depreciation
   *
   * @param fiscalMonthYear E.g. '2026-10'
   * @param userId Initiating user ObjectId string
   * @param session Optional MongoDB ClientSession
   */
  public static async runMonthlyDepreciation(
    fiscalMonthYear: string,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<DepreciationRunResult> {
    if (!fiscalMonthYear || !/^\d{4}-\d{2}$/.test(fiscalMonthYear.trim())) {
      throw new ValidationError("fiscalMonthYear must be in 'YYYY-MM' format (e.g. '2026-10')");
    }

    const normalizedPeriod = fiscalMonthYear.trim();

    // 1. Fetch active assets that have remaining depreciable capacity
    const query = {
      status: 'ACTIVE',
      $expr: {
        $lt: ['$accumulatedDepreciation', { $subtract: ['$purchaseCost', '$residualValue'] }],
      },
    };

    const eligibleAssets = await (session
      ? FixedAssetModel.find(query).session(session)
      : FixedAssetModel.find(query));

    if (eligibleAssets.length === 0) {
      logger.info(`[Depreciation Run ${normalizedPeriod}] No eligible assets found for depreciation.`);
      return {
        fiscalMonthYear: normalizedPeriod,
        processedAssetsCount: 0,
        totalDepreciationAmount: 0,
        depreciatedAssets: [],
      };
    }

    const depreciatedAssetsList: DepreciationRunResult['depreciatedAssets'] = [];
    let totalDepreciationAmount = 0;

    // 2. Compute and deduct depreciation for each asset
    for (const asset of eligibleAssets) {
      const maxDepreciable = asset.purchaseCost - (asset.residualValue || 0);
      const remainingDepreciable = Math.max(0, maxDepreciable - asset.accumulatedDepreciation);

      if (remainingDepreciable <= 0) continue;

      // Deduct monthlyDepreciation or remaining balance if less
      const depAmount = Math.min(asset.monthlyDepreciation || 0, remainingDepreciable);
      if (depAmount <= 0) continue;

      const roundedDepAmount = Number(depAmount.toFixed(2));
      asset.accumulatedDepreciation = Number((asset.accumulatedDepreciation + roundedDepAmount).toFixed(2));
      asset.netBookValue = Math.max(0, Number((asset.purchaseCost - asset.accumulatedDepreciation).toFixed(2)));
      asset.currentBookValue = asset.netBookValue;

      totalDepreciationAmount += roundedDepAmount;

      depreciatedAssetsList.push({
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        depreciationAmount: roundedDepAmount,
        newAccumulatedDepreciation: asset.accumulatedDepreciation,
        newNetBookValue: asset.netBookValue,
      });

      await asset.save(session ? { session } : {});
    }

    totalDepreciationAmount = Number(totalDepreciationAmount.toFixed(2));

    // 3. Post consolidated double-entry Journal Voucher if total > 0
    let journalVoucherNo: string | undefined;
    let journalEntryId: Types.ObjectId | undefined;

    if (totalDepreciationAmount > 0) {
      // Find or determine COA accounts:
      // Depreciation Expense (default: 6310 or 6400)
      // Accumulated Depreciation (default: 1590 or 1890)
      const coaList = await ChartOfAccountsModel.find({
        accountCode: { $in: [6310, 6400, 1590, 1890] },
        isActive: true,
      }).lean();

      let depExpenseCode = 6310;
      let accDepCode = 1590;

      const expenseCoa = coaList.find((c) => c.accountCode === 6310 || c.accountCode === 6400);
      if (expenseCoa) {
        depExpenseCode = expenseCoa.accountCode;
      }

      const accDepCoa = coaList.find((c) => c.accountCode === 1590 || c.accountCode === 1890);
      if (accDepCoa) {
        accDepCode = accDepCoa.accountCode;
      }

      // If neither exists in COA, check if any depreciation account exists in COA master
      if (!expenseCoa) {
        const anyExp = await ChartOfAccountsModel.findOne({
          accountType: 'EXPENSE',
          accountName: { $regex: /depreciation/i },
          isActive: true,
        }).lean();
        if (anyExp) depExpenseCode = anyExp.accountCode;
      }

      if (!accDepCoa) {
        const anyAcc = await ChartOfAccountsModel.findOne({
          accountCode: { $gte: 1500, $lt: 2000 },
          accountName: { $regex: /accumulated depreciation/i },
          isActive: true,
        }).lean();
        if (anyAcc) accDepCode = anyAcc.accountCode;
      }

      // Post balanced journal voucher:
      // Debit Depreciation Expense
      // Credit Accumulated Depreciation
      const jvResult = await AccountingService.createJournalVoucher(
        {
          voucherType: 'JOURNAL',
          transactionDate: new Date(),
          sourceDocumentRef: `DEP-RUN-${normalizedPeriod}`,
          lines: [
            {
              accountCode: depExpenseCode,
              debit: totalDepreciationAmount,
              credit: 0,
              description: `Monthly depreciation for ${normalizedPeriod} (${depreciatedAssetsList.length} assets)`,
            },
            {
              accountCode: accDepCode,
              debit: 0,
              credit: totalDepreciationAmount,
              description: `Accumulated depreciation reserve for ${normalizedPeriod}`,
            },
          ],
        },
        userId,
        session
      );

      journalVoucherNo = jvResult.journalEntry.voucherNo;
      journalEntryId = jvResult.journalEntry._id;

      // Link voucher to updated assets
      for (const asset of eligibleAssets) {
        asset.journalRef = journalVoucherNo;
        await asset.save(session ? { session } : {});
      }

      logger.info(
        `[Depreciation Run ${normalizedPeriod}] Successfully processed ${depreciatedAssetsList.length} assets. Total: ${totalDepreciationAmount} BDT. Posted JV: ${journalVoucherNo}`
      );
    }

    return {
      fiscalMonthYear: normalizedPeriod,
      processedAssetsCount: depreciatedAssetsList.length,
      totalDepreciationAmount,
      depreciatedAssets: depreciatedAssetsList,
      journalVoucherNo,
      journalEntryId,
    };
  }

  /**
   * Retrieves a fixed asset by assetCode or ObjectId.
   */
  public static async getAsset(assetCodeOrId: string): Promise<IFixedAsset> {
    const isObjectId = Types.ObjectId.isValid(assetCodeOrId);
    const query = isObjectId
      ? { _id: new Types.ObjectId(assetCodeOrId) }
      : { assetCode: assetCodeOrId.trim().toUpperCase() };

    const asset = await FixedAssetModel.findOne(query)
      .populate('custodian', 'fullName email mobile userType')
      .populate('warehouseId', 'name warehouseCode address district');

    if (!asset) {
      throw new NotFoundError('Fixed Asset', assetCodeOrId);
    }

    return asset;
  }

  /**
   * Lists fixed assets with optional filtering and pagination.
   */
  public static async listAssets(
    filters: AssetFilterDTO = {}
  ): Promise<{ assets: IFixedAsset[]; total: number; page: number; limit: number }> {
    const { status, category, warehouseId, page = 1, limit = 20 } = filters;

    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (warehouseId) query.warehouseId = new Types.ObjectId(warehouseId.toString());

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    const [assets, total] = await Promise.all([
      FixedAssetModel.find(query)
        .sort({ purchaseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('warehouseId', 'name warehouseCode'),
      FixedAssetModel.countDocuments(query),
    ]);

    return { assets, total, page, limit };
  }

  /**
   * Disposes of an asset (SOLD or DISPOSED).
   */
  public static async disposeAsset(
    assetCodeOrId: string,
    disposalData: DisposeAssetDTO,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IFixedAsset> {
    const asset = await this.getAsset(assetCodeOrId);

    if (asset.status === 'DISPOSED' || asset.status === 'SOLD') {
      throw new ValidationError(`Asset ${asset.assetCode} is already ${asset.status}`);
    }

    const disposalValue = Number(disposalData.disposalValue ?? 0);
    const disposalDate = disposalData.disposalDate ? new Date(disposalData.disposalDate) : new Date();

    asset.status = disposalData.status || 'DISPOSED';
    asset.disposalDate = disposalDate;
    asset.disposalValue = disposalValue;

    await asset.save(session ? { session } : {});

    logger.info(
      `Asset ${asset.assetCode} marked as ${asset.status} on ${disposalDate.toISOString()} (Disposal Value: ${disposalValue} BDT, NBV: ${asset.netBookValue} BDT)`
    );

    return asset;
  }
}

export default FixedAssetService;
