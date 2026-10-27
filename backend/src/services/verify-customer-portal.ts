import http from 'http';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { get, del } from '../config/redis';
import { OtpService } from './OtpService';
import { CustomerAuthService } from './CustomerAuthService';
import { UserModel } from '../models/User';
import { CustomerModel } from '../models/Customer';
import { VerificationLogModel } from '../models/VerificationLog';
import { AuditLogModel } from '../models/AuditLog';

async function runCustomerPortalTests() {
  console.log('=== STARTING CUSTOMER PORTAL & VERIFICATION LOG TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  const testMobile = '01712998877';

  // Start internal test server
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, () => resolve()));
  const port = (testServer.address() as any).port;

  function makeRequest(
    path: string,
    method: string,
    payload?: any,
    token?: string
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
    return new Promise((resolve, reject) => {
      const dataStr = payload ? JSON.stringify(payload) : '';
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (payload) {
        headers['Content-Length'] = Buffer.byteLength(dataStr);
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers,
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode || 0,
                headers: res.headers,
                body: raw ? JSON.parse(raw) : null,
              });
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.on('error', reject);
      if (payload) {
        req.write(dataStr);
      }
      req.end();
    });
  }

  try {
    await connectDatabase().catch(() => {});

    // Clean up test data
    await del([`otp:${testMobile}`, `otp_rate:${testMobile}`]);
    await UserModel.deleteMany({ mobile: testMobile });
    await CustomerModel.deleteMany({ mobile: testMobile });

    // Step 1: Send OTP
    console.log('--- 1. Send OTP & Trigger Customer Login ---');
    await OtpService.sendOtp(testMobile, 'CUSTOMER_LOGIN');

    // Step 2: Failed OTP attempt check
    console.log('\n--- 2. Failed OTP Logs Verification in VerificationLog ---');
    let failCaught = false;
    try {
      await CustomerAuthService.verifyAndAuthenticate({
        mobile: testMobile,
        otp: '000000',
        fullName: 'Test Customer',
      });
    } catch {
      failCaught = true;
    }
    assert(failCaught, 'Invalid OTP rejected by CustomerAuthService');

    const failedLog = await VerificationLogModel.findOne({
      mobile: testMobile,
      status: 'FAILED',
    });
    assert(Boolean(failedLog), 'VerificationLog recorded for FAILED OTP attempt');
    assert(failedLog?.verificationType === 'CUSTOMER_LOGIN', 'VerificationLog type is CUSTOMER_LOGIN');

    // Step 3: Success OTP login
    console.log('\n--- 3. Successful OTP Login & Profile Creation ---');
    const validOtp = await get<string | number>(`otp:${testMobile}`);
    assert(Boolean(validOtp), 'Valid OTP exists in Redis');

    const authRes = await CustomerAuthService.verifyAndAuthenticate({
      mobile: testMobile,
      otp: String(validOtp),
      fullName: 'Kamal Hossain',
      ipAddress: '192.168.1.10',
      userAgent: 'PostmanRuntime/7.36.0',
    });

    assert(Boolean(authRes.accessToken), 'Access token received');
    const token = authRes.accessToken;

    const successLog = await VerificationLogModel.findOne({
      mobile: testMobile,
      status: 'SUCCESS',
    });
    assert(Boolean(successLog), 'VerificationLog recorded for SUCCESSFUL OTP attempt');
    assert(successLog?.customerId?.toString() === authRes.customer._id, 'VerificationLog links to customerId');

    const auditEntry = await AuditLogModel.findOne({
      targetId: authRes.customer._id,
      action: 'CUSTOMER_PROFILE_LOGIN_VERIFIED',
    });
    assert(Boolean(auditEntry), 'AuditLog records CUSTOMER_PROFILE_LOGIN_VERIFIED action');

    // Step 4: GET /api/v1/portal/customer/profile
    console.log('\n--- 4. Customer Portal: GET /profile ---');
    const getProfileRes = await makeRequest('/api/v1/portal/customer/profile', 'GET', null, token);
    assert(getProfileRes.status === 200, 'GET /portal/customer/profile returns 200 OK');
    assert(getProfileRes.body.success === true, 'Profile response success: true');
    assert(getProfileRes.body.data.customer.fullName === 'Kamal Hossain', 'Profile contains customer fullName');
    assert(getProfileRes.body.data.customer.mobile === testMobile, 'Profile contains customer mobile');

    // Step 5: PUT /api/v1/portal/customer/profile
    console.log('\n--- 5. Customer Portal: PUT /profile (Update Profile) ---');
    const updateRes = await makeRequest(
      '/api/v1/portal/customer/profile',
      'PUT',
      {
        fullName: 'Kamal Uddin Hossain',
        email: 'kamal.hossain@example.com',
        billingAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
        shippingAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
        companyName: 'Kamal Diagnostic Center',
      },
      token
    );

    assert(updateRes.status === 200, 'PUT /portal/customer/profile returns 200 OK');
    assert(updateRes.body.data.customer.fullName === 'Kamal Uddin Hossain', 'Customer fullName updated');
    assert(updateRes.body.data.customer.companyName === 'Kamal Diagnostic Center', 'Customer companyName updated');
    assert(updateRes.body.data.customer.billingAddress.includes('Dhanmondi'), 'Billing address updated');

    const profileUpdateAudit = await AuditLogModel.findOne({
      targetId: authRes.customer._id,
      action: 'CUSTOMER_PROFILE_UPDATED',
    });
    assert(Boolean(profileUpdateAudit), 'AuditLog records CUSTOMER_PROFILE_UPDATED action');

    // Step 6: GET /api/v1/portal/customer/orders
    console.log('\n--- 6. Customer Portal: GET /orders ---');
    const getOrdersRes = await makeRequest('/api/v1/portal/customer/orders', 'GET', null, token);
    assert(getOrdersRes.status === 200, 'GET /portal/customer/orders returns 200 OK');
    assert(Array.isArray(getOrdersRes.body.data), 'Orders is an array');

    // Step 7: GET /api/v1/portal/customer/verification-logs
    console.log('\n--- 7. Customer Portal: GET /verification-logs ---');
    const getLogsRes = await makeRequest('/api/v1/portal/customer/verification-logs', 'GET', null, token);
    assert(getLogsRes.status === 200, 'GET /portal/customer/verification-logs returns 200 OK');
    assert(Array.isArray(getLogsRes.body.data), 'Verification logs is an array');
    assert(getLogsRes.body.data.length >= 1, 'Verification logs contains recorded login event');

    // Clean up
    await del([`otp:${testMobile}`, `otp_rate:${testMobile}`]);
    await UserModel.deleteMany({ mobile: testMobile });
    await CustomerModel.deleteMany({ mobile: testMobile });

  } finally {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
    await disconnectDatabase().catch(() => {});
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runCustomerPortalTests().catch((err) => {
  console.error('Customer portal tests failed:', err);
  process.exit(1);
});
