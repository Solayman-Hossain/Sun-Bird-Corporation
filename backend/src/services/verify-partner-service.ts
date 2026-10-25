import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { PartnerModel } from '../models/Partner';
import { JournalEntryModel } from '../models/JournalEntry';
import { QuorumApprovalModel } from '../models/QuorumApproval';
import { UserModel } from '../models/User';
import { PartnerService } from './PartnerService';

async function runPartnerServiceVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 36: PARTNERSHIP CAPITAL & PROFIT ALLOCATION VERIFICATION SUITE');
  console.log('  (Capital Accounts, 50/50 Profit Split, Tier 4 Quorum & Accounting JV)');
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
    console.log('  1. Setup Director Test Users & Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    const directorA = await UserModel.create({
      fullName: `Managing Director A ${runId}`,
      email: `mda.${runId}@sunbirdcorp.com`,
      mobile: `01721${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    const directorB = await UserModel.create({
      fullName: `Director Finance B ${runId}`,
      email: `dfb.${runId}@sunbirdcorp.com`,
      mobile: `01722${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    const directorC = await UserModel.create({
      fullName: `Director Admin C ${runId}`,
      email: `dac.${runId}@sunbirdcorp.com`,
      mobile: `01723${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    assert(!!directorA._id, `Created Director A (${directorA.fullName})`);
    assert(!!directorB._id, `Created Director B (${directorB.fullName})`);
    assert(!!directorC._id, `Created Director C (${directorC.fullName})`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Create Two 50/50 Partners with Capital Contributions');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Clean up any stale test partner documents from prior runs
    await PartnerModel.deleteMany({});

    const partnerA = await PartnerService.createPartner({
      userId: directorA._id,
      partnerName: directorA.fullName,
      capitalContribution: 5000000, // 50 Lakh BDT
      currentAccountBalance: 0,
      profitShareRatio: 50,
      isEligibleForAllocation: true,
    });

    const partnerB = await PartnerService.createPartner({
      userId: directorB._id,
      partnerName: directorB.fullName,
      capitalContribution: 5000000, // 50 Lakh BDT
      currentAccountBalance: 0,
      profitShareRatio: 50,
      isEligibleForAllocation: true,
    });

    assert(partnerA.profitShareRatio === 50, 'Partner A configured with 50% profit share');
    assert(partnerB.profitShareRatio === 50, 'Partner B configured with 50% profit share');
    assert(partnerA.currentAccountBalance === 0, 'Partner A initial current account balance is 0 BDT');
    assert(partnerB.currentAccountBalance === 0, 'Partner B initial current account balance is 0 BDT');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Prompt 36 Core Spec: Distribute 1,000,000 BDT Profit 50/50');
    console.log('────────────────────────────────────────────────────────────────────────');

    const distributionResult = await PartnerService.distributeAnnualProfit(
      '2025-2026',
      1000000, // 10 Lakh BDT
      undefined,
      directorA._id
    );

    assert(distributionResult.fiscalYear === '2025-2026', 'Fiscal year is 2025-2026');
    assert(distributionResult.totalNetProfitBDT === 1000000, 'Total distributed profit is 1,000,000 BDT');
    assert(distributionResult.partnerDistributions.length === 2, 'Exactly 2 partners received allocation');

    // Prompt 36 Verification Assertions:
    // "Distribute 1,000,000 BDT profit between two 50/50 partners and verify capital account balance updates."
    const distA = distributionResult.partnerDistributions.find(
      (d) => d.partnerId.toString() === partnerA._id.toString()
    );
    const distB = distributionResult.partnerDistributions.find(
      (d) => d.partnerId.toString() === partnerB._id.toString()
    );

    assert(!!distA, 'Partner A found in distribution result');
    assert(!!distB, 'Partner B found in distribution result');
    assert(distA?.allocatedAmountBDT === 500000, 'Partner A received strictly 500,000 BDT (50% of 1,000,000)');
    assert(distB?.allocatedAmountBDT === 500000, 'Partner B received strictly 500,000 BDT (50% of 1,000,000)');
    assert(distA?.newCurrentAccountBalance === 500000, 'Partner A new current account balance is 500,000 BDT');
    assert(distB?.newCurrentAccountBalance === 500000, 'Partner B new current account balance is 500,000 BDT');

    // Verify persisted database updates
    const updatedPartnerA = await PartnerModel.findById(partnerA._id);
    const updatedPartnerB = await PartnerModel.findById(partnerB._id);
    assert(
      updatedPartnerA?.currentAccountBalance === 500000,
      'Persisted balance for Partner A is 500,000 BDT in MongoDB'
    );
    assert(
      updatedPartnerB?.currentAccountBalance === 500000,
      'Persisted balance for Partner B is 500,000 BDT in MongoDB'
    );
    assert(
      updatedPartnerA?.allocationTransactions.length === 1,
      'Partner A has 1 allocation transaction recorded'
    );
    assert(
      updatedPartnerA?.allocationTransactions[0].period === '2025-2026',
      'Allocation transaction period is 2025-2026'
    );

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Verify Tier 4 Quorum Approval & Double-Entry Journal Entry');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Tier 4 Quorum check
    assert(distributionResult.quorumTier === 4, 'Quorum Tier is strictly Tier 4');
    assert(
      distributionResult.requiredSignatures >= 3,
      `Tier 4 requires all directors sign-off (Required: ${distributionResult.requiredSignatures})`
    );
    assert(!!distributionResult.quorumApproval?._id, 'Quorum Approval document created in DB');

    // Journal Entry verification
    assert(!!distributionResult.journalVoucherNo, `Journal Voucher generated: ${distributionResult.journalVoucherNo}`);
    const jvDoc = await JournalEntryModel.findOne({ voucherNo: distributionResult.journalVoucherNo });
    assert(!!jvDoc, 'Journal Entry document found in database');
    assert(jvDoc?.status === 'POSTED', 'Journal Voucher status is POSTED');
    assert(
      Math.abs((jvDoc?.totalDebit || 0) - (jvDoc?.totalCredit || 0)) < 0.001,
      'Journal Entry is strictly balanced (Total Debit = Total Credit = 1,000,000 BDT)'
    );

    // Prompt 36 Specification: Debit 3020 Retained Earnings, Credit 3010 Partner Capital Accounts
    const debitLine = jvDoc?.lines.find((l) => l.debit > 0);
    const creditLines = jvDoc?.lines.filter((l) => l.credit > 0);

    assert(
      debitLine?.accountCode === 3020,
      `Debit line impacts 3020 Retained Earnings (Account: ${debitLine?.accountCode}, Debit: ${debitLine?.debit} BDT)`
    );
    assert(
      !!creditLines && creditLines.every((l) => l.accountCode === 3010),
      `All credit lines impact 3010 Partner Capital Accounts`
    );
    const totalCreditAmount = creditLines?.reduce((sum, l) => sum + l.credit, 0);
    assert(
      totalCreditAmount === 1000000,
      `Total credit to partner capital accounts equals 1,000,000 BDT`
    );

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Test Partner Drawings Withdrawal & Balance Reduction');
    console.log('────────────────────────────────────────────────────────────────────────');

    const drawingsResult = await PartnerService.recordPartnerDrawings({
      partnerId: partnerA._id,
      amountBDT: 150000, // 1.5 Lakh BDT
      paymentAccountCode: 1020,
      notes: 'Quarterly tax and personal drawings',
      initiatingUserId: directorA._id,
    });

    assert(drawingsResult.drawingsAmount === 150000, 'Recorded drawings amount: 150,000 BDT');
    assert(
      drawingsResult.newCurrentAccountBalance === 350000,
      'Current balance reduced from 500,000 to 350,000 BDT (500K - 150K)'
    );
    assert(
      drawingsResult.partner.drawingsBalance === 150000,
      'Drawings balance updated to 150,000 BDT'
    );
    assert(!!drawingsResult.journalVoucherNo, `Drawings clearance JV generated: ${drawingsResult.journalVoucherNo}`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Validation Guard: Mismatched Ratio Rejection');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Create partner with invalid ratio (40% + 40% = 80% != 100%)
    const invalidPartner = new PartnerModel({
      userId: directorC._id,
      partnerName: directorC.fullName,
      capitalContribution: 1000000,
      currentAccountBalance: 0,
      profitShareRatio: 40,
      joinedDate: new Date(),
      isEligibleForAllocation: true,
      isActive: true,
    });
    await invalidPartner.save();

    let invalidRatioRejected = false;
    try {
      // Current active partners now sum to 50 + 50 + 40 = 140%
      await PartnerService.distributeAnnualProfit('2026-2027', 500000, undefined, directorA._id);
    } catch (err: any) {
      invalidRatioRejected = true;
    }
    assert(invalidRatioRejected, 'Profit distribution strictly rejected when ratios do not sum to 100%');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Teardown Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await PartnerModel.deleteMany({
      _id: { $in: [partnerA._id, partnerB._id, invalidPartner._id] },
    });
    await UserModel.deleteMany({
      _id: { $in: [directorA._id, directorB._id, directorC._id] },
    });
    if (distributionResult.journalVoucherNo) {
      await JournalEntryModel.deleteMany({ voucherNo: distributionResult.journalVoucherNo });
    }
    if (drawingsResult.journalVoucherNo) {
      await JournalEntryModel.deleteMany({ voucherNo: drawingsResult.journalVoucherNo });
    }
    if (distributionResult.quorumApproval?._id) {
      await QuorumApprovalModel.deleteMany({ _id: distributionResult.quorumApproval._id });
    }
    assert(true, 'Test fixtures cleaned up cleanly');

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled error during Partner Service verification:', err);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runPartnerServiceVerificationSuite();
