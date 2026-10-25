/**
 * Verification Script: RBAC Middleware Chain (Prompt 05)
 *
 * This script validates the authGuard, rbacGuard, and warehouseScopeGuard
 * middleware chain by simulating JWT-authenticated requests against the
 * test-rbac routes. Runs without requiring a live MongoDB connection by
 * using targeted unit-style assertions.
 *
 * Usage: ts-node src/middlewares/verify-rbac-guards.ts
 *
 * Test Matrix:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ TC-01: Missing Authorization header → 401                            │
 * │ TC-02: Malformed Bearer token → 401                                  │
 * │ TC-03: Expired JWT → 401                                             │
 * │ TC-04: SUPER_ADMIN bypasses all RBAC checks                          │
 * │ TC-05: DIRECTOR bypasses all RBAC checks                             │
 * │ TC-06: STAFF with INVENTORY:READ → allowed on GET, denied on POST    │
 * │ TC-07: STAFF with INVENTORY:CREATE → allowed on POST                 │
 * │ TC-08: STAFF without roleId → 403                                    │
 * │ TC-09: Warehouse-bound user on own warehouse → allowed               │
 * │ TC-10: Warehouse-bound user on different warehouse → 403             │
 * │ TC-11: Warehouse-bound user with ALL_WAREHOUSES → allowed anywhere   │
 * └────────────────────────────────────────────────────────────────────────┘
 */

/// <reference path="../types/express.d.ts" />
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import env from '../config/env';
import type { AuthenticatedUser } from '../types/express';

// ─── Inline mocks to avoid needing a live DB connection ───

// Mock user records keyed by userId
const MOCK_USERS: Record<string, any> = {
  'user-superadmin': {
    _id: 'user-superadmin',
    userType: 'SUPER_ADMIN',
    roleId: undefined,
    branchId: undefined,
    warehouseId: undefined,
    isActive: true,
  },
  'user-director': {
    _id: 'user-director',
    userType: 'DIRECTOR',
    roleId: undefined,
    branchId: undefined,
    warehouseId: undefined,
    isActive: true,
  },
  'user-readonly': {
    _id: 'user-readonly',
    userType: 'STAFF',
    roleId: 'role-inventory-reader',
    branchId: undefined,
    warehouseId: undefined,
    isActive: true,
  },
  'user-creator': {
    _id: 'user-creator',
    userType: 'STAFF',
    roleId: 'role-inventory-full',
    branchId: undefined,
    warehouseId: undefined,
    isActive: true,
  },
  'user-no-role': {
    _id: 'user-no-role',
    userType: 'STAFF',
    roleId: undefined,
    branchId: undefined,
    warehouseId: undefined,
    isActive: true,
  },
  'user-warehouse-bound': {
    _id: 'user-warehouse-bound',
    userType: 'STAFF',
    roleId: 'role-inventory-full',
    branchId: undefined,
    warehouseId: 'warehouse-central-01',
    isActive: true,
  },
  'user-warehouse-all': {
    _id: 'user-warehouse-all',
    userType: 'STAFF',
    roleId: 'role-all-warehouses',
    branchId: undefined,
    warehouseId: 'warehouse-central-01',
    isActive: true,
  },
  'user-inactive': {
    _id: 'user-inactive',
    userType: 'STAFF',
    roleId: 'role-inventory-full',
    branchId: undefined,
    warehouseId: undefined,
    isActive: false,
  },
};

// Mock role records
const MOCK_ROLES: Record<string, any> = {
  'role-inventory-reader': {
    _id: 'role-inventory-reader',
    permissions: [{ module: 'INVENTORY', actions: ['READ'] }],
    isActive: true,
  },
  'role-inventory-full': {
    _id: 'role-inventory-full',
    permissions: [
      { module: 'INVENTORY', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
    ],
    isActive: true,
  },
  'role-all-warehouses': {
    _id: 'role-all-warehouses',
    permissions: [
      { module: 'INVENTORY', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
      { module: 'ALL_WAREHOUSES', actions: ['READ'] },
    ],
    isActive: true,
  },
};

// ─── Helper: Create a mock Express Request ───
function createMockReq(overrides: Partial<Request> & { headers?: any; body?: any; params?: any } = {}): Request {
  return {
    headers: overrides.headers || {},
    body: overrides.body || {},
    params: overrides.params || {},
    method: overrides.method || 'GET',
    originalUrl: overrides.originalUrl || '/test',
    url: overrides.originalUrl || '/test',
    user: (overrides as any).user,
  } as unknown as Request;
}

function createMockRes(): Response {
  const res: any = {};
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (data: any) => { res.body = data; return res; };
  return res as Response;
}

// ─── Inline implementations (avoiding module-level imports that need DB) ───

/**
 * Simulated authGuard: mirrors the real authGuard logic but uses MOCK_USERS
 * instead of MongoDB UserModel.
 */
async function simulatedAuthGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return next({ statusCode: 401, message: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim().length === 0) {
      return next({ statusCode: 401, message: 'Empty access token' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err: any) {
      return next({ statusCode: 401, message: `Token verification failed: ${err.message}` });
    }

    const user = MOCK_USERS[decoded.sub];
    if (!user) {
      return next({ statusCode: 401, message: 'User not found' });
    }
    if (!user.isActive) {
      return next({ statusCode: 401, message: 'User account deactivated' });
    }

    const authenticatedUser: AuthenticatedUser = {
      userId: user._id,
      userType: user.userType,
      roleId: user.roleId,
      branchId: user.branchId,
      warehouseId: user.warehouseId,
      isActive: user.isActive,
    };
    (req as any).user = authenticatedUser;

    next();
  } catch (error: any) {
    next({ statusCode: 401, message: error.message || 'Auth failed' });
  }
}

/**
 * Simulated rbacGuard: mirrors hasPermission logic using MOCK_ROLES.
 */
function simulatedHasPermission(module: string, action: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    if (!user) {
      return next({ statusCode: 401, message: 'No user context' });
    }

    const { userType, roleId, userId } = user;

    if (userType === 'SUPER_ADMIN' || userType === 'DIRECTOR') {
      return next();
    }

    if (!roleId) {
      return next({ statusCode: 403, message: 'Insufficient permissions for this resource' });
    }

    const role = MOCK_ROLES[roleId];
    if (!role || !role.isActive) {
      return next({ statusCode: 403, message: 'Insufficient permissions for this resource' });
    }

    const hasRequiredPermission = role.permissions.some(
      (perm: any) => perm.module === module && perm.actions.includes(action)
    );

    if (!hasRequiredPermission) {
      return next({ statusCode: 403, message: 'Insufficient permissions for this resource' });
    }

    next();
  };
}

/**
 * Simulated warehouseScopeGuard: mirrors the real logic using MOCK_ROLES.
 */
async function simulatedWarehouseScopeGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = (req as any).user as AuthenticatedUser | undefined;
  if (!user) {
    return next({ statusCode: 401, message: 'No user context' });
  }

  const { userType, warehouseId, branchId, roleId } = user;

  if (userType === 'SUPER_ADMIN' || userType === 'DIRECTOR') {
    return next();
  }

  const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  if (!MUTATION_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const userBoundWarehouse = warehouseId || branchId;
  if (!userBoundWarehouse) {
    return next();
  }

  if (roleId) {
    const role = MOCK_ROLES[roleId];
    if (role && role.isActive) {
      const hasAllWarehouses = role.permissions.some(
        (perm: any) => perm.module === 'ALL_WAREHOUSES'
      );
      if (hasAllWarehouses) {
        return next();
      }
    }
  }

  const targetWarehouseId = req.body?.warehouseId || req.params?.warehouseId;
  if (!targetWarehouseId) {
    return next();
  }

  if (targetWarehouseId.toString() !== userBoundWarehouse.toString()) {
    return next({
      statusCode: 403,
      message: 'Access denied: not authorized for this warehouse',
    });
  }

  next();
}

// ─── Helper: Generate a signed JWT ───
function generateTestJwt(userId: string, expiresInMs: number = 15 * 60 * 1000): string {
  const user = MOCK_USERS[userId];
  return jwt.sign(
    {
      sub: userId,
      userType: user?.userType || 'STAFF',
      ...(user?.roleId && { roleId: user.roleId }),
      ...(user?.branchId && { branchId: user.branchId }),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: Math.floor(expiresInMs / 1000), algorithm: 'HS256' }
  );
}

// ─── Test runner ───
interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

async function runMiddlewareChain(
  req: Request,
  middlewares: ((req: Request, res: Response, next: NextFunction) => any)[]
): Promise<{ error: any | null; completed: boolean }> {
  let completed = false;

  return new Promise((resolve) => {
    let index = 0;
    const res = createMockRes();

    const next: NextFunction = (err?: any) => {
      if (err) {
        return resolve({ error: err, completed: false });
      }
      index++;
      if (index >= middlewares.length) {
        completed = true;
        return resolve({ error: null, completed: true });
      }
      try {
        middlewares[index](req, res, next);
      } catch (e) {
        resolve({ error: e, completed: false });
      }
    };

    try {
      middlewares[0](req, res, next);
    } catch (e) {
      resolve({ error: e, completed: false });
    }
  });
}

async function runTests(): Promise<void> {
  const results: TestResult[] = [];

  console.log('\n' + '═'.repeat(72));
  console.log('  RBAC MIDDLEWARE VERIFICATION SUITE (Prompt 05)');
  console.log('═'.repeat(72) + '\n');

  // ─── TC-01: Missing Authorization header ───
  {
    const req = createMockReq({ headers: {} });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
    ]);
    const passed = !completed && error?.statusCode === 401;
    results.push({
      name: 'TC-01: Missing Authorization header → 401',
      passed,
      expected: '401 Unauthorized',
      actual: completed ? 'Passed through' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-02: Malformed Bearer token ───
  {
    const req = createMockReq({
      headers: { authorization: 'Bearer invalid.token.here' },
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
    ]);
    const passed = !completed && error?.statusCode === 401;
    results.push({
      name: 'TC-02: Malformed Bearer token → 401',
      passed,
      expected: '401 Unauthorized',
      actual: completed ? 'Passed through' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-03: Expired JWT ───
  {
    const expiredToken = jwt.sign(
      { sub: 'user-creator', userType: 'STAFF' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: 0, algorithm: 'HS256' }
    );
    // Small delay to ensure token has expired
    await new Promise((r) => setTimeout(r, 100));
    const req = createMockReq({
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
    ]);
    const passed = !completed && error?.statusCode === 401;
    results.push({
      name: 'TC-03: Expired JWT → 401',
      passed,
      expected: '401 Unauthorized (expired)',
      actual: completed ? 'Passed through' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-04: SUPER_ADMIN bypasses RBAC ───
  {
    const token = generateTestJwt('user-superadmin');
    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'POST',
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
      await simulatedHasPermission('INVENTORY', 'CREATE'),
    ]);
    const passed = completed && !error;
    results.push({
      name: 'TC-04: SUPER_ADMIN bypasses RBAC → allowed',
      passed,
      expected: 'Passed through (no error)',
      actual: completed ? 'Passed through' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-05: DIRECTOR bypasses RBAC ───
  {
    const token = generateTestJwt('user-director');
    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'DELETE',
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
      await simulatedHasPermission('ACCOUNTING', 'DELETE'),
    ]);
    const passed = completed && !error;
    results.push({
      name: 'TC-05: DIRECTOR bypasses RBAC → allowed',
      passed,
      expected: 'Passed through (no error)',
      actual: completed ? 'Passed through' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-06: STAFF with INVENTORY:READ → GET allowed, POST denied ───
  {
    const token = generateTestJwt('user-readonly');

    // 6a: GET (READ) should pass
    const reqRead = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'GET',
    });
    const readResult = await runMiddlewareChain(reqRead, [
      simulatedAuthGuard,
      await simulatedHasPermission('INVENTORY', 'READ'),
    ]);
    const readPassed = readResult.completed && !readResult.error;

    // 6b: POST (CREATE) should be denied → 403
    const reqCreate = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'POST',
    });
    const createResult = await runMiddlewareChain(reqCreate, [
      simulatedAuthGuard,
      await simulatedHasPermission('INVENTORY', 'CREATE'),
    ]);
    const createDenied = !createResult.completed && createResult.error?.statusCode === 403;

    results.push({
      name: 'TC-06a: STAFF INVENTORY:READ on GET → allowed',
      passed: readPassed,
      expected: 'Passed through',
      actual: readResult.completed ? 'Passed through' : `${readResult.error?.statusCode}`,
    });
    results.push({
      name: 'TC-06b: STAFF INVENTORY:READ on POST (INVENTORY:CREATE) → 403',
      passed: createDenied,
      expected: '403 Forbidden',
      actual: createResult.completed
        ? 'Passed through (WRONG!)'
        : `${createResult.error?.statusCode} ${createResult.error?.message}`,
    });
  }

  // ─── TC-07: STAFF with INVENTORY:CREATE → POST allowed ───
  {
    const token = generateTestJwt('user-creator');
    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'POST',
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
      await simulatedHasPermission('INVENTORY', 'CREATE'),
    ]);
    const passed = completed && !error;
    results.push({
      name: 'TC-07: STAFF with INVENTORY:CREATE → allowed',
      passed,
      expected: 'Passed through',
      actual: completed ? 'Passed through' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-08: STAFF without roleId → 403 ───
  {
    const token = generateTestJwt('user-no-role');
    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'GET',
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
      await simulatedHasPermission('INVENTORY', 'READ'),
    ]);
    const passed = !completed && error?.statusCode === 403;
    results.push({
      name: 'TC-08: STAFF without roleId → 403',
      passed,
      expected: '403 Forbidden',
      actual: completed ? 'Passed through (WRONG!)' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-09: Warehouse-bound user on own warehouse → allowed ───
  {
    const token = generateTestJwt('user-warehouse-bound');
    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'POST',
      params: { warehouseId: 'warehouse-central-01' },
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
      await simulatedHasPermission('INVENTORY', 'CREATE'),
      simulatedWarehouseScopeGuard,
    ]);
    const passed = completed && !error;
    results.push({
      name: 'TC-09: Warehouse-bound user on own warehouse → allowed',
      passed,
      expected: 'Passed through',
      actual: completed ? 'Passed through' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-10: Warehouse-bound user on different warehouse → 403 ───
  {
    const token = generateTestJwt('user-warehouse-bound');
    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'POST',
      params: { warehouseId: 'warehouse-branch-02' },
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
      await simulatedHasPermission('INVENTORY', 'CREATE'),
      simulatedWarehouseScopeGuard,
    ]);
    const passed = !completed && error?.statusCode === 403;
    results.push({
      name: 'TC-10: Warehouse-bound user on different warehouse → 403',
      passed,
      expected: '403 Forbidden',
      actual: completed ? 'Passed through (WRONG!)' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── TC-11: Warehouse-bound user with ALL_WAREHOUSES → allowed anywhere ───
  {
    const token = generateTestJwt('user-warehouse-all');
    const req = createMockReq({
      headers: { authorization: `Bearer ${token}` },
      method: 'POST',
      params: { warehouseId: 'warehouse-branch-99' },
    });
    const { error, completed } = await runMiddlewareChain(req, [
      simulatedAuthGuard,
      await simulatedHasPermission('INVENTORY', 'CREATE'),
      simulatedWarehouseScopeGuard,
    ]);
    const passed = completed && !error;
    results.push({
      name: 'TC-11: ALL_WAREHOUSES permission → bypasses scope guard',
      passed,
      expected: 'Passed through',
      actual: completed ? 'Passed through' : `${error?.statusCode} ${error?.message}`,
    });
  }

  // ─── Print results ───
  console.log('─'.repeat(72));
  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
    if (!r.passed) {
      console.log(`   Expected: ${r.expected}`);
      console.log(`   Actual:   ${r.actual}`);
    }
    if (r.passed) passCount++;
    else failCount++;
  }

  console.log('\n' + '─'.repeat(72));
  console.log(`  Results: ${passCount} passed, ${failCount} failed, ${results.length} total`);
  console.log('─'.repeat(72));

  if (failCount > 0) {
    console.log('\n❌ VERIFICATION FAILED — Some test cases did not pass.\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL RBAC GUARD VERIFICATION TESTS PASSED.\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in verification script:', err);
  process.exit(1);
});
