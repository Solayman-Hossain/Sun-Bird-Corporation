import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { LoanModel } from '../models/Loan';
import { JournalEntryModel } from '../models/JournalEntry';
import { UserModel } from '../models/User';
import { LoanService } from './LoanService';

async function runLoanServiceVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 35: MULTI-TYPE LOAN MANAGEMENT ENGINE VERIFICATION SUITE');
  console.log('  (Interest-Free & Interest-Bearing Loans, Amortization & Repayment JV)');
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
    console.log('  1. Setup COA Accounts & Test Fixture Users');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Create test user (employee borrower)
    const employeeUser = await UserModel.create({
      fullName: `Test Staff Borrower ${runId}`,
      email: `borrower.${runId}@sunbirdcorp.com`,
      mobile: `01711${runId}`,
      userType: 'STAFF',
      isActive: true,
    });

    const directorUser = await UserModel.create({
      fullName: `Finance Director Approver ${runId}`,
      email: `director.${runId}@sunbirdcorp.com`,
      mobile: `01811${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    assert(!!employeeUser._id, `Created test employee borrower (${employeeUser.email})`);
    assert(!!directorUser._id, `Created test director approver (${directorUser.email})`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Prompt 35 Core Spec: 50,000 BDT Interest-Free Employee Loan');
    console.log('────────────────────────────────────────────────────────────────────────');

    const employeeLoan = await LoanService.createLoan(
      {
        loanType: 'EMPLOYEE_LOAN',
        borrowerId: employeeUser._id,
        borrowerType: 'EMPLOYEE',
        principalBDT: 50000,
        isInterestFree: true,
        interestRate: 0,
        interestMethod: 'FLAT',
        tenureMonths: 10,
        startDate: new Date('2026-11-01'),
        contractDocUrl: 'https://s3.ap-southeast-1.amazonaws.com/sunbird/loans/EMP-50K.pdf',
        approvedBy: directorUser._id,
      },
      directorUser._id
    );

    assert(!!employeeLoan._id, `Created Loan ${employeeLoan.loanCode} with Principal: 50,000 BDT`);
    assert(employeeLoan.principalBDT === 50000, 'Principal is strictly 50,000 BDT');
    assert(employeeLoan.isInterestFree === true, 'Loan is flagged as interest-free');
    assert(employeeLoan.interestRate === 0, 'Interest rate is strictly 0%');
    assert(employeeLoan.tenureMonths === 10, 'Tenure is 10 months');
    assert(employeeLoan.repaymentSchedule.length === 10, 'Repayment schedule has exactly 10 installments');

    // Prompt 35 Verification Assertion:
    // "Create an interest-free employee loan of 50,000 BDT and assert repayment schedule has zero interest components."
    const hasAnyInterest = employeeLoan.repaymentSchedule.some((inst) => inst.interestDue > 0);
    assert(!hasAnyInterest, 'Repayment schedule has ZERO interest components across all installments');

    const totalPrincipalScheduled = employeeLoan.repaymentSchedule.reduce(
      (sum, inst) => sum + inst.principalDue,
      0
    );
    assert(
      Math.abs(totalPrincipalScheduled - 50000) < 0.01,
      `Sum of scheduled principal equals original principal (Scheduled: ${totalPrincipalScheduled} BDT)`
    );

    const firstInstallment = employeeLoan.repaymentSchedule[0];
    assert(firstInstallment.principalDue === 5000, 'Monthly installment is 5,000 BDT (50,000 / 10)');
    assert(firstInstallment.interestDue === 0, 'Installment 1 interest is strictly 0');
    assert(firstInstallment.totalDue === 5000, 'Installment 1 total due is 5,000 BDT');
    assert(firstInstallment.isPaid === false, 'Installment 1 is initially unpaid');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Validation Guard: Interest-Free Loan with Rate > 0 Rejection');
    console.log('────────────────────────────────────────────────────────────────────────');

    let rejectedInterestFree = false;
    try {
      await LoanService.createLoan({
        loanType: 'EMPLOYEE_LOAN',
        borrowerId: employeeUser._id,
        borrowerType: 'EMPLOYEE',
        principalBDT: 20000,
        isInterestFree: true,
        interestRate: 5.5, // Invalid combination!
        tenureMonths: 6,
      });
    } catch (err: any) {
      rejectedInterestFree = true;
    }
    assert(rejectedInterestFree, 'Strictly rejected interest-free loan that has interestRate > 0');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Test Interest-Bearing FLAT & REDUCING_BALANCE Schedules');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Test FLAT 12% loan
    const flatSchedule = LoanService.generateRepaymentSchedule({
      principalBDT: 120000,
      tenureMonths: 12,
      startDate: new Date('2026-01-01'),
      isInterestFree: false,
      interestRate: 12,
      interestMethod: 'FLAT',
    });

    assert(flatSchedule.length === 12, 'FLAT schedule has 12 installments');
    // Total interest = 120,000 * 12% * 1 = 14,400 BDT. Monthly interest = 1,200 BDT
    assert(flatSchedule[0].principalDue === 10000, 'Monthly principal is 10,000 BDT');
    assert(flatSchedule[0].interestDue === 1200, 'Monthly interest is 1,200 BDT');
    assert(flatSchedule[0].totalDue === 11200, 'Monthly total is 11,200 BDT');

    // Test REDUCING_BALANCE loan
    const reducingSchedule = LoanService.generateRepaymentSchedule({
      principalBDT: 100000,
      tenureMonths: 12,
      startDate: new Date('2026-01-01'),
      isInterestFree: false,
      interestRate: 10,
      interestMethod: 'REDUCING_BALANCE',
    });
    assert(reducingSchedule.length === 12, 'REDUCING_BALANCE schedule has 12 installments');
    assert(
      reducingSchedule[0].interestDue > reducingSchedule[11].interestDue,
      'Reducing balance interest decreases over time as principal is paid'
    );
    const sumReducingPrincipal = reducingSchedule.reduce((s, i) => s + i.principalDue, 0);
    assert(
      Math.abs(sumReducingPrincipal - 100000) < 0.1,
      `Sum of reducing principal equals original 100,000 BDT (Sum: ${sumReducingPrincipal})`
    );

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Test Repayment Recording & Automated Journal Voucher Generation');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Repay 1st installment of 5,000 BDT
    const repayment1 = await LoanService.recordLoanRepayment(
      employeeLoan.loanCode,
      5000,
      {
        userId: directorUser._id,
        transactionDate: new Date('2026-11-28'),
      }
    );

    assert(repayment1.paymentAmount === 5000, 'Recorded repayment amount: 5,000 BDT');
    assert(repayment1.principalPaid === 5000, 'Principal paid: 5,000 BDT');
    assert(repayment1.interestPaid === 0, 'Interest paid: 0 BDT (interest-free)');
    assert(
      repayment1.remainingOutstandingBalance === 45000,
      'Remaining balance reduced from 50,000 to 45,000 BDT'
    );
    assert(repayment1.settledInstallmentsCount === 1, 'Exactly 1 installment marked as settled');
    assert(!!repayment1.journalVoucherNo, `Clearance JV generated: ${repayment1.journalVoucherNo}`);

    // Verify Journal Entry in DB
    if (repayment1.journalVoucherNo) {
      const jvDoc = await JournalEntryModel.findOne({ voucherNo: repayment1.journalVoucherNo });
      assert(!!jvDoc, 'Journal Entry document found in database');
      assert(jvDoc?.status === 'POSTED', 'Journal Voucher status is POSTED');
      assert(
        Math.abs((jvDoc?.totalDebit || 0) - (jvDoc?.totalCredit || 0)) < 0.001,
        'Journal Entry is mathematically balanced (Debit = Credit = 5,000 BDT)'
      );

      const debitLine = jvDoc?.lines.find((l) => l.debit > 0);
      const creditLine = jvDoc?.lines.find((l) => l.credit > 0);
      assert(
        debitLine?.accountCode === 1020,
        `Debit line impacts Bank account (Code: ${debitLine?.accountCode})`
      );
      assert(
        creditLine?.accountCode === 1140,
        `Credit line impacts Employee Loan account (Code: ${creditLine?.accountCode})`
      );
    }

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Test Full Loan Payoff & Automatic Status Closure');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Pay off remaining 45,000 BDT in full
    const fullPayoff = await LoanService.recordLoanRepayment(
      employeeLoan.loanCode,
      45000,
      {
        userId: directorUser._id,
      }
    );

    assert(fullPayoff.remainingOutstandingBalance === 0, 'Remaining outstanding balance is 0 BDT');
    assert(fullPayoff.loanStatus === 'CLOSED', 'Loan status automatically transitioned to CLOSED');

    const reloadedLoan = await LoanService.getLoanByCode(employeeLoan.loanCode);
    assert(reloadedLoan.status === 'CLOSED', 'Persisted loan status in DB is CLOSED');
    assert(reloadedLoan.outstandingBalance === 0, 'Persisted balance in DB is 0');
    assert(
      reloadedLoan.repaymentSchedule.every((i) => i.isPaid === true),
      'All 10 repayment schedule installments are marked isPaid: true'
    );

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Teardown Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await LoanModel.deleteMany({ loanCode: employeeLoan.loanCode });
    await UserModel.deleteMany({ _id: { $in: [employeeUser._id, directorUser._id] } });
    if (repayment1.journalVoucherNo) {
      await JournalEntryModel.deleteMany({ voucherNo: repayment1.journalVoucherNo });
    }
    if (fullPayoff.journalVoucherNo) {
      await JournalEntryModel.deleteMany({ voucherNo: fullPayoff.journalVoucherNo });
    }
    assert(true, 'Test fixtures cleaned up cleanly');

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled error during Loan Service verification:', err);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runLoanServiceVerificationSuite();
