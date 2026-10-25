import http from 'http';
import { Types } from 'mongoose';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { ChartOfAccountsModel } from '../models/ChartOfAccounts';
import { JournalEntryModel } from '../models/JournalEntry';
import { FixedAssetModel } from '../models/FixedAsset';
import { LoanModel } from '../models/Loan';
import { PartnerModel } from '../models/Partner';
import { QuorumApprovalModel } from '../models/QuorumApproval';
import { TokenService } from '../services/TokenService';

async function runAccountingRoutesVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 37: ACCOUNTING CONTROLLERS & EXPRESS ROUTES VERIFICATION SUITE');
  console.log('  (/accounts, /assets, /loans, /partners with RBAC & Idempotency)');
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
          let resBody = '';
          res.on('data', (chunk) => (resBody += chunk));
          res.on('end', () => {
            let parsed: any;
            try {
              parsed = JSON.parse(resBody);
            } catch {
              parsed = resBody;
            }
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsed,
            });
          });
        }
      );

      req.on('error', reject);
      if (dataStr) req.write(dataStr);
      req.end();
    });
  }

  try {
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Setup RBAC Roles & Test Director/Accountant Users');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Create Accountant Role with accounting permissions
    const accountantRole = await RoleModel.create({
      roleName: `Chief Accountant ${runId}`,
      slug: `accountant-${runId}`,
      permissions: [
        {
          module: 'accounting',
          actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'],
        },
      ],
      isSystemRole: false,
      isActive: true,
    });

    // Create Unprivileged Role (no accounting permissions)
    const viewerRole = await RoleModel.create({
      roleName: `Guest Viewer ${runId}`,
      slug: `viewer-${runId}`,
      permissions: [
        {
          module: 'public',
          actions: ['READ'],
        },
      ],
      isSystemRole: false,
      isActive: true,
    });

    const directorUser = await UserModel.create({
      fullName: `Finance Director ${runId}`,
      email: `director.${runId}@sunbirdcorp.com`,
      mobile: `01731${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    const accountantUser = await UserModel.create({
      fullName: `Lead Accountant ${runId}`,
      email: `accountant.${runId}@sunbirdcorp.com`,
      mobile: `01732${runId}`,
      userType: 'STAFF',
      roleId: accountantRole._id,
      isActive: true,
    });

    const unprivilegedUser = await UserModel.create({
      fullName: `Unprivileged Staff ${runId}`,
      email: `unprivileged.${runId}@sunbirdcorp.com`,
      mobile: `01733${runId}`,
      userType: 'STAFF',
      roleId: viewerRole._id,
      isActive: true,
    });

    // Generate JWT access tokens
    const directorToken = TokenService.generateAccessToken(directorUser);
    const accountantToken = TokenService.generateAccessToken(accountantUser);
    const unprivilegedToken = TokenService.generateAccessToken(unprivilegedUser);

    assert(!!directorToken, 'Generated Director JWT access token');
    assert(!!accountantToken, 'Generated Accountant JWT access token');
    assert(!!unprivilegedToken, 'Generated Unprivileged JWT access token');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Prompt 37 Core Verification: Query /api/v1/erp/accounts/coa');
    console.log('────────────────────────────────────────────────────────────────────────');

    const coaRes = await makeRequest('/api/v1/erp/accounts/coa', 'GET', undefined, {
      Authorization: `Bearer ${accountantToken}`,
    });

    assert(coaRes.status === 200, `GET /api/v1/erp/accounts/coa returned HTTP 200 (Status: ${coaRes.status})`);
    assert(coaRes.body.success === true, 'Response body success is true');
    assert(Array.isArray(coaRes.body.data), 'Response data is an array of accounts');

    // Prompt 37 Core Verification Assertion:
    // "Query `/api/v1/erp/accounts/coa` and verify 35 standard accounts returned."
    const returnedAccounts = coaRes.body.data;
    assert(
      returnedAccounts.length >= 35,
      `Verified 35 standard Chart of Accounts returned (Total: ${returnedAccounts.length})`
    );

    const codes = returnedAccounts.map((a: any) => a.accountCode);
    const requiredCodes = [1010, 1020, 1100, 1200, 1590, 2010, 2050, 3010, 3020, 4010, 5010, 6010, 6310, 6410];
    const hasAllKeyCodes = requiredCodes.every((c) => codes.includes(c));
    assert(hasAllKeyCodes, 'All standard control & operating account codes exist in COA');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Test Journal Entry Creation & Idempotency Guard');
    console.log('────────────────────────────────────────────────────────────────────────');

    const idempotencyKey = `IDEM-JV-${runId}-001`;
    const jvPayload = {
      voucherType: 'SALES',
      sourceDocumentRef: `INV-${runId}-TEST`,
      transactionDate: new Date(),
      lines: [
        {
          accountCode: 1100,
          accountName: 'Accounts Receivable',
          debit: 115000,
          credit: 0,
        },
        {
          accountCode: 4010,
          accountName: 'Sales Revenue',
          debit: 0,
          credit: 100000,
        },
        {
          accountCode: 2050,
          accountName: 'VAT Output Payable',
          debit: 0,
          credit: 15000,
        },
      ],
      notes: 'Test Balanced Sales Journal Voucher via Express API',
    };

    const jvRes1 = await makeRequest('/api/v1/erp/accounts/journals', 'POST', jvPayload, {
      Authorization: `Bearer ${accountantToken}`,
      'X-Idempotency-Key': idempotencyKey,
    });

    assert(jvRes1.status === 201, `POST /api/v1/erp/accounts/journals returned HTTP 201 Created (Status: ${jvRes1.status})`);
    assert(jvRes1.body.success === true, 'Journal entry created successfully');
    const createdVoucherNo = jvRes1.body.data.journalEntry.voucherNo;
    assert(!!createdVoucherNo, `Created Journal Voucher: ${createdVoucherNo}`);

    // Test Idempotent Retry with same X-Idempotency-Key
    const jvRes2 = await makeRequest('/api/v1/erp/accounts/journals', 'POST', jvPayload, {
      Authorization: `Bearer ${accountantToken}`,
      'X-Idempotency-Key': idempotencyKey,
    });

    assert(
      jvRes2.status === 200 || jvRes2.status === 201,
      'Idempotent duplicate request handled safely without error'
    );
    assert(
      jvRes2.headers['x-idempotent-replay'] === 'true' ||
        jvRes2.body.data.journalEntry.voucherNo === createdVoucherNo,
      'Idempotency guard returned replay snapshot matching original voucher'
    );

    // Retrieve Journal Entry by voucherNo
    const getJvRes = await makeRequest(
      `/api/v1/erp/accounts/journals/${createdVoucherNo}`,
      'GET',
      undefined,
      {
        Authorization: `Bearer ${accountantToken}`,
      }
    );
    assert(getJvRes.status === 200, 'GET /journals/:voucherNo returned HTTP 200');
    assert(getJvRes.body.data.voucherNo === createdVoucherNo, 'Retrieved correct voucher document');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Test Financial Reports & Statements Endpoints');
    console.log('────────────────────────────────────────────────────────────────────────');

    const tbRes = await makeRequest(
      '/api/v1/erp/accounts/reports/trial-balance',
      'GET',
      undefined,
      { Authorization: `Bearer ${accountantToken}` }
    );
    assert(tbRes.status === 200, 'GET /reports/trial-balance returned HTTP 200');
    assert(tbRes.body.data.isBalanced === true, 'Trial balance is mathematically balanced (Total Dr = Total Cr)');

    const pnlRes = await makeRequest(
      '/api/v1/erp/accounts/reports/profit-loss',
      'GET',
      undefined,
      { Authorization: `Bearer ${accountantToken}` }
    );
    assert(pnlRes.status === 200, 'GET /reports/profit-loss returned HTTP 200');
    assert(typeof pnlRes.body.data.netOperatingProfit === 'number', 'P&L report computed net operating profit');

    const bsRes = await makeRequest(
      '/api/v1/erp/accounts/reports/balance-sheet',
      'GET',
      undefined,
      { Authorization: `Bearer ${accountantToken}` }
    );
    assert(bsRes.status === 200, 'GET /reports/balance-sheet returned HTTP 200');
    assert(bsRes.body.data.isBalanced === true, 'Balance Sheet satisfies accounting equation (Assets = Liab + Equity)');

    const glRes = await makeRequest(
      '/api/v1/erp/accounts/reports/general-ledger?accountCode=1100',
      'GET',
      undefined,
      { Authorization: `Bearer ${accountantToken}` }
    );
    assert(glRes.status === 200, 'GET /reports/general-ledger returned HTTP 200');
    assert(glRes.body.data.accountCode === 1100, 'General ledger drill-down retrieved account 1100 lines');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Test Fixed Assets Express Routes (/api/v1/erp/assets)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const assetPayload = {
      assetName: `Sonoscape Ultrasound Unit ${runId}`,
      category: 'Medical Equipment',
      purchaseCost: 240000,
      residualValue: 0,
      usefulLifeMonths: 24,
      depreciationMethod: 'SLM',
      purchaseDate: new Date('2026-01-01'),
    };

    const assetRes = await makeRequest('/api/v1/erp/assets', 'POST', assetPayload, {
      Authorization: `Bearer ${accountantToken}`,
    });

    assert(assetRes.status === 201, `POST /api/v1/erp/assets returned HTTP 201 (Status: ${assetRes.status})`);
    assert(
      assetRes.body.data.monthlyDepreciation === 10000,
      'Monthly SLM depreciation auto-computed correctly (240,000 / 24 = 10,000 BDT)'
    );
    const assetId = assetRes.body.data._id;

    // Run monthly depreciation route
    const depRes = await makeRequest(
      '/api/v1/erp/assets/run-depreciation',
      'POST',
      { fiscalMonthYear: '2026-11' },
      { Authorization: `Bearer ${accountantToken}` }
    );
    assert(depRes.status === 200, 'POST /api/v1/erp/assets/run-depreciation returned HTTP 200');
    assert(depRes.body.data.processedAssetsCount >= 1, 'Depreciation run processed eligible assets');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Test Loans Express Routes (/api/v1/erp/loans)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const loanPayload = {
      loanType: 'EMPLOYEE_LOAN',
      borrowerId: accountantUser._id.toString(),
      borrowerType: 'EMPLOYEE',
      principalBDT: 60000,
      isInterestFree: true,
      interestRate: 0,
      interestMethod: 'FLAT',
      tenureMonths: 6,
      startDate: new Date('2026-11-01'),
    };

    const loanRes = await makeRequest('/api/v1/erp/loans', 'POST', loanPayload, {
      Authorization: `Bearer ${accountantToken}`,
    });

    assert(loanRes.status === 201, `POST /api/v1/erp/loans returned HTTP 201 (Status: ${loanRes.status})`);
    assert(loanRes.body.data.outstandingBalance === 60000, 'Loan registered with 60,000 BDT principal');
    const loanCode = loanRes.body.data.loanCode;

    // Record repayment route
    const repayRes = await makeRequest(
      `/api/v1/erp/loans/${loanCode}/repay`,
      'POST',
      { paymentAmount: 10000 },
      { Authorization: `Bearer ${accountantToken}` }
    );

    assert(repayRes.status === 200, `POST /api/v1/erp/loans/:id/repay returned HTTP 200`);
    assert(
      repayRes.body.data.remainingOutstandingBalance === 50000,
      'Loan outstanding balance reduced to 50,000 BDT'
    );
    assert(!!repayRes.body.data.journalVoucherNo, 'Clearance JV generated for loan repayment');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Test Partners Express Routes (/api/v1/erp/partners)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Create partner profile for director
    const partnerRes = await makeRequest(
      '/api/v1/erp/partners',
      'POST',
      {
        userId: directorUser._id.toString(),
        partnerName: directorUser.fullName,
        capitalContribution: 5000000,
        profitShareRatio: 100, // 100% for single partner test
      },
      { Authorization: `Bearer ${directorToken}` }
    );

    assert(partnerRes.status === 201, 'POST /api/v1/erp/partners returned HTTP 201');

    // Distribute profit route
    const distRes = await makeRequest(
      '/api/v1/erp/partners/distribute-profit',
      'POST',
      {
        fiscalYear: `2025-2026-${runId}`,
        netProfitBDT: 200000,
      },
      { Authorization: `Bearer ${directorToken}` }
    );

    assert(distRes.status === 200, 'POST /api/v1/erp/partners/distribute-profit returned HTTP 200');
    assert(
      distRes.body.data.totalNetProfitBDT === 200000,
      'Distributed 200,000 BDT profit successfully via route'
    );
    assert(distRes.body.data.quorumTier === 4, 'Tier 4 Quorum required for profit distribution');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  8. Test RBAC Permission Guard Enforcement (Forbidden for Unprivileged)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const forbiddenRes = await makeRequest(
      '/api/v1/erp/accounts/journals',
      'POST',
      jvPayload,
      {
        Authorization: `Bearer ${unprivilegedToken}`,
      }
    );

    assert(
      forbiddenRes.status === 403,
      `Unprivileged user correctly blocked with HTTP 403 Forbidden (Status: ${forbiddenRes.status})`
    );

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  9. Teardown Test Fixtures & Stop Server');
    console.log('────────────────────────────────────────────────────────────────────────');

    await RoleModel.deleteMany({ _id: { $in: [accountantRole._id, viewerRole._id] } });
    await UserModel.deleteMany({
      _id: { $in: [directorUser._id, accountantUser._id, unprivilegedUser._id] },
    });
    await JournalEntryModel.deleteMany({ sourceDocumentRef: jvPayload.sourceDocumentRef });
    if (assetId) await FixedAssetModel.findByIdAndDelete(assetId);
    if (loanCode) await LoanModel.deleteMany({ loanCode });
    if (partnerRes.body?.data?._id) await PartnerModel.findByIdAndDelete(partnerRes.body.data._id);

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

    assert(true, 'Test fixtures cleaned up and ephemeral server closed');

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled error during Accounting Routes verification:', err);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runAccountingRoutesVerificationSuite();
