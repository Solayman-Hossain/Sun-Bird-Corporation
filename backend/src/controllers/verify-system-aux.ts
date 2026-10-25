import http from 'http';
import { Types } from 'mongoose';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { WarehouseModel } from '../models/Warehouse';
import { CrmActivityModel } from '../models/CrmActivity';
import { ApprovalRequestModel } from '../models/ApprovalRequest';
import { AuditLogModel } from '../models/AuditLog';
import { QuorumApprovalModel } from '../models/QuorumApproval';
import { CounterService } from '../services/CounterService';
import { AuditLogService } from '../services/AuditLogService';
import { TokenService } from '../services/TokenService';

async function runSystemAuxVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PHASE 7: QUORUM APPROVALS, GOVERNANCE, CRM & AUXILIARIES VERIFICATION');
  console.log('  (Prompts 43 - 49: Quorum, Maker-Checker, CRM, Warehouses, Audit Logs)');
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
          let chunks = '';
          res.on('data', (d) => (chunks += d));
          res.on('end', () => {
            try {
              const body = chunks ? JSON.parse(chunks) : {};
              resolve({ status: res.statusCode || 500, headers: res.headers, body });
            } catch {
              resolve({ status: res.statusCode || 500, headers: res.headers, body: chunks });
            }
          });
        }
      );

      req.on('error', reject);
      if (dataStr) req.write(dataStr);
      req.end();
    });
  }

  try {
    // ── Setup Users and Roles ───────────────────────────────────────────────
    console.log('--- Step 0: Setting up Super Admin and Directors ---');
    const adminRole = await RoleModel.create({
      roleName: `ADMIN_ROLE_${runId}`,
      slug: `admin-role-${runId}`,
      description: 'System Admin',
      permissions: [
        { module: 'warehouses', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
        { module: 'crm', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
        { module: 'approvals', actions: ['CREATE', 'READ', 'UPDATE', 'APPROVE'] },
        { module: 'audit', actions: ['READ'] },
      ],
      isSystemRole: true,
      isActive: true,
    });

    const superAdmin = await UserModel.create({
      mobile: `0171${runId}01`,
      fullName: `Super Admin ${runId}`,
      email: `admin.${runId}@sunbird.com`,
      passwordHash: 'hashed_admin_pass',
      userType: 'SUPER_ADMIN',
      roleId: adminRole._id,
      isActive: true,
      isMobileVerified: true,
    });

    const director1 = await UserModel.create({
      mobile: `0171${runId}02`,
      fullName: `Director One ${runId}`,
      email: `director1.${runId}@sunbird.com`,
      passwordHash: 'hashed_dir1_pass',
      userType: 'DIRECTOR',
      directorRole: 'MD',
      roleId: adminRole._id,
      isActive: true,
      isMobileVerified: true,
    });

    const director2 = await UserModel.create({
      mobile: `0171${runId}03`,
      fullName: `Director Two ${runId}`,
      email: `director2.${runId}@sunbird.com`,
      passwordHash: 'hashed_dir2_pass',
      userType: 'DIRECTOR',
      directorRole: 'DIRECTOR_FINANCE',
      roleId: adminRole._id,
      isActive: true,
      isMobileVerified: true,
    });

    const adminToken = TokenService.generateAccessToken(superAdmin);
    const dir1Token = TokenService.generateAccessToken(director1);
    const dir2Token = TokenService.generateAccessToken(director2);

    assert(Boolean(adminToken && dir1Token && dir2Token), 'Access tokens successfully generated for Admin and Directors');

    // ── Test 1: Atomic Gapless CounterService Concurrency ───────────────────
    console.log('\n--- Step 1: Testing CounterService Atomic Concurrency ---');
    const concurrencyCount = 20;
    const prefix = `TEST${runId}`;
    const counterPromises = Array.from({ length: concurrencyCount }, () =>
      CounterService.getNextSequence(prefix)
    );
    const sequences = await Promise.all(counterPromises);

    const uniqueSet = new Set(sequences);
    assert(uniqueSet.size === concurrencyCount, `All ${concurrencyCount} concurrent counter requests are strictly unique`);

    const seqNumbers = sequences.map((s) => parseInt(s.split('-').pop() || '0', 10));
    seqNumbers.sort((a, b) => a - b);
    const isSequential = seqNumbers.every((num, idx) => num === idx + 1);
    assert(isSequential, `Counter generated 1 through ${concurrencyCount} sequentially with zero gaps`);

    // ── Test 2: Multi-Warehouse Directory & Geofencing ─────────────────────
    console.log('\n--- Step 2: Testing Warehouse Directory and GPS Geofencing ---');
    const createWhRes = await makeRequest(
      '/api/v1/erp/warehouses',
      'POST',
      {
        name: `Dhanmondi Regional Showroom ${runId}`,
        type: 'BRANCH',
        address: 'House 42, Road 27, Dhanmondi, Dhaka',
        district: 'Dhaka',
        contactPerson: 'Showroom Manager',
        mobile: '01811223344',
        gpsLatitude: 23.7461,
        gpsLongitude: 90.3742,
        geofenceRadiusMeters: 50,
      },
      { Authorization: `Bearer ${adminToken}` }
    );

    assert(createWhRes.status === 201, `Warehouse created successfully (HTTP 201)`);
    const createdWh = createWhRes.body.data;
    assert(createdWh.location?.coordinates[0] === 90.3742, `Warehouse GeoJSON longitude correctly populated`);
    assert(createdWh.location?.coordinates[1] === 23.7461, `Warehouse GeoJSON latitude correctly populated`);
    assert(createdWh.geofenceRadiusMeters === 50, `Warehouse 50-meter geofence radius configured`);

    // Query warehouses by district
    const whByDistrictRes = await makeRequest(
      '/api/v1/erp/warehouses/district/Dhaka',
      'GET',
      undefined,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(whByDistrictRes.status === 200, `Warehouse queried by district 'Dhaka' (HTTP 200)`);
    assert(
      Array.isArray(whByDistrictRes.body.data) && whByDistrictRes.body.data.length > 0,
      `Regional coverage query returned active Dhaka warehouses`
    );

    // Update warehouse
    const updateWhRes = await makeRequest(
      `/api/v1/erp/warehouses/${createdWh._id}`,
      'PUT',
      { binCount: 120, capacityCbf: 5000 },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(updateWhRes.status === 200, `Warehouse details updated successfully (HTTP 200)`);
    assert(updateWhRes.body.data.binCount === 120, `Warehouse bin count updated to 120`);

    // ── Test 3: CRM Activities, Doctor Visits & Follow-up Scheduling ────────
    console.log('\n--- Step 3: Testing CRM Activities and Doctor Visit Logs ---');
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead
    const createCrmRes = await makeRequest(
      '/api/v1/erp/crm/activities',
      'POST',
      {
        activityType: 'VISIT_LOG',
        leadName: 'Dr. Rafiqul Islam (Dhaka Medical College)',
        contactMobile: '01711223344',
        notes: 'Presented Sun Bird Orthopedic Implants catalogue. Doctor requested demo samples.',
        followUpDate: futureDate.toISOString(),
        status: 'OPEN',
      },
      { Authorization: `Bearer ${adminToken}` }
    );

    assert(createCrmRes.status === 201, `CRM visit log recorded (HTTP 201)`);
    const crmActivity = createCrmRes.body.data;
    assert(crmActivity.activityNumber.startsWith('CRM-'), `CRM activity assigned gapless code '${crmActivity.activityNumber}'`);
    assert(crmActivity.activityType === 'VISIT_LOG', `Activity type correctly saved as VISIT_LOG`);

    // Query upcoming follow-ups
    const followUpsRes = await makeRequest(
      '/api/v1/erp/crm/follow-ups?daysAhead=7',
      'GET',
      undefined,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(followUpsRes.status === 200, `Upcoming CRM follow-ups queried (HTTP 200)`);
    const foundFollowUp = followUpsRes.body.data.some(
      (a: any) => a._id === crmActivity._id
    );
    assert(foundFollowUp, `Doctor visit scheduled follow-up appears in 7-day upcoming list`);

    // Update CRM activity outcome
    const updateCrmRes = await makeRequest(
      `/api/v1/erp/crm/activities/${crmActivity._id}`,
      'PUT',
      {
        status: 'RESOLVED',
        outcome: 'Doctor approved hospital trial PO for 50 units.',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(updateCrmRes.status === 200, `CRM activity updated with outcome (HTTP 200)`);
    assert(updateCrmRes.body.data.status === 'RESOLVED', `CRM activity status updated to RESOLVED`);

    // ── Test 4: Immutable Audit Trail & Tamper Resistance ───────────────────
    console.log('\n--- Step 4: Testing Immutable Audit Trail & Tamper Blocking ---');
    await AuditLogService.logAction({
      actorId: superAdmin._id.toString(),
      actorRole: 'SUPER_ADMIN',
      action: 'WAREHOUSE_REGISTER',
      targetCollection: 'warehouses',
      targetId: createdWh._id.toString(),
      afterSnapshot: { name: createdWh.name },
      ipAddress: '127.0.0.1',
    });

    const auditQueryRes = await makeRequest(
      `/api/v1/erp/audit-logs?targetCollection=warehouses`,
      'GET',
      undefined,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(auditQueryRes.status === 200, `Audit logs queried successfully (HTTP 200)`);
    assert(auditQueryRes.body.data.length > 0, `Audit log entry found in system audit trail`);

    const resourceHistoryRes = await makeRequest(
      `/api/v1/erp/audit-logs/history/warehouses/${createdWh._id}`,
      'GET',
      undefined,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(resourceHistoryRes.status === 200, `Resource chronological audit history retrieved (HTTP 200)`);

    // Tamper test: direct Mongoose deleteOne on AuditLog must fail via pre-hook
    let deleteBlocked = false;
    try {
      await AuditLogModel.deleteOne({ targetCollection: 'warehouses' });
    } catch (err: any) {
      deleteBlocked = err.message.includes('immutable');
    }
    assert(deleteBlocked, `Direct Mongoose deleteOne on AuditLog strictly blocked by immutability pre-hook`);

    // Tamper test: direct Mongoose updateOne on AuditLog must fail via pre-hook
    let updateBlocked = false;
    try {
      await AuditLogModel.updateOne(
        { targetCollection: 'warehouses' },
        { action: 'TAMPERED_ACTION' }
      );
    } catch (err: any) {
      updateBlocked = err.message.includes('immutable');
    }
    assert(updateBlocked, `Direct Mongoose updateOne on AuditLog strictly blocked by immutability pre-hook`);

    // ── Test 5: Workflow Maker-Checker Queue ────────────────────────────────
    console.log('\n--- Step 5: Testing Workflow Maker-Checker Approval Requests ---');
    const dummyDocId = new Types.ObjectId();
    const createReqRes = await makeRequest(
      '/api/v1/erp/approvals/requests',
      'POST',
      {
        documentType: 'EXPENSE',
        documentId: dummyDocId.toString(),
        documentRef: 'EXP-2026-0001',
        currentQuorumTier: 1,
        quorumRequired: 1,
      },
      { Authorization: `Bearer ${adminToken}` }
    );

    assert(createReqRes.status === 201, `Workflow approval request submitted (HTTP 201)`);
    const appRequest = createReqRes.body.data;
    assert(appRequest.requestCode.startsWith('AR-'), `Approval request assigned code '${appRequest.requestCode}'`);
    assert(appRequest.currentStatus === 'PENDING', `Request initialized with PENDING status`);

    // Action request (Approve)
    const actionReqRes = await makeRequest(
      `/api/v1/erp/approvals/requests/${appRequest._id}/action`,
      'PUT',
      {
        status: 'APPROVED',
        comment: 'Verified expense receipts. Approved for disbursement.',
      },
      { Authorization: `Bearer ${dir1Token}` }
    );

    assert(actionReqRes.status === 200, `Workflow request approved by checker (HTTP 200)`);
    assert(actionReqRes.body.data.currentStatus === 'APPROVED', `Request transitioned to APPROVED status`);
    assert(actionReqRes.body.data.quorumReached === true, `Quorum reached flagged as true`);

    // ── Test 6: Multi-Director Quorum Cryptographic Signatures ──────────────
    console.log('\n--- Step 6: Testing Multi-Director Quorum Approvals ---');
    const quorumTargetId = new Types.ObjectId();
    const testQuorum = await QuorumApprovalModel.create({
      targetCollection: 'purchase_orders',
      targetId: quorumTargetId,
      targetRef: `PO-${runId}-001`,
      quorumTier: 3,
      requiredCount: 2,
      approvals: [],
      isComplete: false,
    });

    // 1st Signature (Director 1)
    const sign1Res = await makeRequest(
      `/api/v1/erp/approvals/quorum/${testQuorum._id}/sign`,
      'POST',
      {
        directorRole: 'MD',
        remarks: 'First director review passed',
      },
      {
        Authorization: `Bearer ${dir1Token}`,
        'X-MFA-Code': '123456',
      }
    );

    assert(sign1Res.status === 200, `Director 1 signed quorum (HTTP 200)`);
    assert(sign1Res.body.data.currentSignaturesCount === 1, `Quorum recorded 1 signature`);
    assert(sign1Res.body.data.isComplete === false, `Quorum remains incomplete (1/2 required)`);

    // Duplicate signature attempt by Director 1 must fail
    const duplicateSignRes = await makeRequest(
      `/api/v1/erp/approvals/quorum/${testQuorum._id}/sign`,
      'POST',
      {
        directorRole: 'MD',
        remarks: 'Attempting duplicate signature',
      },
      {
        Authorization: `Bearer ${dir1Token}`,
        'X-MFA-Code': '123456',
      }
    );
    assert(duplicateSignRes.status >= 400, `Duplicate signature by same director strictly rejected (HTTP ${duplicateSignRes.status})`);

    // 2nd Signature (Director 2) - Should complete the quorum
    const sign2Res = await makeRequest(
      `/api/v1/erp/approvals/quorum/${testQuorum._id}/sign`,
      'POST',
      {
        directorRole: 'DIRECTOR_FINANCE',
        remarks: 'Second director countersign confirmed',
      },
      {
        Authorization: `Bearer ${dir2Token}`,
        'X-MFA-Code': '654321',
      }
    );

    assert(sign2Res.status === 200, `Director 2 signed quorum (HTTP 200)`);
    assert(sign2Res.body.data.currentSignaturesCount === 2, `Quorum reached 2 signatures`);
    assert(sign2Res.body.data.isComplete === true, `Quorum marked complete upon reaching required threshold (2/2)`);
    assert(Boolean(sign2Res.body.data.completedAt), `Completion timestamp accurately logged`);

    // ── Test 7: Managing Director Emergency Override ────────────────────────
    console.log('\n--- Step 7: Testing MD Emergency Override ---');
    const emergencyQuorum = await QuorumApprovalModel.create({
      targetCollection: 'purchase_orders',
      targetId: new Types.ObjectId(),
      targetRef: `PO-EMERGENCY-${runId}`,
      quorumTier: 3,
      requiredCount: 3,
      approvals: [],
      isComplete: false,
    });

    const overrideRes = await makeRequest(
      `/api/v1/erp/approvals/quorum/${emergencyQuorum._id}/emergency-override`,
      'POST',
      {
        reason: 'Critical raw material shortage; urgent clearance authorized by MD.',
      },
      { Authorization: `Bearer ${dir1Token}` }
    );

    assert(overrideRes.status === 200, `Emergency override executed by MD (HTTP 200)`);
    assert(overrideRes.body.data.isComplete === true, `Quorum marked complete via emergency override`);
    assert(overrideRes.body.data.emergencyOverride === true, `Emergency override metadata flagged as true`);
    assert(
      overrideRes.body.data.overrideReason?.includes('Critical raw material shortage'),
      `Override justification reason preserved`
    );

  } catch (error: any) {
    console.error('Unexpected error during verification:', error);
    assert(false, `Unexpected error: ${error.message}`);
  } finally {
    // Teardown test records
    console.log('\n--- Cleaning up test artifacts ---');
    await UserModel.deleteMany({ email: new RegExp(runId) });
    await RoleModel.deleteMany({ roleName: new RegExp(runId) });
    await WarehouseModel.deleteMany({ name: new RegExp(runId) });
    await CrmActivityModel.deleteMany({ contactMobile: '01711223344' });
    await ApprovalRequestModel.deleteMany({ documentRef: 'EXP-2026-0001' });
    await QuorumApprovalModel.deleteMany({ targetRef: new RegExp(runId) });
    await AuditLogModel.collection.drop().catch(() => {});

    server.close();
    await disconnectDatabase();

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runSystemAuxVerificationSuite();
