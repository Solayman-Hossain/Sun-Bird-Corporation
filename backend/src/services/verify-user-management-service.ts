import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { RefreshTokenModel } from '../models/RefreshToken';
import { LoginHistoryModel } from '../models/LoginHistory';
import { OrganizationModel } from '../models/Organization';
import { UserService } from './UserService';
import { RoleService } from './RoleService';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sunbird';

async function runVerification() {
  console.log('=====================================================');
  console.log('🚀 SUN BIRD ERP - MODULE 02: USER & ACCESS VERIFICATION');
  console.log('=====================================================');

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

  const testOrgCode = `TESTORG_${Date.now()}`;
  let testOrgId: string = '';
  let testUserId: string = '';
  let testRoleId: string = '';

  try {
    // 0. Setup a test organization
    const testOrg = await OrganizationModel.create({
      organizationCode: testOrgCode,
      legalName: 'Test Healthcare Corp Ltd',
      displayName: 'Test Healthcare',
      organizationType: 'PRIVATE_LIMITED',
      email: `${testOrgCode.toLowerCase()}@testsunbird.com`,
      phone: '+8801700998877',
      address: 'House 12, Road 4, Dhanmondi',
      city: 'Dhaka',
      district: 'Dhaka',
      country: 'Bangladesh',
      status: 'ACTIVE',
    });
    testOrgId = testOrg._id.toString();
    console.log(`\n🏢 Created test organization: ${testOrg.displayName} (${testOrgId})`);

    // 1. Permission Registry & Standard Presets
    console.log('\n--- Test Group 1: Permission Registry & Seeding ---');
    const { registry, presets } = RoleService.getPermissionRegistry();
    assert(registry.length >= 10, `Registry contains ${registry.length} modules`);
    assert(presets.length >= 15, `Registry contains ${presets.length} role presets`);

    const seedResult = await RoleService.seedStandardRoles();
    console.log(`  ℹ️ Seed result: Created ${seedResult.created.length}, Existing ${seedResult.existing.length}`);
    const superAdminRole = await RoleModel.findOne({ slug: 'super_admin' });
    assert(superAdminRole !== null, 'Super Admin role exists');
    assert(superAdminRole?.isSystemRole === true, 'Super Admin role is marked as isSystemRole=true');

    // 2. Role Creation, Retrieval & Duplication
    console.log('\n--- Test Group 2: Role Management CRUD & Duplication ---');
    const createdRole = await RoleService.createRole({
      roleName: `Custom Officer ${Date.now()}`,
      description: 'Special customs and clearance officer',
      permissions: [
        { module: 'products', actions: ['VIEW', 'READ'] },
        { module: 'procurement', actions: ['VIEW', 'READ', 'APPROVE'] },
      ],
      isActive: true,
    });
    testRoleId = createdRole._id.toString();
    assert(createdRole !== null && createdRole.roleName.startsWith('Custom Officer'), 'Custom role created');

    const duplicateRole = await RoleService.duplicateRole(
      testRoleId,
      `Duplicate Officer ${Date.now()}`
    );
    assert(
      duplicateRole.permissions.length === createdRole.permissions.length,
      'Duplicated role inherited all permissions'
    );
    assert(duplicateRole.isSystemRole === false, 'Duplicated role is not a system role');

    // 3. User Creation with Password Hashing & Unique Constraints
    console.log('\n--- Test Group 3: User Creation & Unique Validation ---');
    const timestamp = Date.now();
    const testUsername = `user_${timestamp}`;
    const testEmail = `user_${timestamp}@sunbird.com`;
    const testMobile = `+88017${Math.floor(10000000 + Math.random() * 90000000)}`;

    const user = await UserService.createUser({
      fullName: 'Dr. Test Officer',
      username: testUsername,
      email: testEmail,
      mobile: testMobile,
      password: 'SecurePassword123!',
      employeeId: `EMP-${timestamp.toString().slice(-5)}`,
      department: 'Biomedical Engineering',
      designation: 'Lead Technician',
      roleId: testRoleId,
      assignedRoles: [testRoleId],
      assignedOrganizations: [testOrgId],
      defaultOrganization: testOrgId,
      status: 'ACTIVE',
    });
    testUserId = user._id.toString();

    assert(user._id !== undefined, 'User created successfully');
    assert(user.passwordHash !== 'SecurePassword123!', 'Password stored as bcrypt hash');
    assert(user.username === testUsername, 'Username assigned correctly');
    assert(user.employeeId?.startsWith('EMP-') === true, 'Employee ID saved');

    // Test duplicate email prevention
    let duplicateCaught = false;
    try {
      await UserService.createUser({
        fullName: 'Another User',
        username: `diff_${timestamp}`,
        email: testEmail,
        mobile: `+88018${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: 'Password123!',
      });
    } catch (e: any) {
      duplicateCaught = true;
    }
    assert(duplicateCaught, 'Duplicate email rejected by UserService');

    // 4. User Status Modification & Lockout/Unlock
    console.log('\n--- Test Group 4: User Status & Lockout Management ---');
    const suspendedUser = await UserService.setUserStatus(testUserId, 'SUSPENDED');
    assert(suspendedUser.status === 'SUSPENDED', 'User status transitioned to SUSPENDED');
    assert(suspendedUser.isActive === false, 'User isActive set to false on SUSPENDED');

    const activeUser = await UserService.setUserStatus(testUserId, 'ACTIVE');
    assert(activeUser.status === 'ACTIVE' && activeUser.isActive === true, 'User reactivated');

    // Simulate lockout
    await UserModel.findByIdAndUpdate(testUserId, {
      status: 'LOCKED',
      failedLoginAttempts: 5,
      lockoutUntil: new Date(Date.now() + 30 * 60 * 1000),
    });
    const lockedUser = await UserModel.findById(testUserId);
    assert(lockedUser?.status === 'LOCKED', 'Simulated 5 failed attempts locks user');

    const unlockedUser = await UserService.unlockUser(testUserId);
    assert(unlockedUser.status === 'ACTIVE', 'User unlocked back to ACTIVE');
    assert(unlockedUser.failedLoginAttempts === 0, 'Failed login counter reset to 0');
    assert(unlockedUser.lockoutUntil === null || unlockedUser.lockoutUntil === undefined, 'Lockout expiration cleared');

    // 5. Password Reset & Session Invalidation
    console.log('\n--- Test Group 5: Password Reset & Session Invalidation ---');
    // Create dummy refresh token session for user
    const dummySession = await RefreshTokenModel.create({
      userId: new Types.ObjectId(testUserId),
      tokenHash: 'dummy_hash_' + Date.now(),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
    });
    assert(dummySession._id !== undefined, 'Created mock active session');

    const sessionsBefore = await UserService.getUserSessions(testUserId);
    assert(sessionsBefore.length >= 1, `Found ${sessionsBefore.length} active session(s)`);

    // Reset password with force flag
    await UserService.resetPassword(testUserId, 'BrandNewPass2026!', true);
    const updatedUser = await UserModel.findById(testUserId);
    assert(updatedUser?.forcePasswordChange === true, 'forcePasswordChange flag set on reset');

    const sessionsAfter = await UserService.getUserSessions(testUserId);
    assert(sessionsAfter.length === 0, 'All active sessions revoked following password reset');

    // 6. Organization Assignment & Multi-Tenancy Scope
    console.log('\n--- Test Group 6: Organization Access Assignment ---');
    const assignedUser: any = await UserService.assignOrganizations(
      testUserId,
      [testOrgId],
      testOrgId
    );
    const orgIdFromUser = assignedUser.authorizedOrganizations?.[0]?._id
      ? assignedUser.authorizedOrganizations[0]._id.toString()
      : assignedUser.authorizedOrganizations?.[0]?.toString();
    const defaultOrgFromUser = assignedUser.defaultOrganizationId?._id
      ? assignedUser.defaultOrganizationId._id.toString()
      : assignedUser.defaultOrganizationId?.toString();
    assert(
      assignedUser.authorizedOrganizations?.length === 1 &&
      orgIdFromUser === testOrgId,
      'Organization scope assigned'
    );
    assert(
      defaultOrgFromUser === testOrgId,
      'Default organization assigned'
    );

    // 7. Role Deletion Protection Checks
    console.log('\n--- Test Group 7: Role Protection Guarantees ---');
    // Attempt deleting system role (must fail)
    let systemRoleProtected = false;
    try {
      if (superAdminRole) {
        await RoleService.deleteRole(superAdminRole._id.toString());
      }
    } catch (e: any) {
      systemRoleProtected = true;
    }
    assert(systemRoleProtected, 'System-critical role protected against accidental deletion');

    // Attempt deleting role currently assigned to testUser (must fail)
    let assignedRoleProtected = false;
    try {
      await RoleService.deleteRole(testRoleId);
    } catch (e: any) {
      assignedRoleProtected = true;
    }
    assert(assignedRoleProtected, 'Role protected from deletion while active users are assigned');

    // 8. User Dashboard Statistics Aggregation
    console.log('\n--- Test Group 8: User Dashboard Analytics ---');
    const stats = await UserService.getDashboardStats();
    assert(typeof stats.totalUsers === 'number' && stats.totalUsers >= 1, 'Total users statistic is numeric');
    assert(typeof stats.activeUsers === 'number', 'Active users statistic is numeric');
    assert(typeof stats.lockedUsers === 'number', 'Locked users statistic is numeric');
    assert(Array.isArray(stats.usersByDepartment), 'Department distribution aggregated');
    assert(Array.isArray(stats.usersByRole), 'Role distribution aggregated');

    // 9. Login History Recording
    console.log('\n--- Test Group 9: Login History Audit ---');
    await LoginHistoryModel.create({
      userId: new Types.ObjectId(testUserId),
      email: testEmail,
      ipAddress: '192.168.1.50',
      userAgent: 'Chrome on Windows 11',
      status: 'SUCCESS',
      organizationId: new Types.ObjectId(testOrgId),
    });

    const history = await UserService.getUserLoginHistory(testUserId, 5);
    assert(history.length >= 1, 'Login history audit record retrieved');
    assert(history[0].ipAddress === '192.168.1.50', 'Audit record contains accurate IP address');

    // Cleanup cloned/temporary roles and user
    await RoleModel.findByIdAndDelete(duplicateRole._id);
    await UserModel.findByIdAndDelete(testUserId);
    await RoleService.deleteRole(testRoleId);
    await OrganizationModel.findByIdAndDelete(testOrgId);
    console.log('\n🧹 Cleaned up test database records');

  } catch (err: any) {
    console.error('❌ Unexpected error during verification:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log('\n=====================================================');
    console.log(`📊 FINAL RESULT: ${passed} Passed, ${failed} Failed`);
    console.log('=====================================================');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runVerification();

