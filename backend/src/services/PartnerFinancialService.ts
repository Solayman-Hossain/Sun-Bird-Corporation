import { Types } from 'mongoose';
import { PartnerModel, IPartner } from '../models/Partner';
import {
  PartnerTransactionModel,
  IPartnerTransaction,
} from '../models/PartnerTransaction';
import { AccountingService } from './AccountingService';
import { ValidationError, NotFoundError } from '../errors/AppError';

export class PartnerFinancialService {
  /**
   * Retrieves all active partners
   */
  public static async getPartners(organizationId?: string): Promise<IPartner[]> {
    const filter: any = {};
    if (organizationId) filter.organizationId = new Types.ObjectId(organizationId);
    return PartnerModel.find(filter).sort({ joinedDate: 1 }).lean() as any;
  }

  /**
   * Creates a new Partner profile
   */
  public static async createPartner(data: {
    organizationId?: string | Types.ObjectId;
    partnerName: string;
    partnerCode?: string;
    partnerType?: string;
    phone?: string;
    email?: string;
    address?: string;
    nid?: string;
    capitalContribution?: number;
    profitShareRatio?: number;
    joinedDate?: Date | string;
    notes?: string;
  }): Promise<IPartner> {
    const code = data.partnerCode || `PRT-${Math.floor(100 + Math.random() * 900)}`;
    const capital = Number(data.capitalContribution || 0);

    const partner = await PartnerModel.create({
      organizationId: data.organizationId ? new Types.ObjectId(data.organizationId.toString()) : undefined,
      partnerCode: code,
      partnerName: data.partnerName,
      partnerType: data.partnerType || 'EQUITY_PARTNER',
      phone: data.phone,
      email: data.email,
      address: data.address,
      nid: data.nid,
      capitalContribution: capital,
      currentAccountBalance: capital,
      profitShareRatio: data.profitShareRatio || 0,
      joinedDate: data.joinedDate ? new Date(data.joinedDate) : new Date(),
      isEligibleForAllocation: true,
      notes: data.notes,
      isActive: true,
    });

    return partner;
  }

  /**
   * Records a Partner Capital Contribution and posts balanced Journal Voucher:
   * DR: Cash/Bank (1005/1010)
   * CR: Partner Capital (3001)
   */
  public static async recordCapitalContribution(dto: {
    organizationId?: string | Types.ObjectId;
    partnerId: string | Types.ObjectId;
    amount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'INTERNAL_TRANSFER';
    bankAccountCode?: number; // 1005 or 1010
    reference?: string;
    notes?: string;
    userId: string | Types.ObjectId;
  }): Promise<{ transaction: IPartnerTransaction; journalVoucherNo?: string }> {
    if (dto.amount <= 0) {
      throw new ValidationError('Capital contribution must be positive');
    }

    const partner = await PartnerModel.findById(dto.partnerId);
    if (!partner) throw new NotFoundError('Partner', dto.partnerId.toString());

    const cashBankCode = dto.bankAccountCode || (dto.paymentMethod === 'CASH' ? 1005 : 1010);
    const ref = dto.reference || `CAP-${partner.partnerCode || partner.partnerName}-${Date.now()}`;

    // Post double-entry JV
    const jvResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'RECEIPT',
        transactionDate: new Date(),
        sourceDocumentRef: ref,
        lines: [
          {
            accountCode: cashBankCode,
            accountName: cashBankCode === 1005 ? 'Cash in Hand' : 'Cash at Bank',
            debit: dto.amount,
            credit: 0,
            description: `Capital injection by Partner ${partner.partnerName}`,
          },
          {
            accountCode: 3001, // Partner Capital
            accountName: `Partner Capital (${partner.partnerName})`,
            debit: 0,
            credit: dto.amount,
            description: `Equity contribution from ${partner.partnerName}`,
          },
        ],
        notes: dto.notes,
      },
      dto.userId
    );

    // Update partner capital balance
    partner.capitalContribution = (partner.capitalContribution || 0) + dto.amount;
    partner.currentAccountBalance = (partner.currentAccountBalance || 0) + dto.amount;
    await partner.save();

    // Log transaction
    const tx = await PartnerTransactionModel.create({
      organizationId: partner.organizationId || new Types.ObjectId(),
      partnerId: partner._id,
      partnerName: partner.partnerName,
      transactionType: 'CAPITAL_CONTRIBUTION',
      transactionDate: new Date(),
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      bankAccountCode: cashBankCode,
      journalVoucherNo: jvResult.journalEntry.voucherNo,
      reference: ref,
      notes: dto.notes,
      status: 'POSTED',
      approvedBy: new Types.ObjectId(dto.userId.toString()),
      approvedAt: new Date(),
    });

    return { transaction: tx, journalVoucherNo: jvResult.journalEntry.voucherNo };
  }

  /**
   * Records a Partner Drawings / Withdrawal and posts balanced Journal Voucher:
   * DR: Partner Drawings / Current Account (3002)
   * CR: Cash/Bank (1005/1010)
   */
  public static async recordPartnerWithdrawal(dto: {
    organizationId?: string | Types.ObjectId;
    partnerId: string | Types.ObjectId;
    amount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
    bankAccountCode?: number; // 1005 or 1010
    reference?: string;
    notes?: string;
    userId: string | Types.ObjectId;
  }): Promise<{ transaction: IPartnerTransaction; journalVoucherNo?: string }> {
    if (dto.amount <= 0) {
      throw new ValidationError('Withdrawal amount must be positive');
    }

    const partner = await PartnerModel.findById(dto.partnerId);
    if (!partner) throw new NotFoundError('Partner', dto.partnerId.toString());

    const cashBankCode = dto.bankAccountCode || (dto.paymentMethod === 'CASH' ? 1005 : 1010);
    const ref = dto.reference || `DRAW-${partner.partnerCode || partner.partnerName}-${Date.now()}`;

    // Post double-entry JV
    const jvResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        transactionDate: new Date(),
        sourceDocumentRef: ref,
        lines: [
          {
            accountCode: 3002, // Partner Current / Drawings
            accountName: `Partner Drawings (${partner.partnerName})`,
            debit: dto.amount,
            credit: 0,
            description: `Capital drawings by Partner ${partner.partnerName}`,
          },
          {
            accountCode: cashBankCode,
            accountName: cashBankCode === 1005 ? 'Cash in Hand' : 'Cash at Bank',
            debit: 0,
            credit: dto.amount,
            description: `Disbursement to Partner ${partner.partnerName}`,
          },
        ],
        notes: dto.notes,
      },
      dto.userId
    );

    // Update drawings balance
    partner.drawingsBalance = (partner.drawingsBalance || 0) + dto.amount;
    partner.currentAccountBalance = (partner.currentAccountBalance || 0) - dto.amount;
    await partner.save();

    const tx = await PartnerTransactionModel.create({
      organizationId: partner.organizationId || new Types.ObjectId(),
      partnerId: partner._id,
      partnerName: partner.partnerName,
      transactionType: 'WITHDRAWAL',
      transactionDate: new Date(),
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      bankAccountCode: cashBankCode,
      journalVoucherNo: jvResult.journalEntry.voucherNo,
      reference: ref,
      notes: dto.notes,
      status: 'POSTED',
      approvedBy: new Types.ObjectId(dto.userId.toString()),
      approvedAt: new Date(),
    });

    return { transaction: tx, journalVoucherNo: jvResult.journalEntry.voucherNo };
  }

  /**
   * Calculates preview for Partner Profit Distribution based on profitShareRatio
   */
  public static async calculateProfitDistributionPreview(params: {
    organizationId?: string;
    fiscalYear: string;
    netProfit: number;
  }): Promise<{
    fiscalYear: string;
    netProfit: number;
    distributions: Array<{
      partnerId: string;
      partnerName: string;
      profitShareRatio: number;
      allocatedProfit: number;
    }>;
    totalAllocated: number;
    retainedEarnings: number;
  }> {
    const partners = await PartnerModel.find({ isActive: true, isEligibleForAllocation: true }).lean();
    if (partners.length === 0) {
      throw new ValidationError('No active eligible partners found for distribution');
    }

    let totalAllocated = 0;
    const distributions: any[] = [];

    for (const p of partners) {
      const ratio = p.profitShareRatio || 0;
      const allocated = Number(((params.netProfit * ratio) / 100).toFixed(2));
      totalAllocated += allocated;
      distributions.push({
        partnerId: p._id.toString(),
        partnerName: p.partnerName,
        profitShareRatio: ratio,
        allocatedProfit: allocated,
      });
    }

    const retainedEarnings = Number((params.netProfit - totalAllocated).toFixed(2));

    return {
      fiscalYear: params.fiscalYear,
      netProfit: params.netProfit,
      distributions,
      totalAllocated,
      retainedEarnings,
    };
  }

  /**
   * Posts Partner Profit Distribution with balanced Journal Voucher:
   * DR: Retained Earnings / Current Year Profit (3010)
   * CR: Partner Profit Payable (2040)
   */
  public static async postProfitDistribution(dto: {
    organizationId?: string | Types.ObjectId;
    fiscalYear: string;
    netProfit: number;
    userId: string | Types.ObjectId;
  }): Promise<{
    journalVoucherNo: string;
    distributions: any[];
  }> {
    const preview = await this.calculateProfitDistributionPreview({
      organizationId: dto.organizationId ? String(dto.organizationId) : undefined,
      fiscalYear: dto.fiscalYear,
      netProfit: dto.netProfit,
    });
    const ref = `PROFIT-DIST-${dto.fiscalYear}`;

    // Construct lines: Debit Retained Earnings, Credit each partner's payable
    const lines: any[] = [
      {
        accountCode: 3010,
        accountName: 'Retained Earnings & Accumulated Surplus',
        debit: preview.totalAllocated,
        credit: 0,
        description: `Annual profit distribution for FY ${dto.fiscalYear}`,
      },
    ];

    for (const dist of preview.distributions) {
      if (dist.allocatedProfit <= 0) continue;
      lines.push({
        accountCode: 2040, // Partner Profit Payable
        accountName: `Partner Profit Payable (${dist.partnerName})`,
        debit: 0,
        credit: dist.allocatedProfit,
        description: `Profit allocation for ${dist.partnerName} (${dist.profitShareRatio}%)`,
      });
    }

    const jvResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'JOURNAL',
        transactionDate: new Date(),
        sourceDocumentRef: ref,
        lines,
        notes: `Annual Partner Profit Distribution FY ${dto.fiscalYear}`,
      },
      dto.userId
    );

    // Update each partner's current account balance and log transaction
    for (const dist of preview.distributions) {
      const p = await PartnerModel.findById(dist.partnerId);
      if (p) {
        p.currentAccountBalance = (p.currentAccountBalance || 0) + dist.allocatedProfit;
        p.allocationTransactions.push({
          period: dto.fiscalYear,
          allocatedAmount: dist.allocatedProfit,
          journalRef: jvResult.journalEntry.voucherNo,
          approvedAt: new Date(),
        });
        await p.save();

        await PartnerTransactionModel.create({
          organizationId: p.organizationId || new Types.ObjectId(),
          partnerId: p._id,
          partnerName: p.partnerName,
          transactionType: 'PROFIT_DISTRIBUTION',
          transactionDate: new Date(),
          amount: dist.allocatedProfit,
          journalVoucherNo: jvResult.journalEntry.voucherNo,
          reference: ref,
          notes: `Profit distribution ${dto.fiscalYear}`,
          status: 'POSTED',
          approvedBy: new Types.ObjectId(dto.userId.toString()),
          approvedAt: new Date(),
        });
      }
    }

    return {
      journalVoucherNo: jvResult.journalEntry.voucherNo,
      distributions: preview.distributions,
    };
  }

  /**
   * Partner Settlement: Settles partner profit payable with cash/bank disbursement:
   * DR: Partner Profit Payable (2040)
   * CR: Bank (1010)
   */
  public static async recordPartnerSettlement(dto: {
    partnerId: string | Types.ObjectId;
    amount: number;
    paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
    bankAccountCode?: number; // 1010
    reference?: string;
    notes?: string;
    userId: string | Types.ObjectId;
  }): Promise<{ transaction: IPartnerTransaction; journalVoucherNo?: string }> {
    if (dto.amount <= 0) {
      throw new ValidationError('Settlement amount must be positive');
    }

    const partner = await PartnerModel.findById(dto.partnerId);
    if (!partner) throw new NotFoundError('Partner', dto.partnerId.toString());

    const cashBankCode = dto.bankAccountCode || (dto.paymentMethod === 'CASH' ? 1005 : 1010);
    const ref = dto.reference || `SETTLE-${partner.partnerCode || partner.partnerName}-${Date.now()}`;

    // Post double-entry JV
    const jvResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        transactionDate: new Date(),
        sourceDocumentRef: ref,
        lines: [
          {
            accountCode: 2040, // Partner Profit Payable
            accountName: `Partner Profit Payable (${partner.partnerName})`,
            debit: dto.amount,
            credit: 0,
            description: `Profit payout / settlement for Partner ${partner.partnerName}`,
          },
          {
            accountCode: cashBankCode,
            accountName: cashBankCode === 1005 ? 'Cash in Hand' : 'Cash at Bank',
            debit: 0,
            credit: dto.amount,
            description: `Settlement disbursement to ${partner.partnerName}`,
          },
        ],
        notes: dto.notes,
      },
      dto.userId
    );

    partner.currentAccountBalance = Math.max(0, (partner.currentAccountBalance || 0) - dto.amount);
    await partner.save();

    const tx = await PartnerTransactionModel.create({
      organizationId: partner.organizationId || new Types.ObjectId(),
      partnerId: partner._id,
      partnerName: partner.partnerName,
      transactionType: 'SETTLEMENT',
      transactionDate: new Date(),
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      bankAccountCode: cashBankCode,
      journalVoucherNo: jvResult.journalEntry.voucherNo,
      reference: ref,
      notes: dto.notes,
      status: 'POSTED',
      approvedBy: new Types.ObjectId(dto.userId.toString()),
      approvedAt: new Date(),
    });

    return { transaction: tx, journalVoucherNo: jvResult.journalEntry.voucherNo };
  }

  /**
   * Partner Ledger: Computes historical statement and running balance
   */
  public static async getPartnerLedger(partnerId: string): Promise<{
    partner: IPartner;
    openingBalance: number;
    closingBalance: number;
    transactions: IPartnerTransaction[];
    entries: Array<{
      date: Date;
      transactionType: string;
      reference: string;
      journalVoucherNo?: string;
      debit: number;
      credit: number;
      balance: number;
      notes?: string;
    }>;
  }> {
    const partner = await PartnerModel.findById(partnerId).lean();
    if (!partner) throw new NotFoundError('Partner', partnerId);

    const txs = await PartnerTransactionModel.find({ partnerId: partner._id, status: 'POSTED' })
      .sort({ transactionDate: 1 })
      .lean();

    let balance = 0;
    const entries: any[] = [];

    for (const t of txs) {
      let debit = 0;
      let credit = 0;
      if (t.transactionType === 'CAPITAL_CONTRIBUTION' || t.transactionType === 'PROFIT_DISTRIBUTION') {
        credit = t.amount;
        balance += t.amount;
      } else {
        debit = t.amount;
        balance -= t.amount;
      }

      entries.push({
        date: t.transactionDate,
        transactionType: t.transactionType,
        reference: t.reference || t.journalVoucherNo || 'N/A',
        journalVoucherNo: t.journalVoucherNo,
        debit,
        credit,
        balance,
        notes: t.notes,
      });
    }

    return {
      partner: partner as any,
      openingBalance: 0,
      closingBalance: balance,
      transactions: txs as any,
      entries,
    };
  }
}
