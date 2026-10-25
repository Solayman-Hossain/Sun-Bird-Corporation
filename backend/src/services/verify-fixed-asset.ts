import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { FixedAssetModel } from '../models/FixedAsset';
import { JournalEntryModel } from '../models/JournalEntry';
import { UserModel } from '../models/User';
import { FixedAssetService } from './FixedAssetService';

async function runFixedAssetVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 34: FIXED ASSET REGISTER & SLM DEPRECIATION ENGINE');
  console.log('  (Registration, Monthly SLM Calculation, Automated JV Posting & Disposal)');
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
    console.log('  1. Setup COA Accounts (6310 Depreciation Expense & 1590 Acc Dep)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Ensure 6310 and 1590 exist
    let coaDepExpense = await ChartOfAccountsModel.findOne({ accountCode: 6310 });
    if (!coaDepExpense) {
      coaDepExpense = await ChartOfAccountsModel.create({
        accountCode: 6310,
        accountName: 'Depreciation Expense',
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        isControl: false,
        isActive: true,
      });
    }

    let coaAccDep = await ChartOfAccountsModel.findOne({ accountCode: 1590 });
    if (!coaAccDep) {
      coaAccDep = await ChartOfAccountsModel.create({
        accountCode: 1590,
        accountName: 'Accumulated Depreciation Reserve',
        accountType: 'ASSET',
        normalBalance: 'CREDIT',
        isControl: false,
        isActive: true,
      });
    }

    assert(!!coaDepExpense && !!coaAccDep, 'COA Depreciation Expense (6310) and Accumulated Depreciation (1590) ready');

    const financeUser = await UserModel.create({
      fullName: `Asset Accountant ${runId}`,
      email: `asset.mgr.${runId}@sunbirdcorp.com`,
      mobile: `01311${runId}`,
      userType: 'STAFF',
      isActive: true,
    });
    assert(!!financeUser._id, 'Created Finance user fixture');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verify Prompt Requirement: Register Asset Costing 120,000 BDT with 12 Months Life');
    console.log('────────────────────────────────────────────────────────────────────────');

    const testAssetCode = `FA-SLM-${runId}`;
    const registeredAsset = await FixedAssetService.registerAsset({
      assetCode: testAssetCode,
      assetName: `ECG Calibration Monitor ${runId}`,
      category: 'MEDICAL_EQUIPMENT',
      purchasePriceBDT: 120000.0,
      salvageValueBDT: 0.0,
      usefulLifeMonths: 12,
      depreciationMethod: 'SLM',
    });

    assert(registeredAsset.assetCode === testAssetCode, `Asset registered with code: ${registeredAsset.assetCode}`);
    assert(registeredAsset.purchaseCost === 120000, 'Purchase price is 120,000 BDT');
    assert(registeredAsset.residualValue === 0, 'Residual / salvage value is 0 BDT');
    assert(registeredAsset.usefulLifeMonths === 12, 'Useful life is 12 months');
    assert(registeredAsset.monthlyDepreciation === 10000, `Monthly SLM Depreciation auto-calculated to 10,000 BDT (120,000 / 12)`);
    assert(registeredAsset.accumulatedDepreciation === 0, 'Initial accumulated depreciation is 0 BDT');
    assert(registeredAsset.netBookValue === 120000, 'Initial net book value is 120,000 BDT');
    assert(registeredAsset.currentBookValue === 120000, 'Initial currentBookValue is 120,000 BDT');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verify Prompt Requirement: Run Depreciation & Verify 10,000 BDT Deduction & JV Generation');
    console.log('────────────────────────────────────────────────────────────────────────');

    const runResult = await FixedAssetService.runMonthlyDepreciation(
      '2026-10',
      financeUser._id.toString()
    );

    assert(runResult.processedAssetsCount >= 1, `Depreciation run processed ${runResult.processedAssetsCount} assets`);
    assert(runResult.totalDepreciationAmount >= 10000, `Total depreciation amount includes at least 10,000 BDT (got ${runResult.totalDepreciationAmount} BDT)`);
    assert(!!runResult.journalVoucherNo, `Automated Journal Voucher posted: ${runResult.journalVoucherNo}`);

    // Verify Asset State in Database
    const updatedAsset = await FixedAssetService.getAsset(testAssetCode);
    assert(updatedAsset.accumulatedDepreciation === 10000, `Asset accumulated depreciation is 10,000 BDT (got ${updatedAsset.accumulatedDepreciation})`);
    assert(updatedAsset.netBookValue === 110000, `Asset netBookValue is 110,000 BDT (120,000 - 10,000) (got ${updatedAsset.netBookValue})`);
    assert(updatedAsset.currentBookValue === 110000, `Asset currentBookValue is 110,000 BDT (got ${updatedAsset.currentBookValue})`);
    assert(updatedAsset.journalRef === runResult.journalVoucherNo, `Asset journalRef links to ${runResult.journalVoucherNo}`);

    // Verify Journal Entry in Database
    const jvDoc = await JournalEntryModel.findOne({ voucherNo: runResult.journalVoucherNo });
    assert(!!jvDoc, 'Journal Voucher exists in journal_entries collection');
    assert(jvDoc?.status === 'POSTED', 'Generated Journal Voucher is POSTED');
    assert(jvDoc?.lines.length === 2, 'Journal Voucher contains 2 lines (Debit & Credit)');

    const debitLine = jvDoc?.lines.find((l) => l.debit > 0);
    const creditLine = jvDoc?.lines.find((l) => l.credit > 0);

    assert(debitLine?.accountCode === 6310 || debitLine?.accountCode === 6400, `Debit line impacts Depreciation Expense (code: ${debitLine?.accountCode})`);
    assert(creditLine?.accountCode === 1590 || creditLine?.accountCode === 1890, `Credit line impacts Accumulated Depreciation (code: ${creditLine?.accountCode})`);
    assert(debitLine?.debit === runResult.totalDepreciationAmount, `Debit amount equals total depreciation (${runResult.totalDepreciationAmount} BDT)`);
    assert(creditLine?.credit === runResult.totalDepreciationAmount, `Credit amount equals total depreciation (${runResult.totalDepreciationAmount} BDT)`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Run Month 2 Depreciation & Assert Cumulative Depreciation (20,000 BDT)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const runResultMonth2 = await FixedAssetService.runMonthlyDepreciation(
      '2026-11',
      financeUser._id.toString()
    );
    assert(!!runResultMonth2.journalVoucherNo, `Month 2 Journal Voucher posted: ${runResultMonth2.journalVoucherNo}`);

    const assetMonth2 = await FixedAssetService.getAsset(testAssetCode);
    assert(assetMonth2.accumulatedDepreciation === 20000, `Asset accumulated depreciation after Month 2 is 20,000 BDT`);
    assert(assetMonth2.netBookValue === 100000, `Asset netBookValue after Month 2 is 100,000 BDT`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Verify Asset with Salvage Value Calculation');
    console.log('────────────────────────────────────────────────────────────────────────');

    const salvageAssetCode = `FA-SALV-${runId}`;
    const salvageAsset = await FixedAssetService.registerAsset({
      assetCode: salvageAssetCode,
      assetName: `Surgical Lighting System ${runId}`,
      category: 'MEDICAL_EQUIPMENT',
      purchasePriceBDT: 240000.0,
      salvageValueBDT: 40000.0,
      usefulLifeMonths: 20,
    });

    // (240,000 - 40,000) / 20 = 10,000 BDT/month
    assert(salvageAsset.monthlyDepreciation === 10000, `Salvage SLM monthly depreciation is 10,000 BDT ((240k - 40k) / 20)`);
    assert(salvageAsset.residualValue === 40000, 'Residual value is 40,000 BDT');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Verify Asset Disposal Workflow');
    console.log('────────────────────────────────────────────────────────────────────────');

    const disposedAsset = await FixedAssetService.disposeAsset(
      salvageAssetCode,
      {
        disposalDate: new Date(),
        disposalValue: 150000,
        status: 'SOLD',
        reason: 'Upgrade to LED multi-head surgical light',
      },
      financeUser._id.toString()
    );

    assert(disposedAsset.status === 'SOLD', 'Asset status transitioned to SOLD');
    assert(disposedAsset.disposalValue === 150000, 'Disposal value recorded: 150,000 BDT');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Teardown Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    const jvIdsToDelete = [runResult.journalEntryId, runResultMonth2.journalEntryId].filter(Boolean);

    await Promise.all([
      FixedAssetModel.deleteMany({ assetCode: { $in: [testAssetCode, salvageAssetCode] } }),
      JournalEntryModel.deleteMany({ _id: { $in: jvIdsToDelete } }),
      UserModel.findByIdAndDelete(financeUser._id),
    ]);

    assert(true, 'Test fixtures safely cleaned up from database');
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

runFixedAssetVerificationSuite().catch((err) => {
  console.error('Fatal error during Fixed Asset verification:', err);
  process.exit(1);
});
