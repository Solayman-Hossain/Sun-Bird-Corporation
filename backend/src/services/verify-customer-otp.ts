import http from 'http';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { get, del } from '../config/redis';
import { OtpService } from './OtpService';
import { CustomerAuthService } from './CustomerAuthService';
import { UserModel } from '../models/User';
import { CustomerModel } from '../models/Customer';
import { RateLimitExceededError, ValidationError } from '../errors/AppError';

async function runCustomerOtpVerificationTests() {
  console.log('=== STARTING CUSTOMER SMS OTP & AUTHENTICATION TESTS ===\n');
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

  const testMobile = '01799887766';
  const testMobileRate = '01899112233';

  // Start internal test server for HTTP tests
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, () => resolve()));
  const port = (testServer.address() as any).port;

  function makeRequest(
    path: string,
    method: string,
    payload: any
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(payload);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataStr),
          },
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
      req.write(dataStr);
      req.end();
    });
  }

  try {
    await connectDatabase().catch(() => {});

    // Clean up residual keys
    await del([`otp:${testMobile}`, `otp_rate:${testMobile}`, `otp:${testMobileRate}`, `otp_rate:${testMobileRate}`]);
    await UserModel.deleteMany({ mobile: { $in: [testMobile, testMobileRate] } });
    await CustomerModel.deleteMany({ mobile: { $in: [testMobile, testMobileRate] } });

    // --- Section 1: OtpService Generation & Redis Storage ---
    console.log('--- 1. OTP Generation & Redis Storage ---');
    const sendRes = await OtpService.sendOtp(testMobile, 'LOGIN');
    assert(sendRes.mobile === testMobile, 'sendOtp returns normalized mobile');
    assert(sendRes.expiresInSeconds === 180, 'expiresInSeconds is 180');

    const storedOtp = await get<string | number>(`otp:${testMobile}`);
    assert(Boolean(storedOtp), 'OTP key exists in Redis');
    assert(String(storedOtp).length === 6, 'Generated OTP is exactly 6 digits');
    assert(/^\d{6}$/.test(String(storedOtp)), 'Generated OTP is numeric only');

    // --- Section 2: Rate Limiting Enforcement (Max 3 / Hour) ---
    console.log('\n--- 2. Hourly Rate Limiting Enforcement (Max 3 / Hour) ---');
    // Request 1 already occurred for testMobileRate if we use testMobileRate
    await OtpService.sendOtp(testMobileRate); // attempt 1
    await OtpService.sendOtp(testMobileRate); // attempt 2
    await OtpService.sendOtp(testMobileRate); // attempt 3

    let rateLimitCaught = false;
    try {
      await OtpService.sendOtp(testMobileRate); // attempt 4 -> should throw
    } catch (err: unknown) {
      if (err instanceof RateLimitExceededError) {
        rateLimitCaught = true;
        assert(err.statusCode === 429, 'Rate limit error has statusCode 429');
        assert(err.errorCode === 'RATE_LIMIT_EXCEEDED', 'Rate limit error has errorCode RATE_LIMIT_EXCEEDED');
      }
    }
    assert(rateLimitCaught, '4th OTP attempt within the hour is blocked by RateLimitExceededError');

    // --- Section 3: OTP Verification & Single-Use Replay Prevention ---
    console.log('\n--- 3. OTP Verification & Replay Prevention ---');
    const wrongVerify = await OtpService.verifyOtp(testMobile, '000000');
    assert(wrongVerify === false, 'Incorrect OTP returns false');

    const correctVerify = await OtpService.verifyOtp(testMobile, String(storedOtp));
    assert(correctVerify === true, 'Correct OTP returns true');

    // Key should be deleted immediately upon successful verification
    const replayVerify = await OtpService.verifyOtp(testMobile, String(storedOtp));
    assert(replayVerify === false, 'Replaying already-used OTP returns false (single-use guarantee)');

    // --- Section 4: CustomerAuthService & Shadow Record Creation ---
    console.log('\n--- 4. CustomerAuthService: User & Shadow Customer Persistence ---');
    // Generate fresh OTP
    await OtpService.sendOtp(testMobile);
    const freshOtp = await get<string | number>(`otp:${testMobile}`);

    // Verify invalid OTP handling
    let valCaught = false;
    try {
      await CustomerAuthService.verifyAndAuthenticate({
        mobile: testMobile,
        otp: '999999',
        fullName: 'Mahmudur Rahman',
      });
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        valCaught = true;
        assert(err.statusCode === 400, 'Invalid OTP throws ValidationError (400)');
      }
    }
    assert(valCaught, 'CustomerAuthService blocks invalid OTP with ValidationError');

    // Verify successful authentication
    const authResult = await CustomerAuthService.verifyAndAuthenticate({
      mobile: testMobile,
      otp: String(freshOtp),
      fullName: 'Mahmudur Rahman',
      ipAddress: '103.25.120.4',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    assert(Boolean(authResult.accessToken), 'Access token issued');
    assert(Boolean(authResult.refreshToken), 'Refresh token issued');
    assert(authResult.user.userType === 'CUSTOMER', 'User record userType is strictly CUSTOMER');
    assert(authResult.user.fullName === 'Mahmudur Rahman', 'User fullName persisted correctly');
    assert(authResult.customer.isGuest === false, 'Customer record has isGuest: false');
    assert(authResult.customer.customerType === 'RETAIL', 'Customer record customerType is RETAIL');

    // Verify records exist in MongoDB
    const userInDb = await UserModel.findOne({ mobile: testMobile });
    const custInDb = await CustomerModel.findOne({ mobile: testMobile });
    assert(Boolean(userInDb), 'User record persisted in MongoDB users collection');
    assert(userInDb?.userType === 'CUSTOMER', 'Database userType matches CUSTOMER');
    assert(Boolean(custInDb), 'Customer shadow record persisted in MongoDB customers collection');
    assert(custInDb?.isGuest === false, 'Database customer record isGuest is false');

    // --- Section 5: HTTP End-to-End API Integration ---
    console.log('\n--- 5. Express HTTP End-to-End API Integration ---');
    const httpTestMobile = '01912345678';
    await del([`otp:${httpTestMobile}`, `otp_rate:${httpTestMobile}`]);
    await UserModel.deleteMany({ mobile: httpTestMobile });
    await CustomerModel.deleteMany({ mobile: httpTestMobile });

    // Step 5.1: POST /api/v1/public/auth/send-otp
    const httpSend = await makeRequest('/api/v1/public/auth/send-otp', 'POST', {
      mobile: httpTestMobile,
      purpose: 'STOREFRONT_LOGIN',
    });
    assert(httpSend.status === 200, 'HTTP send-otp endpoint returns 200 OK');
    assert(httpSend.body.success === true, 'HTTP send-otp returns success: true');
    assert(httpSend.body.data.mobile === httpTestMobile, 'HTTP send-otp returns target mobile');

    const httpOtp = await get<string | number>(`otp:${httpTestMobile}`);
    assert(Boolean(httpOtp), 'HTTP send-otp created active OTP in Redis');

    // Step 5.2: POST /api/v1/public/auth/verify-otp
    const httpVerify = await makeRequest('/api/v1/public/auth/verify-otp', 'POST', {
      mobile: httpTestMobile,
      otp: String(httpOtp),
      fullName: 'Sumaiya Akter',
    });

    assert(httpVerify.status === 200, 'HTTP verify-otp returns 200 OK');
    assert(httpVerify.body.success === true, 'HTTP verify-otp returns success: true');
    assert(httpVerify.body.data.user.userType === 'CUSTOMER', 'HTTP response userType is CUSTOMER');
    assert(httpVerify.body.data.user.fullName === 'Sumaiya Akter', 'HTTP response fullName is Sumaiya Akter');
    assert(Boolean(httpVerify.body.data.accessToken), 'HTTP response includes JWT accessToken');

    // Verify Set-Cookie header contains HttpOnly refresh token
    const cookies = httpVerify.headers['set-cookie'];
    assert(Array.isArray(cookies) && cookies.some((c) => c.includes('refreshToken=') && c.includes('HttpOnly')), 'Set-Cookie header includes HttpOnly refreshToken cookie');

    // Clean up
    await del([`otp:${httpTestMobile}`, `otp_rate:${httpTestMobile}`]);
    await UserModel.deleteMany({ mobile: { $in: [testMobile, testMobileRate, httpTestMobile] } });
    await CustomerModel.deleteMany({ mobile: { $in: [testMobile, testMobileRate, httpTestMobile] } });

  } finally {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
    await disconnectDatabase().catch(() => {});
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runCustomerOtpVerificationTests().catch((err) => {
  console.error('Customer OTP verification failed:', err);
  process.exit(1);
});
