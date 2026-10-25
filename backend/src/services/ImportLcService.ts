import { Types, ClientSession } from 'mongoose';
import {
  ImportLCModel,
  IImportLC,
  LCStatus,
  LCCurrency,
} from '../models/ImportLC';
import { PurchaseOrderModel } from '../models/PurchaseOrder';
import { SupplierModel } from '../models/Supplier';
import { CounterService } from './CounterService';
import {
  NotFoundError,
  ValidationError,
  DuplicateKeyError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface CreateImportLcDTO {
  lcNumber?: string;
  version?: string;
  supplierId: string | Types.ObjectId;
  purchaseOrderId?: string | Types.ObjectId;
  issuingBank: string;
  foreignCurrency: LCCurrency;
  lcValueFC: number;
  openingExchangeRate: number;
  portFreeDays?: number;
  demurrageDailyRateBDT?: number;
}

export interface TransitionLcStageDTO {
  lcId: string | Types.ObjectId;
  nextStage: LCStatus;
  portArrivalDate?: Date | string;
  customsClearanceDate?: Date | string;
  notes?: string;
}

export interface CustomsAssessmentDTO {
  lcId: string | Types.ObjectId;
  customsAssessmentRate: number;
  assessmentDate?: Date | string;
}

export interface SettleLcDTO {
  lcId: string | Types.ObjectId;
  finalSettlementRate: number;
  settlementDate?: Date | string;
}

export interface DemurrageCalculationInput {
  arrivalDate: Date | string;
  clearanceDate: Date | string;
  freeDays?: number;
  dailyRateBDT?: number;
}

export interface DemurrageCalculationResult {
  totalPortDays: number;
  freeDays: number;
  billableDays: number;
  dailyRateBDT: number;
  totalPenaltyBDT: number;
  isDemurrageCharged: boolean;
}

export class ImportLcService {
  /**
   * Pure calculation utility for port demurrage penalties.
   * Compares container dwell time against statutory/contractual port free days (typically 4 days for sea ports).
   *
   * @param input Arrival and clearance timestamps with free days threshold and daily slab penalty
   * @returns Structured demurrage breakdown
   */
  public static computeDemurrage(
    input: DemurrageCalculationInput
  ): DemurrageCalculationResult {
    const arrival = new Date(input.arrivalDate);
    const clearance = new Date(input.clearanceDate);

    if (isNaN(arrival.getTime()) || isNaN(clearance.getTime())) {
      throw new ValidationError('Invalid arrivalDate or clearanceDate timestamp provided');
    }

    if (clearance < arrival) {
      throw new ValidationError('Customs clearance date cannot be prior to port arrival date');
    }

    const freeDays = input.freeDays !== undefined && input.freeDays >= 0 ? input.freeDays : 4;
    const dailyRateBDT = input.dailyRateBDT !== undefined && input.dailyRateBDT >= 0 ? input.dailyRateBDT : 5000;

    // Calculate elapsed duration in calendar days (inclusive of fractions)
    const diffMs = clearance.getTime() - arrival.getTime();
    const exactDays = diffMs / (1000 * 60 * 60 * 24);
    // Ceiling to full days (e.g. 10.0 days = 10 days, 9.1 days = 10 days)
    const totalPortDays = Math.max(1, Math.ceil(exactDays));

    const billableDays = Math.max(0, totalPortDays - freeDays);
    const totalPenaltyBDT = Number((billableDays * dailyRateBDT).toFixed(2));

    return {
      totalPortDays,
      freeDays,
      billableDays,
      dailyRateBDT,
      totalPenaltyBDT,
      isDemurrageCharged: billableDays > 0,
    };
  }

  /**
   * Opens or drafts an Import Letter of Credit (LC) linked to a Purchase Order.
   * Enforces 1st-Tier Foreign Exchange Rate tracking (`openingExchangeRate`).
   */
  public static async createImportLc(
    dto: CreateImportLcDTO,
    session?: ClientSession
  ): Promise<IImportLC> {
    const supplier = await SupplierModel.findById(dto.supplierId).session(session || null);
    if (!supplier) {
      throw new NotFoundError('Supplier', dto.supplierId.toString());
    }

    if (dto.purchaseOrderId) {
      const po = await PurchaseOrderModel.findById(dto.purchaseOrderId).session(session || null);
      if (!po) {
        throw new NotFoundError('PurchaseOrder', dto.purchaseOrderId.toString());
      }
    }

    if (dto.openingExchangeRate <= 0) {
      throw new ValidationError('Opening exchange rate must be greater than zero');
    }
    if (dto.lcValueFC <= 0) {
      throw new ValidationError('LC foreign currency value must be greater than zero');
    }

    let lcNumber = dto.lcNumber?.trim().toUpperCase();
    if (!lcNumber) {
      lcNumber = await CounterService.getNextSequence('LC', session);
    }

    const existing = await ImportLCModel.findOne({ lcNumber }).session(session || null);
    if (existing) {
      throw new DuplicateKeyError(`Import LC with number '${lcNumber}' already exists`);
    }

    const lcDocs = await ImportLCModel.create(
      [
        {
          lcNumber,
          version: dto.version || 'V1',
          supplierId: supplier._id,
          purchaseOrderId: dto.purchaseOrderId ? new Types.ObjectId(dto.purchaseOrderId) : undefined,
          issuingBank: dto.issuingBank.trim(),
          foreignCurrency: dto.foreignCurrency,
          lcValueFC: dto.lcValueFC,
          openingExchangeRate: dto.openingExchangeRate,
          status: 'LC_OPENED',
          portFreeDays: dto.portFreeDays !== undefined ? dto.portFreeDays : 4,
          demurrageDailyRateBDT: dto.demurrageDailyRateBDT !== undefined ? dto.demurrageDailyRateBDT : 5000,
          realizedFxGainLoss: 0.0,
        },
      ],
      { session }
    );

    const lc = lcDocs[0];
    logger.info(`Import LC created: ${lc.lcNumber} (${lc.lcValueFC} ${lc.foreignCurrency} @ ${lc.openingExchangeRate} BDT)`);
    return lc;
  }

  /**
   * Transitions an LC through its statutory lifecycle stages:
   * DRAFT -> LC_OPENED -> SHIPMENT_IN_TRANSIT -> PORT_ARRIVED -> CUSTOMS_CLEARED -> FINAL_SETTLEMENT
   */
  public static async transitionLcStage(
    dto: TransitionLcStageDTO,
    session?: ClientSession
  ): Promise<IImportLC> {
    const lc = await ImportLCModel.findById(dto.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', dto.lcId.toString());
    }

    const previousStage = lc.status;
    const nextStage = dto.nextStage;

    // Define permissible progression map
    const permissibleTransitions: Record<string, string[]> = {
      DRAFT: ['LC_OPENED'],
      LC_OPENED: ['SHIPMENT_IN_TRANSIT', 'IN_TRANSIT', 'AMENDED'],
      IN_TRANSIT: ['PORT_ARRIVED', 'CUSTOMS_ASSESSED', 'PORT_CLEARED'],
      SHIPMENT_IN_TRANSIT: ['PORT_ARRIVED', 'CUSTOMS_ASSESSED', 'PORT_CLEARED'],
      PORT_ARRIVED: ['CUSTOMS_ASSESSED', 'CUSTOMS_CLEARED', 'PORT_CLEARED'],
      CUSTOMS_ASSESSED: ['CUSTOMS_CLEARED', 'PORT_CLEARED', 'FINAL_SETTLEMENT', 'SETTLED'],
      CUSTOMS_CLEARED: ['FINAL_SETTLEMENT', 'SETTLED', 'PORT_CLEARED'],
      PORT_CLEARED: ['FINAL_SETTLEMENT', 'SETTLED'],
      AMENDED: ['SHIPMENT_IN_TRANSIT', 'IN_TRANSIT', 'PORT_ARRIVED'],
      FINAL_SETTLEMENT: [],
      SETTLED: [],
    };

    const allowed = permissibleTransitions[previousStage] || [];
    if (!allowed.includes(nextStage) && previousStage !== nextStage) {
      throw new ValidationError(
        `Invalid LC lifecycle stage transition: Cannot transition from '${previousStage}' to '${nextStage}'. Allowed targets: [${allowed.join(', ')}]`
      );
    }

    lc.status = nextStage;

    if (dto.portArrivalDate) {
      lc.portArrivalDate = new Date(dto.portArrivalDate);
    }
    if (dto.customsClearanceDate) {
      lc.customsClearanceDate = new Date(dto.customsClearanceDate);
    }

    // If both portArrivalDate and customsClearanceDate are present, compute and record demurrage
    if (lc.portArrivalDate && lc.customsClearanceDate) {
      const demurrage = this.computeDemurrage({
        arrivalDate: lc.portArrivalDate,
        clearanceDate: lc.customsClearanceDate,
        freeDays: lc.portFreeDays,
        dailyRateBDT: lc.demurrageDailyRateBDT,
      });

      lc.demurrageBillableDays = demurrage.billableDays;
      lc.calculatedDemurragePenaltyBDT = demurrage.totalPenaltyBDT;
    }

    await lc.save({ session });
    logger.info(`Import LC ${lc.lcNumber} stage transitioned from ${previousStage} to ${nextStage}`);
    return lc;
  }

  /**
   * Records 2nd-Tier FX Rate: Bill of Entry / Customs Assessment Rate at port arrival.
   */
  public static async recordCustomsAssessment(
    dto: CustomsAssessmentDTO,
    session?: ClientSession
  ): Promise<IImportLC> {
    const lc = await ImportLCModel.findById(dto.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', dto.lcId.toString());
    }

    if (dto.customsAssessmentRate <= 0) {
      throw new ValidationError('Customs assessment exchange rate must be greater than zero');
    }

    lc.customsAssessmentRate = dto.customsAssessmentRate;
    if (lc.status === 'SHIPMENT_IN_TRANSIT' || lc.status === 'PORT_ARRIVED' || lc.status === 'IN_TRANSIT') {
      lc.status = 'CUSTOMS_ASSESSED';
    }

    await lc.save({ session });
    logger.info(`Import LC ${lc.lcNumber} Customs Assessment Rate recorded: ${dto.customsAssessmentRate} BDT`);
    return lc;
  }

  /**
   * Records 3rd-Tier FX Rate: Bank Final Settlement Rate and calculates realized FX gain/loss.
   * Realized FX Gain/Loss = (Final Settlement Rate - Opening Rate) * LC Value FC.
   */
  public static async settleLc(
    dto: SettleLcDTO,
    session?: ClientSession
  ): Promise<IImportLC> {
    const lc = await ImportLCModel.findById(dto.lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', dto.lcId.toString());
    }

    if (dto.finalSettlementRate <= 0) {
      throw new ValidationError('Final settlement exchange rate must be greater than zero');
    }

    lc.finalSettlementRate = dto.finalSettlementRate;
    // Calculate realized FX gain/loss
    // Positive indicates higher BDT spent (FX loss); negative indicates savings (FX gain)
    const rateDiff = dto.finalSettlementRate - lc.openingExchangeRate;
    lc.realizedFxGainLoss = Number((rateDiff * lc.lcValueFC).toFixed(2));
    lc.status = 'FINAL_SETTLEMENT';

    await lc.save({ session });
    logger.info(
      `Import LC ${lc.lcNumber} settled at ${dto.finalSettlementRate} BDT (Realized FX Variance: ${lc.realizedFxGainLoss} BDT)`
    );
    return lc;
  }

  /**
   * Explicitly triggers and attaches demurrage penalty calculation for an LC.
   */
  public static async calculateAndSaveDemurrage(
    lcId: string | Types.ObjectId,
    arrivalDate: Date | string,
    clearanceDate: Date | string,
    dailyRateBDT?: number,
    session?: ClientSession
  ): Promise<{ lc: IImportLC; demurrage: DemurrageCalculationResult }> {
    const lc = await ImportLCModel.findById(lcId).session(session || null);
    if (!lc) {
      throw new NotFoundError('ImportLC', lcId.toString());
    }

    const demurrage = this.computeDemurrage({
      arrivalDate,
      clearanceDate,
      freeDays: lc.portFreeDays,
      dailyRateBDT: dailyRateBDT !== undefined ? dailyRateBDT : lc.demurrageDailyRateBDT,
    });

    lc.portArrivalDate = new Date(arrivalDate);
    lc.customsClearanceDate = new Date(clearanceDate);
    lc.demurrageBillableDays = demurrage.billableDays;
    lc.calculatedDemurragePenaltyBDT = demurrage.totalPenaltyBDT;
    if (dailyRateBDT) {
      lc.demurrageDailyRateBDT = dailyRateBDT;
    }

    await lc.save({ session });
    logger.info(
      `Demurrage calculated for LC ${lc.lcNumber}: ${demurrage.totalPortDays} total days - ${demurrage.freeDays} free = ${demurrage.billableDays} billable days. Penalty: ${demurrage.totalPenaltyBDT} BDT`
    );

    return { lc, demurrage };
  }

  /**
   * Retrieves an Import LC by ObjectId with populated relations.
   */
  public static async getById(lcId: string | Types.ObjectId): Promise<IImportLC> {
    const lc = await ImportLCModel.findById(lcId)
      .populate('supplierId', 'companyName supplierCode country currency swiftCode')
      .populate('purchaseOrderId', 'poNumber grandTotal currency status items');

    if (!lc) {
      throw new NotFoundError('ImportLC', lcId.toString());
    }

    return lc;
  }

  /**
   * Lists Import LCs with filtering and pagination.
   */
  public static async listImportLcs(
    filters: { status?: LCStatus; supplierId?: string; search?: string },
    pagination: { page?: number; limit?: number }
  ): Promise<{
    data: IImportLC[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: Record<string, any> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.supplierId) {
      query.supplierId = new Types.ObjectId(filters.supplierId);
    }
    if (filters.search) {
      query.lcNumber = { $regex: filters.search.trim(), $options: 'i' };
    }

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ImportLCModel.find(query)
        .populate('supplierId', 'companyName supplierCode country')
        .populate('purchaseOrderId', 'poNumber grandTotal status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ImportLCModel.countDocuments(query),
    ]);

    return {
      data: data as unknown as IImportLC[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default ImportLcService;
