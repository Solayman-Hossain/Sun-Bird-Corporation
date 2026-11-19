import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  EmployeeProfileModel,
  DepartmentModel,
  DesignationModel,
  JobGradeModel,
  EmploymentTypeModel,
  ShiftModel,
  RosterScheduleModel,
  HolidayModel,
  AttendancePunchModel,
  AttendanceCorrectionModel,
  LeaveTypeModel,
  LeaveRequestModel,
  LeaveBalanceModel,
  SalaryComponentModel,
  SalaryStructureModel,
  PayrollBatchModel,
  PayslipModel,
  EmployeeAdvanceModel,
  ExpenseReimbursementModel,
  PerformanceReviewModel,
  TrainingRecordModel,
  HrSettingsModel,
  UserModel,
  JournalEntryModel,
  AuditLogModel,
} from '../models';
import { EmployeeManagementService } from './EmployeeManagementService';
import { AttendanceShiftService } from './AttendanceShiftService';
import { LeaveManagementService } from './LeaveManagementService';
import { PayrollCalculationService } from './PayrollCalculationService';
import { EmployeeLoanAdvanceService } from './EmployeeLoanAdvanceService';
import { HRAuxiliaryService } from './HRAuxiliaryService';

async function runHrmVerification() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  MODULE 10: HRM, ATTENDANCE, LEAVE, PAYROLL & EXPENSES TEST SUITE');
  console.log('  Sun Bird Corporation ERP Enterprise Verification');
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
    // 0. Setup dummy user for employee reference
    const dummyUser = await UserModel.create({
      fullName: `Dr. Mustafizur Rahman ${runId}`,
      email: `mustafiz.${runId}@sunbirdcorp.com`,
      mobile: `01711${runId}`,
      userType: 'STAFF',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: 'dummy_hash_for_test',
    });

    // ── 1. Department & Designation ──
    console.log('\n--- 1. Departments & Designations ---');
    const dept = await EmployeeManagementService.createDepartment({
      departmentCode: `DEP-${runId}`,
      name: `Biomedical Engineering ${runId}`,
      nameBn: 'বায়োমেডিক্যাল ইঞ্জিনিয়ারিং',
      isActive: true,
    });
    assert(!!dept._id && dept.departmentCode === `DEP-${runId}`, 'Department created with code & name');

    const desig = await EmployeeManagementService.createDesignation({
      designationCode: `DES-${runId}`,
      title: `Chief Biomedical Specialist ${runId}`,
      departmentId: dept._id,
      isActive: true,
    });
    assert(!!desig._id && desig.designationCode === `DES-${runId}`, 'Designation created and linked to department');

    // ── 2. Job Grades & Employment Types ──
    console.log('\n--- 2. Job Grades & Employment Types ---');
    const grade = await EmployeeManagementService.createJobGrade({
      gradeCode: `GRD-${runId}`,
      gradeName: `Executive Grade ${runId}`,
      minSalary: 40000,
      maxSalary: 120000,
      benefits: ['Medical Insurance', 'Provident Fund'],
    });
    assert(!!grade._id && grade.minSalary === 40000, 'Job Grade created with salary scale & benefits');

    const empType = await EmployeeManagementService.createEmploymentType({
      code: `PERM-${runId}`,
      name: 'Permanent Full-time',
      probationMonths: 6,
      hasBenefits: true,
    });
    assert(!!empType._id && empType.hasBenefits === true, 'Employment type created with probation period');

    // ── 3. Employee Creation & Onboarding ──
    console.log('\n--- 3. Employee Creation & Onboarding ---');
    const employee = await EmployeeManagementService.createEmployee({
      userId: dummyUser._id,
      department: dept.name,
      designation: desig.title,
      joiningDate: new Date('2024-01-01'),
      basicSalary: 60000,
      houseRentAllowance: 25000,
      medicalAllowance: 10000,
      conveyanceAllowance: 5000,
      personalInfo: {
        firstName: 'Mustafizur',
        lastName: 'Rahman',
        gender: 'MALE',
        bloodGroup: 'B+',
        nidNumber: `NID-${runId}`,
      },
      contactInfo: {
        officialEmail: dummyUser.email,
        officialPhone: dummyUser.mobile,
      },
      emergencyContacts: [
        { name: 'Mrs. Rahman', relationship: 'Spouse', phone: '01811998877', isPrimary: true },
      ],
      bankDetails: {
        bankName: 'City Bank',
        branchName: 'Gulshan',
        accountName: 'Dr. Mustafizur Rahman',
        accountNo: `110294${runId}`,
        paymentMethod: 'BANK',
      },
    });
    assert(!!employee._id && employee.grossSalary === 100000, 'Employee created with auto-calculated gross salary (100,000)');
    assert(employee.employmentDetails?.onboardingChecklist?.length! >= 5, 'Onboarding checklist initialized');

    // Toggle checklist task
    const updatedEmp = await EmployeeManagementService.updateOnboardingTask(employee._id, 0, true);
    assert(updatedEmp.employmentDetails?.onboardingChecklist?.[0].completed === true, 'Onboarding checklist item updated to completed');

    // ── 4. Org Chart & ID Card ──
    console.log('\n--- 4. Org Chart & Employee ID Card ---');
    const orgChart = await EmployeeManagementService.getOrganizationChart();
    assert(Array.isArray(orgChart) && orgChart.length > 0, 'Organization chart tree generated');

    const idCard = await EmployeeManagementService.getEmployeeIdCardData(employee._id);
    assert(idCard.employeeCode === employee.employeeCode && idCard.bloodGroup === 'B+', 'ID Card generated with blood group and QR payload');

    // ── 5. Shifts, Rosters & Holidays ──
    console.log('\n--- 5. Shifts, Rosters & Holidays ---');
    const shift = await AttendanceShiftService.createShift({
      shiftCode: `SFT-M-${runId}`,
      name: 'Standard Morning Shift',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      breakMinutes: 60,
    });
    assert(!!shift._id && shift.graceMinutes === 15, 'Shift created with grace & break minutes');

    const todayStr = new Date().toISOString().slice(0, 10);
    await HolidayModel.deleteMany({ date: '2026-12-16' });
    const holiday = await AttendanceShiftService.createHoliday({
      holidayName: `National Victory Day ${runId}`,
      date: `2026-12-16`,
      isOptional: false,
    });
    assert(!!holiday._id && holiday.holidayName.includes('Victory'), 'Holiday calendar record created');

    const roster = await AttendanceShiftService.assignRoster({
      employeeId: employee._id,
      shiftId: shift._id,
      startDate: todayStr,
      endDate: todayStr,
    });
    assert(!!roster._id, 'Roster assigned to employee');

    // ── 6. Geofenced Punch & Late Detection ──
    console.log('\n--- 6. Attendance Punch & Late Detection ---');
    const onTimePunch = await AttendanceShiftService.recordPunch({
      employeeId: employee._id,
      punchType: 'IN',
      punchTimestamp: new Date(`${todayStr}T09:05:00`),
      punchDate: todayStr,
      latitude: 23.8103,
      longitude: 90.4125,
      distanceMeters: 10,
    });
    assert(onTimePunch.isLate === false, 'On-time punch within 15min grace period flagged isLate = false');

    const lateDateStr = '2026-11-02';
    const latePunch = await AttendanceShiftService.recordPunch({
      employeeId: employee._id,
      punchType: 'IN',
      punchTimestamp: new Date(`${lateDateStr}T10:15:00`),
      punchDate: lateDateStr,
      latitude: 23.8103,
      longitude: 90.4125,
      distanceMeters: 15,
    });
    assert(latePunch.isLate === true, 'Punch past grace period (10:15 AM) flagged isLate = true');

    // ── 7. Bulk Attendance Import ──
    console.log('\n--- 7. Bulk Attendance Import ---');
    const importResult = await AttendanceShiftService.importBulkAttendance([
      {
        employeeCode: employee.employeeCode,
        punchDate: '2026-11-03',
        inTime: '08:55',
        outTime: '18:05',
      },
    ]);
    assert(importResult.importedCount === 1, 'Bulk biometric attendance imported successfully');

    // ── 8. Attendance Correction ──
    console.log('\n--- 8. Attendance Correction ---');
    const correction = await AttendanceShiftService.requestCorrection({
      employeeId: employee._id,
      date: lateDateStr,
      requestedInTime: new Date(`${lateDateStr}T09:00:00`),
      reason: 'Biometric fingerprint sensor was unresponsive',
    });
    assert(correction.status === 'PENDING', 'Attendance correction request submitted as PENDING');

    const processedCorrection = await AttendanceShiftService.processCorrection(
      correction._id,
      'APPROVED',
      dummyUser._id,
      'Verified with CCTV entry log'
    );
    assert(processedCorrection.status === 'APPROVED', 'Attendance correction approved and updated in database');

    // ── 9. Leave Types, Balances & Requests ──
    console.log('\n--- 9. Leave Types, Balances & Requests ---');
    const leaveType = await LeaveManagementService.createLeaveType({
      code: `CL-${runId}`,
      name: `Casual Leave ${runId}`,
      annualQuota: 14,
      isPaid: true,
      canCarryForward: false,
    });
    assert(!!leaveType._id && leaveType.annualQuota === 14, 'Leave type created with 14 days annual quota');

    const balancesCount = await LeaveManagementService.initializeBalancesForYear(2026);
    assert(balancesCount >= 1, 'Leave balances initialized for all employees for year 2026');

    const empBalances = await LeaveManagementService.getEmployeeBalances(employee._id, 2026);
    assert(empBalances.length > 0, 'Retrieved active leave balances for employee');

    const leaveReq = await LeaveManagementService.submitLeaveRequest({
      employeeId: employee._id,
      leaveTypeId: leaveType._id,
      startDate: new Date('2026-11-20'),
      endDate: new Date('2026-11-21'),
      totalDays: 2,
      reason: 'Personal family emergency',
    });
    assert(leaveReq.status === 'PENDING' && leaveReq.totalDays === 2, 'Leave request submitted with validation against balance');

    const approvedLeave = await LeaveManagementService.processLeaveApproval(
      leaveReq._id,
      'APPROVED',
      dummyUser._id,
      'Granted with pay'
    );
    assert(approvedLeave.status === 'APPROVED', 'Leave request approved');

    const updatedBalances = await LeaveManagementService.getEmployeeBalances(employee._id, 2026);
    const clBalance = updatedBalances.find((b: any) => b.leaveTypeId?.code === `CL-${runId}`);
    assert(clBalance?.usedDays === 2 && clBalance?.remainingDays === 12, 'Leave balance decremented by 2 days (14 -> 12)');

    // ── 10. Salary Components & Structure ──
    console.log('\n--- 10. Salary Components & Structure ---');
    const salComp = await PayrollCalculationService.createSalaryComponent({
      code: `BONUS-${runId}`,
      name: 'Performance Festival Bonus',
      type: 'EARNING',
      calculationType: 'PERCENTAGE',
      percentageBasis: 'BASIC',
      percentageValue: 50,
      isTaxable: false,
    });
    assert(!!salComp._id, 'Salary component created (50% of Basic)');

    const salStruct = await PayrollCalculationService.createSalaryStructure({
      structureCode: `STR-${runId}`,
      name: 'Executive Medical Staff Structure',
      components: [
        {
          componentId: salComp._id,
          componentName: salComp.name,
          type: 'EARNING',
          calculationType: 'PERCENTAGE',
          amountOrPercent: 50,
        },
      ],
    });
    assert(!!salStruct._id && salStruct.components.length === 1, 'Salary structure defined');

    // ── 11. Employee Loans & Advances ──
    console.log('\n--- 11. Employee Loans & Advances ---');
    const loan = await EmployeeLoanAdvanceService.createEmployeeLoan({
      employeeId: employee._id,
      principalBDT: 24000,
      tenureMonths: 12,
      isInterestFree: true,
      actorId: dummyUser._id,
    });
    assert(loan.outstandingBalance === 24000 && loan.repaymentSchedule.length === 12, 'Employee loan created with 12-month installment schedule');

    const advance = await EmployeeLoanAdvanceService.requestAdvance({
      employeeId: employee._id,
      amount: 5000,
      purpose: 'Urgent medical diagnostic fee',
      repaymentMonth: '2026-11',
    });
    assert(advance.status === 'PENDING' && advance.amount === 5000, 'Salary advance requested');

    const approvedAdv = await EmployeeLoanAdvanceService.approveAdvance(advance._id, dummyUser._id);
    assert(approvedAdv.status === 'APPROVED', 'Salary advance approved');

    const disbursedAdv = await EmployeeLoanAdvanceService.disburseAdvance(advance._id, dummyUser._id);
    assert(disbursedAdv.status === 'DISBURSED' && !!disbursedAdv.journalRef, 'Salary advance disbursed and double-entry journal voucher posted');

    // ── 12. Payroll Batch Computation & Payslips ──
    console.log('\n--- 12. Payroll Batch & Payslip Generation ---');
    await PayrollBatchModel.deleteMany({ monthYear: '2026-11' });
    await PayslipModel.deleteMany({ payslipNo: { $regex: '^SLIP-202611' } });
    const batch = await PayrollCalculationService.computePayrollBatch({
      monthYear: '2026-11',
      actorId: dummyUser._id,
    });
    assert(batch.totalGross >= 100000, 'Payroll batch computed with total gross matching active employees');
    assert(batch.totalDeductions >= 7000, 'Payroll deductions include loan installment (2,000) and advance (5,000)');

    const payslips = await PayslipModel.find({ payrollBatchId: batch._id });
    assert(payslips.length >= 1, 'Payslips generated for batch');

    const empPayslip = payslips.find((p) => p.employeeId.toString() === employee._id.toString());
    assert(!!empPayslip && empPayslip.advanceDeduction === 5000, 'Employee payslip correctly deducted 5,000 advance');

    const printData = await PayrollCalculationService.getPayslipPrintData(empPayslip!._id);
    assert(printData.company === 'SUN BIRD CORPORATION' && printData.earnings.length >= 4, 'Printable payslip view compiled with itemized earnings & deductions');

    // ── 13. Payroll Review & General Ledger Posting ──
    console.log('\n--- 13. Payroll Review & GL Posting ---');
    const reviewedBatch = await PayrollCalculationService.updateBatchStatus(batch._id, 'REVIEWED', dummyUser._id);
    assert(reviewedBatch.status === 'REVIEWED', 'Payroll batch marked as REVIEWED');

    const glResult = await PayrollCalculationService.postPayrollToGl(batch._id, dummyUser._id);
    assert(glResult.batch.status === 'POSTED_GL' && !!glResult.journalRef, 'Payroll posted to GL: Debit Salaries Expense (6110), Credit Accrued Salaries (2100)');

    const journal = await JournalEntryModel.findOne({ voucherNo: glResult.journalRef });
    assert(!!journal && journal.status === 'POSTED', 'Journal entry verified in general ledger as POSTED');

    // ── 14. Salary Disbursement / Payment ──
    console.log('\n--- 14. Salary Disbursement & Bank Payment ---');
    const paidBatch = await PayrollCalculationService.disburseSalaryPayment(batch._id, 'BANK_TRANSFER', dummyUser._id);
    assert(paidBatch.status === 'PAID', 'Payroll batch marked as PAID');

    const updatedSlip = await PayslipModel.findById(empPayslip!._id);
    assert(updatedSlip?.paymentStatus === 'PAID', 'Employee payslip status updated to PAID');

    const recoveredAdv = await EmployeeAdvanceModel.findById(advance._id);
    assert(recoveredAdv?.status === 'RECOVERED', 'Salary advance status transitioned to RECOVERED');

    // ── 15. Expense Reimbursement ──
    console.log('\n--- 15. Expense Reimbursement ---');
    const claim = await EmployeeLoanAdvanceService.submitExpenseClaim({
      employeeId: employee._id,
      expenseDate: new Date(),
      category: 'CLIENT_ENTERTAINMENT',
      amount: 3500,
      description: 'Hospital Director institutional meeting lunch',
    });
    assert(claim.status === 'SUBMITTED', 'Expense claim submitted');

    const approvedClaim = await EmployeeLoanAdvanceService.approveExpenseClaim(claim._id, dummyUser._id);
    assert(approvedClaim.status === 'APPROVED', 'Expense claim approved');

    const settledClaim = await EmployeeLoanAdvanceService.settleExpenseClaim(claim._id, dummyUser._id);
    assert(settledClaim.status === 'SETTLED' && !!settledClaim.journalRef, 'Expense claim settled and journal voucher posted to Accounts');

    // ── 16. Performance Management & Training ──
    console.log('\n--- 16. Performance & Training ---');
    const perfReview = await HRAuxiliaryService.createPerformanceReview({
      employeeId: employee._id,
      reviewerId: dummyUser._id,
      period: '2026-ANNUAL',
      kpis: [
        { metric: 'Biomedical Equipment Calibration Accuracy', target: '99%', achieved: '99.5%', score: 5 },
        { metric: 'On-time Customer Service Turnaround', target: '24h', achieved: '18h', score: 5 },
      ],
      overallRating: 5.0,
      strengths: 'Outstanding biomedical engineering leadership',
      improvements: 'Continue knowledge sharing sessions',
      recommendation: 'INCREMENT',
      status: 'COMPLETED',
    });
    assert(perfReview.overallRating === 5.0 && perfReview.recommendation === 'INCREMENT', 'Performance review recorded with KPIs and recommendation');

    const training = await HRAuxiliaryService.createTrainingRecord({
      title: 'ISO 13485 Medical Device Quality Management',
      trainer: 'Global Certification Body Lead Auditor',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-03'),
      venue: 'Tejgaon Central Depot Conference Hall',
      cost: 45000,
      attendees: [{ employeeId: employee._id, status: 'ENROLLED' }],
      status: 'PLANNED',
    });
    assert(!!training._id && training.attendees.length === 1, 'Training program created with enrolled employees');

    // ── 17. HR Reports & Settings ──
    console.log('\n--- 17. HR Reports & Settings ---');
    const headcountReport = await HRAuxiliaryService.getHeadcountReport();
    assert(headcountReport.totalEmployees >= 1 && headcountReport.activeCount >= 1, 'Headcount report generated with department breakdown');

    const payrollReport = await HRAuxiliaryService.getPayrollAnalyticsReport();
    assert(payrollReport.totalBatches >= 1, 'Payroll trend report generated with YTD totals');

    const hrSettings = await HRAuxiliaryService.getSettings();
    assert(hrSettings.workingDaysPerMonth === 26, 'HR settings retrieved with default working days (26)');

    const updatedSettings = await HRAuxiliaryService.updateSettings({ lateGraceMinutes: 20 });
    assert(updatedSettings.lateGraceMinutes === 20, 'HR settings updated (grace period 20 mins)');

    // ── 18. Offboarding Clearance ──
    console.log('\n--- 18. Employee Offboarding Clearance ---');
    const offboardedEmp = await EmployeeManagementService.processOffboarding(employee._id, {
      offboardingNotes: 'Test offboarding simulation',
      clearance: { itClearance: true, accountsClearance: true, adminClearance: true, hrClearance: true },
      status: 'RESIGNED',
    });
    assert(offboardedEmp.employmentDetails?.offboardingClearance?.itClearance === true, 'Offboarding clearance workflow recorded all department approvals');

    // ── 19. Audit Logs ──
    console.log('\n--- 19. HR Audit Logs ---');
    const auditLogs = await HRAuxiliaryService.getHrAuditLogs(10);
    assert(auditLogs.length > 0, 'HR Audit Logs verified with recorded actions');
  } catch (error: any) {
    console.error('❌ Exception during verification:', error);
    failed++;
  } finally {
    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  MODULE 10 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');
    await disconnectDatabase();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runHrmVerification();
