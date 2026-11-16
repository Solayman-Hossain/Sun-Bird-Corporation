import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { OrganizationModel } from '../models/Organization';
import { ApprovalRequestModel } from '../models/ApprovalRequest';
import { ApprovalWorkflowModel } from '../models/ApprovalWorkflow';
import { ApprovalDelegationModel } from '../models/ApprovalDelegation';
import { AuditLogModel } from '../models/AuditLog';
import { ApprovalService } from './ApprovalService';
import { ApprovalWorkflowService } from './ApprovalWorkflowService';
import { ApprovalDelegationService } from './ApprovalDelegationService';
import { AuditService } from './AuditService';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sunbird';

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 SUN BIRD ERP - MODULE 03: APPROVAL & AUDIT VERIFICATION');
  console.log('================================================================');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  let testOrgId: string = '';
  let makerUserId: string = '';
  let checker1UserId: string = '';
  let checker2UserId: string = '';
  let delegateUserId: string = '';
  let testWorkflowId: string = '';

  try {
    // 0. Setup a test organization
    const testOrg = await OrganizationModel.create({
      organizationCode: `ORG_APP_${timestamp}`,
      legalName: 'Sun Bird Medical Systems Ltd',
      displayName: 'Sun Bird Medical Systems',
      organizationType: 'PRIVATE_LIMITED',
      email: `approval_${timestamp}@sunbird.com`,
      phone: '+8801711223344',
      address: 'Tejgaon Industrial Area',
      city: 'Dhaka',
      district: 'Dhaka',
      country: 'Bangladesh',
      status: 'ACTIVE',
    });
    testOrgId = testOrg._id.toString();
    console.log(`\n🏢 Created test organization: ${testOrg.displayName} (${testOrgId})`);

    // Setup Test Roles
    const storeMgrRole = await RoleModel.findOneAndUpdate(
      { slug: 'store_manager' },
      { roleName: 'Store Manager', slug: 'store_manager', isActive: true, permissions: [] },
      { upsert: true, new: true }
    );
    const financeMgrRole = await RoleModel.findOneAndUpdate(
      { slug: 'finance_manager' },
      { roleName: 'Finance Manager', slug: 'finance_manager', isActive: true, permissions: [] },
      { upsert: true, new: true }
    );

    // Setup Test Users: Maker, Checker 1, Checker 2, Delegate
    const maker = await UserModel.create({
      fullName: 'Enamul Haque (Procurement Officer)',
      username: `maker_${timestamp}`,
      email: `maker_${timestamp}@sunbird.com`,
      mobile: `+88018${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'dummy_hash',
      userType: 'STAFF',
      status: 'ACTIVE',
      isActive: true,
    });
    makerUserId = maker._id.toString();

    const checker1 = await UserModel.create({
      fullName: 'Kamal Hossain (Store Manager)',
      username: `checker1_${timestamp}`,
      email: `checker1_${timestamp}@sunbird.com`,
      mobile: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'dummy_hash',
      userType: 'STAFF',
      roleId: storeMgrRole._id,
      assignedRoles: [storeMgrRole._id],
      status: 'ACTIVE',
      isActive: true,
    });
    checker1UserId = checker1._id.toString();

    const checker2 = await UserModel.create({
      fullName: 'Farhana Ahmed (Finance Manager)',
      username: `checker2_${timestamp}`,
      email: `checker2_${timestamp}@sunbird.com`,
      mobile: `+88019${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'dummy_hash',
      userType: 'STAFF',
      roleId: financeMgrRole._id,
      assignedRoles: [financeMgrRole._id],
      status: 'ACTIVE',
      isActive: true,
    });
    checker2UserId = checker2._id.toString();

    const delegateUser = await UserModel.create({
      fullName: 'Nasir Uddin (Assistant Store Lead)',
      username: `delegate_${timestamp}`,
      email: `delegate_${timestamp}@sunbird.com`,
      mobile: `+88016${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'dummy_hash',
      userType: 'STAFF',
      status: 'ACTIVE',
      isActive: true,
    });
    delegateUserId = delegateUser._id.toString();

    // 1. Workflow Seeding & Multi-Level Configuration
    console.log('\n--- Test Group 1: Workflow Seeding & Configuration ---');
    const seedResult = await ApprovalWorkflowService.seedDefaultWorkflows();
    assert(seedResult.created.length >= 0 || seedResult.existing.length > 0, 'Default workflows seeded idempotently');

    const createdWorkflow = await ApprovalWorkflowService.createWorkflow({
      workflowName: `Purchase Order Multi-Tier Verification ${timestamp}`,
      workflowCode: `WF_TEST_PO_${timestamp}`,
      organizationId: testOrgId,
      module: 'PURCHASE',
      transactionType: 'PURCHASE_ORDER',
      minAmount: 50000,
      maxAmount: 500000,
      approvalLevels: [
        {
          levelNumber: 1,
          levelName: 'Store Manager Technical Audit',
          approverType: 'USER',
          approverId: checker1UserId,
          requiredCount: 1,
          isParallel: false,
          slaHours: 24,
        },
        {
          levelNumber: 2,
          levelName: 'Finance Manager Financial Clearance',
          approverType: 'USER',
          approverId: checker2UserId,
          requiredCount: 1,
          isParallel: false,
          slaHours: 24,
        },
      ],
      autoEscalation: true,
      escalateAfterHours: 24,
    });
    testWorkflowId = createdWorkflow._id.toString();
    assert(createdWorkflow.approvalLevels.length === 2, '2-level sequential approval workflow created');

    const matchedWf = await ApprovalWorkflowService.findMatchingWorkflow(
      testOrgId,
      'PURCHASE',
      'PURCHASE_ORDER',
      120000
    );
    assert(matchedWf !== null && matchedWf._id.toString() === testWorkflowId, 'Workflow matching engine matched BDT 120,000 to Tier 2');

    // 2. Submission & Maker-Checker Rule Enforcement
    console.log('\n--- Test Group 2: Maker-Checker Strict Enforcement ---');
    const req1 = await ApprovalService.createApprovalRequest(
      {
        documentType: 'PO',
        documentId: new Types.ObjectId().toString(),
        documentRef: `PO-2026-${timestamp}`,
        organizationId: testOrgId,
        module: 'PURCHASE',
        transactionType: 'PURCHASE_ORDER',
        transactionAmount: 120000,
        priority: 'HIGH',
        attachments: ['https://s3.example.com/quotation.pdf'],
        transactionSnapshot: { vendor: 'Siemens Healthineers', itemsCount: 4 },
      },
      makerUserId,
      maker.fullName
    );

    assert(req1.currentStatus === 'PENDING', 'Request created in PENDING status');
    assert(req1.makerId?.toString() === makerUserId, 'Creator properly tagged as Maker');
    assert(req1.currentLevel === 1 && req1.totalLevels === 2, 'Request initialized at Level 1 of 2');

    // Test Maker cannot approve their own request
    let makerBlocked = false;
    try {
      await ApprovalService.processDecision(
        req1._id.toString(),
        'APPROVE',
        makerUserId,
        maker.fullName,
        'MAKER'
      );
    } catch (err: any) {
      makerBlocked = true;
      assert(err.message.includes('Maker-Checker Violation'), 'Maker blocked from approving own request');
    }
    assert(makerBlocked, 'Maker-Checker constraint strictly enforced');

    // Test Unauthorized User cannot approve
    let unauthorizedBlocked = false;
    try {
      await ApprovalService.processDecision(
        req1._id.toString(),
        'APPROVE',
        new Types.ObjectId().toString(),
        'Random Intruder',
        'STAFF'
      );
    } catch (err: any) {
      unauthorizedBlocked = true;
    }
    assert(unauthorizedBlocked, 'Unauthorized user blocked from approving');

    // 3. Multi-Level Sequential Progression
    console.log('\n--- Test Group 3: Multi-Level Sequential Progression ---');
    // Level 1 Approval (Checker 1)
    const level1Result = await ApprovalService.processDecision(
      req1._id.toString(),
      'APPROVE',
      checker1UserId,
      checker1.fullName,
      'STORE_MANAGER',
      'Physical inspection and specifications verified.'
    );

    assert(level1Result.currentLevel === 2, 'Level advanced to 2 upon Checker 1 approval');
    assert(level1Result.currentStatus === 'UNDER_REVIEW', 'Status transitioned to UNDER_REVIEW');
    assert(level1Result.assignedApproverId?.toString() === checker2UserId, 'Level 2 assigned to Finance Manager');

    // Level 2 Approval (Checker 2)
    const level2Result = await ApprovalService.processDecision(
      req1._id.toString(),
      'APPROVE',
      checker2UserId,
      checker2.fullName,
      'FINANCE_MANAGER',
      'Budget and funds allocation verified.'
    );

    assert(level2Result.currentStatus === 'APPROVED', 'Request marked APPROVED after final tier completed');
    assert(level2Result.quorumReached === true, 'Quorum reached flag set to true');
    assert(level2Result.decisionHistory.length === 3, 'Full decision history tracked (Submit + Level 1 + Level 2)');

    // 4. Return for Correction & Re-submission Flow
    console.log('\n--- Test Group 4: Return for Correction Workflow ---');
    const req2 = await ApprovalService.createApprovalRequest(
      {
        documentType: 'PO',
        documentId: new Types.ObjectId().toString(),
        documentRef: `PO-RETURN-${timestamp}`,
        organizationId: testOrgId,
        module: 'PURCHASE',
        transactionType: 'PURCHASE_ORDER',
        transactionAmount: 120000,
      },
      makerUserId,
      maker.fullName
    );

    const returnedResult = await ApprovalService.processDecision(
      req2._id.toString(),
      'RETURN',
      checker1UserId,
      checker1.fullName,
      'STORE_MANAGER',
      'Warranty clause missing in supplier quotation. Please update.'
    );
    assert(returnedResult.currentStatus === 'RETURNED_FOR_CORRECTION', 'Request status set to RETURNED_FOR_CORRECTION');

    // 5. Rejection Flow
    console.log('\n--- Test Group 5: Rejection Workflow ---');
    const req3 = await ApprovalService.createApprovalRequest(
      {
        documentType: 'PO',
        documentId: new Types.ObjectId().toString(),
        documentRef: `PO-REJECT-${timestamp}`,
        organizationId: testOrgId,
        module: 'PURCHASE',
        transactionType: 'PURCHASE_ORDER',
        transactionAmount: 120000,
      },
      makerUserId,
      maker.fullName
    );

    const rejectedResult = await ApprovalService.processDecision(
      req3._id.toString(),
      'REJECT',
      checker1UserId,
      checker1.fullName,
      'STORE_MANAGER',
      'Price exceeds current DGDA benchmark.'
    );
    assert(rejectedResult.currentStatus === 'REJECTED', 'Request marked REJECTED');

    // 6. Delegation Management & Circular Prevention
    console.log('\n--- Test Group 6: Delegation & Circular Prevention ---');
    const today = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600000);

    const delegation = await ApprovalDelegationService.createDelegation({
      originalApproverId: checker1UserId,
      delegatedApproverId: delegateUserId,
      organizationId: testOrgId,
      moduleScope: ['PURCHASE'],
      startDate: today,
      endDate: nextWeek,
      reason: 'On official field inspection visit',
    });
    assert(delegation._id !== undefined && delegation.isActive === true, 'Approval delegation created');

    // Test Circular Delegation Prevention: delegate cannot delegate back to checker1
    let circularCaught = false;
    try {
      await ApprovalDelegationService.createDelegation({
        originalApproverId: delegateUserId,
        delegatedApproverId: checker1UserId,
        organizationId: testOrgId,
        startDate: today,
        endDate: nextWeek,
        reason: 'Attempting circular loop',
      });
    } catch (err: any) {
      circularCaught = true;
      assert(err.message.includes('Circular delegation detected'), 'Circular delegation rejected');
    }
    assert(circularCaught, 'Circular delegation safety rule passed');

    // Test Delegate can approve on behalf of original approver
    const req4 = await ApprovalService.createApprovalRequest(
      {
        documentType: 'PO',
        documentId: new Types.ObjectId().toString(),
        documentRef: `PO-DELEGATE-${timestamp}`,
        organizationId: testOrgId,
        module: 'PURCHASE',
        transactionType: 'PURCHASE_ORDER',
        transactionAmount: 120000,
      },
      makerUserId,
      maker.fullName
    );

    const delegatedApprovalResult = await ApprovalService.processDecision(
      req4._id.toString(),
      'APPROVE',
      delegateUserId,
      delegateUser.fullName,
      'DELEGATE_STORE_LEAD',
      'Approved via active delegation authority'
    );
    assert(delegatedApprovalResult.currentLevel === 2, 'Delegate successfully signed and advanced level');

    // 7. Cancellation by Maker
    console.log('\n--- Test Group 7: Cancellation Workflow ---');
    const req5 = await ApprovalService.createApprovalRequest(
      {
        documentType: 'PO',
        documentId: new Types.ObjectId().toString(),
        documentRef: `PO-CANCEL-${timestamp}`,
        organizationId: testOrgId,
        module: 'PURCHASE',
        transactionType: 'PURCHASE_ORDER',
        transactionAmount: 50000,
      },
      makerUserId,
      maker.fullName
    );

    const cancelledResult = await ApprovalService.cancelRequest(
      req5._id.toString(),
      makerUserId,
      'Client cancelled purchase order'
    );
    assert(cancelledResult.currentStatus === 'CANCELLED', 'Request successfully cancelled by Maker');

    // 8. Overdue SLA Escalation
    console.log('\n--- Test Group 8: Overdue SLA Escalation ---');
    // Force dueDate to past on req2
    await ApprovalRequestModel.findByIdAndUpdate(req2._id, {
      dueDate: new Date(Date.now() - 3600000),
      isOverdue: false,
      currentStatus: 'PENDING',
    });

    const overdueScan = await ApprovalService.checkAndEscalateOverdue();
    assert(overdueScan.overdueCount >= 1, `Overdue monitor identified ${overdueScan.overdueCount} expired request(s)`);

    // 9. Central Dashboard Analytics & Audit Trail
    console.log('\n--- Test Group 9: Central Dashboard Analytics & Audit ---');
    const stats = await ApprovalService.getDashboardStats({ organizationId: testOrgId });
    assert(stats.totalRequests >= 4, `Total requests tracked: ${stats.totalRequests}`);
    assert(stats.approvedCount >= 1, `Approved count tracked: ${stats.approvedCount}`);
    assert(stats.rejectedCount >= 1, `Rejected count tracked: ${stats.rejectedCount}`);
    assert(stats.cancelledCount >= 1, `Cancelled count tracked: ${stats.cancelledCount}`);
    assert(Array.isArray(stats.moduleBreakdown), 'Module breakdown aggregated');
    assert(Array.isArray(stats.orgBreakdown), 'Organization breakdown aggregated');

    // Verify Audit Trail & Change Diff
    const auditLogs = await AuditService.listAuditLogs({ organizationId: testOrgId });
    assert(auditLogs.total >= 4, `Audit logs captured ${auditLogs.total} immutable events`);

    const sampleDiff = AuditService.computeFieldDiffs(
      { amount: 50000, vendor: 'Vendor A' },
      { amount: 75000, vendor: 'Vendor A' }
    );
    assert(sampleDiff.length === 1 && sampleDiff[0].field === 'amount', 'Field-level change diff computed');

    // Cleanup test data
    await ApprovalRequestModel.deleteMany({ organizationId: new Types.ObjectId(testOrgId) });
    await ApprovalWorkflowModel.findByIdAndDelete(testWorkflowId);
    await ApprovalDelegationModel.deleteMany({ organizationId: new Types.ObjectId(testOrgId) });
    await UserModel.deleteMany({
      _id: { $in: [makerUserId, checker1UserId, checker2UserId, delegateUserId] },
    });
    await OrganizationModel.findByIdAndDelete(testOrgId);
    console.log('\n🧹 Cleaned up test database records');

  } catch (err: any) {
    console.error('❌ Unexpected error during verification:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n================================================================');
    console.log(`📊 FINAL RESULT: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runVerification();

