import { Types } from 'mongoose';
import { JournalEntryModel } from '../models/JournalEntry';
import { QuorumApprovalService } from '../services/QuorumApprovalService';

describe('Accounting & Double-Entry Ledger Test Suite (Prompt 54)', () => {
  const runId = Date.now().toString().slice(-6);

  afterAll(async () => {
    await JournalEntryModel.deleteMany({ sourceDocumentRef: new RegExp(runId) });
  });

  it('should save strictly balanced journal entries with equal Debit and Credit', async () => {
    const entry = new JournalEntryModel({
      voucherNo: `JV-${runId}-001`,
      voucherType: 'JOURNAL',
      transactionDate: new Date(),
      sourceDocumentRef: `REF-${runId}-01`,
      lines: [
        { accountCode: 1010, accountName: 'Cash', debit: 5000, credit: 0 },
        { accountCode: 1020, accountName: 'Bank', debit: 0, credit: 5000 },
      ],
      totalDebit: 5000,
      totalCredit: 5000,
      status: 'POSTED',
      createdBy: new Types.ObjectId(),
      requiredQuorumTier: 1,
      approvals: [],
      isFullyApproved: true,
    });

    await entry.save();
    expect(entry._id).toBeDefined();
    expect(entry.totalDebit).toEqual(entry.totalCredit);
  });

  it('should reject unbalanced journal entries with DoubleEntryImbalanceError', async () => {
    const unbalancedEntry = new JournalEntryModel({
      voucherNo: `JV-${runId}-ERR`,
      voucherType: 'JOURNAL',
      transactionDate: new Date(),
      sourceDocumentRef: `REF-${runId}-02`,
      lines: [
        { accountCode: 1010, accountName: 'Cash', debit: 5000, credit: 0 },
        { accountCode: 1020, accountName: 'Bank', debit: 0, credit: 4000 }, // Variance 1000
      ],
      totalDebit: 5000,
      totalCredit: 4000,
      status: 'POSTED',
      createdBy: new Types.ObjectId(),
      requiredQuorumTier: 1,
      approvals: [],
      isFullyApproved: true,
    });

    await expect(unbalancedEntry.save()).rejects.toThrow();
  });

  it('should enforce Quorum Tier requirements for transactions exceeding threshold', () => {
    // Over 10 Lakh BDT (1,000,000) falls under Tier 3 multi-director policy
    const grandTotal = 1500000;
    const tier = QuorumApprovalService.determineQuorumTier(grandTotal);
    expect(tier).toBeGreaterThanOrEqual(3);
  });
});
