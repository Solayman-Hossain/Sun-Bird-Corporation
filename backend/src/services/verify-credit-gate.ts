import { Types } from 'mongoose';
import { generateSecret, generateSync } from 'otplib';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { CustomerCreditProfileModel } from '../models/CustomerCreditProfile';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { CustomerModel } from '../models/Customer';
import { OrderModel } from '../models/Order';
import { UserModel } from '../models/User';
import { WarehouseModel } from '../models/Warehouse';
import { CustomerCreditService } from './CustomerCreditService';
import {
  CreditLockedError,
  ForbiddenError,
  MfaRequiredError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/AppError';

async function runCreditGateVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 25: B2B CREDIT LIMIT & AGING HARD-LOCK GATE VERIFICATION');
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

  const suffix = Date.now().toString().slice(-6);

  try {
    await connectDatabase().catch(() => {});

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Seed Test Fixtures (Customer, Warehouse, Order, Staff, Director)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 1. Create B2B Customer
    const testCustomer = await CustomerModel.create({
      fullName: `Square Hospitals Dhaka Ltd ${suffix}`,
      mobile: `+8801700${suffix}`,
      email: `procurement-${suffix}@squarehospitals.com`,
      customerType: 'B2B_HOSPITAL',
      companyName: `Square Hospitals Ltd ${suffix}`,
      tradeLicenseNo: `TL-DHK-${suffix}`,
      buyerBin: '0009876540101',
    });
    assert(!!testCustomer._id, `Created test B2B customer: ${testCustomer.fullName}`);

    // 2. Create Warehouse for invoice references
    const testWarehouse = await WarehouseModel.create({
      name: `Central Med Hub ${suffix}`,
      warehouseCode: `WH-GATE-${suffix}`,
      type: 'CENTRAL',
      address: '100 Tejgaon I/A',
      district: 'Dhaka',
      isCentralHub: true,
      isActive: true,
    });

    // 3. Create Staff User
    const staffUser = await UserModel.create({
      fullName: `Sales Officer ${suffix}`,
      email: `sales.${suffix}@sunbird.com`,
      mobile: `+8801811${suffix}`,
      userType: 'STAFF',
      isActive: true,
    });

    // 4. Create Director User with TOTP MFA Secret
    const directorTotpSecret = generateSecret();
    const directorUser = await UserModel.create({
      fullName: `Director Finance ${suffix}`,
      email: `director.fin.${suffix}@sunbird.com`,
      mobile: `+8801911${suffix}`,
      userType: 'DIRECTOR',
      totpSecret: directorTotpSecret,
      isActive: true,
    });
    assert(!!directorUser._id, `Created test Director with MFA secret: ${directorUser.fullName}`);

    // 5. Create Dummy Order for Sales Invoice reference
    const dummyOrder = await OrderModel.create({
      orderNo: `ORD-GATE-${suffix}`,
      customerId: testCustomer._id,
      orderChannel: 'B2B_PORTAL',
      shippingAddress: 'Plot 10, Road 5, Dhanmondi, Dhaka',
      items: [
        {
          productId: new Types.ObjectId(),
          sku: `SKU-GATE-${suffix}`,
          qty: 2,
          uom: 'UNIT',
          unitPrice: 200000,
          vatAmount: 60000,
          lineTotal: 400000,
        },
      ],
      subtotal: 400000,
      vatTotal: 60000,
      grandTotal: 460000,
      paymentMethod: 'CREDIT',
      paymentStatus: 'UNPAID',
      orderStatus: 'CONFIRMED',
    });

    // 6. Create Customer Credit Profile (Credit Limit: 500,000 BDT)
    const creditProfile = await CustomerCreditProfileModel.create({
      customerId: testCustomer._id,
      creditLimitBDT: 500000,
      creditTermDays: 30,
      currentOutstandingAR: 100000,
      unbilledDispatches: 50000,
      isCreditLocked: false,
    });
    assert(
      creditProfile.creditLimitBDT === 500000,
      'Customer credit profile initialized: Limit = 500,000 BDT, AR = 100,000 BDT, Unbilled = 50,000 BDT'
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verify Safe Exposure Check (Within Credit Limit)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Total Exposure = 100,000 (AR) + 50,000 (Unbilled) + 150,000 (New) = 300,000 <= 500,000
    const checkPassed = await CustomerCreditService.checkCreditExposure(testCustomer._id, 150000);
    assert(checkPassed === true, 'Safe order (150,000 BDT) approved: Total exposure (300,000 BDT) <= limit (500,000 BDT)');

    const reloadedProfile1 = await CustomerCreditProfileModel.findOne({ customerId: testCustomer._id });
    assert(reloadedProfile1?.isCreditLocked === false, 'Credit profile remains unlocked (isCreditLocked: false)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verify Automated Hard-Lock Trigger (Exposure Exceeds Limit)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // New order: 400,000 BDT -> Exposure = 100,000 + 50,000 + 400,000 = 550,000 > 500,000
    let creditLimitErrorCaught = false;
    let caughtCreditErr: CreditLockedError | null = null;

    try {
      await CustomerCreditService.checkCreditExposure(testCustomer._id, 400000);
    } catch (err: any) {
      if (err instanceof CreditLockedError) {
        creditLimitErrorCaught = true;
        caughtCreditErr = err;
      }
    }

    assert(creditLimitErrorCaught, 'CreditLockedError thrown when total exposure (550,000 BDT) > limit (500,000 BDT)');
    assert(caughtCreditErr?.statusCode === 422, 'CreditLockedError has statusCode 422 (Unprocessable Entity)');
    assert(caughtCreditErr?.errorCode === 'CREDIT_LOCKED', 'CreditLockedError errorCode is CREDIT_LOCKED');
    assert(caughtCreditErr?.totalExposure === 550000, 'Error payload accurately reports totalExposure: 550,000 BDT');
    assert(caughtCreditErr?.creditLimit === 500000, 'Error payload reports creditLimit: 500,000 BDT');

    // Check DB record: isCreditLocked must be true and lockReason persisted
    const lockedProfile = await CustomerCreditProfileModel.findOne({ customerId: testCustomer._id });
    assert(lockedProfile?.isCreditLocked === true, 'Customer credit profile automatically hard-locked in database (isCreditLocked: true)');
    assert(
      typeof lockedProfile?.lockReason === 'string' && lockedProfile.lockReason.includes('Credit limit exceeded'),
      `Hard-lock audit reason saved: "${lockedProfile?.lockReason}"`
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  4. Verify Immediate Hard-Lock Block on Pre-Locked Customer');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Once hard-locked, even a tiny 1 BDT order must be rejected immediately
    let lockedAttemptBlocked = false;
    try {
      await CustomerCreditService.checkCreditExposure(testCustomer._id, 1);
    } catch (err: any) {
      if (err instanceof CreditLockedError) {
        lockedAttemptBlocked = true;
      }
    }
    assert(lockedAttemptBlocked, 'Pre-locked customer blocked immediately without re-evaluating limits');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  5. Verify Overdue Aging Gate & Automated Hard-Lock Trigger');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Create a new B2B customer with high limit (2,000,000 BDT) and 0 AR
    const agingCustomer = await CustomerModel.create({
      fullName: `Apollo Hospitals Dhaka Ltd ${suffix}`,
      mobile: `+8801722${suffix}`,
      email: `procurement-${suffix}@apollo.com`,
      customerType: 'B2B_HOSPITAL',
      companyName: `Apollo Hospitals Ltd ${suffix}`,
      tradeLicenseNo: `TL-APO-${suffix}`,
      buyerBin: '0001122330101',
    });

    const agingCreditProfile = await CustomerCreditProfileModel.create({
      customerId: agingCustomer._id,
      creditLimitBDT: 2000000,
      creditTermDays: 30,
      currentOutstandingAR: 20000,
      unbilledDispatches: 0,
      isCreditLocked: false,
    });

    // Create an overdue invoice for this customer: dueDate was 10 days ago!
    const pastDueDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const overdueInvoice = await SalesInvoiceModel.create({
      invoiceNo: `INV-OVERDUE-${suffix}`,
      orderId: dummyOrder._id,
      customerId: agingCustomer._id,
      branchId: testWarehouse._id,
      invoiceDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      dueDate: pastDueDate,
      mushakInvoiceNo: `MUS-OVERDUE-${suffix}`,
      subtotal: 20000,
      discountAmount: 0,
      vatRate: 15.0,
      vatTotal: 3000,
      grandTotal: 23000,
      paidAmount: 3000,
      dueAmount: 20000,
      paymentStatus: 'OVERDUE',
      status: 'ISSUED',
      preparedBy: staffUser._id,
    });
    assert(!!overdueInvoice._id, `Created overdue invoice (${overdueInvoice.invoiceNo}) with dueDate in the past`);

    // Now test small order (5,000 BDT): Exposure = 25,000 << 2,000,000 limit, but overdue invoice exists
    let agingLockCaught = false;
    let caughtAgingErr: CreditLockedError | null = null;
    try {
      await CustomerCreditService.checkCreditExposure(agingCustomer._id, 5000);
    } catch (err: any) {
      if (err instanceof CreditLockedError) {
        agingLockCaught = true;
        caughtAgingErr = err;
      }
    }

    assert(agingLockCaught, 'Aging Gate: CreditLockedError triggered due to overdue unpaid invoice despite being well under credit limit');
    const agingLockedProfile = await CustomerCreditProfileModel.findOne({ customerId: agingCustomer._id });
    assert(agingLockedProfile?.isCreditLocked === true, 'Aging violation hard-locked profile in DB (isCreditLocked: true)');
    assert(
      agingLockedProfile?.lockReason?.includes('Overdue aging violation') || false,
      `Lock reason specifies overdue aging violation: "${agingLockedProfile?.lockReason}"`
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  6. Verify Director Override Validation & MFA Enforcement');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 6a. Attempt override by non-director (STAFF user) -> Must throw ForbiddenError
    let forbiddenCaught = false;
    try {
      await CustomerCreditService.directorOverrideCreditLock(
        testCustomer._id,
        staffUser._id,
        'Staff attempting unauthorized credit override'
      );
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        forbiddenCaught = true;
      }
    }
    assert(forbiddenCaught, 'Non-director staff user override rejected with ForbiddenError (403)');

    // 6b. Attempt override without MFA code when Director has TOTP secret configured -> Must throw MfaRequiredError
    let mfaRequiredCaught = false;
    try {
      await CustomerCreditService.directorOverrideCreditLock(
        testCustomer._id,
        directorUser._id,
        'Director override without TOTP token'
      );
    } catch (err: any) {
      if (err instanceof MfaRequiredError) {
        mfaRequiredCaught = true;
      }
    }
    assert(mfaRequiredCaught, 'Director with MFA secret requires TOTP code (throws MfaRequiredError)');

    // 6c. Attempt override with invalid MFA code -> Must throw UnauthorizedError
    let invalidMfaCaught = false;
    try {
      await CustomerCreditService.directorOverrideCreditLock(
        testCustomer._id,
        directorUser._id,
        'Director override with bogus TOTP token',
        undefined,
        '000000'
      );
    } catch (err: any) {
      if (err instanceof UnauthorizedError) {
        invalidMfaCaught = true;
      }
    }
    assert(invalidMfaCaught, 'Invalid MFA TOTP code rejected with UnauthorizedError (401)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  7. Verify Authorized Director Override with Valid TOTP MFA');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Generate valid TOTP token for test Director
    const validTotp = generateSync({ secret: directorTotpSecret });

    const overrideResult = await CustomerCreditService.directorOverrideCreditLock(
      testCustomer._id,
      directorUser._id,
      'Urgent surgical equipment dispatch authorized for ICU expansion',
      undefined,
      validTotp
    );

    assert(overrideResult.isCreditLocked === false, 'Credit profile unlocked: isCreditLocked set to false');
    assert(
      overrideResult.approvedByDirector?.toString() === directorUser._id.toString(),
      'approvedByDirector audit foreign key set to Director user ID'
    );
    assert(
      overrideResult.lockReason?.includes('Director override granted by') || false,
      `Audit reason updated with Director details: "${overrideResult.lockReason}"`
    );

    // Verify database reflection
    const dbProfileAfterOverride = await CustomerCreditProfileModel.findOne({ customerId: testCustomer._id });
    assert(dbProfileAfterOverride?.isCreditLocked === false, 'Database confirms credit lock is released');
    assert(
      dbProfileAfterOverride?.approvedByDirector?.toString() === directorUser._id.toString(),
      'Database confirms approvedByDirector is recorded'
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  8. Verify Dispatch Gate Bypassed Under Active Director Override');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Now, even with a massive order (e.g., 600,000 BDT) exceeding limit, override permits dispatch!
    const overrideGateResult = await CustomerCreditService.checkCreditExposure(testCustomer._id, 600000);
    assert(overrideGateResult === true, 'Credit check passes because Director override is active');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  9. Verify Clear Director Override After Dispatch');
    console.log('────────────────────────────────────────────────────────────────────────');

    await CustomerCreditService.clearDirectorOverride(testCustomer._id);
    const clearedProfile = await CustomerCreditProfileModel.findOne({ customerId: testCustomer._id });
    assert(clearedProfile?.approvedByDirector === undefined, 'Director override flag cleared successfully');

    // Once cleared, an over-limit order locks it again
    let relockCaught = false;
    try {
      await CustomerCreditService.checkCreditExposure(testCustomer._id, 600000);
    } catch (err: any) {
      if (err instanceof CreditLockedError) {
        relockCaught = true;
      }
    }
    assert(relockCaught, 'After clearing override, subsequent over-limit check triggers hard-lock again');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  10. Verify Utility Helpers (Exposure Details & Atomic Balance Deltas)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Atomic balance updates
    const updatedBalances = await CustomerCreditService.updateCreditBalances(testCustomer._id, {
      arDelta: 50000,
      unbilledDelta: -25000,
    });
    assert(updatedBalances.currentOutstandingAR === 150000, 'AR incremented atomically (+50,000 -> 150,000 BDT)');
    assert(updatedBalances.unbilledDispatches === 25000, 'Unbilled decremented atomically (-25,000 -> 25,000 BDT)');

    // Real-time exposure details query
    const details = await CustomerCreditService.getExposureDetails(testCustomer._id, 75000);
    assert(details.totalExposure === 250000, `getExposureDetails calculates exact total exposure (150k + 25k + 75k = 250,000 BDT)`);
    assert(details.creditLimitBDT === 500000, 'getExposureDetails reports accurate creditLimitBDT');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  Clean Up Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      CustomerCreditProfileModel.deleteMany({ customerId: { $in: [testCustomer._id, agingCustomer._id] } }),
      SalesInvoiceModel.deleteMany({ customerId: { $in: [testCustomer._id, agingCustomer._id] } }),
      CustomerModel.deleteMany({ _id: { $in: [testCustomer._id, agingCustomer._id] } }),
      OrderModel.deleteOne({ _id: dummyOrder._id }),
      WarehouseModel.deleteOne({ _id: testWarehouse._id }),
      UserModel.deleteMany({ _id: { $in: [staffUser._id, directorUser._id] } }),
    ]);

    assert(true, 'Test fixtures safely removed from database');

  } catch (error: any) {
    console.error('💥 Unhandled exception during credit gate verification:', error);
    failed++;
  } finally {
    await disconnectDatabase().catch(() => {});
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCreditGateVerificationSuite();
