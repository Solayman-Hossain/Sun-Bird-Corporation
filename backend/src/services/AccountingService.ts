import { ClientSession, Types } from 'mongoose';
import {
  JournalEntryModel,
  IJournalEntry,
  IJournalLine,
  VoucherType,
  JournalStatus,
} from '../models/JournalEntry';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { QuorumApprovalModel, IQuorumApproval } from '../models/QuorumApproval';
import { CounterService } from './CounterService';
import {
  DoubleEntryImbalanceError,
  ValidationError,
  NotFoundError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface CreateVoucherLineDTO {
  accountId?: Types.ObjectId | string;
  accountCode: number;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateVoucherDTO {
  voucherType: VoucherType;
  transactionDate?: Date | string;
  sourceDocumentRef: string;
  lines: CreateVoucherLineDTO[];
  idempotencyKey?: string;
  status?: 'DRAFT' | 'SUBMITTED' | 'POSTED';
  notes?: string;
}

export interface JournalFilterDTO {
  status?: JournalStatus;
  voucherType?: VoucherType;
  accountCode?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CreateVoucherResult {
  journalEntry: IJournalEntry;
  quorumApproval?: IQuorumApproval;
}

export interface ReverseVoucherResult {
  originalVoucher: IJournalEntry;
  reversalVoucher: IJournalEntry;
}

export class AccountingService {
  /**
   * Creates a double-entry balanced Journal Voucher with strict mathematical checks,
   * active Chart of Accounts validation, and multi-director quorum policy evaluation.
   *
   * @param voucherData DTO containing voucher header and lines
   * @param userId Initiating user ObjectId string
   * @param session Optional MongoDB ClientSession for ACID transactions
   */
  public static async createJournalVoucher(
    voucherData: CreateVoucherDTO,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<CreateVoucherResult> {
    const { voucherType, sourceDocumentRef, lines, idempotencyKey } = voucherData;

    // 1. Basic validation
    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      throw new ValidationError(
        'Journal voucher must contain at least 2 lines (minimum one debit and one credit)'
      );
    }

    if (!sourceDocumentRef || !sourceDocumentRef.trim()) {
      throw new ValidationError('sourceDocumentRef is required for audit trail reference');
    }

    // 2. Mathematical Double-Entry Balance Check: sum(debits) === sum(credits)
    const sumDebit = Number(
      lines.reduce((acc, line) => acc + (Number(line.debit) || 0), 0).toFixed(4)
    );
    const sumCredit = Number(
      lines.reduce((acc, line) => acc + (Number(line.credit) || 0), 0).toFixed(4)
    );

    const variance = Math.abs(sumDebit - sumCredit);
    if (variance >= 0.001) {
      logger.warn(
        `Double-entry imbalance detected: Debits=${sumDebit}, Credits=${sumCredit}, Variance=${variance}`
      );
      throw new DoubleEntryImbalanceError(sumDebit, sumCredit);
    }

    const totalDebit = Number(sumDebit.toFixed(2));
    const totalCredit = Number(sumCredit.toFixed(2));

    if (totalDebit <= 0) {
      throw new ValidationError('Total voucher amount must be greater than zero');
    }

    // 3. Validate that all accountCode references exist in active chart_of_accounts
    const distinctAccountCodes = Array.from(new Set(lines.map((l) => Number(l.accountCode))));
    const coaQuery: any = {
      accountCode: { $in: distinctAccountCodes },
      isActive: true,
    };
    const coaRecords = await (session
      ? ChartOfAccountsModel.find(coaQuery).session(session)
      : ChartOfAccountsModel.find(coaQuery));

    const foundCodesMap = new Map<number, { id: Types.ObjectId; name: string }>();
    coaRecords.forEach((coa) => {
      foundCodesMap.set(coa.accountCode, {
        id: coa._id as Types.ObjectId,
        name: coa.accountName,
      });
    });

    const invalidCodes = distinctAccountCodes.filter((code) => !foundCodesMap.has(code));
    if (invalidCodes.length > 0) {
      throw new ValidationError(
        `The following account codes do not exist or are inactive in the Chart of Accounts: ${invalidCodes.join(', ')}`
      );
    }

    // Prepare validated journal lines with verified accountId & accountName
    const validatedLines: IJournalLine[] = lines.map((line) => {
      const coa = foundCodesMap.get(Number(line.accountCode))!;
      return {
        accountId: coa.id,
        accountCode: Number(line.accountCode),
        accountName: line.accountName || coa.name,
        debit: Number((Number(line.debit) || 0).toFixed(2)),
        credit: Number((Number(line.credit) || 0).toFixed(2)),
        description: line.description?.trim(),
      };
    });

    // 4. Evaluate Quorum Policy:
    // If totalDebit > 5,000,000 BDT -> Tier 4 Quorum (3 Directors)
    // Else if totalDebit > 1,000,000 BDT -> Tier 3 Quorum (2 Directors)
    // Else -> Tier 1 (Standard Maker-Checker or Direct Post)
    let requiredQuorumTier: 1 | 2 | 3 | 4 = 1;
    let requiredDirectors = 0;

    if (totalDebit > 5000000) {
      requiredQuorumTier = 4;
      requiredDirectors = 3;
    } else if (totalDebit > 1000000) {
      requiredQuorumTier = 3;
      requiredDirectors = 2;
    }

    const requiresQuorum = requiredQuorumTier >= 3;

    // Determine initial voucher status:
    // If quorum is required -> must be 'SUBMITTED' until approved
    // If no quorum is required -> 'POSTED' (unless client explicitly requested 'DRAFT')
    let status: JournalStatus = 'POSTED';
    let isFullyApproved = true;

    if (requiresQuorum) {
      status = 'SUBMITTED';
      isFullyApproved = false;
    } else if (voucherData.status === 'DRAFT') {
      status = 'DRAFT';
      isFullyApproved = false;
    }

    // 5. Generate gapless sequential voucher number (JV-YYYY-XXXXX)
    const voucherNo = await CounterService.getNextSequence('JV', session);

    const transactionDate = voucherData.transactionDate
      ? new Date(voucherData.transactionDate)
      : new Date();

    // 6. Create JournalEntry document
    const createOptions = session ? { session } : {};
    const createdDocs = await JournalEntryModel.create(
      [
        {
          voucherNo,
          voucherType,
          transactionDate,
          sourceDocumentRef: sourceDocumentRef.trim(),
          lines: validatedLines,
          totalDebit,
          totalCredit,
          status,
          createdBy: new Types.ObjectId(userId.toString()),
          requiredQuorumTier,
          approvals: [],
          isFullyApproved,
          idempotencyKey: idempotencyKey?.trim() || undefined,
        },
      ],
      createOptions
    );

    const journalEntry = createdDocs[0];

    // 7. If Tier 3 or 4, create corresponding record in quorum_approvals collection
    let quorumApproval: IQuorumApproval | undefined;
    if (requiresQuorum) {
      const quorumDocs = await QuorumApprovalModel.create(
        [
          {
            targetCollection: 'journal_entries',
            targetId: journalEntry._id,
            targetRef: journalEntry.voucherNo,
            quorumTier: requiredQuorumTier as 3 | 4,
            requiredCount: requiredDirectors,
            approvals: [],
            isComplete: false,
            emergencyOverride: false,
          },
        ],
        createOptions
      );
      quorumApproval = quorumDocs[0];

      logger.info(
        `Quorum Approval record created for Voucher ${voucherNo} (Tier ${requiredQuorumTier}, Required Directors: ${requiredDirectors}, Total: ${totalDebit} BDT)`
      );
    } else {
      logger.info(
        `Journal Voucher ${voucherNo} posted directly (Amount: ${totalDebit} BDT, Tier ${requiredQuorumTier})`
      );
    }

    return { journalEntry, quorumApproval };
  }

  /**
   * Reverses an existing POSTED journal voucher by generating an exact opposite contra-entry,
   * linking the reversal reference, and marking the original voucher as REVERSED.
   *
   * @param voucherNo Unique voucher number of the voucher to reverse
   * @param reason Auditable business justification for reversal
   * @param userId Initiating user ObjectId
   * @param session Optional MongoDB ClientSession
   */
  public static async reverseJournalVoucher(
    voucherNo: string,
    reason: string,
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<ReverseVoucherResult> {
    if (!reason || !reason.trim()) {
      throw new ValidationError('A detailed reason is required to reverse a journal voucher');
    }

    // 1. Fetch original voucher
    const query = { voucherNo: voucherNo.trim().toUpperCase() };
    const originalVoucher = await (session
      ? JournalEntryModel.findOne(query).session(session)
      : JournalEntryModel.findOne(query));

    if (!originalVoucher) {
      throw new NotFoundError('Journal Voucher', voucherNo);
    }

    if (originalVoucher.status === 'REVERSED') {
      throw new ValidationError(`Journal Voucher '${voucherNo}' has already been reversed`);
    }

    if (originalVoucher.status !== 'POSTED') {
      throw new ValidationError(
        `Only POSTED vouchers can be reversed. Current voucher status is '${originalVoucher.status}'`
      );
    }

    // 2. Generate contra-entry lines (Swap debit and credit for every line)
    const contraLines: IJournalLine[] = originalVoucher.lines.map((line) => ({
      accountId: line.accountId,
      accountCode: line.accountCode,
      accountName: line.accountName,
      debit: line.credit, // Contra: old credit becomes new debit
      credit: line.debit, // Contra: old debit becomes new credit
      description: `Reversal of ${originalVoucher.voucherNo}: ${line.description || reason}`.trim(),
    }));

    // 3. Generate new sequential voucher number for the reversal voucher
    const reversalVoucherNo = await CounterService.getNextSequence('JV', session);

    // 4. Create and post Reversal Journal Voucher
    const createOptions = session ? { session } : {};
    const reversalDocs = await JournalEntryModel.create(
      [
        {
          voucherNo: reversalVoucherNo,
          voucherType: originalVoucher.voucherType,
          transactionDate: new Date(),
          sourceDocumentRef: `REVERSAL of ${originalVoucher.voucherNo}: ${reason.trim()}`,
          lines: contraLines,
          totalDebit: originalVoucher.totalCredit,
          totalCredit: originalVoucher.totalDebit,
          status: 'POSTED',
          createdBy: new Types.ObjectId(userId.toString()),
          requiredQuorumTier: 1, // Reversal of an authorized voucher posts immediately
          approvals: [],
          isFullyApproved: true,
          reversalOf: originalVoucher._id,
        },
      ],
      createOptions
    );

    const reversalVoucher = reversalDocs[0];

    // 5. Update original voucher status to REVERSED
    originalVoucher.status = 'REVERSED';
    await originalVoucher.save(createOptions);

    logger.info(
      `Journal Voucher ${originalVoucher.voucherNo} successfully reversed by Reversal Voucher ${reversalVoucher.voucherNo} (Reason: ${reason})`
    );

    return { originalVoucher, reversalVoucher };
  }

  /**
   * Cryptographically signs / approves a high-value Journal Voucher (Tiers 3 & 4).
   * Once required director sign-off count is reached, automatically transitions voucher to POSTED.
   *
   * @param voucherNoOrId Voucher Number or ObjectId string
   * @param directorId User ID of approving Director
   * @param directorRole Role enum ('MD' | 'DIRECTOR_ADMIN' | 'DIRECTOR_FINANCE')
   * @param signatureHash SHA-256 cryptographic signature hash
   * @param session Optional MongoDB ClientSession
   */
  public static async approveJournalVoucher(
    voucherNoOrId: string,
    directorId: string | Types.ObjectId,
    directorRole: 'MD' | 'DIRECTOR_ADMIN' | 'DIRECTOR_FINANCE',
    signatureHash: string,
    session?: ClientSession
  ): Promise<{ journalEntry: IJournalEntry; quorumApproval?: IQuorumApproval; isNowPosted: boolean }> {
    const isObjectId = Types.ObjectId.isValid(voucherNoOrId);
    const query = isObjectId
      ? { _id: new Types.ObjectId(voucherNoOrId) }
      : { voucherNo: voucherNoOrId.trim().toUpperCase() };

    const voucher = await (session
      ? JournalEntryModel.findOne(query).session(session)
      : JournalEntryModel.findOne(query));

    if (!voucher) {
      throw new NotFoundError('Journal Voucher', voucherNoOrId);
    }

    if (voucher.status === 'POSTED') {
      throw new ValidationError(`Voucher '${voucher.voucherNo}' is already POSTED`);
    }

    if (voucher.status === 'REVERSED') {
      throw new ValidationError(`Cannot approve a REVERSED voucher '${voucher.voucherNo}'`);
    }

    // Check if director has already approved
    const directorObjId = new Types.ObjectId(directorId.toString());
    const alreadySigned = voucher.approvals.some((app) => app.directorId.equals(directorObjId));
    if (alreadySigned) {
      throw new ValidationError(
        `Director ${directorId} has already cryptographically signed Voucher ${voucher.voucherNo}`
      );
    }

    // Add approval to voucher
    const approvalRecord = {
      directorId: directorObjId,
      directorRole,
      approvedAt: new Date(),
      signatureHash,
    };
    voucher.approvals.push(approvalRecord);

    // Update Quorum Approval if exists
    let quorumApproval: IQuorumApproval | null = null;
    let isNowPosted = false;

    if (voucher.requiredQuorumTier >= 3) {
      quorumApproval = await (session
        ? QuorumApprovalModel.findOne({
            targetCollection: 'journal_entries',
            targetId: voucher._id,
          }).session(session)
        : QuorumApprovalModel.findOne({
            targetCollection: 'journal_entries',
            targetId: voucher._id,
          }));

      if (quorumApproval) {
        quorumApproval.approvals.push({
          directorId: directorObjId,
          directorRole,
          approvedAt: new Date(),
          signatureHash,
        });

        if (quorumApproval.approvals.length >= quorumApproval.requiredCount) {
          quorumApproval.isComplete = true;
          quorumApproval.completedAt = new Date();
          isNowPosted = true;
        }
        await quorumApproval.save(session ? { session } : {});
      }
    } else {
      isNowPosted = true;
    }

    if (isNowPosted) {
      voucher.status = 'POSTED';
      voucher.isFullyApproved = true;
      logger.info(
        `Voucher ${voucher.voucherNo} fully approved by quorum (${voucher.approvals.length} signatures) and transitioned to POSTED`
      );
    }

    await voucher.save(session ? { session } : {});

    return {
      journalEntry: voucher,
      quorumApproval: quorumApproval || undefined,
      isNowPosted,
    };
  }

  /**
   * Retrieves a single Journal Voucher by voucherNo or ObjectId with populated relations.
   */
  public static async getJournalVoucher(voucherNoOrId: string): Promise<IJournalEntry> {
    const isObjectId = Types.ObjectId.isValid(voucherNoOrId);
    const query = isObjectId
      ? { _id: new Types.ObjectId(voucherNoOrId) }
      : { voucherNo: voucherNoOrId.trim().toUpperCase() };

    const voucher = await JournalEntryModel.findOne(query)
      .populate('createdBy', 'fullName email userType')
      .populate('approvals.directorId', 'fullName email userType')
      .populate('reversalOf', 'voucherNo totalDebit totalCredit status');

    if (!voucher) {
      throw new NotFoundError('Journal Voucher', voucherNoOrId);
    }

    return voucher;
  }

  /**
   * Lists journal vouchers with flexible filtering and pagination.
   */
  public static async listJournalVouchers(
    filters: JournalFilterDTO = {}
  ): Promise<{ vouchers: IJournalEntry[]; total: number; page: number; limit: number }> {
    const { status, voucherType, accountCode, startDate, endDate, page = 1, limit = 20 } = filters;

    const query: any = {};

    if (status) query.status = status;
    if (voucherType) query.voucherType = voucherType;
    if (accountCode) query['lines.accountCode'] = Number(accountCode);

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

    const [vouchers, total] = await Promise.all([
      JournalEntryModel.find(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fullName email'),
      JournalEntryModel.countDocuments(query),
    ]);

    return { vouchers, total, page, limit };
  }
}

export default AccountingService;
