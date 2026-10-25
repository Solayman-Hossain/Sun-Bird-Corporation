import http from 'http';
import bcrypt from 'bcryptjs';
import { generateSecret, generateSync } from 'otplib';
import { Types } from 'mongoose';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { RefreshTokenModel } from '../models/RefreshToken';
import { TokenService } from '../services/TokenService';

async function runAuthControllersVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 10: AUTH & USER/ROLE MANAGEMENT VERIFICATION SUITE');
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

  // Start internal Express HTTP test server on ephemeral port
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, () => resolve()));
  const port = (testServer.address() as any).port;

  function makeRequest(
    path: string,
    method: string,
    payload?: any,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
    return new Promise((resolve, reject) => {
      const dataStr = payload !== undefined ? JSON.stringify(payload) : '';
      const requestHeaders: Record<string, string> = {
        ...headers,
      };

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
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode || 0,
                headers: res.headers,
                body: raw ? JSON.parse(raw) : null,
              });
            } catch {
              resolve({
                status: res.statusCode || 0,
                headers: res.headers,
                body: raw,
              });
            }
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
    await connectDatabase().catch(() => {});

    // Clean up test records
    const testAdminEmail = 'test.admin.prompt10@sunbirdcorp.com';
    const testStaffEmail = 'test.staff.prompt10@sunbirdcorp.com';
    const testDirectorEmail = 'test.director.prompt10@sunbirdcorp.com';

    await UserModel.deleteMany({
      email: { $in: [testAdminEmail, testStaffEmail, testDirectorEmail] },
    });
    await RoleModel.deleteMany({
      slug: { $in: ['test_admin_role', 'test_staff_role', 'test_new_role'] },
    });

    // 1. Seed Roles
    const adminRole = await RoleModel.create({
      roleName: 'Test Admin Role',
      slug: 'test_admin_role',
      permissions: [
        { module: 'users', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
        { module: 'roles', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
      ],
      isActive: true,
    });

    const staffRole = await RoleModel.create({
      roleName: 'Test Staff Role',
      slug: 'test_staff_role',
      permissions: [
        { module: 'INVENTORY', actions: ['READ'] },
      ],
      isActive: true,
    });

    // 2. Seed Users
    const staffPassword = 'StaffPassword123#';
    const staffPasswordHash = await bcrypt.hash(staffPassword, 10);
    const staffUser = await UserModel.create({
      fullName: 'Kamal Hossain',
      email: testStaffEmail,
      mobile: '01711' + Math.floor(100000 + Math.random() * 900000),
      passwordHash: staffPasswordHash,
      userType: 'STAFF',
      roleId: staffRole._id,
      isActive: true,
    });

    const adminPassword = 'AdminPassword123#';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const adminUser = await UserModel.create({
      fullName: 'Super Administrator',
      email: testAdminEmail,
      mobile: '01811' + Math.floor(100000 + Math.random() * 900000),
      passwordHash: adminPasswordHash,
      userType: 'SUPER_ADMIN',
      roleId: adminRole._id,
      isActive: true,
    });

    const directorTotpSecret = generateSecret({ length: 20 });
    const directorPassword = 'DirectorPassword123#';
    const directorPasswordHash = await bcrypt.hash(directorPassword, 10);
    const directorUser = await UserModel.create({
      fullName: 'Dr. Farhana Yasmin',
      email: testDirectorEmail,
      mobile: '01911' + Math.floor(100000 + Math.random() * 900000),
      passwordHash: directorPasswordHash,
      totpSecret: directorTotpSecret,
      hardwareFingerprint: 'hw-fingerprint-director-macbook-pro',
      userType: 'DIRECTOR',
      isActive: true,
    });

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  TEST GROUP 1: ERP Staff Login & Token Issuance');
    console.log('────────────────────────────────────────────────────────────────────────');

    // TC-01: Invalid password -> 401
    const invalidLoginRes = await makeRequest('/api/v1/erp/auth/login', 'POST', {
      email: testStaffEmail,
      password: 'WrongPassword!',
    });
    assert(invalidLoginRes.status === 401, 'TC-01: Invalid password returns 401 Unauthorized');
    assert(invalidLoginRes.body.error?.code === 'AUTH_UNAUTHORIZED', 'TC-01: Error code is AUTH_UNAUTHORIZED');

    // TC-02: Valid staff credentials -> 200 OK + access token + refresh cookie
    const staffLoginRes = await makeRequest('/api/v1/erp/auth/login', 'POST', {
      email: testStaffEmail,
      password: staffPassword,
    });
    assert(staffLoginRes.status === 200, 'TC-02: Valid staff login returns 200 OK');
    assert(staffLoginRes.body.success === true, 'TC-02: Response success is true');
    assert(Boolean(staffLoginRes.body.data?.accessToken), 'TC-02: Response includes JWT accessToken');
    assert(staffLoginRes.body.data?.user?.email === testStaffEmail, 'TC-02: User profile email matches');
    assert(staffLoginRes.body.data?.user?.role?.roleName === 'Test Staff Role', 'TC-02: User role populated');

    // Check Set-Cookie header for HttpOnly refresh cookie
    const setCookieHeader = staffLoginRes.headers['set-cookie'];
    assert(Boolean(setCookieHeader && setCookieHeader.length > 0), 'TC-02: Response includes Set-Cookie header');
    const refreshCookieStr = setCookieHeader ? setCookieHeader[0] : '';
    assert(refreshCookieStr.includes('refreshToken='), 'TC-02: Set-Cookie contains refreshToken');
    assert(refreshCookieStr.toLowerCase().includes('httponly'), 'TC-02: Cookie has HttpOnly flag');
    assert(refreshCookieStr.includes('Path=/api/v1/auth'), 'TC-02: Cookie specifies Path=/api/v1/auth');

    // Extract raw token from cookie string
    const match = refreshCookieStr.match(/refreshToken=([^;]+)/);
    const rawRefreshToken = match ? match[1] : '';
    assert(Boolean(rawRefreshToken && rawRefreshToken.length > 30), 'TC-02: Successfully extracted raw refresh token');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  TEST GROUP 2: Token Refresh Flow (/refresh-token)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // TC-03: Call /refresh-token with empty request -> 401
    const emptyRefreshRes = await makeRequest('/api/v1/auth/refresh-token', 'POST', {});
    assert(emptyRefreshRes.status === 401, 'TC-03: Refresh without token returns 401');

    // TC-04: Call /api/v1/auth/refresh-token with valid Cookie -> 200 OK + new accessToken
    const cookieRefreshRes = await makeRequest(
      '/api/v1/auth/refresh-token',
      'POST',
      {},
      { Cookie: `refreshToken=${rawRefreshToken}` }
    );
    assert(cookieRefreshRes.status === 200, 'TC-04: Call /refresh-token with cookie returns 200 OK');
    const decodedToken = TokenService.verifyAccessToken(cookieRefreshRes.body.data?.accessToken);
    assert(decodedToken.sub === staffUser._id.toString(), 'TC-04: New accessToken encodes valid staff identity');

    // Extract rotated refresh token from new cookie
    const rotatedSetCookie = cookieRefreshRes.headers['set-cookie'];
    const rotatedMatch = rotatedSetCookie ? rotatedSetCookie[0].match(/refreshToken=([^;]+)/) : null;
    const rotatedRefreshToken = rotatedMatch ? rotatedMatch[1] : '';
    assert(Boolean(rotatedRefreshToken && rotatedRefreshToken !== rawRefreshToken), 'TC-04: Rotated refresh token is newly issued');

    // TC-05: ERP route /api/v1/erp/auth/refresh-token also works with request body
    const bodyRefreshRes = await makeRequest(
      '/api/v1/erp/auth/refresh-token',
      'POST',
      { refreshToken: rotatedRefreshToken }
    );
    assert(bodyRefreshRes.status === 200, 'TC-05: /api/v1/erp/auth/refresh-token with body returns 200 OK');

    // TC-06: Replaying the old (now revoked) refresh token triggers reuse detection
    const replayRes = await makeRequest(
      '/api/v1/auth/refresh-token',
      'POST',
      {},
      { Cookie: `refreshToken=${rawRefreshToken}` }
    );
    assert(replayRes.status === 401, 'TC-06: Replaying revoked token is rejected with 401 (breach detection)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  TEST GROUP 3: Director MFA & Hardware Binding');
    console.log('────────────────────────────────────────────────────────────────────────');

    // TC-07: Director login without TOTP -> returns mfaRequired: true
    const directorNoMfaRes = await makeRequest('/api/v1/erp/auth/login', 'POST', {
      email: testDirectorEmail,
      password: directorPassword,
    });
    assert(directorNoMfaRes.status === 200, 'TC-07: Director login without TOTP returns 200 status');
    assert(directorNoMfaRes.body.data?.mfaRequired === true, 'TC-07: Response specifies mfaRequired: true');

    // TC-08: Director login with invalid TOTP -> 401
    const directorBadTotpRes = await makeRequest('/api/v1/erp/auth/login', 'POST', {
      email: testDirectorEmail,
      password: directorPassword,
      totpCode: '000000',
      hardwareFingerprint: 'hw-fingerprint-director-macbook-pro',
    });
    assert(directorBadTotpRes.status === 401, 'TC-08: Director login with invalid TOTP returns 401');

    // TC-08b: Director login with invalid hardware fingerprint -> 403 Forbidden
    const validTotp = generateSync({ secret: directorTotpSecret });
    const directorBadHwRes = await makeRequest('/api/v1/erp/auth/login', 'POST', {
      email: testDirectorEmail,
      password: directorPassword,
      totpCode: validTotp,
      hardwareFingerprint: 'unrecognized-hacker-device',
    });
    assert(directorBadHwRes.status === 403, 'TC-08b: Director login with wrong hardware fingerprint returns 403');

    // TC-09: Director login with valid TOTP & hardware fingerprint -> 200 OK
    const directorSuccessRes = await makeRequest('/api/v1/erp/auth/login', 'POST', {
      email: testDirectorEmail,
      password: directorPassword,
      totpCode: validTotp,
      hardwareFingerprint: 'hw-fingerprint-director-macbook-pro',
    });
    assert(directorSuccessRes.status === 200, 'TC-09: Director login with valid TOTP + device fingerprint returns 200 OK');
    assert(Boolean(directorSuccessRes.body.data?.accessToken), 'TC-09: Director receives accessToken');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  TEST GROUP 4: User Management (CRUD) via /api/v1/erp/users');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Admin access token
    const adminAccessToken = TokenService.generateAccessToken(adminUser);
    const staffAccessToken = TokenService.generateAccessToken(staffUser);
    const adminAuthHeader = { Authorization: `Bearer ${adminAccessToken}` };
    const staffAuthHeader = { Authorization: `Bearer ${staffAccessToken}` };

    // TC-10: List users without auth -> 401
    const unauthListRes = await makeRequest('/api/v1/erp/users', 'GET');
    assert(unauthListRes.status === 401, 'TC-10: Unauthenticated GET /users returns 401');

    // TC-11: List users with Admin auth -> 200 OK
    const adminListRes = await makeRequest('/api/v1/erp/users', 'GET', undefined, adminAuthHeader);
    assert(adminListRes.status === 200, 'TC-11: Admin GET /users returns 200 OK');
    assert(Array.isArray(adminListRes.body.data), 'TC-11: Response data is array of users');
    assert(Boolean(adminListRes.body.meta?.total), 'TC-11: Response includes pagination meta');

    // TC-12: Staff without users:CREATE permission tries to create user -> 403 Forbidden
    const forbiddenCreateRes = await makeRequest(
      '/api/v1/erp/users',
      'POST',
      {
        fullName: 'New Sales Rep',
        email: 'sales.rep@sunbirdcorp.com',
        mobile: '01722334455',
        password: 'Password123#',
        userType: 'STAFF',
      },
      staffAuthHeader
    );
    assert(forbiddenCreateRes.status === 403, 'TC-12: Staff lacking users:CREATE receives 403 Forbidden');

    // TC-13: Admin creates new user with Zod validation -> 201 Created
    const newUserMobile = '01733' + Math.floor(100000 + Math.random() * 900000);
    const createRes = await makeRequest(
      '/api/v1/erp/users',
      'POST',
      {
        fullName: 'Tanvir Hasan',
        email: 'tanvir.test@sunbirdcorp.com',
        mobile: newUserMobile,
        password: 'InitialStaffPassword#2026',
        userType: 'STAFF',
      },
      adminAuthHeader
    );
    assert(createRes.status === 201, 'TC-13: Admin POST /users returns 201 Created');
    assert(createRes.body.data?.fullName === 'Tanvir Hasan', 'TC-13: Created user fullName matches');
    const createdUserId = createRes.body.data?._id;

    // TC-14: Get user by ID -> 200 OK
    const getRes = await makeRequest(
      `/api/v1/erp/users/${createdUserId}`,
      'GET',
      undefined,
      adminAuthHeader
    );
    assert(getRes.status === 200, 'TC-14: GET /users/:id returns 200 OK');
    assert(getRes.body.data?._id === createdUserId, 'TC-14: Retrieved user ID matches');

    // TC-15: Update user -> 200 OK
    const updateRes = await makeRequest(
      `/api/v1/erp/users/${createdUserId}`,
      'PUT',
      { fullName: 'Tanvir Hasan Updated' },
      adminAuthHeader
    );
    assert(updateRes.status === 200, 'TC-15: PUT /users/:id returns 200 OK');
    assert(updateRes.body.data?.fullName === 'Tanvir Hasan Updated', 'TC-15: Updated fullName reflected');

    // TC-16: Deactivate user -> 200 OK
    const deactivateRes = await makeRequest(
      `/api/v1/erp/users/${createdUserId}`,
      'DELETE',
      undefined,
      adminAuthHeader
    );
    assert(deactivateRes.status === 200, 'TC-16: DELETE /users/:id returns 200 OK');

    // Verify user is inactive in DB
    const checkInactive = await UserModel.findById(createdUserId);
    assert(checkInactive?.isActive === false, 'TC-16: User is marked isActive: false in database');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  TEST GROUP 5: Role Management (CRUD) via /api/v1/erp/roles');
    console.log('────────────────────────────────────────────────────────────────────────');

    // TC-17: Admin lists roles -> 200 OK
    const listRolesRes = await makeRequest('/api/v1/erp/roles', 'GET', undefined, adminAuthHeader);
    assert(listRolesRes.status === 200, 'TC-17: GET /roles returns 200 OK');
    assert(Array.isArray(listRolesRes.body.data), 'TC-17: Response contains roles array');

    // TC-18: Admin creates role with Zod validation -> 201 Created
    const createRoleRes = await makeRequest(
      '/api/v1/erp/roles',
      'POST',
      {
        roleName: 'Showroom POS Cashier Test',
        slug: 'pos_cashier_test',
        description: 'Showroom billing, walk-in sales',
        permissions: [
          { module: 'INVENTORY', actions: ['READ'] },
          { module: 'SALES', actions: ['CREATE', 'READ', 'UPDATE'] },
        ],
      },
      adminAuthHeader
    );
    assert(createRoleRes.status === 201, 'TC-18: POST /roles returns 201 Created');
    assert(createRoleRes.body.data?.slug === 'pos_cashier_test', 'TC-18: Role slug matches');
    const createdRoleId = createRoleRes.body.data?._id;

    // TC-19: Admin updates role -> 200 OK
    const updateRoleRes = await makeRequest(
      `/api/v1/erp/roles/${createdRoleId}`,
      'PUT',
      { description: 'Updated POS cashier description' },
      adminAuthHeader
    );
    assert(updateRoleRes.status === 200, 'TC-19: PUT /roles/:id returns 200 OK');
    assert(updateRoleRes.body.data?.description === 'Updated POS cashier description', 'TC-19: Updated description reflected');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  TEST GROUP 6: MFA Setup & Verification');
    console.log('────────────────────────────────────────────────────────────────────────');

    // TC-20: Setup MFA -> returns secret & otpAuthUrl
    const setupMfaRes = await makeRequest(
      '/api/v1/erp/auth/setup-mfa',
      'POST',
      {},
      adminAuthHeader
    );
    assert(setupMfaRes.status === 200, 'TC-20: POST /erp/auth/setup-mfa returns 200 OK');
    assert(Boolean(setupMfaRes.body.data?.secret), 'TC-20: Returns TOTP secret');
    assert(Boolean(setupMfaRes.body.data?.otpAuthUrl), 'TC-20: Returns otpAuthUrl');

    const generatedMfaSecret = setupMfaRes.body.data?.secret;
    const testTotpCode = generateSync({ secret: generatedMfaSecret });

    // TC-21: Verify MFA with valid code -> 200 OK
    const verifyMfaRes = await makeRequest(
      '/api/v1/erp/auth/verify-mfa',
      'POST',
      { totpCode: testTotpCode },
      adminAuthHeader
    );
    assert(verifyMfaRes.status === 200, 'TC-21: POST /erp/auth/verify-mfa returns 200 OK');
    assert(verifyMfaRes.body.success === true, 'TC-21: MFA enabled successfully');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  TEST GROUP 7: User Logout & Session Revocation');
    console.log('────────────────────────────────────────────────────────────────────────');

    // TC-22: Logout clears refresh cookie and revokes token
    const logoutRes = await makeRequest(
      '/api/v1/auth/logout',
      'POST',
      {},
      adminAuthHeader
    );
    assert(logoutRes.status === 200, 'TC-22: POST /auth/logout returns 200 OK');
    const logoutCookies = logoutRes.headers['set-cookie'];
    assert(Boolean(logoutCookies), 'TC-22: Logout sets cookie expiration in response');

    // Cleanup created test records
    await UserModel.deleteMany({
      email: {
        $in: [
          testAdminEmail,
          testStaffEmail,
          testDirectorEmail,
          'tanvir.test@sunbirdcorp.com',
        ],
      },
    });
    await RoleModel.deleteMany({
      slug: {
        $in: [
          'test_admin_role',
          'test_staff_role',
          'test_new_role',
          'pos_cashier_test',
        ],
      },
    });

  } catch (error) {
    console.error('Unexpected test execution fault:', error);
    failed++;
  } finally {
    testServer.close();
    await disconnectDatabase().catch(() => {});
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthControllersVerificationSuite();
