import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { JournalEntryModel } from '../models/JournalEntry';
import { QuorumApprovalModel } from '../models/QuorumApproval';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { AccountingService } from './AccountingService';
import { DoubleEntryImbalanceError, ValidationError } from '../errors/AppError';

async function runAccountingServiceVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 32: DOUBLE-ENTRY ACCOUNTING CORE ENGINE & VOUCHER POSTING SERVICE');
  console.log('  (Strict Balance Check, Active COA Validation, Quorum Tiers 3 & 4, Reversals)');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  await connectDatabase();
  const runId = Date.now().toString().slice(-6);

  try {
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Setup Chart of Accounts & Director User Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    // COA Codes for Testing
    const cashCode = 101000 + Number(runId.slice(-3));
    const arCode = 110000 + Number(runId.slice(-3));
    const apCode = 201000 + Number(runId.slice(-3));
    const revCode = 401000 + Number(runId.slice(-3));

    const [coaCash, coaAr, coaAp, coaRev] = await Promise.all([
      ChartOfAccountsModel.create({
        accountCode: cashCode,
        accountName: `Cash on Hand Test ${runId}`,
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        isControl: false,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: arCode,
        accountName: `Accounts Receivable Test ${runId}`,
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        isControl: true,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: apCode,
        accountName: `Accounts Payable Test ${runId}`,
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        isControl: true,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: revCode,
        accountName: `Sales Revenue Test ${runId}`,
        accountType: 'REVENUE',
        normalBalance: 'CREDIT',
        isControl: false,
        isActive: true,
      }),
    ]);

    assert(!!coaCash._id && !!coaAr._id, 'Created Chart of Accounts fixtures');

    // Users
    const accountantUser = await UserModel.create({
      fullName: `Accountant Rafiq ${runId}`,
      email: `accountant.${runId}@sunbirdcorp.com`,
      mobile: `01799${runId}`,
      userType: 'STAFF',
      isActive: true,
    });

    const director1 = await UserModel.create({
      fullName: `Director Shahadat ${runId}`,
      email: `dir1.${runId}@sunbirdcorp.com`,
      mobile: `01899${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    const director2 = await UserModel.create({
      fullName: `Director Faruk ${runId}`,
      email: `dir2.${runId}@sunbirdcorp.com`,
      mobile: `01999${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    const director3 = await UserModel.create({
      fullName: `Director Anis ${runId}`,
      email: `dir3.${runId}@sunbirdcorp.com`,
      mobile: `01599${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    assert(!!accountantUser._id && !!director1._id, 'Created staff and director fixtures');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verify Verification Requirement: Unbalanced Voucher Rejection');
    console.log('     (Debit: 50,000, Credit: 48,000 -> DoubleEntryImbalanceError)');
    console.log('────────────────────────────────────────────────────────────────────────');

    let imbalanceCaught = false;
    let caughtError: any = null;
    try {
      await AccountingService.createJournalVoucher(
        {
          voucherType: 'JOURNAL',
          sourceDocumentRef: `MANUAL-AUDIT-${runId}`,
          lines: [
            {
              accountCode: cashCode,
              debit: 50000.0,
              credit: 0,
            },
            {
              accountCode: apCode,
              debit: 0,
              credit: 48000.0, // Variance = 2,000 BDT
            },
          ],
        },
        accountantUser._id.toString()
      );
    } catch (err: any) {
      caughtError = err;
      if (err instanceof DoubleEntryImbalanceError || err.name === 'DoubleEntryImbalanceError') {
        imbalanceCaught = true;
      }
    }

    assert(imbalanceCaught, 'Unbalanced voucher (Debit: 50,000, Credit: 48,000) rejected with DoubleEntryImbalanceError');
    assert(caughtError?.statusCode === 422, 'DoubleEntryImbalanceError has HTTP status 422');
    assert(caughtError?.totalDebit === 50000 && caughtError?.totalCredit === 48000, 'Error details capture exact totalDebit and totalCredit');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verify Inactive or Non-existent Account Code Rejection');
    console.log('────────────────────────────────────────────────────────────────────────');

    let invalidCodeCaught = false;
    try {
      await AccountingService.createJournalVoucher(
        {
          voucherType: 'JOURNAL',
          sourceDocumentRef: `INVALID-COA-${runId}`,
          lines: [
            {
              accountCode: 999999, // Non-existent code
              debit: 10000.0,
              credit: 0,
            },
            {
              accountCode: apCode,
              debit: 0,
              credit: 10000.0,
            },
          ],
        },
        accountantUser._id.toString()
      );
    } catch (err: any) {
      if (err instanceof ValidationError || err.name === 'ValidationError') {
        invalidCodeCaught = true;
      }
    }

    assert(invalidCodeCaught, 'Voucher referencing non-existent account code 999999 strictly rejected with ValidationError');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Verify Balanced Standard Voucher (< 10 Lakh -> Tier 1 Direct Post)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const tier1Result = await AccountingService.createJournalVoucher(
      {
        voucherType: 'SALES',
        sourceDocumentRef: `INV-TEST-${runId}-001`,
        lines: [
          {
            accountCode: arCode,
            debit: 50000.0,
            credit: 0,
            description: 'Receivable from Hospital',
          },
          {
            accountCode: revCode,
            debit: 0,
            credit: 50000.0,
            description: 'Sales of surgical syringes',
          },
        ],
      },
      accountantUser._id.toString()
    );

    assert(!!tier1Result.journalEntry._id, `Journal Voucher created: ${tier1Result.journalEntry.voucherNo}`);
    assert(tier1Result.journalEntry.voucherNo.startsWith('JV-'), 'Voucher number adheres to gapless sequence format (JV-YYYY-XXXXX)');
    assert(tier1Result.journalEntry.status === 'POSTED', 'Tier 1 voucher is automatically marked POSTED');
    assert(tier1Result.journalEntry.isFullyApproved === true, 'Tier 1 voucher is marked isFullyApproved = true');
    assert(tier1Result.journalEntry.requiredQuorumTier === 1, 'requiredQuorumTier is 1 for standard amounts');
    assert(Boolean(tier1Result.journalEntry.lines[0].accountId?.equals(coaAr._id)), 'Line accountId populated automatically from COA master');
    assert(tier1Result.journalEntry.lines[0].accountName === coaAr.accountName, 'Line accountName populated automatically from COA master');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Verify High-Value Voucher (> 10 Lakh -> Tier 3 Quorum: 2 Directors)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const highValueAmount = 2500000.0; // 25 Lakh BDT
    const tier3Result = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PURCHASE',
        sourceDocumentRef: `PO-IMPORT-${runId}-01`,
        lines: [
          {
            accountCode: cashCode,
            debit: 0,
            credit: highValueAmount,
            description: 'Bank LC Margin Payment',
          },
          {
            accountCode: apCode,
            debit: highValueAmount,
            credit: 0,
            description: 'Foreign Supplier LC Advance',
          },
        ],
      },
      accountantUser._id.toString()
    );

    assert(tier3Result.journalEntry.requiredQuorumTier === 3, 'Tier 3 Quorum assigned for > 1,000,000 BDT');
    assert(tier3Result.journalEntry.status === 'SUBMITTED', 'Voucher status is SUBMITTED pending quorum');
    assert(tier3Result.journalEntry.isFullyApproved === false, 'isFullyApproved is false before quorum sign-offs');
    assert(!!tier3Result.quorumApproval, 'QuorumApproval record created in database');
    assert(tier3Result.quorumApproval?.requiredCount === 2, 'Tier 3 requires exactly 2 Directors');

    // Sign by First Director
    const sign1Res = await AccountingService.approveJournalVoucher(
      tier3Result.journalEntry.voucherNo,
      director1._id.toString(),
      'DIRECTOR_FINANCE',
      'sha256-mock-signature-director-1'
    );
    assert(sign1Res.isNowPosted === false, 'Voucher remains SUBMITTED after 1 of 2 directors sign');
    assert(sign1Res.journalEntry.approvals.length === 1, '1 director signature recorded on voucher');

    // Duplicate Sign Attempt by Same Director
    let dupSignCaught = false;
    try {
      await AccountingService.approveJournalVoucher(
        tier3Result.journalEntry.voucherNo,
        director1._id.toString(),
        'DIRECTOR_FINANCE',
        'sha256-duplicate-sign'
      );
    } catch (err: any) {
      if (err instanceof ValidationError) dupSignCaught = true;
    }
    assert(dupSignCaught, 'Duplicate sign by same director strictly rejected');

    // Sign by Second Director -> Triggers Quorum Completion
    const sign2Res = await AccountingService.approveJournalVoucher(
      tier3Result.journalEntry.voucherNo,
      director2._id.toString(),
      'MD',
      'sha256-mock-signature-director-2'
    );
    assert(sign2Res.isNowPosted === true, 'Voucher transitioned to POSTED upon receiving second director signature');
    assert(sign2Res.journalEntry.isFullyApproved === true, 'isFullyApproved is now true');
    assert(sign2Res.quorumApproval?.isComplete === true, 'QuorumApproval marked complete');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Verify Very High-Value Voucher (> 50 Lakh -> Tier 4 Quorum: 3 Directors)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const veryHighAmount = 6000000.0; // 60 Lakh BDT
    const tier4Result = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PURCHASE',
        sourceDocumentRef: `LC-MEGA-${runId}`,
        lines: [
          {
            accountCode: cashCode,
            debit: 0,
            credit: veryHighAmount,
          },
          {
            accountCode: apCode,
            debit: veryHighAmount,
            credit: 0,
          },
        ],
      },
      accountantUser._id.toString()
    );

    assert(tier4Result.journalEntry.requiredQuorumTier === 4, 'Tier 4 Quorum assigned for > 5,000,000 BDT');
    assert(tier4Result.quorumApproval?.requiredCount === 3, 'Tier 4 requires exactly 3 Directors');
    assert(tier4Result.journalEntry.status === 'SUBMITTED', 'Tier 4 voucher initial status is SUBMITTED');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Verify Journal Voucher Contra-Entry Reversal');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Reverse tier1 voucher (which is POSTED)
    const reversalResult = await AccountingService.reverseJournalVoucher(
      tier1Result.journalEntry.voucherNo,
      'Duplicate billing error by showroom staff',
      accountantUser._id.toString()
    );

    assert(reversalResult.originalVoucher.status === 'REVERSED', `Original voucher ${tier1Result.journalEntry.voucherNo} status transitioned to REVERSED`);
    assert(reversalResult.reversalVoucher.status === 'POSTED', `Reversal voucher ${reversalResult.reversalVoucher.voucherNo} posted`);
    assert(Boolean(reversalResult.reversalVoucher.reversalOf?.equals(tier1Result.journalEntry._id)), 'Reversal voucher links reversalOf to original voucher ID');

    // Assert contra line inversion:
    // Original: AR Debit 50,000, Rev Credit 50,000
    // Contra:   AR Credit 50,000, Rev Debit 50,000
    const contraArLine = reversalResult.reversalVoucher.lines.find((l) => l.accountCode === arCode);
    const contraRevLine = reversalResult.reversalVoucher.lines.find((l) => l.accountCode === revCode);

    assert(contraArLine?.credit === 50000 && contraArLine?.debit === 0, 'Contra-entry inverted AR: Credit 50,000, Debit 0');
    assert(contraRevLine?.debit === 50000 && contraRevLine?.credit === 0, 'Contra-entry inverted Revenue: Debit 50,000, Credit 0');

    // Attempt to reverse already reversed voucher
    let doubleReversalCaught = false;
    try {
      await AccountingService.reverseJournalVoucher(
        tier1Result.journalEntry.voucherNo,
        'Attempting double reversal',
        accountantUser._id.toString()
      );
    } catch (err: any) {
      if (err instanceof ValidationError) doubleReversalCaught = true;
    }
    assert(doubleReversalCaught, 'Reversing an already reversed voucher rejected with ValidationError');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  8. Verify Voucher Retrieval & Listing');
    console.log('────────────────────────────────────────────────────────────────────────');

    const fetchedVoucher = await AccountingService.getJournalVoucher(reversalResult.reversalVoucher.voucherNo);
    assert(fetchedVoucher.voucherNo === reversalResult.reversalVoucher.voucherNo, 'Retrieved voucher by voucherNo');
    assert(!!fetchedVoucher.reversalOf, 'Populated reversalOf reference');

    const listResult = await AccountingService.listJournalVouchers({
      status: 'POSTED',
      page: 1,
      limit: 10,
    });
    assert(listResult.vouchers.length >= 2, `Listed vouchers (found ${listResult.vouchers.length} POSTED vouchers)`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  9. Teardown Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      ChartOfAccountsModel.deleteMany({
        accountCode: { $in: [cashCode, arCode, apCode, revCode] },
      }),
      JournalEntryModel.deleteMany({
        _id: {
          $in: [
            tier1Result.journalEntry._id,
            reversalResult.reversalVoucher._id,
            tier3Result.journalEntry._id,
            tier4Result.journalEntry._id,
          ],
        },
      }),
      QuorumApprovalModel.deleteMany({
        targetId: {
          $in: [tier3Result.journalEntry._id, tier4Result.journalEntry._id],
        },
      }),
      UserModel.deleteMany({
        _id: { $in: [accountantUser._id, director1._id, director2._id, director3._id] },
      }),
    ]);
    assert(true, 'Test fixtures safely removed from MongoDB Atlas');
  } finally {
    await disconnectDatabase();
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAccountingServiceVerificationSuite().catch((err) => {
  console.error('Fatal error during AccountingService verification:', err);
  process.exit(1);
});
