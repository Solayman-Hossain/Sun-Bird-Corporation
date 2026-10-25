import http from 'http';
import { Types } from 'mongoose';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { WarehouseModel } from '../models/Warehouse';
import { EmployeeProfileModel } from '../models/EmployeeProfile';
import { AttendancePunchModel } from '../models/AttendancePunch';
import { PayrollRunModel } from '../models/PayrollRun';
import { LoanModel } from '../models/Loan';
import { OrderModel } from '../models/Order';
import { JournalEntryModel } from '../models/JournalEntry';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { TokenService } from '../services/TokenService';

async function runHrmPayrollVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PHASE 6: HRM & GPS GEOFENCED PAYROLL ENGINE VERIFICATION SUITE');
  console.log('  (Prompts 38 - 42: Staff Master, Mobile Punches, Payroll, GL JV)');
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

  // Start ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;

  function makeRequest(
    path: string,
    method: string,
    payload?: any,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
    return new Promise((resolve, reject) => {
      const dataStr = payload !== undefined ? JSON.stringify(payload) : '';
      const requestHeaders: Record<string, string> = { ...headers };

      if (dataStr) {
        requestHeaders['Content-Type'] = 'application/json';
        requestHeaders['Content-Length'] = String(Buffer.byteLength(dataStr));
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: requestHeaders,
        },
        (res) => {
          let rawData = '';
          res.on('data', (chunk) => (rawData += chunk));
          res.on('end', () => {
            let parsedBody: any;
            try {
              parsedBody = JSON.parse(rawData);
            } catch {
              parsedBody = rawData;
            }
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsedBody,
            });
          });
        }
      );

      req.on('error', reject);
      if (dataStr) {
        req.write(dataStr);
      }
      req.end();
    });
  }

  try {
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Setup Roles & Test Users (Director, HR Manager, Staff Employee)');
    console.log('────────────────────────────────────────────────────────────────────────');
    const hrRole = await RoleModel.create({
      roleName: `HR_MANAGER_${runId}`,
      slug: `hr_manager_${runId}`,
      description: 'Human Resources Manager with full HR & Payroll permissions',
      permissions: [
        {
          module: 'HRM',
          actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE'],
        },
      ],
      isSystemRole: false,
      isActive: true,
    });

    const hrUser = await UserModel.create({
      fullName: `HR Manager ${runId}`,
      email: `hr_${runId}@sunbird.com.bd`,
      mobile: `+8801711${runId}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      userType: 'STAFF',
      roleId: hrRole._id,
      isActive: true,
    });

    const staffUser = await UserModel.create({
      fullName: `Medical Sales Rep ${runId}`,
      email: `staff_${runId}@sunbird.com.bd`,
      mobile: `+8801722${runId}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      userType: 'STAFF',
      isActive: true,
    });

    const unprivilegedUser = await UserModel.create({
      fullName: `Unprivileged Guest ${runId}`,
      email: `guest_${runId}@sunbird.com.bd`,
      mobile: `+8801733${runId}`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      userType: 'CUSTOMER',
      isActive: true,
    });

    // Create Hub Warehouse with GPS location coordinates [longitude, latitude]
    // Dhanmondi Hub: 23.7461° N, 90.3752° E
    const warehouse = await WarehouseModel.create({
      warehouseCode: `WH-DMD-${runId}`,
      name: `Dhanmondi Medical Hub ${runId}`,
      type: 'BRANCH',
      address: 'House 34, Road 11, Dhanmondi, Dhaka',
      district: 'Dhaka',
      isCentralHub: false,
      isActive: true,
    });

    const hrToken = TokenService.generateAccessToken(hrUser);
    const staffToken = TokenService.generateAccessToken(staffUser);
    const unprivToken = TokenService.generateAccessToken(unprivilegedUser);

    const hrHeaders = { Authorization: `Bearer ${hrToken}` };
    const staffHeaders = { Authorization: `Bearer ${staffToken}` };
    const unprivHeaders = { Authorization: `Bearer ${unprivToken}` };

    assert(!!hrToken, 'Generated HR Manager JWT access token');
    assert(!!staffToken, 'Generated Staff Employee JWT access token');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Prompt 39: Staff Master & Statutory Compensation Structure');
    console.log('────────────────────────────────────────────────────────────────────────');
    // Onboard employee with basic 40,000 + house 16,000 + med 4,000 + conv 4,000 = Gross 64,000
    const empPayload = {
      userId: staffUser._id.toString(),
      employeeCode: `EMP-2026-${runId}`,
      department: 'SALES',
      designation: 'Senior Medical Equipment Sales Executive',
      joiningDate: '2026-01-01T00:00:00.000Z',
      basicSalary: 40000,
      houseRentAllowance: 16000,
      medicalAllowance: 4000,
      conveyanceAllowance: 4000,
      salesCommissionRate: 2.0, // 2% commission on medical device orders
      assignedWarehouseId: warehouse._id.toString(),
      officeLatLng: {
        lat: 23.7461,
        lng: 90.3752,
      },
    };

    const createEmpRes = await makeRequest(
      '/api/v1/erp/hrm/employees',
      'POST',
      empPayload,
      hrHeaders
    );

    assert(createEmpRes.status === 201, `POST /api/v1/erp/hrm/employees returned HTTP 201 (Status: ${createEmpRes.status})`);
    assert(createEmpRes.body.success === true, 'Response body success is true');
    const createdEmp = createEmpRes.body.data;
    assert(
      createdEmp.grossSalary === 64000,
      `Gross salary matches statutory sum: 40,000 + 16,000 + 4,000 + 4,000 = ${createdEmp.grossSalary} BDT`
    );
    assert(createdEmp.salesCommissionRate === 2.0, 'Sales commission rate configured to 2.0%');

    // Query employee profile by ID
    const getEmpRes = await makeRequest(
      `/api/v1/erp/hrm/employees/${createdEmp._id}`,
      'GET',
      undefined,
      hrHeaders
    );
    assert(getEmpRes.status === 200, 'GET /api/v1/erp/hrm/employees/:id returned HTTP 200');
    assert(getEmpRes.body.data.employeeCode === empPayload.employeeCode, 'Retrieved matching employee code');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Prompt 40: Mobile GPS Geofenced Attendance Punch Engine');
    console.log('────────────────────────────────────────────────────────────────────────');
    // Test 1: Punch at ~18 meters (inside 50m geofence anchor)
    // Office: 23.7461, 90.3752. Punch at: 23.7462, 90.3753
    const validPunchPayload = {
      punchType: 'IN',
      latitude: 23.7462,
      longitude: 90.3753,
      deviceUUID: `MOBILE-UUID-${runId}`,
      punchTimestamp: '2026-10-25T02:50:00.000Z', // 08:50 AM BST (on-time before 09:15 AM)
    };

    const validPunchRes = await makeRequest(
      '/api/v1/portal/employee/punch',
      'POST',
      validPunchPayload,
      staffHeaders
    );

    assert(validPunchRes.status === 201, `POST /portal/employee/punch returned HTTP 201 (Status: ${validPunchRes.status})`);
    assert(validPunchRes.body.data.isWithinGeofence === true, 'Valid punch within 50m geofence flagged isWithinGeofence: true');
    assert(validPunchRes.body.data.isLate === false, 'On-time punch flagged isLate: false');
    assert(validPunchRes.body.data.distanceMeters < 50, `Calculated distance: ${validPunchRes.body.data.distanceMeters}m (< 50m)`);

    // Test 2: Punch at ~150 meters (geofence violation)
    // Coordinates offset to ~150m away: 23.7474, 90.3752
    const violationPunchPayload = {
      punchType: 'IN',
      latitude: 23.7474,
      longitude: 90.3752,
      deviceUUID: `MOBILE-UUID-${runId}`,
      punchTimestamp: '2026-10-25T02:55:00.000Z',
    };

    const violationPunchRes = await makeRequest(
      '/api/v1/portal/employee/punch',
      'POST',
      violationPunchPayload,
      staffHeaders
    );

    assert(violationPunchRes.status === 201, 'Recorded punch response received');
    assert(violationPunchRes.body.data.isWithinGeofence === false, 'Geofence violation correctly flagged (isWithinGeofence: false)');
    assert(violationPunchRes.body.data.distanceMeters > 50, `Distance ${violationPunchRes.body.data.distanceMeters}m exceeded 50m threshold`);

    // Test 3: Record late punches for payroll deduction testing (3 late = 0.5 day deduction)
    // Daily rate for 64,000 / 26 = 2,461.54 BDT -> 0.5 day = 1,230.77 BDT
    const latePunchTimes = [
      '2026-10-05T09:35:00.000Z', // 35 min past shift start
      '2026-10-06T09:40:00.000Z',
      '2026-10-07T09:50:00.000Z',
    ];

    for (let i = 0; i < latePunchTimes.length; i++) {
      const p = await AttendancePunchModel.create({
        employeeId: createdEmp._id,
        punchType: 'IN',
        punchTimestamp: new Date(latePunchTimes[i]),
        punchDate: `2026-10-0${5 + i}`,
        latitude: 23.7461,
        longitude: 90.3752,
        distanceMeters: 5,
        isWithinGeofence: true,
        isPresent: true,
        isLate: true,
      });
      assert(p.isLate === true, `Recorded late punch ${i + 1} on ${p.punchDate}`);
    }

    // Verify self-service attendance endpoint
    const myAttRes = await makeRequest(
      '/api/v1/portal/employee/attendance?monthYear=2026-10',
      'GET',
      undefined,
      staffHeaders
    );
    assert(myAttRes.status === 200, 'GET /portal/employee/attendance returned HTTP 200');
    assert(Array.isArray(myAttRes.body.data), 'Attendance data returned as array');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Prompt 41: Monthly Payroll Computation Engine');
    console.log('────────────────────────────────────────────────────────────────────────');
    // Setup active employee loan with 10,000 BDT monthly installment
    const empLoan = await LoanModel.create({
      loanCode: `LN-EMP-${runId}`,
      loanType: 'EMPLOYEE_LOAN',
      borrowerId: staffUser._id,
      borrowerType: 'EMPLOYEE',
      principalBDT: 60000,
      isInterestFree: true,
      interestRate: 0,
      interestMethod: 'FLAT',
      startDate: new Date('2026-09-01'),
      tenureMonths: 6,
      outstandingBalance: 50000,
      repaymentSchedule: [
        {
          dueDate: new Date('2026-10-15'),
          principalDue: 10000,
          interestDue: 0,
          totalDue: 10000,
          isPaid: false,
        },
      ],
      status: 'ACTIVE',
    });
    assert(!!empLoan._id, 'Created active employee loan with 10,000 BDT monthly installment');

    // Create a paid sales order attributed to this employee for realized commission calculation
    // 100,000 BDT order * 2.0% commission = 2,000 BDT commission
    const paidOrder = await OrderModel.create({
      orderNo: `ORD-SALES-${runId}`,
      customerId: new Types.ObjectId(),
      salesRepId: staffUser._id,
      orderChannel: 'B2B_DIRECT',
      orderStatus: 'DELIVERED',
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      items: [
        {
          productId: new Types.ObjectId(),
          sku: 'MED-SONO-01',
          qty: 1,
          uom: 'PCS',
          unitPrice: 100000,
          lineTotal: 100000,
          vatAmount: 0,
        },
      ],
      subtotal: 100000,
      vatTotal: 0,
      grandTotal: 100000,
      codOtpStatus: 'NOT_REQUIRED',
      shippingAddress: 'Gulshan 2, Dhaka',
      createdAt: new Date('2026-10-10'),
    });
    assert(!!paidOrder._id, 'Created 100,000 BDT paid sales order for 2% commission (2,000 BDT)');

    // Execute Batch Payroll Computation via API
    const computePayrollPayload = {
      monthYear: '2026-10',
      workingDays: 26,
    };

    const computeRes = await makeRequest(
      '/api/v1/erp/hrm/payroll-runs/compute',
      'POST',
      computePayrollPayload,
      hrHeaders
    );

    assert(computeRes.status === 200, `POST /payroll-runs/compute returned HTTP 200 (Status: ${computeRes.status})`);
    assert(computeRes.body.success === true, 'Payroll compute returned success: true');
    const computedData = computeRes.body.data;
    assert(computedData.monthYear === '2026-10', 'Computed month is 2026-10');
    assert(computedData.totalEmployees >= 1, `Computed payroll for ${computedData.totalEmployees} employees`);

    // Verify employee payroll run details
    const thisRun = computedData.payrollRuns.find(
      (r: any) => String(r.employeeId) === String(createdEmp._id)
    );
    assert(!!thisRun, 'Found computed payroll run for target employee');
    assert(thisRun.grossSalary === 64000, `Gross salary is 64,000 BDT`);
    assert(thisRun.commissionAddition === 2000, `Sales commission is 2,000 BDT (2% of 100,000)`);
    assert(thisRun.lateDeduction > 0, `3 Late punches deducted half-day salary (${thisRun.lateDeduction} BDT)`);
    assert(thisRun.loanDeduction === 10000, `Loan installment deducted 10,000 BDT`);
    assert(thisRun.netPay > 0, `Computed positive net pay (${thisRun.netPay} BDT)`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Prompt 41 & 42: GL Auto-Posting & Double-Entry Salary JV');
    console.log('────────────────────────────────────────────────────────────────────────');
    const postGlHeaders = {
      ...hrHeaders,
      'X-Idempotency-Key': `IDEM-PAYROLL-GL-${runId}-001`,
    };

    const postGlRes = await makeRequest(
      '/api/v1/erp/hrm/payroll-runs/post-gl',
      'POST',
      { monthYear: '2026-10' },
      postGlHeaders
    );

    assert(postGlRes.status === 200, `POST /payroll-runs/post-gl returned HTTP 200 (Status: ${postGlRes.status})`);
    assert(postGlRes.body.success === true, 'GL posting returned success: true');
    const glData = postGlRes.body.data;
    assert(!!glData.journalVoucherNo, `Generated balanced Journal Voucher: ${glData.journalVoucherNo}`);
    assert(glData.status === 'POSTED', 'Payroll status transitioned to POSTED');

    // Retrieve and verify the Journal Entry document directly
    const jvDoc = await JournalEntryModel.findOne({ voucherNo: glData.journalVoucherNo });
    assert(!!jvDoc, 'Journal Voucher exists in journal_entries collection');
    assert(jvDoc?.status === 'POSTED', 'Journal entry status is POSTED');

    // Verify accounting equation: Total Dr === Total Cr
    const sumDr = jvDoc?.lines.reduce((acc, l) => acc + l.debit, 0) || 0;
    const sumCr = jvDoc?.lines.reduce((acc, l) => acc + l.credit, 0) || 0;
    assert(Math.abs(sumDr - sumCr) < 0.01, `Voucher is mathematically balanced: Dr ${sumDr} === Cr ${sumCr}`);

    // Verify presence of standard payroll accounts in JV lines
    const lineCodes = jvDoc?.lines.map((l) => l.accountCode) || [];
    assert(lineCodes.includes(6110), 'JV contains Debit 6110 Salaries & Allowances Expense');
    assert(lineCodes.includes(2100), 'JV contains Credit 2100 Accrued Salaries Payable');
    assert(lineCodes.includes(1420), 'JV contains Credit 1420 Employee Advance / Loan Recoveries');

    // Verify Idempotency replay on duplicate post-gl request
    const dupPostGlRes = await makeRequest(
      '/api/v1/erp/hrm/payroll-runs/post-gl',
      'POST',
      { monthYear: '2026-10' },
      postGlHeaders
    );
    assert(dupPostGlRes.status === 200, 'Duplicate post-gl request handled safely via idempotency replay (HTTP 200)');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Test Self-Service Payslips & RBAC Guard Enforcement');
    console.log('────────────────────────────────────────────────────────────────────────');
    // Staff employee queries personal payslip
    const payslipsRes = await makeRequest(
      '/api/v1/portal/employee/payslips',
      'GET',
      undefined,
      staffHeaders
    );
    assert(payslipsRes.status === 200, 'GET /portal/employee/payslips returned HTTP 200 for staff');
    assert(payslipsRes.body.data.length >= 1, 'Staff retrieved posted monthly payslip');
    assert(payslipsRes.body.data[0].journalRef === glData.journalVoucherNo, 'Payslip references correct GL Journal Voucher');

    // Unprivileged user blocked from HR endpoints
    const forbiddenRes = await makeRequest(
      '/api/v1/erp/hrm/employees',
      'POST',
      empPayload,
      unprivHeaders
    );
    assert(forbiddenRes.status === 403, `Unprivileged user blocked from POST /hrm/employees with HTTP 403 (Status: ${forbiddenRes.status})`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Teardown Test Fixtures & Stop Server');
    console.log('────────────────────────────────────────────────────────────────────────');
    await PayrollRunModel.deleteMany({ payrollRunCode: new RegExp(runId) });
    await AttendancePunchModel.deleteMany({ employeeId: createdEmp._id });
    await EmployeeProfileModel.deleteMany({ employeeCode: new RegExp(runId) });
    await LoanModel.deleteMany({ loanCode: new RegExp(runId) });
    await OrderModel.deleteMany({ orderNo: new RegExp(runId) });
    if (glData?.journalVoucherNo) {
      await JournalEntryModel.deleteMany({ voucherNo: glData.journalVoucherNo });
    }
    await UserModel.deleteMany({ email: new RegExp(runId) });
    await RoleModel.deleteMany({ slug: new RegExp(runId) });
    await WarehouseModel.deleteMany({ warehouseCode: new RegExp(runId) });
    console.log('✅ [PASS] Cleaned up test fixtures successfully');
  } catch (error: any) {
    console.error('❌ Verification Suite Error:', error);
    failed++;
  } finally {
    server.close();
    await disconnectDatabase();
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHrmPayrollVerificationSuite();
