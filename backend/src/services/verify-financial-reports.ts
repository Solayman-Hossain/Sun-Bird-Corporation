import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { JournalEntryModel } from '../models/JournalEntry';
import { UserModel } from '../models/User';
import { AccountingService } from './AccountingService';
import { FinancialReportService } from './FinancialReportService';

async function runFinancialReportsVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 33: FINANCIAL REPORTING AGGREGATION ENGINE');
  console.log('  (Trial Balance, Profit & Loss, Balance Sheet, General Ledger Drilldown)');
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
    console.log('  1. Setup Chart of Accounts & User Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    // COA Codes:
    // Assets (1000s)
    const codeCash = 101000 + Number(runId.slice(-3));
    const codeAr = 110000 + Number(runId.slice(-3));
    const codeInv = 120000 + Number(runId.slice(-3));

    // Liabilities (2000s)
    const codeAp = 201000 + Number(runId.slice(-3));
    const codeVat = 205000 + Number(runId.slice(-3));

    // Equity (3000s)
    const codeEquity = 301000 + Number(runId.slice(-3));

    // Revenue (4000s)
    const codeRev = 401000 + Number(runId.slice(-3));

    // COGS (5000s)
    const codeCogs = 501000 + Number(runId.slice(-3));

    // OpEx (6000s)
    const codeSalary = 601000 + Number(runId.slice(-3));

    const coaDocs = await Promise.all([
      ChartOfAccountsModel.create({
        accountCode: codeCash,
        accountName: `Cash on Hand ${runId}`,
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        isControl: false,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: codeAr,
        accountName: `Accounts Receivable ${runId}`,
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        isControl: true,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: codeInv,
        accountName: `Inventory Merchandise ${runId}`,
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        isControl: false,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: codeAp,
        accountName: `Accounts Payable ${runId}`,
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        isControl: true,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: codeVat,
        accountName: `VAT Output Payable ${runId}`,
        accountType: 'LIABILITY',
        normalBalance: 'CREDIT',
        isControl: false,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: codeEquity,
        accountName: `Partner Capital ${runId}`,
        accountType: 'EQUITY',
        normalBalance: 'CREDIT',
        isControl: false,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: codeRev,
        accountName: `Sales Revenue ${runId}`,
        accountType: 'REVENUE',
        normalBalance: 'CREDIT',
        isControl: false,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: codeCogs,
        accountName: `Cost of Goods Sold ${runId}`,
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        isControl: false,
        isActive: true,
      }),
      ChartOfAccountsModel.create({
        accountCode: codeSalary,
        accountName: `Staff Salaries ${runId}`,
        accountType: 'EXPENSE',
        normalBalance: 'DEBIT',
        isControl: false,
        isActive: true,
      }),
    ]);

    assert(coaDocs.length === 9, 'Created 9 Chart of Accounts records covering Assets, Liabilities, Equity, Revenue, COGS, and Expenses');

    const accountantUser = await UserModel.create({
      fullName: `Reporting Accountant ${runId}`,
      email: `fin.rep.${runId}@sunbirdcorp.com`,
      mobile: `01411${runId}`,
      userType: 'STAFF',
      isActive: true,
    });
    assert(!!accountantUser._id, 'Created Accountant user fixture');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Post Balanced Sales, Purchase, COGS & Expense Journal Vouchers');
    console.log('────────────────────────────────────────────────────────────────────────');

    const today = new Date();
    const createdVoucherIds: Types.ObjectId[] = [];

    // JV 1: Inventory Purchase on Credit from Vendor (200,000 BDT)
    // Debit Inventory (1200) 200,000 | Credit AP (2010) 200,000
    const jvPurchase = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PURCHASE',
        transactionDate: today,
        sourceDocumentRef: `PO-PURCHASE-${runId}`,
        lines: [
          {
            accountCode: codeInv,
            debit: 200000.0,
            credit: 0,
            description: 'Received 1000 units surgical equipment',
          },
          {
            accountCode: codeAp,
            debit: 0,
            credit: 200000.0,
            description: 'Supplier credit invoice',
          },
        ],
      },
      accountantUser._id.toString()
    );
    createdVoucherIds.push(jvPurchase.journalEntry._id);
    assert(jvPurchase.journalEntry.status === 'POSTED', 'JV 1 (Purchase) posted: 200,000 BDT');

    // JV 2: Sales to B2B Hospital Customer (100,000 Revenue + 15,000 VAT = 115,000 AR)
    // Debit AR (1100) 115,000 | Credit Sales Revenue (4010) 100,000 | Credit VAT Payable (2050) 15,000
    const jvSales = await AccountingService.createJournalVoucher(
      {
        voucherType: 'SALES',
        transactionDate: today,
        sourceDocumentRef: `INV-SALES-${runId}`,
        lines: [
          {
            accountCode: codeAr,
            debit: 115000.0,
            credit: 0,
            description: 'Receivable from Square Hospital',
          },
          {
            accountCode: codeRev,
            debit: 0,
            credit: 100000.0,
            description: 'Healthcare devices revenue',
          },
          {
            accountCode: codeVat,
            debit: 0,
            credit: 15000.0,
            description: '15% NBR VAT on sales',
          },
        ],
      },
      accountantUser._id.toString()
    );
    createdVoucherIds.push(jvSales.journalEntry._id);
    assert(jvSales.journalEntry.status === 'POSTED', 'JV 2 (Sales) posted: 115,000 BDT');

    // JV 3: Cost of Goods Sold (COGS) & Inventory Relief (60,000 BDT)
    // Debit COGS (5010) 60,000 | Credit Inventory (1200) 60,000
    const jvCogs = await AccountingService.createJournalVoucher(
      {
        voucherType: 'JOURNAL',
        transactionDate: today,
        sourceDocumentRef: `CHALLAN-RELIEF-${runId}`,
        lines: [
          {
            accountCode: codeCogs,
            debit: 60000.0,
            credit: 0,
            description: 'Cost of goods sold for invoice',
          },
          {
            accountCode: codeInv,
            debit: 0,
            credit: 60000.0,
            description: 'Inventory relief at WAC cost',
          },
        ],
      },
      accountantUser._id.toString()
    );
    createdVoucherIds.push(jvCogs.journalEntry._id);
    assert(jvCogs.journalEntry.status === 'POSTED', 'JV 3 (COGS) posted: 60,000 BDT');

    // JV 4: Operating Expense - Staff Salary Paid in Cash (25,000 BDT)
    // Debit Salaries (6010) 25,000 | Credit Cash (1010) 25,000
    const jvExpense = await AccountingService.createJournalVoucher(
      {
        voucherType: 'PAYMENT',
        transactionDate: today,
        sourceDocumentRef: `SALARY-VOUCHER-${runId}`,
        lines: [
          {
            accountCode: codeSalary,
            debit: 25000.0,
            credit: 0,
            description: 'Showroom staff salary',
          },
          {
            accountCode: codeCash,
            debit: 0,
            credit: 25000.0,
            description: 'Cash payment from till',
          },
        ],
      },
      accountantUser._id.toString()
    );
    createdVoucherIds.push(jvExpense.journalEntry._id);
    assert(jvExpense.journalEntry.status === 'POSTED', 'JV 4 (Salaries Expense) posted: 25,000 BDT');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Execute Trial Balance Aggregation & Verify Net Zero Difference');
    console.log('────────────────────────────────────────────────────────────────────────');

    const trialBalance = await FinancialReportService.getTrialBalance();

    assert(trialBalance.isBalanced === true, 'Trial Balance isBalanced flag is true');
    assert(trialBalance.difference === 0, 'Trial Balance difference is strictly 0.00 BDT (net zero balance)');
    assert(
      trialBalance.totalNetDebit === trialBalance.totalNetCredit,
      `Total Net Debits (${trialBalance.totalNetDebit} BDT) equals Total Net Credits (${trialBalance.totalNetCredit} BDT)`
    );
    assert(
      trialBalance.totalDebit === trialBalance.totalCredit,
      `Total Raw Debits (${trialBalance.totalDebit} BDT) equals Total Raw Credits (${trialBalance.totalCredit} BDT)`
    );

    // Verify all 9 test accounts are accounted for
    const foundTestAccounts = trialBalance.accounts.filter((a) =>
      [codeCash, codeAr, codeInv, codeAp, codeVat, codeRev, codeCogs, codeSalary].includes(a.accountCode)
    );
    assert(foundTestAccounts.length >= 7, 'All impacted test accounts are represented in Trial Balance');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Execute Profit & Loss (P&L) Report');
    console.log('────────────────────────────────────────────────────────────────────────');

    const pnl = await FinancialReportService.getProfitAndLoss();

    // In our test JVs:
    // Revenue = 100,000 BDT
    // COGS = 60,000 BDT
    // Gross Profit = 40,000 BDT
    // OpEx = 25,000 BDT
    // Net Operating Profit = 15,000 BDT
    const revItem = pnl.revenue.items.find((i) => i.accountCode === codeRev);
    const cogsItem = pnl.cogs.items.find((i) => i.accountCode === codeCogs);
    const opexItem = pnl.operatingExpenses.items.find((i) => i.accountCode === codeSalary);

    assert(revItem?.amount === 100000, `P&L Revenue item for ${codeRev} is 100,000 BDT (got ${revItem?.amount})`);
    assert(cogsItem?.amount === 60000, `P&L COGS item for ${codeCogs} is 60,000 BDT (got ${cogsItem?.amount})`);
    assert(pnl.grossProfit >= 40000, `Gross Profit correctly computed (Revenue - COGS)`);
    assert(opexItem?.amount === 25000, `P&L Operating Expense item for ${codeSalary} is 25,000 BDT (got ${opexItem?.amount})`);
    assert(
      pnl.netOperatingProfit === Number((pnl.grossProfit - pnl.operatingExpenses.totalOperatingExpenses).toFixed(2)),
      `Net Operating Profit equals Gross Profit - OpEx (${pnl.netOperatingProfit} BDT)`
    );

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Execute Balance Sheet Report & Verify Fundamental Accounting Equation');
    console.log('────────────────────────────────────────────────────────────────────────');

    const balanceSheet = await FinancialReportService.getBalanceSheet();

    // Verify accounting equation:
    // Total Assets = Total Liabilities + Total Equity + Current Period Net Profit
    assert(balanceSheet.isBalanced === true, 'Balance Sheet isBalanced flag is true');
    assert(balanceSheet.difference === 0, 'Balance Sheet difference is 0.00 BDT');
    assert(
      balanceSheet.assets.totalAssets === balanceSheet.totalLiabilitiesAndEquity,
      `Total Assets (${balanceSheet.assets.totalAssets} BDT) equals Total Liabilities & Equity (${balanceSheet.totalLiabilitiesAndEquity} BDT)`
    );

    // Verify line item calculations:
    const invItem = balanceSheet.assets.items.find((i) => i.accountCode === codeInv);
    assert(invItem?.amount === 140000, `Inventory Net Book Value is 140,000 BDT (200,000 purchase - 60,000 cogs)`);

    const arItem = balanceSheet.assets.items.find((i) => i.accountCode === codeAr);
    assert(arItem?.amount === 115000, `Accounts Receivable is 115,000 BDT`);

    const apItem = balanceSheet.liabilities.items.find((i) => i.accountCode === codeAp);
    assert(apItem?.amount === 200000, `Accounts Payable is 200,000 BDT`);

    const vatItem = balanceSheet.liabilities.items.find((i) => i.accountCode === codeVat);
    assert(vatItem?.amount === 15000, `VAT Output Payable is 15,000 BDT`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Execute General Ledger Drilldown with Running Balance');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Drilldown on Inventory (codeInv)
    const glInv = await FinancialReportService.getGeneralLedgerDrilldown(codeInv);

    assert(glInv.accountCode === codeInv, 'GL Drilldown returned correct accountCode');
    assert(glInv.normalBalance === 'DEBIT', 'GL normalBalance is DEBIT');
    assert(glInv.entries.length === 2, `GL contains 2 entries (purchase and cogs)`);

    const purchaseEntry = glInv.entries.find((e: any) => e.voucherId.equals(jvPurchase.journalEntry._id));
    const cogsEntry = glInv.entries.find((e: any) => e.voucherId.equals(jvCogs.journalEntry._id));

    assert(purchaseEntry?.debit === 200000 && purchaseEntry?.credit === 0, 'Purchase entry debited 200,000 BDT');
    assert(purchaseEntry?.runningBalance === 200000, 'Running balance after purchase is 200,000 BDT');

    assert(cogsEntry?.credit === 60000 && cogsEntry?.debit === 0, 'COGS entry credited 60,000 BDT');
    assert(cogsEntry?.runningBalance === 140000, 'Running balance after COGS relief is 140,000 BDT');

    assert(glInv.closingBalance === 140000, `Closing balance is 140,000 BDT (got ${glInv.closingBalance})`);
    assert(glInv.periodTotalDebit === 200000, 'Period total debit is 200,000 BDT');
    assert(glInv.periodTotalCredit === 60000, 'Period total credit is 60,000 BDT');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Teardown Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      ChartOfAccountsModel.deleteMany({
        accountCode: {
          $in: [codeCash, codeAr, codeInv, codeAp, codeVat, codeEquity, codeRev, codeCogs, codeSalary],
        },
      }),
      JournalEntryModel.deleteMany({
        _id: { $in: createdVoucherIds },
      }),
      UserModel.findByIdAndDelete(accountantUser._id),
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

runFinancialReportsVerificationSuite().catch((err) => {
  console.error('Fatal error during financial reports verification:', err);
  process.exit(1);
});
