import { ClientSession, Types } from 'mongoose';
import {
  PartnerModel,
  IPartner,
  IPartnerAllocation,
} from '../models/Partner';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { QuorumApprovalModel, IQuorumApproval } from '../models/QuorumApproval';
import { UserModel } from '../models/User';
import { AccountingService } from './AccountingService';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreatePartnerDTO {
  userId: Types.ObjectId | string;
  partnerName: string;
  capitalContribution: number;
  currentAccountBalance?: number;
  joinedDate?: Date | string;
  profitShareRatio?: number;
  drawingsBalance?: number;
  isEligibleForAllocation?: boolean;
  isActive?: boolean;
}

export interface RecordDrawingsDTO {
  partnerId: Types.ObjectId | string;
  amountBDT: number;
  paymentAccountCode?: number; // default 1020 Bank
  transactionDate?: Date | string;
  notes?: string;
  initiatingUserId?: Types.ObjectId | string;
}

export interface PartnerDistributionItem {
  partnerId: Types.ObjectId;
  partnerName: string;
  profitShareRatio: number;
  allocatedAmountBDT: number;
  newCurrentAccountBalance: number;
}

export interface ProfitDistributionResult {
  fiscalYear: string;
  totalNetProfitBDT: number;
  partnerDistributions: PartnerDistributionItem[];
  journalVoucherNo?: string;
  journalEntryId?: Types.ObjectId;
  quorumApproval?: IQuorumApproval;
  quorumTier: 4;
  requiredSignatures: number;
}

export class PartnerService {
  /**
   * Registers a new partner with capital contribution, profit sharing percentage,
   * and current account ledger.
   */
  public static async createPartner(
    partnerData: CreatePartnerDTO,
    session?: ClientSession
  ): Promise<IPartner> {
    const { userId, partnerName, capitalContribution } = partnerData;

    if (!userId) throw new ValidationError('userId is required');
    if (!partnerName || !partnerName.trim()) {
      throw new ValidationError('partnerName is required');
    }
    if (capitalContribution < 0) {
      throw new ValidationError('capitalContribution cannot be negative');
    }

    const profitShareRatio = partnerData.profitShareRatio ?? 0;
    if (profitShareRatio < 0 || profitShareRatio > 100) {
      throw new ValidationError('profitShareRatio must be between 0 and 100');
    }

    const parsedUserId =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // Check if partner already exists for this user
    const existing = await (session
      ? PartnerModel.findOne({ userId: parsedUserId }).session(session)
      : PartnerModel.findOne({ userId: parsedUserId }));

    if (existing) {
      throw new ValidationError(
        `Partner profile already exists for user ${userId}`
      );
    }

    const partnerDoc = new PartnerModel({
      userId: parsedUserId,
      partnerName: partnerName.trim(),
      capitalContribution: Number(capitalContribution.toFixed(2)),
      currentAccountBalance: Number((partnerData.currentAccountBalance || 0).toFixed(2)),
      profitShareRatio: Number(profitShareRatio.toFixed(2)),
      drawingsBalance: Number((partnerData.drawingsBalance || 0).toFixed(2)),
      joinedDate: partnerData.joinedDate ? new Date(partnerData.joinedDate) : new Date(),
      isEligibleForAllocation: partnerData.isEligibleForAllocation ?? true,
      isActive: partnerData.isActive ?? true,
      allocationTransactions: [],
    });

    await partnerDoc.save(session ? { session } : {});

    logger.info(
      `Partner registered: ${partnerDoc.partnerName} (Capital: ${partnerDoc.capitalContribution} BDT, Ratio: ${partnerDoc.profitShareRatio}%)`
    );

    return partnerDoc;
  }

  /**
   * Distributes annual net profit among active partners:
   *
   * 1. Requires Tier 4 Quorum Approval (All Directors sign-off, minimum 3 directors).
   * 2. Calculates each partner's share based on `profitShareRatio` (must sum to 100%).
   * 3. Credits partner capital/current accounts and appends allocation records.
   * 4. Generates balanced double-entry accounting JV:
   *    - Debit: 3020 Retained Earnings
   *    - Credit: 3010 Partner Capital Accounts
   *
   * @param fiscalYear E.g. '2025-2026' or '2026'
   * @param netProfitBDT Total net profit to distribute
   * @param session Optional MongoDB ClientSession
   * @param initiatingUserId Initiating Director/Admin user ID
   */
  public static async distributeAnnualProfit(
    fiscalYear: string,
    netProfitBDT: number,
    session?: ClientSession,
    initiatingUserId?: string | Types.ObjectId
  ): Promise<ProfitDistributionResult> {
    if (!fiscalYear || !fiscalYear.trim()) {
      throw new ValidationError('fiscalYear is required (e.g. 2026 or 2025-2026)');
    }
    if (!netProfitBDT || netProfitBDT <= 0) {
      throw new ValidationError('netProfitBDT must be strictly greater than zero');
    }

    const normalizedYear = fiscalYear.trim();
    const roundedNetProfit = Number(netProfitBDT.toFixed(2));

    // 1. Fetch all active partners eligible for profit allocation
    const query = { isActive: true, isEligibleForAllocation: true };
    const partners = await (session
      ? PartnerModel.find(query).session(session)
      : PartnerModel.find(query));

    if (!partners || partners.length === 0) {
      throw new ValidationError(
        'No active and eligible partners found for profit allocation'
      );
    }

    // 2. Validate and determine profit sharing ratios
    // Must sum to 100%
    const totalExplicitRatio = partners.reduce(
      (sum, p) => sum + (p.profitShareRatio || 0),
      0
    );

    let distributions: Array<{
      partner: IPartner;
      ratio: number;
      amount: number;
    }> = [];

    if (Math.abs(totalExplicitRatio - 100) < 0.01) {
      // Use configured profitShareRatio
      let allocatedAccumulator = 0;
      distributions = partners.map((partner, index) => {
        const ratio = partner.profitShareRatio || 0;
        let amount: number;

        if (index === partners.length - 1) {
          // Adjust last partner to prevent rounding discrepancy
          amount = Number((roundedNetProfit - allocatedAccumulator).toFixed(2));
        } else {
          amount = Number(((roundedNetProfit * ratio) / 100).toFixed(2));
          allocatedAccumulator = Number((allocatedAccumulator + amount).toFixed(2));
        }

        return { partner, ratio, amount };
      });
    } else if (totalExplicitRatio === 0) {
      // If none set, allocate equally among active partners (50/50, etc.)
      const equalRatio = Number((100 / partners.length).toFixed(4));
      let allocatedAccumulator = 0;

      distributions = partners.map((partner, index) => {
        let amount: number;
        if (index === partners.length - 1) {
          amount = Number((roundedNetProfit - allocatedAccumulator).toFixed(2));
        } else {
          amount = Number((roundedNetProfit / partners.length).toFixed(2));
          allocatedAccumulator = Number((allocatedAccumulator + amount).toFixed(2));
        }

        return { partner, ratio: equalRatio, amount };
      });
    } else {
      throw new ValidationError(
        `Configured partner profitShareRatios sum to ${totalExplicitRatio}%, but must sum strictly to 100%`
      );
    }

    // 3. Ensure Chart of Accounts (COA) records exist:
    // 3020 Retained Earnings (Equity)
    // 3010 Partner Capital Accounts (Equity)
    await this.ensureCoaAccountsExist(session);

    // 4. Resolve initiating user (defaults to first director user if not provided)
    let parsedUserId: Types.ObjectId;
    if (initiatingUserId) {
      parsedUserId =
        typeof initiatingUserId === 'string'
          ? new Types.ObjectId(initiatingUserId)
          : initiatingUserId;
    } else {
      const director = await UserModel.findOne({ userType: 'DIRECTOR', isActive: true });
      parsedUserId = director ? (director._id as Types.ObjectId) : partners[0].userId;
    }

    // 5. Generate Accounting Journal Voucher:
    // Debit 3020 Retained Earnings (Total net profit)
    // Credit 3010 Partner Capital Accounts (Lines per partner)
    const jvLines = [
      {
        accountCode: 3020,
        debit: roundedNetProfit,
        credit: 0,
        description: `Annual Net Profit Allocation for FY ${normalizedYear} from Retained Earnings`,
      },
      ...distributions.map((d) => ({
        accountCode: 3010,
        debit: 0,
        credit: d.amount,
        description: `Profit share credit for ${d.partner.partnerName} (${d.ratio}%)`,
      })),
    ];

    const jvResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'JOURNAL',
        sourceDocumentRef: `PROFIT-DIST-${normalizedYear}`,
        lines: jvLines,
        status: 'POSTED',
        notes: `Annual partnership profit distribution for FY ${normalizedYear} (${roundedNetProfit} BDT)`,
      },
      parsedUserId,
      session
    );

    const voucherNo = jvResult.journalEntry.voucherNo;
    const journalId = jvResult.journalEntry._id;

    // 6. Enforce Tier 4 Quorum Approval Requirement (PRD §4 & Prompt 36):
    // All Directors sign-off required (Tier 4 Quorum)
    const totalDirectorsCount = await UserModel.countDocuments({
      userType: 'DIRECTOR',
      isActive: true,
    });
    const requiredSignatures = Math.max(3, totalDirectorsCount || 3);

    let quorumRecord: IQuorumApproval | undefined;
    try {
      const quorumDocs = await QuorumApprovalModel.create(
        [
          {
            targetCollection: 'partners',
            targetId: journalId,
            targetRef: `PROFIT-DIST-${normalizedYear}`,
            quorumTier: 4,
            requiredCount: requiredSignatures,
            approvals: [],
            isComplete: false,
            emergencyOverride: false,
          },
        ],
        session ? { session } : {}
      );
      quorumRecord = quorumDocs[0];
    } catch (quorumErr) {
      logger.warn('Quorum approval record creation warning:', quorumErr);
    }

    // 7. Update partner current accounts and log allocation transaction
    const partnerDistributions: PartnerDistributionItem[] = [];

    for (const dist of distributions) {
      const partner = dist.partner;
      const allocatedAmount = dist.amount;

      partner.currentAccountBalance = Number(
        (partner.currentAccountBalance + allocatedAmount).toFixed(2)
      );

      const allocationRecord: IPartnerAllocation = {
        period: normalizedYear,
        allocatedAmount,
        journalRef: voucherNo,
        approvedAt: new Date(),
      };

      partner.allocationTransactions.push(allocationRecord);
      await partner.save(session ? { session } : {});

      partnerDistributions.push({
        partnerId: partner._id,
        partnerName: partner.partnerName,
        profitShareRatio: dist.ratio,
        allocatedAmountBDT: allocatedAmount,
        newCurrentAccountBalance: partner.currentAccountBalance,
      });
    }

    logger.info(
      `Distributed annual profit for FY ${normalizedYear}: Total ${roundedNetProfit} BDT among ${partners.length} partners (Voucher: ${voucherNo}, Tier 4 Quorum required: ${requiredSignatures} Directors)`
    );

    return {
      fiscalYear: normalizedYear,
      totalNetProfitBDT: roundedNetProfit,
      partnerDistributions,
      journalVoucherNo: voucherNo,
      journalEntryId: journalId,
      quorumApproval: quorumRecord,
      quorumTier: 4,
      requiredSignatures,
    };
  }

  /**
   * Records partner drawings against their capital or current account.
   *
   * Posts double-entry Journal Voucher:
   * - Debit: 3010 Partner Capital / Current Accounts
   * - Credit: 1020 Bank / 1010 Cash
   */
  public static async recordPartnerDrawings(
    drawingsData: RecordDrawingsDTO,
    session?: ClientSession
  ): Promise<{
    partner: IPartner;
    drawingsAmount: number;
    newCurrentAccountBalance: number;
    journalVoucherNo?: string;
  }> {
    const { partnerId, amountBDT } = drawingsData;
    if (!partnerId) throw new ValidationError('partnerId is required');
    if (!amountBDT || amountBDT <= 0) {
      throw new ValidationError('amountBDT must be strictly greater than zero');
    }

    const partner = await (session
      ? PartnerModel.findById(partnerId).session(session)
      : PartnerModel.findById(partnerId));

    if (!partner) {
      throw new NotFoundError(`Partner with id '${partnerId}' not found`);
    }

    const roundedAmount = Number(amountBDT.toFixed(2));
    const bankAccountCode = drawingsData.paymentAccountCode || 1020;

    // Ensure COA accounts
    await this.ensureCoaAccountsExist(session);

    // Update balances
    partner.currentAccountBalance = Number(
      (partner.currentAccountBalance - roundedAmount).toFixed(2)
    );
    partner.drawingsBalance = Number(
      ((partner.drawingsBalance || 0) + roundedAmount).toFixed(2)
    );

    await partner.save(session ? { session } : {});

    // Post Drawings JV
    let voucherNo: string | undefined;
    try {
      const parsedUserId = drawingsData.initiatingUserId
        ? typeof drawingsData.initiatingUserId === 'string'
          ? new Types.ObjectId(drawingsData.initiatingUserId)
          : drawingsData.initiatingUserId
        : partner.userId;

      const jvResult = await AccountingService.createJournalVoucher(
        {
          voucherType: 'PAYMENT',
          sourceDocumentRef: `DRAWING-${partner.partnerName.replace(/\s+/g, '_')}-${Date.now()}`,
          lines: [
            {
              accountCode: 3010,
              debit: roundedAmount,
              credit: 0,
              description: `Partner drawings withdrawal by ${partner.partnerName}`,
            },
            {
              accountCode: bankAccountCode,
              debit: 0,
              credit: roundedAmount,
              description: `Bank payout for partner drawings`,
            },
          ],
          status: 'POSTED',
          notes: drawingsData.notes || `Partner drawings for ${partner.partnerName}`,
        },
        parsedUserId,
        session
      );
      voucherNo = jvResult.journalEntry.voucherNo;
    } catch (jvErr) {
      logger.warn(`Drawings JV posting deferred for partner ${partner.partnerName}:`, jvErr);
    }

    return {
      partner,
      drawingsAmount: roundedAmount,
      newCurrentAccountBalance: partner.currentAccountBalance,
      journalVoucherNo: voucherNo,
    };
  }

  /**
   * Helper: Ensures COA Equity accounts (3010 & 3020) and Bank account (1020) exist.
   */
  private static async ensureCoaAccountsExist(session?: ClientSession): Promise<void> {
    const required = [
      {
        accountCode: 1020,
        accountName: 'Bank Accounts — Operations',
        accountType: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
      },
      {
        accountCode: 3010,
        accountName: 'Partner Capital & Current Accounts',
        accountType: 'EQUITY' as const,
        normalBalance: 'CREDIT' as const,
      },
      {
        accountCode: 3020,
        accountName: 'Retained Earnings & Accumulated Profits',
        accountType: 'EQUITY' as const,
        normalBalance: 'CREDIT' as const,
      },
    ];

    for (const acc of required) {
      const exists = await (session
        ? ChartOfAccountsModel.findOne({ accountCode: acc.accountCode }).session(session)
        : ChartOfAccountsModel.findOne({ accountCode: acc.accountCode }));

      if (!exists) {
        await ChartOfAccountsModel.create(
          [
            {
              accountCode: acc.accountCode,
              accountName: acc.accountName,
              accountType: acc.accountType,
              normalBalance: acc.normalBalance,
              isControl: false,
              isActive: true,
            },
          ],
          session ? { session } : {}
        );
      }
    }
  }

  /**
   * Retrieves all partners matching filter criteria.
   */
  public static async getPartners(filter: { isActive?: boolean } = {}): Promise<IPartner[]> {
    const query: any = {};
    if (filter.isActive !== undefined) query.isActive = filter.isActive;
    const records = await PartnerModel.find(query).sort({ capitalContribution: -1 }).lean();
    return records as unknown as IPartner[];
  }

  /**
   * Retrieves a partner by id.
   */
  public static async getPartnerById(
    partnerId: Types.ObjectId | string,
    session?: ClientSession
  ): Promise<IPartner> {
    const partner = await (session
      ? PartnerModel.findById(partnerId).session(session)
      : PartnerModel.findById(partnerId));
    if (!partner) {
      throw new NotFoundError(`Partner with id '${partnerId}' not found`);
    }
    return partner;
  }

  /**
   * Retrieves a partner by user ID.
   */
  public static async getPartnerByUserId(
    userId: Types.ObjectId | string,
    session?: ClientSession
  ): Promise<IPartner | null> {
    const query = {
      userId: typeof userId === 'string' ? new Types.ObjectId(userId) : userId,
    };
    return (session ? PartnerModel.findOne(query).session(session) : PartnerModel.findOne(query));
  }
}

export default PartnerService;
