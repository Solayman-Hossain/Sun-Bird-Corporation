import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import mongoose, { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { JournalEntryModel } from '../models/JournalEntry';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { PurchaseInvoiceModel } from '../models/PurchaseInvoice';
import { SupplierPaymentModel } from '../models/SupplierPayment';
import { CustomerModel } from '../models/Customer';
import { SupplierModel } from '../models/Supplier';
import { MoneyReceiptModel } from '../models/MoneyReceipt';
import { PartnerModel } from '../models/Partner';
import { PartnerTransactionModel } from '../models/PartnerTransaction';
import { BudgetModel } from '../models/Budget';
import { BankReconciliationModel } from '../models/BankReconciliation';
import { OrganizationModel } from '../models/Organization';
import { AccountingService } from './AccountingService';
import { FinancialReportService } from './FinancialReportService';
import { CashBankService } from './CashBankService';
import { BankReconciliationService } from './BankReconciliationService';
import { ReceivablePayableService } from './ReceivablePayableService';
import { PartnerFinancialService } from './PartnerFinancialService';
import { BudgetService } from './BudgetService';
import { AccountsDashboardService } from './AccountsDashboardService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

async function runAccountingVerification() {
  console.log('\n===============================================================');
  console.log('   SUN BIRD ERP — MODULE 08: ACCOUNTS & FINANCE VERIFICATION  ');
  console.log('===============================================================\n');

  let passCount = 0;

  try {
    await connectDatabase();

    const testAdminId = new Types.ObjectId();
    const testOrgId = new Types.ObjectId();

    // Setup Test Organization
    await OrganizationModel.findOneAndUpdate(
      { organizationCode: 'ORG-FIN-01' },
      {
        displayName: 'Sun Bird Financial Testing Corp',
        legalName: 'Sun Bird Financial Testing Corp Ltd.',
        organizationCode: 'ORG-FIN-01',
        isDefault: false,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    // Seed any missing COA accounts needed by services
    console.log('[Setup] Ensuring required Chart of Accounts entries exist...');
    const requiredAccounts = [
      { accountCode: 1005, accountName: 'Cash in Hand', accountType: 'ASSET', normalBalance: 'DEBIT' },
      { accountCode: 3001, accountName: 'Partner Capital Account', accountType: 'EQUITY', normalBalance: 'CREDIT' },
      { accountCode: 3002, accountName: 'Partner Drawings Account', accountType: 'EQUITY', normalBalance: 'DEBIT' },
      { accountCode: 2040, accountName: 'Partner Profit Payable', accountType: 'LIABILITY', normalBalance: 'CREDIT' },
      { accountCode: 5200, accountName: 'Marketing & Distribution Expenses', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
    ];
    for (const acc of requiredAccounts) {
      await ChartOfAccountsModel.findOneAndUpdate(
        { accountCode: acc.accountCode },
        { $setOnInsert: { ...acc, isControl: false, isActive: true } },
        { upsert: true }
      );
    }
    console.log('  ✓ Required COA accounts verified/seeded');

    // =========================================================================
    // TEST 1: Chart of Accounts Creation, Code Validation, Hierarchy
    // =========================================================================
    console.log('[Test 1] Testing Chart of Accounts...');
    const testAccountCode = 6999;
    await ChartOfAccountsModel.deleteOne({ accountCode: testAccountCode });

    const newAccount = await ChartOfAccountsModel.create({
      organizationId: testOrgId,
      accountCode: testAccountCode,
      accountName: 'Special Medical Equipment Maintenance',
      accountType: 'EXPENSE',
      normalBalance: 'DEBIT',
      isControl: false,
      isActive: true,
    });

    assert(newAccount.accountCode === testAccountCode, 'Account code matches');
    assert(newAccount.normalBalance === 'DEBIT', 'Normal balance is DEBIT');
    passCount += 2;
    console.log('  ✓ Chart of Accounts creation and validation passed');

    // =========================================================================
    // TEST 2: Journal Entry - Balanced vs Unbalanced Double-Entry
    // =========================================================================
    console.log('[Test 2] Testing Journal Entry Balance Enforcement...');
    // Unbalanced test: Should reject
    let unbalancedCaught = false;
    try {
      await AccountingService.createJournalVoucher(
        {
          voucherType: 'JOURNAL',
          sourceDocumentRef: 'UNBALANCED-TEST',
          lines: [
            { accountCode: 1010, debit: 10000, credit: 0 },
            { accountCode: 4010, debit: 0, credit: 9500 }, // Imbalanced by 500
          ],
        },
        testAdminId
      );
    } catch (err: any) {
      unbalancedCaught = true;
    }
    assert(unbalancedCaught, 'Unbalanced journal voucher was strictly rejected');

    // Balanced test: Should succeed
    const balancedResult = await AccountingService.createJournalVoucher(
      {
        voucherType: 'JOURNAL',
        sourceDocumentRef: 'BALANCED-TEST-10K',
        lines: [
          { accountCode: 1010, debit: 10000, credit: 0, description: 'Bank receipt' },
          { accountCode: 4010, debit: 0, credit: 10000, description: 'Medical Sales Revenue' },
        ],
        notes: 'Test balanced JV',
      },
      testAdminId
    );

    assert(balancedResult.journalEntry.totalDebit === 10000, 'Total debit is 10,000');
    assert(balancedResult.journalEntry.totalCredit === 10000, 'Total credit is 10,000');
    assert(balancedResult.journalEntry.status === 'POSTED', 'Tier 1 voucher is automatically posted');
    passCount += 4;
    console.log(`  ✓ Balanced Journal Entry posted successfully (${balancedResult.journalEntry.voucherNo})`);

    // =========================================================================
    // TEST 3: General Ledger Running Balance Verification
    // =========================================================================
    console.log('[Test 3] Testing General Ledger Running Balance...');
    const glReport = await FinancialReportService.getGeneralLedgerDrilldown(1010);
    assert(glReport.accountCode === 1010, 'GL generated for account 1010');
    assert(glReport.entries.length > 0, 'GL contains chronological entries');
    passCount += 2;
    console.log(`  ✓ General Ledger contains ${glReport.entries.length} entries, closing balance: ৳${glReport.closingBalance.toLocaleString()}`);

    // =========================================================================
    // TEST 4: Accounts Receivable & Customer Payment Allocation
    // =========================================================================
    console.log('[Test 4] Testing Accounts Receivable & Customer Payment Allocation...');
    const testCustomer = await CustomerModel.create({
      fullName: `Test Hospital AR ${Date.now()}`,
      mobile: `017${Math.floor(10000000 + Math.random() * 90000000)}`,
      creditLimit: 500000,
      currentBalance: 0,
    });

    const testInvoice = await SalesInvoiceModel.create({
      invoiceNo: `INV-AR-${Date.now()}`,
      orderId: new Types.ObjectId(),
      customerId: testCustomer._id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 86400000), // Due in 15 days (Current)
      subtotal: 50000,
      discountAmount: 0,
      vatRate: 0,
      vatTotal: 0,
      grandTotal: 50000,
      paidAmount: 0,
      dueAmount: 50000,
      paymentStatus: 'UNPAID',
      status: 'ISSUED',
      preparedBy: testAdminId,
    });

    // Create partial money receipt for 30,000 BDT
    const testReceipt = await MoneyReceiptModel.create({
      receiptNumber: `MR-AR-${Date.now()}`,
      organizationId: testOrgId,
      receivedBy: testAdminId,
      customerId: testCustomer._id,
      receiptDate: new Date(),
      paymentMethod: 'CHEQUE',
      bankName: 'City Bank Ltd.',
      chequeNumber: 'CHQ-556677',
      amount: 30000,
      amountInWordsEn: 'Thirty Thousand Taka Only',
      forParticulars: 'Partial advance against ICU equipment',
      status: 'POSTED',
    });

    // Allocate payment
    const allocResult = await ReceivablePayableService.allocateCustomerPayment(
      testReceipt._id.toString(),
      [{ invoiceId: testInvoice._id.toString(), amount: 30000 }]
    );

    const updatedInv = await SalesInvoiceModel.findById(testInvoice._id);
    assert(updatedInv!.paidAmount === 30000, 'Invoice paidAmount is 30,000');
    assert(updatedInv!.dueAmount === 20000, 'Invoice dueAmount remaining is 20,000');
    assert(updatedInv!.paymentStatus === 'PARTIALLY_PAID', 'Invoice status is PARTIALLY_PAID');
    passCount += 3;
    console.log('  ✓ Customer payment allocated: ৳30,000 applied, ৳20,000 remaining due');

    // =========================================================================
    // TEST 5: Accounts Payable & Supplier Payment Allocation
    // =========================================================================
    console.log('[Test 5] Testing Accounts Payable & Supplier Payment...');
    const testSupplier = await SupplierModel.create({
      companyName: `Test Korea Medical Supplies ${Date.now()}`,
      supplierCode: `SUP-TEST-${Date.now()}`,
      supplierType: 'FOREIGN',
      contactPerson: 'Kim Min-jun',
      phone: '+82 2-1234-5678',
      email: `supp_${Date.now()}@medkorea.com`,
      paymentTerms: '30_DAYS',
      currency: 'BDT',
    });

    const testPurchaseInv = await PurchaseInvoiceModel.create({
      invoiceNumber: `PINV-TEST-${Date.now()}`,
      supplierInvoiceNumber: `INV-KR-${Date.now()}`,
      organizationId: testOrgId,
      supplierId: testSupplier._id,
      grnIds: [],
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      currency: 'BDT',
      exchangeRate: 1.0,
      items: [
        {
          productId: new Types.ObjectId(),
          sku: 'MED-DEV-01',
          productName: 'Electrosurgical Unit',
          qty: 2,
          uom: 'PCS',
          unitPrice: 40000,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          lineTotal: 80000,
        },
      ],
      subtotal: 80000,
      totalDiscount: 0,
      totalTax: 0,
      freightCharges: 0,
      otherCharges: 0,
      grandTotal: 80000,
      paidAmount: 0,
      outstandingAmount: 80000,
      dueAmount: 80000,
      attachments: [],
      status: 'POSTED',
      createdBy: testAdminId,
    });

    // Record Supplier Payment of 50,000 BDT
    const suppPayResult = await ReceivablePayableService.recordSupplierPayment({
      organizationId: testOrgId,
      supplierId: testSupplier._id,
      paymentAmount: 50000,
      paymentMethod: 'BANK_TRANSFER',
      sourceAccountCode: 1010,
      allocations: [{ invoiceId: testPurchaseInv._id.toString(), amount: 50000 }],
      notes: 'Payment for Electrosurgical Units',
      userId: testAdminId,
    });

    const updatedPinv = await PurchaseInvoiceModel.findById(testPurchaseInv._id);
    assert(updatedPinv!.paidAmount === 50000, 'Purchase invoice paidAmount is 50,000');
    assert(updatedPinv!.outstandingAmount === 30000, 'Purchase invoice outstanding is 30,000');
    assert(suppPayResult.journalVoucherNo !== undefined, 'Payment posted with GL Journal Voucher');
    passCount += 3;
    console.log(`  ✓ Supplier Payment recorded: ৳50,000 applied via JV (${suppPayResult.journalVoucherNo})`);

    // =========================================================================
    // TEST 6: Bank Reconciliation & Statement Line Matching
    // =========================================================================
    console.log('[Test 6] Testing Bank Reconciliation...');
    const recon = await BankReconciliationService.createReconciliation({
      organizationId: testOrgId,
      bankAccountCode: 1010,
      bankAccountName: 'City Bank Ltd. A/C 2901',
      statementPeriodStart: new Date(Date.now() - 30 * 86400000),
      statementPeriodEnd: new Date(),
      statementClosingBalance: 250000,
      statementLines: [
        {
          date: new Date(),
          description: 'Deposit Customer Cheque CHQ-556677',
          reference: 'DEP-8899',
          amount: 30000,
          type: 'CREDIT',
        },
      ],
      notes: 'Monthly bank statement reconciliation',
    });

    assert(recon.bankAccountCode === 1010, 'Bank account code matches');
    assert(recon.statementLines.length === 1, 'Statement lines recorded');

    // Match statement line
    const matchedRecon = await BankReconciliationService.matchStatementLine(
      recon._id.toString(),
      recon.statementLines[0].lineId,
      balancedResult.journalEntry.voucherNo
    );

    assert(matchedRecon.statementLines[0].isMatched === true, 'Statement line matched');
    passCount += 3;
    console.log('  ✓ Bank Reconciliation statement line matched with posted Journal Voucher');

    // =========================================================================
    // TEST 7: Partner Capital Contribution & GL Posting
    // =========================================================================
    console.log('[Test 7] Testing Partner Capital Contribution...');
    const testPartner = await PartnerFinancialService.createPartner({
      organizationId: testOrgId,
      partnerName: `Dr. Kazi Mostafa ${Date.now()}`,
      partnerCode: `PRT-${Date.now()}`,
      partnerType: 'EQUITY_PARTNER',
      phone: '+880 1711-223344',
      email: `partner_${Date.now()}@sunbird.com`,
      capitalContribution: 1000000,
      profitShareRatio: 60,
    });

    assert(testPartner.capitalContribution === 1000000, 'Initial capital recorded');

    // Additional Capital injection of 500,000 BDT
    const capContrib = await PartnerFinancialService.recordCapitalContribution({
      organizationId: testOrgId,
      partnerId: testPartner._id,
      amount: 500000,
      paymentMethod: 'BANK_TRANSFER',
      bankAccountCode: 1010,
      reference: `ADD-CAP-${Date.now()}`,
      notes: 'Additional equity injection for branch expansion',
      userId: testAdminId,
    });

    const updatedPartner = await PartnerModel.findById(testPartner._id);
    assert(updatedPartner!.capitalContribution === 1500000, 'Capital updated to 1,500,000');
    assert(capContrib.journalVoucherNo !== undefined, 'Capital contribution posted with JV');
    passCount += 3;
    console.log(`  ✓ Partner Capital Contribution posted (Total: ৳1,500,000 via JV ${capContrib.journalVoucherNo})`);

    // =========================================================================
    // TEST 8: Partner Profit Distribution Preview & Posting
    // =========================================================================
    console.log('[Test 8] Testing Partner Profit Distribution Engine...');
    const distPreview = await PartnerFinancialService.calculateProfitDistributionPreview({
      organizationId: testOrgId.toString(),
      fiscalYear: '2026',
      netProfit: 500000,
    });

    assert(distPreview.netProfit === 500000, 'Net profit is 500,000');
    assert(distPreview.distributions.length > 0, 'Partner distribution calculated');

    const distPost = await PartnerFinancialService.postProfitDistribution({
      organizationId: testOrgId,
      fiscalYear: '2026',
      netProfit: 500000,
      userId: testAdminId,
    });

    assert(distPost.journalVoucherNo !== undefined, 'Profit distribution posted with JV');
    passCount += 3;
    console.log(`  ✓ Partner Profit Distribution posted to GL via JV (${distPost.journalVoucherNo})`);

    // =========================================================================
    // TEST 9: Partner Settlement
    // =========================================================================
    console.log('[Test 9] Testing Partner Settlement...');
    const settleResult = await PartnerFinancialService.recordPartnerSettlement({
      partnerId: testPartner._id,
      amount: 50000,
      paymentMethod: 'BANK_TRANSFER',
      bankAccountCode: 1010,
      reference: `SETTLE-DIV-${Date.now()}`,
      notes: 'Quarterly dividend settlement',
      userId: testAdminId,
    });

    assert(settleResult.journalVoucherNo !== undefined, 'Settlement posted with JV');
    passCount += 1;
    console.log(`  ✓ Partner Settlement completed via JV (${settleResult.journalVoucherNo})`);

    // =========================================================================
    // TEST 10: Budget Management & Budget vs Actual Variance
    // =========================================================================
    console.log('[Test 10] Testing Budget vs Actual...');
    const budget = await BudgetService.createBudget({
      organizationId: testOrgId,
      fiscalYear: '2026',
      budgetName: 'Marketing & Institutional Medical Conferences 2026',
      budgetType: 'ANNUAL',
      accountCode: 5200,
      allocatedAmount: 600000,
      department: 'Commercial Marketing',
      notes: 'Hospital outreach and medical seminars',
    });

    assert(budget.status === 'DRAFT', 'Budget initially DRAFT');

    const approvedBudget = await BudgetService.approveBudget(budget._id.toString(), testAdminId);
    assert(approvedBudget.status === 'APPROVED', 'Budget approved');

    const bva = await BudgetService.getBudgetVsActual({
      organizationId: testOrgId.toString(),
      fiscalYear: '2026',
    });

    assert(bva.items.length > 0, 'Budget vs Actual items generated');
    passCount += 3;
    console.log(`  ✓ Budget created and approved (Allocated: ৳600,000, Variance analyzed)`);

    // =========================================================================
    // TEST 11: Real Financial Statements (TB, P&L, BS, Cash Flow)
    // =========================================================================
    console.log('[Test 11] Testing Financial Statements Engine...');
    const [tb, pnl, bs, cf, analysis] = await Promise.all([
      FinancialReportService.getTrialBalance(),
      FinancialReportService.getProfitAndLoss(),
      FinancialReportService.getBalanceSheet(),
      FinancialReportService.getCashFlowStatement(),
      FinancialReportService.getFinancialAnalysis(),
    ]);

    assert(tb.isBalanced === true, 'Trial Balance debits equal credits');
    assert(pnl.grossProfit !== undefined, 'P&L calculated gross profit');
    assert(bs.isBalanced === true, 'Balance Sheet Assets = Liabilities + Equity');
    assert(cf.netCashFlow !== undefined, 'Cash Flow Statement generated net cash flow');
    assert(typeof analysis.ratios.currentRatio === 'number', 'Financial ratios generated');
    passCount += 5;
    console.log('  ✓ Trial Balance, Profit & Loss, Balance Sheet, and Cash Flow Statement all balanced and verified');

    // =========================================================================
    // TEST 12: Cash & Bank Books
    // =========================================================================
    console.log('[Test 12] Testing Cash & Bank Books...');
    const [cashBook, bankBook] = await Promise.all([
      CashBankService.getCashBook({ accountCode: 1005 }),
      CashBankService.getBankBook({ accountCode: 1010 }),
    ]);

    assert(cashBook.entries !== undefined, 'Cash Book generated');
    assert(bankBook.entries !== undefined, 'Bank Book generated');
    passCount += 2;
    console.log(`  ✓ Cash Book and Bank Book entries verified (Bank Book: ${bankBook.entries.length} transactions)`);

    // =========================================================================
    // TEST 13: Accounts Dashboard Real-Time Metrics
    // =========================================================================
    console.log('[Test 13] Testing Real-Time Accounts Dashboard...');
    const dashboard = await AccountsDashboardService.getDashboardMetrics();
    assert(dashboard.financialSummary.totalAssets > 0, 'Total Assets calculated');
    assert(dashboard.charts.monthlyTrends.length > 0, 'Monthly trends chart series populated');
    passCount += 2;
    console.log(`  ✓ Accounts Dashboard metrics verified (Assets: ৳${dashboard.financialSummary.totalAssets.toLocaleString()})`);

    // =========================================================================
    // TEST 14: Duplicate Idempotent Posting Prevention
    // =========================================================================
    console.log('[Test 14] Testing Idempotency & Duplicate Prevention...');
    const idemKey = `IDEM-FIN-${Date.now()}`;
    const firstJv = await AccountingService.createJournalVoucher(
      {
        voucherType: 'JOURNAL',
        sourceDocumentRef: 'IDEM-REF-1',
        idempotencyKey: idemKey,
        lines: [
          { accountCode: 1010, debit: 5000, credit: 0 },
          { accountCode: 4010, debit: 0, credit: 5000 },
        ],
      },
      testAdminId
    );

    let dupErrorCaught = false;
    try {
      await AccountingService.createJournalVoucher(
        {
          voucherType: 'JOURNAL',
          sourceDocumentRef: 'IDEM-REF-2',
          idempotencyKey: idemKey, // Same idempotency key
          lines: [
            { accountCode: 1010, debit: 5000, credit: 0 },
            { accountCode: 4010, debit: 0, credit: 5000 },
          ],
        },
        testAdminId
      );
    } catch (err) {
      dupErrorCaught = true;
    }

    assert(dupErrorCaught, 'Duplicate posting with identical idempotencyKey was prevented');
    passCount += 1;
    console.log('  ✓ Duplicate posting protection enforced via idempotency key');

    console.log('\n===============================================================');
    console.log(`  SUCCESS: ALL ${passCount} ACCOUNTS & FINANCE ASSERTIONS PASSED!`);
    console.log('===============================================================\n');
  } finally {
    await disconnectDatabase();
  }
}

runAccountingVerification().catch((err) => {
  console.error('\n❌ Verification failed with error:', err);
  process.exit(1);
});
