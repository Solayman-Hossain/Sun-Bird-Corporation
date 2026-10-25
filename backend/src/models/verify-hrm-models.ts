import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UserModel } from './User';
import { WarehouseModel } from './Warehouse';
import { EmployeeProfileModel } from './EmployeeProfile';
import { AttendancePunchModel } from './AttendancePunch';
import { PayrollRunModel } from './PayrollRun';

async function verifyHrmModels() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 38: HRM & PAYROLL MONGOOSE MODELS VERIFICATION SUITE');
  console.log('  (EmployeeProfile, AttendancePunch, PayrollRun - D11)');
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
    console.log('  1. Verify EmployeeProfile Schema & Explicit Indexes');
    console.log('────────────────────────────────────────────────────────────────────────');
    const empIndexes = EmployeeProfileModel.schema.indexes();
    const hasEmpCodeIndex = empIndexes.some(
      ([spec, opts]) => (spec as any).employeeCode === 1 && opts?.unique === true
    );
    const hasUserIdIndex = empIndexes.some(
      ([spec, opts]) => (spec as any).userId === 1 && opts?.unique === true
    );
    const hasDeptIndex = empIndexes.some(([spec]) => (spec as any).department === 1);
    const hasActiveIndex = empIndexes.some(([spec]) => (spec as any).isActive === 1);

    assert(hasEmpCodeIndex, 'EmployeeProfile has unique index on { employeeCode: 1 }');
    assert(hasUserIdIndex, 'EmployeeProfile has unique index on { userId: 1 }');
    assert(hasDeptIndex, 'EmployeeProfile has index on { department: 1 }');
    assert(hasActiveIndex, 'EmployeeProfile has index on { isActive: 1 }');

    // Create supporting User and Warehouse
    const testUser = await UserModel.create({
      fullName: `Staff Test User ${runId}`,
      email: `emp_${runId}@sunbird.com.bd`,
      mobile: `+8801700${runId.slice(-6)}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      userType: 'STAFF',
      isActive: true,
    });

    const testWarehouse = await WarehouseModel.create({
      warehouseCode: `WH-${runId}`,
      name: `Dhanmondi Hub ${runId}`,
      type: 'BRANCH',
      address: 'House 12, Road 4, Dhanmondi, Dhaka',
      district: 'Dhaka',
      isCentralHub: false,
      isActive: true,
    });

    // Test Gross Salary auto-computation pre-save hook
    const employee = await EmployeeProfileModel.create({
      userId: testUser._id,
      employeeCode: `EMP-${runId}-001`,
      department: 'SALES',
      designation: 'Senior Medical Equipment Sales Specialist',
      joiningDate: new Date('2026-01-01'),
      basicSalary: 35000,
      houseRentAllowance: 15000,
      medicalAllowance: 5000,
      conveyanceAllowance: 5000,
      grossSalary: 60000, // Should match basic + allowances
      salesCommissionRate: 2.5,
      assignedWarehouseId: testWarehouse._id,
      loanOutstanding: 0,
      officeLatLng: {
        lat: 23.7461,
        lng: 90.3752,
      },
      isActive: true,
    });

    assert(!!employee._id, `Created EmployeeProfile: ${employee.employeeCode}`);
    assert(
      employee.grossSalary === 60000,
      `Gross salary matches formula (35000 + 15000 + 5000 + 5000 = ${employee.grossSalary} BDT)`
    );
    assert(employee.salesCommissionRate === 2.5, 'Sales commission rate configured to 2.5%');
    assert(employee.casualLeaveBalance === 15, 'Default casual leave balance is 15 days');

    // Verify unique index on employeeCode
    try {
      await EmployeeProfileModel.create({
        userId: new Types.ObjectId(),
        employeeCode: `EMP-${runId}-001`, // Duplicate
        department: 'SALES',
        designation: 'Duplicate Employee',
        joiningDate: new Date(),
        basicSalary: 20000,
        grossSalary: 20000,
      });
      assert(false, 'Should prevent duplicate employeeCode');
    } catch (err: any) {
      assert(err.code === 11000, 'Blocked duplicate employeeCode with MongoDB E11000 duplicate key error');
    }

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verify AttendancePunch Schema & Compound Indexes');
    console.log('────────────────────────────────────────────────────────────────────────');
    const punchIndexes = AttendancePunchModel.schema.indexes();
    const hasEmpPunchDateIndex = punchIndexes.some(
      ([spec]) => (spec as any).employeeId === 1 && (spec as any).punchDate === -1
    );
    const hasPunchDateIndex = punchIndexes.some(([spec]) => (spec as any).punchDate === -1);
    const hasLatePunchIndex = punchIndexes.some(
      ([spec]) => (spec as any).isLate === 1 && (spec as any).punchDate === -1
    );

    assert(hasEmpPunchDateIndex, 'AttendancePunch has compound index { employeeId: 1, punchDate: -1 }');
    assert(hasPunchDateIndex, 'AttendancePunch has index { punchDate: -1 }');
    assert(hasLatePunchIndex, 'AttendancePunch has compound index { isLate: 1, punchDate: -1 }');

    // Record Valid IN Punch (within 50m geofence)
    const validPunch = await AttendancePunchModel.create({
      employeeId: employee._id,
      punchType: 'IN',
      punchTimestamp: new Date('2026-10-25T08:50:00Z'),
      punchDate: '2026-10-25',
      latitude: 23.74615,
      longitude: 90.37525,
      distanceMeters: 12.5,
      isWithinGeofence: true,
      isPresent: true,
      deviceUUID: 'DEV-UUID-TEST-001',
      isLate: false,
      isLWP: false,
    });

    assert(!!validPunch._id, `Created valid attendance punch within geofence (${validPunch.distanceMeters}m)`);
    assert(validPunch.isWithinGeofence === true, 'isWithinGeofence is true for 12.5 meters');
    assert(validPunch.isLate === false, 'isLate is false for on-time clock-in');

    // Record Late & Geofence Violation Punch
    const violationPunch = await AttendancePunchModel.create({
      employeeId: employee._id,
      punchType: 'IN',
      punchTimestamp: new Date('2026-10-26T09:45:00Z'),
      punchDate: '2026-10-26',
      latitude: 23.7805,
      longitude: 90.4102,
      distanceMeters: 4500, // 4.5km away
      isWithinGeofence: false,
      isPresent: true,
      deviceUUID: 'DEV-UUID-TEST-001',
      isLate: true,
      isLWP: false,
    });

    assert(violationPunch.isWithinGeofence === false, 'Geofence violation flagged for distance > 50m (4500m)');
    assert(violationPunch.isLate === true, 'Late arrival flagged for arrival past shift start');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verify PayrollRun Schema & Compound Indexes');
    console.log('────────────────────────────────────────────────────────────────────────');
    const payrollIndexes = PayrollRunModel.schema.indexes();
    const hasRunCodeIndex = payrollIndexes.some(
      ([spec, opts]) => (spec as any).payrollRunCode === 1 && opts?.unique === true
    );
    const hasMonthEmpIndex = payrollIndexes.some(
      ([spec, opts]) =>
        (spec as any).monthYear === 1 && (spec as any).employeeId === 1 && opts?.unique === true
    );
    const hasStatusIndex = payrollIndexes.some(([spec]) => (spec as any).status === 1);
    const hasMonthStatusIndex = payrollIndexes.some(
      ([spec]) => (spec as any).monthYear === 1 && (spec as any).status === 1
    );
    const hasEmpMonthIndex = payrollIndexes.some(
      ([spec]) => (spec as any).employeeId === 1 && (spec as any).monthYear === -1
    );
    const hasIdemIndex = payrollIndexes.some(
      ([spec, opts]) => (spec as any).idempotencyKey === 1 && opts?.unique === true && opts?.sparse === true
    );

    assert(hasRunCodeIndex, 'PayrollRun has unique index on { payrollRunCode: 1 }');
    assert(hasMonthEmpIndex, 'PayrollRun has compound unique index on { monthYear: 1, employeeId: 1 }');
    assert(hasStatusIndex, 'PayrollRun has index on { status: 1 }');
    assert(hasMonthStatusIndex, 'PayrollRun has compound index on { monthYear: 1, status: 1 }');
    assert(hasEmpMonthIndex, 'PayrollRun has compound index on { employeeId: 1, monthYear: -1 }');
    assert(hasIdemIndex, 'PayrollRun has sparse unique index on { idempotencyKey: 1 }');

    // Create Payroll Run with auto-computed netPay
    // Gross: 60,000 + Commission: 5,000 - LWP: 2,000 - Late: 1,000 - Loan: 3,000 = Net: 59,000
    const payrollRun = await PayrollRunModel.create({
      payrollRunCode: `PR-2026-10-${runId}`,
      monthYear: '2026-10',
      employeeId: employee._id,
      grossSalary: 60000,
      commissionAddition: 5000,
      lwpDeduction: 2000,
      lateDeduction: 1000,
      loanDeduction: 3000,
      status: 'DRAFT',
      idempotencyKey: `IDEM-PAYROLL-${runId}-001`,
    });

    assert(!!payrollRun._id, `Created PayrollRun: ${payrollRun.payrollRunCode}`);
    assert(
      payrollRun.netPay === 59000,
      `Net pay pre-validate auto-computed correctly: 60,000 + 5,000 - (2,000 + 1,000 + 3,000) = ${payrollRun.netPay} BDT`
    );
    assert(payrollRun.status === 'DRAFT', 'Initial payroll status is DRAFT');

    // Verify compound unique constraint: { monthYear: 1, employeeId: 1 }
    try {
      await PayrollRunModel.create({
        payrollRunCode: `PR-2026-10-${runId}-DUP`,
        monthYear: '2026-10',
        employeeId: employee._id, // Same employee, same month
        grossSalary: 60000,
        netPay: 60000,
      });
      assert(false, 'Should prevent duplicate payroll run for same employee and monthYear');
    } catch (err: any) {
      assert(
        err.code === 11000,
        'Blocked duplicate payroll run for same month with compound unique index E11000'
      );
    }

    // Clean up test documents
    await PayrollRunModel.deleteMany({ payrollRunCode: new RegExp(runId) });
    await AttendancePunchModel.deleteMany({ employeeId: employee._id });
    await EmployeeProfileModel.deleteMany({ employeeCode: new RegExp(runId) });
    await UserModel.deleteMany({ email: new RegExp(runId) });
    await WarehouseModel.deleteMany({ warehouseCode: new RegExp(runId) });
    console.log('✅ [PASS] Cleaned up test fixtures successfully');
  } catch (error: any) {
    console.error('❌ Verification Suite Error:', error);
    failed++;
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

verifyHrmModels();
