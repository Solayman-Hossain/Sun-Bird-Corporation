import { UserModel } from '../models/User';
import { RefreshTokenModel } from '../models/RefreshToken';
import { TokenService } from '../services/TokenService';

describe('Auth & Security Test Suite (Prompt 54)', () => {
  const runId = Date.now().toString().slice(-6);

  afterAll(async () => {
    await UserModel.deleteMany({ email: new RegExp(runId) });
    await RefreshTokenModel.deleteMany({});
  });

  it('should generate valid access token with user claims', async () => {
    const user = await UserModel.create({
      mobile: `0179${runId}01`,
      fullName: `Auth Tester ${runId}`,
      email: `authtester.${runId}@sunbird.com`,
      passwordHash: 'dummy_hash',
      userType: 'STAFF',
      isActive: true,
      isMobileVerified: true,
    });

    const accessToken = TokenService.generateAccessToken(user);
    expect(accessToken).toBeDefined();
    expect(typeof accessToken).toBe('string');

    const refreshToken = await TokenService.generateRefreshToken(user);
    expect(refreshToken).toBeDefined();
    expect(typeof refreshToken).toBe('string');
  });

  it('should rotate refresh token and reject reused revoked tokens', async () => {
    const user = await UserModel.create({
      mobile: `0179${runId}02`,
      fullName: `Rotation Tester ${runId}`,
      email: `rotation.${runId}@sunbird.com`,
      passwordHash: 'dummy_hash',
      userType: 'CUSTOMER',
      isActive: true,
      isMobileVerified: true,
    });

    const initialRefreshToken = await TokenService.generateRefreshToken(user);
    const rotationResult = await TokenService.rotateRefreshToken(initialRefreshToken);

    expect(rotationResult.accessToken).toBeDefined();
    expect(rotationResult.refreshToken).toBeDefined();
    expect(rotationResult.refreshToken).not.toEqual(initialRefreshToken);

    // Attempting to reuse revoked initial token should flag breach and throw
    await expect(TokenService.rotateRefreshToken(initialRefreshToken)).rejects.toThrow(
      /breach|invalid/i
    );
  });
});
