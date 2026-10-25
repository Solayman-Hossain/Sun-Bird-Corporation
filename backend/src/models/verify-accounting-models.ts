import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ChartOfAccountsModel } from './ChartOfAccounts';
import { JournalEntryModel } from './JournalEntry';
import { FixedAssetModel } from './FixedAsset';
import { LoanModel } from './Loan';
import { PartnerModel } from './Partner';
import { UserModel } from './User';
import { WarehouseModel } from './Warehouse';
import { DoubleEntryImbalanceError } from '../errors/AppError';

async function verifyAccountingModels() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 31: ACCOUNTING & FINANCE MONGOOSE MODELS VERIFICATION SUITE');
  console.log('  (ChartOfAccounts, JournalEntry, FixedAsset, Loan, Partner)');
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
    console.log('  1. Verify ChartOfAccounts Schema & Indexes');
    console.log('────────────────────────────────────────────────────────────────────────');
    const coaIndexes = ChartOfAccountsModel.schema.indexes();
    const hasCoaCodeIndex = coaIndexes.some(
      ([spec, opts]) => (spec as any).accountCode === 1 && opts?.unique === true
    );
    const hasCoaTypeIndex = coaIndexes.some(([spec]) => (spec as any).accountType === 1);

    assert(hasCoaCodeIndex, 'ChartOfAccounts has unique index on { accountCode: 1 }');
    assert(hasCoaTypeIndex, 'ChartOfAccounts has index on { accountType: 1 }');

    const sampleCoa = await ChartOfAccountsModel.create({
      accountCode: 101000 + Number(runId.slice(-3)),
      accountName: `Petty Cash Showroom ${runId}`,
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isControl: false,
      isActive: true,
    });
    assert(!!sampleCoa._id, `Created ChartOfAccounts record (Code: ${sampleCoa.accountCode})`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verify JournalEntry Pre-Save Balance Hook & Indexes');
    console.log('────────────────────────────────────────────────────────────────────────');
    const jvIndexes = JournalEntryModel.schema.indexes();
    assert(
      jvIndexes.some(([spec, opts]) => (spec as any).voucherNo === 1 && opts?.unique === true),
      'JournalEntry has unique index on { voucherNo: 1 }'
    );
    assert(
      jvIndexes.some(([spec]) => (spec as any).transactionDate === -1),
      'JournalEntry has descending index on { transactionDate: -1 }'
    );
    assert(
      jvIndexes.some(([spec]) => (spec as any).status === 1),
      'JournalEntry has index on { status: 1 }'
    );
    assert(
      jvIndexes.some(([spec]) => (spec as any).voucherType === 1),
      'JournalEntry has index on { voucherType: 1 }'
    );
    assert(
      jvIndexes.some(([spec]) => (spec as any)['lines.accountCode'] === 1),
      'JournalEntry has index on { "lines.accountCode": 1 }'
    );
    assert(
      jvIndexes.some(
        ([spec, opts]) => (spec as any).idempotencyKey === 1 && opts?.unique === true && opts?.sparse === true
      ),
      'JournalEntry has sparse-unique index on { idempotencyKey: 1 }'
    );
    assert(
      jvIndexes.some(([spec]) => (spec as any).createdBy === 1),
      'JournalEntry has index on { createdBy: 1 }'
    );

    // Test Balanced Journal Entry
    const dummyUserId = new Types.ObjectId();
    const balancedJv = new JournalEntryModel({
      voucherNo: `JV-${runId}-001`,
      voucherType: 'JOURNAL',
      transactionDate: new Date(),
      sourceDocumentRef: `REF-${runId}`,
      createdBy: dummyUserId,
      lines: [
        {
          accountCode: sampleCoa.accountCode,
          accountName: sampleCoa.accountName,
          debit: 50000.0,
          credit: 0,
        },
        {
          accountCode: 2010,
          accountName: 'Accounts Payable',
          debit: 0,
          credit: 50000.0,
        },
      ],
      totalDebit: 50000.0,
      totalCredit: 50000.0,
      status: 'DRAFT',
    });

    await balancedJv.validate();
    assert(true, 'Balanced Journal Entry (Debit: 50,000 = Credit: 50,000) passes validation');

    // Test Unbalanced Journal Entry (Throws DoubleEntryImbalanceError)
    const unbalancedJv = new JournalEntryModel({
      voucherNo: `JV-${runId}-002`,
      voucherType: 'JOURNAL',
      transactionDate: new Date(),
      sourceDocumentRef: `REF-${runId}-ERR`,
      createdBy: dummyUserId,
      lines: [
        {
          accountCode: sampleCoa.accountCode,
          accountName: sampleCoa.accountName,
          debit: 50000.0,
          credit: 0,
        },
        {
          accountCode: 2010,
          accountName: 'Accounts Payable',
          debit: 0,
          credit: 48000.0, // Discrepancy of 2,000 BDT
        },
      ],
      totalDebit: 50000.0,
      totalCredit: 48000.0,
      status: 'DRAFT',
    });

    let imbalanceCaught = false;
    try {
      await unbalancedJv.validate();
    } catch (err: any) {
      if (err instanceof DoubleEntryImbalanceError || err.name === 'DoubleEntryImbalanceError') {
        imbalanceCaught = true;
      }
    }
    assert(imbalanceCaught, 'Unbalanced Journal Entry (Debit: 50,000, Credit: 48,000) strictly rejected with DoubleEntryImbalanceError');

    // Test Micro Imbalance (> 0.001)
    const microImbalanceJv = new JournalEntryModel({
      voucherNo: `JV-${runId}-003`,
      voucherType: 'JOURNAL',
      transactionDate: new Date(),
      sourceDocumentRef: `REF-${runId}-MICRO`,
      createdBy: dummyUserId,
      lines: [
        {
          accountCode: sampleCoa.accountCode,
          accountName: sampleCoa.accountName,
          debit: 100.05,
          credit: 0,
        },
        {
          accountCode: 2010,
          accountName: 'Accounts Payable',
          debit: 0,
          credit: 100.0,
        },
      ],
      totalDebit: 100.05,
      totalCredit: 100.0,
      status: 'DRAFT',
    });

    let microCaught = false;
    try {
      await microImbalanceJv.validate();
    } catch (err: any) {
      if (err instanceof DoubleEntryImbalanceError || err.name === 'DoubleEntryImbalanceError') {
        microCaught = true;
      }
    }
    assert(microCaught, 'Micro Imbalance (discrepancy >= 0.001) strictly rejected with DoubleEntryImbalanceError');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verify FixedAsset Schema & Indexes');
    console.log('────────────────────────────────────────────────────────────────────────');
    const faIndexes = FixedAssetModel.schema.indexes();
    assert(
      faIndexes.some(([spec, opts]) => (spec as any).assetCode === 1 && opts?.unique === true),
      'FixedAsset has unique index on { assetCode: 1 }'
    );
    assert(
      faIndexes.some(([spec]) => (spec as any).status === 1),
      'FixedAsset has index on { status: 1 }'
    );
    assert(
      faIndexes.some(([spec]) => (spec as any).category === 1),
      'FixedAsset has index on { category: 1 }'
    );
    assert(
      faIndexes.some(([spec]) => (spec as any).warehouseId === 1),
      'FixedAsset has index on { warehouseId: 1 }'
    );

    const warehouseFixture = await WarehouseModel.create({
      name: `Asset Warehouse ${runId}`,
      warehouseCode: `WH-AST-${runId}`,
      type: 'CENTRAL',
      address: 'Tejgaon I/A, Dhaka',
      district: 'Dhaka',
      isCentralHub: true,
      isActive: true,
    });

    const fixedAsset = await FixedAssetModel.create({
      assetCode: `FA-${runId}-001`,
      assetName: `Autoclave Sterilizer 50L ${runId}`,
      category: 'MEDICAL_EQUIPMENT',
      purchaseDate: new Date('2026-01-01'),
      purchaseCost: 240000,
      residualValue: 0,
      usefulLifeYears: 5,
      depreciationMethod: 'SLM',
      warehouseId: warehouseFixture._id,
      status: 'ACTIVE',
    });

    assert(!!fixedAsset._id, `Created FixedAsset document: ${fixedAsset.assetCode}`);
    assert(fixedAsset.netBookValue === 240000, `Initial netBookValue equals purchaseCost (240,000 BDT)`);
    assert(fixedAsset.monthlyDepreciation === 4000, `Monthly SLM depreciation auto-computed correctly (240,000 / 60 = 4,000 BDT)`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Verify Loan Schema & Indexes');
    console.log('────────────────────────────────────────────────────────────────────────');
    const loanIndexes = LoanModel.schema.indexes();
    assert(
      loanIndexes.some(([spec, opts]) => (spec as any).loanCode === 1 && opts?.unique === true),
      'Loan has unique index on { loanCode: 1 }'
    );
    assert(
      loanIndexes.some(([spec]) => (spec as any).loanType === 1 && (spec as any).status === 1),
      'Loan has compound index on { loanType: 1, status: 1 }'
    );
    assert(
      loanIndexes.some(([spec]) => (spec as any).borrowerId === 1 && (spec as any).loanType === 1),
      'Loan has compound index on { borrowerId: 1, loanType: 1 }'
    );
    assert(
      loanIndexes.some(([spec]) => (spec as any).status === 1),
      'Loan has index on { status: 1 }'
    );

    const borrowerUser = await UserModel.create({
      fullName: `Borrower Staff ${runId}`,
      email: `borrower.${runId}@sunbirdcorp.com`,
      mobile: `01611${runId}`,
      userType: 'STAFF',
      isActive: true,
    });

    const loanDoc = await LoanModel.create({
      loanCode: `LN-${runId}-001`,
      loanType: 'EMPLOYEE_LOAN',
      borrowerId: borrowerUser._id,
      borrowerType: 'EMPLOYEE',
      principalBDT: 120000,
      isInterestFree: true,
      interestRate: 0,
      interestMethod: 'FLAT',
      startDate: new Date('2026-03-01'),
      tenureMonths: 12,
      outstandingBalance: 120000,
      status: 'ACTIVE',
      repaymentSchedule: [
        {
          dueDate: new Date('2026-04-01'),
          principalDue: 10000,
          interestDue: 0,
          totalDue: 10000,
          isPaid: false,
        },
      ],
    });

    assert(!!loanDoc._id, `Created Loan document: ${loanDoc.loanCode}`);
    assert(loanDoc.isInterestFree === true, 'Loan is flagged interest free');
    assert(loanDoc.outstandingBalance === 120000, 'Loan outstanding balance matches principal');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Verify Partner Schema & Indexes');
    console.log('────────────────────────────────────────────────────────────────────────');
    const partnerIndexes = PartnerModel.schema.indexes();
    assert(
      partnerIndexes.some(([spec, opts]) => (spec as any).userId === 1 && opts?.unique === true),
      'Partner has unique index on { userId: 1 }'
    );
    assert(
      partnerIndexes.some(([spec]) => (spec as any).isActive === 1),
      'Partner has index on { isActive: 1 }'
    );

    const partnerUser = await UserModel.create({
      fullName: `Partner Director ${runId}`,
      email: `partner.${runId}@sunbirdcorp.com`,
      mobile: `01511${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    const partnerDoc = await PartnerModel.create({
      userId: partnerUser._id,
      partnerName: partnerUser.fullName,
      capitalContribution: 2500000,
      currentAccountBalance: 150000,
      joinedDate: new Date('2025-01-01'),
      isEligibleForAllocation: true,
      isActive: true,
    });

    assert(!!partnerDoc._id, `Created Partner document for ${partnerDoc.partnerName}`);
    assert(partnerDoc.capitalContribution === 2500000, 'Partner capital contribution is 2,500,000 BDT');
    assert(partnerDoc.currentAccountBalance === 150000, 'Partner current account balance is 150,000 BDT');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Teardown Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');
    await ChartOfAccountsModel.findByIdAndDelete(sampleCoa._id);
    await FixedAssetModel.findByIdAndDelete(fixedAsset._id);
    await WarehouseModel.findByIdAndDelete(warehouseFixture._id);
    await LoanModel.findByIdAndDelete(loanDoc._id);
    await UserModel.findByIdAndDelete(borrowerUser._id);
    await PartnerModel.findByIdAndDelete(partnerDoc._id);
    await UserModel.findByIdAndDelete(partnerUser._id);
    assert(true, 'Test fixtures safely cleaned up from MongoDB Atlas');
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

verifyAccountingModels().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
