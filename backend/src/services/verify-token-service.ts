import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { TokenService } from './TokenService';
import { UserModel, IUser } from '../models/User';
import { RefreshTokenModel } from '../models/RefreshToken';
import { UnauthorizedError } from '../errors/AppError';

async function runTokenServiceTests() {
  console.log('=== STARTING TOKEN SERVICE & REFRESH TOKEN ROTATION TESTS ===\n');
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

  try {
    await connectDatabase().catch(() => { });

    // Create a mock/real test user in MongoDB
    const testUserId = new Types.ObjectId();
    const testRoleId = new Types.ObjectId();
    const testBranchId = new Types.ObjectId();

    // Clean up any residual test records
    await UserModel.deleteMany({ email: 'test.director@sunbirdcorp.com' });
    await RefreshTokenModel.deleteMany({ userId: testUserId });

    const testUser = await UserModel.create({
      _id: testUserId,
      fullName: 'Dr. Asaduzzaman Khan',
      email: 'test.director@sunbirdcorp.com',
      mobile: '01700' + Math.floor(100000 + Math.random() * 900000),
      userType: 'DIRECTOR',
      roleId: testRoleId,
      branchId: testBranchId,
      isActive: true,
    });

    // --- Test 1: Access Token Generation & Payload Structure ---
    console.log('--- 1. Access Token Generation & Claims Verification ---');
    const accessToken = TokenService.generateAccessToken(testUser);
    assert(typeof accessToken === 'string' && accessToken.length > 50, 'AccessToken is valid non-empty JWT string');

    const decoded = TokenService.verifyAccessToken(accessToken);
    assert(decoded.sub === testUser._id.toString(), 'Payload sub matches user._id');
    assert(decoded.userType === 'DIRECTOR', 'Payload userType is DIRECTOR');
    assert(decoded.roleId === testRoleId.toString(), 'Payload roleId matches testRoleId');
    assert(decoded.branchId === testBranchId.toString(), 'Payload branchId matches testBranchId');

    const tokenLifespanSeconds = (decoded.exp || 0) - (decoded.iat || 0);
    assert(tokenLifespanSeconds === 15 * 60, 'AccessToken lifespan is strictly 15 minutes (900 seconds)');

    // --- Test 2: Refresh Token Generation & Database Persistence ---
    console.log('\n--- 2. Refresh Token Generation & SHA-256 Storage ---');
    const rawRefreshToken = await TokenService.generateRefreshToken(
      testUser,
      '192.168.1.100',
      'SunBird-ERP-Web/1.0'
    );

    assert(
      typeof rawRefreshToken === 'string' && rawRefreshToken.length === 128,
      'Raw refresh token is cryptographically random 64-byte hex string (128 characters)'
    );

    const tokenHash = TokenService.hashToken(rawRefreshToken);
    const dbToken = await RefreshTokenModel.findOne({ tokenHash });
    assert(Boolean(dbToken), 'Refresh token document found in MongoDB by SHA-256 tokenHash');
    assert(dbToken?.userId.toString() === testUser._id.toString(), 'RefreshToken document matches test user ID');
    assert(dbToken?.isRevoked === false, 'New refresh token isRevoked is false');
    assert(dbToken?.ipAddress === '192.168.1.100', 'IP address logged correctly');
    assert(dbToken?.userAgent === 'SunBird-ERP-Web/1.0', 'User-Agent logged correctly');

    const expectedExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const diffHours = Math.abs((dbToken?.expiresAt.getTime() || 0) - expectedExpiry) / (1000 * 60 * 60);
    assert(diffHours < 1, 'RefreshToken expiresAt is set to approximately 7 days in future');

    // --- Test 3: Normal Refresh Token Rotation ---
    console.log('\n--- 3. Normal Refresh Token Family Rotation ---');
    const rotatedPair = await TokenService.rotateRefreshToken(
      rawRefreshToken,
      '192.168.1.101',
      'SunBird-ERP-Web/1.1'
    );

    assert(typeof rotatedPair.accessToken === 'string', 'New access token issued upon rotation');
    assert(typeof rotatedPair.refreshToken === 'string', 'New refresh token issued upon rotation');
    assert(rotatedPair.refreshToken !== rawRefreshToken, 'Rotated refresh token is distinct from original');

    const oldTokenDb = await RefreshTokenModel.findOne({ tokenHash });
    const newHash = TokenService.hashToken(rotatedPair.refreshToken);
    const newTokenDb = await RefreshTokenModel.findOne({ tokenHash: newHash });

    assert(oldTokenDb?.isRevoked === true, 'Original refresh token is marked isRevoked: true');
    assert(Boolean(oldTokenDb?.revokedAt), 'Original refresh token records revokedAt timestamp');
    assert(oldTokenDb?.replacedByToken === newHash, 'Original token links replacedByToken to new token hash');
    assert(newTokenDb?.isRevoked === false, 'New rotated token is active (isRevoked: false)');

    // --- Test 4: Token Reuse Detection & Security Family Breach ---
    console.log('\n--- 4. Token Reuse Detection (Hijack Simulation) ---');
    // Generate a second active device session for the same user (e.g. tablet app)
    const secondRawToken = await TokenService.generateRefreshToken(testUser, '10.0.0.50', 'Mobile-Tablet');
    const secondHash = TokenService.hashToken(secondRawToken);

    let activeCountBefore = await RefreshTokenModel.countDocuments({
      userId: testUser._id,
      isRevoked: false,
    });
    assert(activeCountBefore >= 2, `User currently has ${activeCountBefore} active sessions`);

    // Simulate attacker replaying the OLD revoked rawRefreshToken!
    let reuseBreachCaught = false;
    try {
      await TokenService.rotateRefreshToken(rawRefreshToken, '198.51.100.99', 'Attacker-Browser');
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        reuseBreachCaught = true;
        assert(
          err.message.includes('Token family breach detected'),
          'UnauthorizedError identifies Token family breach detected'
        );
      }
    }
    assert(reuseBreachCaught, 'Attacker replay of revoked token throws UnauthorizedError');

    // Verify ALL tokens for this user were revoked immediately!
    const activeCountAfter = await RefreshTokenModel.countDocuments({
      userId: testUser._id,
      isRevoked: false,
    });
    assert(
      activeCountAfter === 0,
      `All active user sessions revoked upon breach detection (active tokens: ${activeCountAfter})`
    );

    // Verify the legitimate second token was also revoked
    const secondTokenDb = await RefreshTokenModel.findOne({ tokenHash: secondHash });
    assert(secondTokenDb?.isRevoked === true, 'Parallel active device session was invalidated by breach handler');

    // --- Test 5: Global User Session Revocation ---
    console.log('\n--- 5. Global User Session Revocation (revokeUserSessions) ---');
    const freshToken = await TokenService.generateRefreshToken(testUser);
    const freshHash = TokenService.hashToken(freshToken);

    let freshDb = await RefreshTokenModel.findOne({ tokenHash: freshHash });
    assert(freshDb?.isRevoked === false, 'Fresh session created and active');

    const revokedCount = await TokenService.revokeUserSessions(testUser._id);
    assert(revokedCount >= 1, `revokeUserSessions revoked ${revokedCount} active session(s)`);

    freshDb = await RefreshTokenModel.findOne({ tokenHash: freshHash });
    assert(freshDb?.isRevoked === true, 'Fresh session is now revoked');

    // Clean up test data
    await UserModel.deleteMany({ email: 'test.director@sunbirdcorp.com' });
    await RefreshTokenModel.deleteMany({ userId: testUser._id });

  } finally {
    await disconnectDatabase().catch(() => { });
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

runTokenServiceTests().catch((err) => {
  console.error('TokenService verification failed:', err);
  process.exit(1);
});
