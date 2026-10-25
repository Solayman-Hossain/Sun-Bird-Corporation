# Sun Bird Corporation — Backend Engineering Master Prompts Blueprint (`prompt.md`)
## Complete Step-by-Step, Feature-by-Feature Autonomous Implementation Guide

> **Project:** Sun Bird Corporation Integrated Cloud ERP, E-Commerce, POS & AI Platform  
> **Architecture Pattern:** Modular Layered Monolith (Clean Architecture)  
> **Tech Stack:** Node.js, Express.js, TypeScript, MongoDB Atlas (Mongoose v8.x), Redis (BullMQ), AWS S3 / MinIO  
> **Core References:**  
> - Product Requirements: [`prd.md`](file:///e:/Documents/Sun%20Bird%20Corporation/prd.md)  
> - System Architecture: [`architecture.md`](file:///e:/Documents/Sun%20Bird%20Corporation/architecture.md)  
> - Mongoose Database Schemas (35 Collections): [`Database-Schema.md`](file:///e:/Documents/Sun%20Bird%20Corporation/Database-Schema.md)  
> - Database Design & ERD: [`Database.md`](file:///e:/Documents/Sun%20Bird%20Corporation/Database.md)  
> - RESTful API Specification (50+ Endpoints): [`api-spec.md`](file:///e:/Documents/Sun%20Bird%20Corporation/api-spec.md)  

---

## 🧭 How to Use This Prompt Guide
1. **Strictly Sequential Execution:** Follow the phases and prompts in numerical order (Prompt 01 to Prompt 55). Do not jump ahead, as later modules depend on repositories, services, and middlewares built in earlier steps.
2. **Backend-First Discipline:** Build the complete core REST API, database schemas, validation layers, transactions, and background queues before connecting the Next.js frontend.
3. **Copy-Paste Ready:** Each prompt is self-contained with explicit file paths, business logic rules, referenced collections from `Database-Schema.md`, and test/verification criteria.
4. **Zero Placeholder Policy:** Every code implementation must be production-ready with full TypeScript types, Zod schemas, Mongoose models, and error handling.

---

## 📑 Master Execution Index

- [Phase 0: Project Scaffolding & Foundational Setup (Prompts 01–04)](#phase-0-project-scaffolding--foundational-setup)
- [Phase 1: Authentication, Authorization, RBAC & Security (Prompts 05–10)](#phase-1-authentication-authorization-rbac--security)
- [Phase 2: Master Product & Inventory Engine (Prompts 11–16)](#phase-2-master-product--inventory-engine)
- [Phase 3: Procurement, RFQ & Import LC Supply Chain (Prompts 17–23)](#phase-3-procurement-rfq--import-lc-supply-chain)
- [Phase 4: Sales, E-Commerce, POS & Logistics Distribution (Prompts 24–30)](#phase-4-sales-e-commerce-pos--logistics-distribution)
- [Phase 5: Double-Entry Accounting, GL, Fixed Assets & Loans (Prompts 31–37)](#phase-5-double-entry-accounting-gl-fixed-assets--loans)
- [Phase 6: Human Resources & GPS Geofenced Payroll Engine (Prompts 38–42)](#phase-6-human-resources--gps-geofenced-payroll-engine)
- [Phase 7: Quorum Approvals, Governance, CRM & System Auxiliaries (Prompts 43–49)](#phase-7-quorum-approvals-governance-crm--system-auxiliaries)
- [Phase 8: External Gateways, Webhooks & Asynchronous BullMQ Queues (Prompts 50–52)](#phase-8-external-gateways-webhooks--asynchronous-bullmq-queues)
- [Phase 9: Seeding, Automated Testing & Production Deployment (Prompts 53–55)](#phase-9-seeding-automated-testing--production-deployment)

---

## Phase 0: Project Scaffolding & Foundational Setup

### Prompt 01: Project Scaffolding, TypeScript & Environment Setup
```text
Task: Initialize the backend project scaffolding for the Sun Bird Corporation Cloud ERP platform.

Technical Requirements:
1. Initialize a Node.js project with TypeScript in root directory `backend/` (or current root as appropriate).
2. Configure `tsconfig.json` with strict mode (`strict: true`), ES2022 target, module resolution `NodeNext`, sourceMap, and root/out directory mappings (`./src` -> `./dist`).
3. Install core production dependencies:
   - `express`, `cors`, `helmet`, `compression`, `dotenv`, `envalid`, `cookie-parser`, `uuid`.
4. Install dev dependencies:
   - `typescript`, `@types/node`, `@types/express`, `@types/cors`, `@types/cookie-parser`, `@types/uuid`, `ts-node-dev`, `rimraf`.
5. Create environment schema using `envalid` in `src/config/env.ts` covering:
   - `PORT`, `NODE_ENV`, `MONGODB_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_STOREFRONT_URL`, `CLIENT_ERP_URL`.
6. Setup Winston & Morgan correlated logging in `src/config/logger.ts` outputting JSON logs with timestamps.
7. Implement an `X-Request-ID` correlation middleware in `src/middlewares/requestId.ts` attaching a UUIDv4 to incoming requests.
8. Create a health-check endpoint `GET /api/v1/health` returning server status, uptime, and system timestamp.

Verification: Run `npm run build` and `npm run dev` to verify clean compilation and test `GET /api/v1/health`.
```

---

### Prompt 02: Database & Cache Infrastructure Setup (MongoDB Atlas & Redis)
```text
Task: Implement resilient MongoDB Atlas (Mongoose v8) and Redis connections with transaction session helper.

Technical Requirements:
1. Refer to `Database.md` and `architecture.md` §2.1.
2. In `src/config/database.ts`:
   - Setup Mongoose connection with connection pooling (`maxPoolSize: 50`, `minPoolSize: 10`, `serverSelectionTimeoutMS: 5000`).
   - Listen to connection events (`connected`, `error`, `disconnected`, `reconnected`).
   - Export an atomic session transaction helper:
     `runInTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T>`
     incorporating retry logic for `TransientTransactionError` and `UnknownTransactionCommitResult`.
3. In `src/config/redis.ts`:
   - Initialize an `ioredis` client with exponential backoff reconnection.
   - Export helper utilities for Redis key get/set with TTL and distributed locks.
4. Graceful shutdown handler in `src/server.ts` listening to `SIGINT` and `SIGTERM` to close Mongoose and Redis connections cleanly before exiting.

Verification: Verify successful connection logs against local or Atlas MongoDB and Redis instances.
```

---

### Prompt 03: Centralized Error Handling & Custom Exception Hierarchy
```text
Task: Build the centralized RFC 7807-aligned error handling infrastructure as specified in `api-spec.md` Module 9.

Technical Requirements:
1. In `src/errors/AppError.ts`:
   - Create abstract base class `AppError extends Error` with `statusCode`, `errorCode`, `details`, and `serializeError()`.
2. Implement custom exception subclasses:
   - `ValidationError` (400, `VALIDATION_FAILED`)
   - `UnauthorizedError` (401, `AUTH_UNAUTHORIZED`)
   - `MfaRequiredError` (401, `AUTH_MFA_REQUIRED`)
   - `ForbiddenError` (403, `AUTH_FORBIDDEN`)
   - `NotFoundError` (404, `RESOURCE_NOT_FOUND`)
   - `DuplicateKeyError` (409, `DUPLICATE_KEY_CONFLICT`)
   - `IdempotencyConflictError` (409, `IDEMPOTENCY_CONFLICT`)
   - `InsufficientStockError` (422, `INSUFFICIENT_STOCK`)
   - `BatchExpiredError` (422, `BATCH_EXPIRED`)
   - `DoubleEntryImbalanceError` (422, `DOUBLE_ENTRY_IMBALANCE`)
   - `CreditLockedError` (422, `CREDIT_LOCKED`)
   - `QuorumRequiredError` (422, `QUORUM_REQUIRED`)
   - `RateLimitExceededError` (429, `RATE_LIMIT_EXCEEDED`)
3. In `src/middlewares/errorHandler.ts`:
   - Implement Express 4-argument error middleware (`err, req, res, next`).
   - Map `AppError`, Mongoose `ValidationError`, MongoDB `E11000` duplicate key, and unhandled `Error`.
   - Deliver standard JSON envelope: `{ success: false, statusCode, error, requestId, timestamp, path }`.
   - Mask internal stack traces when `NODE_ENV === 'production'`.

Verification: Create a test route that throws `DoubleEntryImbalanceError(10000, 9500)` and assert correct 422 JSON response.
```

---

### Prompt 04: Request Validation Middleware & Idempotency Guard
```text
Task: Implement Zod schema validation middleware and Redis/MongoDB idempotency guard.

Technical Requirements:
1. Refer to `api-spec.md` §1.3 and `Database-Schema.md` §7.7 (`idempotency_keys`).
2. In `src/middlewares/validateRequest.ts`:
   - Create a generic request validation middleware accepting Zod schemas for `body`, `query`, and `params`.
   - On validation failure, format error details into `ValidationError` (`{ field, issue }`).
3. In `src/models/IdempotencyKey.ts`:
   - Implement `IdempotencyKeySchema` according to `Database-Schema.md` §7.7.
   - Enforce unique index on `key` and TTL index on `expiresAt` (`expireAfterSeconds: 0`).
4. In `src/middlewares/idempotency.ts`:
   - Read `X-Idempotency-Key` header on mutating methods (`POST`, `PUT`, `PATCH`).
   - If key exists and status is `RESOLVED`, return cached status and response payload directly.
   - If key is currently `PROCESSING`, throw `IdempotencyConflictError` (409).
   - If key is new, store lock, intercept `res.send()` / `res.json()`, and cache the response upon successful resolution.

Verification: Submit concurrent POST requests with the same `X-Idempotency-Key` and verify 409 conflict on duplicate in-flight requests.
```

---

## Phase 1: Authentication, Authorization, RBAC & Security

### Prompt 05: User, Role & RefreshToken Mongoose Models (D1)
```text
Task: Create Mongoose schemas and models for Authentication & Security domain matching `Database-Schema.md` §1.

Technical Requirements:
1. In `src/models/User.ts`:
   - Implement `IUser` interface and `UserSchema` per `Database-Schema.md` §1.1.
   - User types: `CUSTOMER`, `STAFF`, `DIRECTOR`, `SUPER_ADMIN`, `VENDOR`, `RESELLER`.
   - Fields: `fullName`, `email` (lowercase), `mobile`, `passwordHash`, `totpSecret`, `roleId`, `branchId`, `warehouseId`, `isActive`, `hardwareFingerprint`.
   - Explicit indexes: `{ email: 1 }` unique, `{ mobile: 1 }` unique, `{ userType: 1, isActive: 1 }`.
2. In `src/models/Role.ts`:
   - Implement `IRole` interface and `RoleSchema` per `Database-Schema.md` §1.2.
   - Granular permissions: `module` (INVENTORY, SALES, ACCOUNTING, etc.) and `actions` (CREATE, READ, UPDATE, DELETE, APPROVE, EXPORT).
   - Explicit index: `{ slug: 1 }` unique.
3. In `src/models/RefreshToken.ts`:
   - Implement `IRefreshToken` interface and `RefreshTokenSchema` per `Database-Schema.md` §1.3.
   - Fields: `userId`, `tokenHash`, `expiresAt`, `isRevoked`, `revokedAt`, `replacedByToken`, `ipAddress`, `userAgent`.
   - Explicit indexes: `{ tokenHash: 1 }` unique, `{ expiresAt: 1 }` TTL (`expireAfterSeconds: 0`), `{ userId: 1, isRevoked: 1 }`, `{ userId: 1 }`.

Verification: Ensure Mongoose registers all 3 models without duplicate index warnings during app initialization.
```

---

### Prompt 06: JWT Token Engine & Rotating Refresh Token Family Service
```text
Task: Build the cryptographic JWT token manager and refresh token family rotation service.

Technical Requirements:
1. Refer to `api-spec.md` §1.2 and §2.4.
2. In `src/services/TokenService.ts`:
   - Method `generateAccessToken(user: IUser)`: 15-minute validity, payload: `{ sub: user._id, userType: user.userType, roleId: user.roleId, branchId: user.branchId }`.
   - Method `generateRefreshToken(user: IUser, ipAddress?: string, userAgent?: string)`: Cryptographically random 64-byte hex string, hash using SHA-256 before saving to `refresh_tokens` collection with 7-day expiry.
   - Method `rotateRefreshToken(rawToken: string, ipAddress?: string, userAgent?: string)`:
     - Hash incoming token and find in `refresh_tokens`.
     - Token Reuse Detection: If found token is already `isRevoked: true`, revoke ALL tokens belonging to that `userId` (flag security breach!) and throw `UnauthorizedError('Token family breach detected')`.
     - Otherwise, mark current token revoked, generate new refresh token, link `replacedByToken`, and return new token pair.
   - Method `revokeUserSessions(userId: string)`: Revokes all active refresh tokens for user.

Verification: Unit test normal refresh rotation and test reuse detection triggering revocation of all user tokens.
```

---

### Prompt 07: Mobile SMS Gateway Integration & Customer OTP Engine
```text
Task: Implement mobile SMS OTP authentication service for public storefront customers.

Technical Requirements:
1. Refer to `prd.md` §4, §6.3, and `api-spec.md` §2.1, §2.2.
2. In `src/integrations/smsGateway.ts`:
   - Implement HTTP client for BulkSMSBD / Greenweb API to dispatch SMS messages with fallback.
3. In `src/services/OtpService.ts`:
   - Generate secure 6-digit numeric OTP.
   - Store in Redis with key `otp:<mobile>` and TTL 180 seconds (3 minutes).
   - Enforce rate-limiting: maximum 3 OTP requests per mobile number per hour.
   - Method `verifyOtp(mobile: string, otp: string)`: Validate against Redis. If match, delete key and return true.
4. In `src/services/CustomerAuthService.ts`:
   - When OTP verified, find or create customer in `users` collection (`userType: 'CUSTOMER'`).
   - Also ensure shadow record in `customers` collection (`isGuest: false`).
   - Issue JWT access token and set HTTP-Only refresh token cookie.

Verification: Test OTP send, OTP verify, and verify creation of User record with correct `userType: 'CUSTOMER'`.
```

---

### Prompt 08: TOTP Two-Factor Authentication & Director Device Binding
```text
Task: Implement TOTP MFA engine and Director hardware fingerprint device binding.

Technical Requirements:
1. Refer to `prd.md` §4, `Database-Schema.md` §1.1, and `api-spec.md` §1.2.
2. In `src/services/MfaService.ts`:
   - Use `speakeasy` or `otplib` to generate TOTP secret, backup recovery codes, and QR code URI for Google Authenticator.
   - Method `verifyTotp(secret: string, token: string)`: Validate 6-digit token with $\pm 1$ time window drift.
3. In `src/middlewares/mfaGuard.ts`:
   - Check if authenticated user has `userType: 'DIRECTOR'` or `'SUPER_ADMIN'`.
   - If so, inspect `X-MFA-Code` header. If missing or invalid, throw `MfaRequiredError`.
4. In `src/middlewares/deviceBindingGuard.ts`:
   - For Directors, read `X-Device-Fingerprint` header.
   - Match against `hardwareFingerprint` in Director's `users` record. If mismatch, log security warning in `audit_logs` and throw `ForbiddenError('Unrecognized device for Director approval')`.

Verification: Simulate Director login with valid and invalid TOTP codes and verify access restriction.
```

---

### Prompt 09: Granular RBAC Permission Middleware & Tenant Scope Guard
```text
Task: Build the Role-Based Access Control (RBAC) middleware and warehouse/branch tenant scope guard.

Technical Requirements:
1. Refer to `prd.md` §4 and `Database-Schema.md` §1.2.
2. In `src/middlewares/authGuard.ts`:
   - Extract Bearer JWT from `Authorization` header. Verify signature and expiry. Attach `req.user` to Express Request context.
3. In `src/middlewares/rbacGuard.ts`:
   - Function `hasPermission(module: string, action: string)`:
     - Allow `SUPER_ADMIN` unconditionally.
     - For other users, populate `roleId` from `roles` collection. Check if permissions array contains requested `module` and `action`.
     - If not authorized, throw `ForbiddenError('Insufficient permissions for this resource')`.
4. In `src/middlewares/warehouseScopeGuard.ts`:
   - If user is branch-bound (`branchId` or `warehouseId` assigned in User record), restrict mutations to their designated warehouse unless they possess `ALL_WAREHOUSES` permission.

Verification: Test an endpoint requiring `INVENTORY:CREATE` with a user having only `INVENTORY:READ` and verify 403 Forbidden.
```

---

### Prompt 10: Auth Controllers & Routes Wiring (`/api/v1/public/auth` & `/api/v1/erp/auth`)
```text
Task: Implement controllers and wire express routes for authentication and user/role management.

Technical Requirements:
1. Refer to `api-spec.md` §2.1–§2.7.
2. In `src/controllers/AuthController.ts`:
   - `sendOtp`, `verifyOtp`, `erpLogin`, `refreshToken`, `logout`, `setupMfa`, `verifyMfa`.
3. In `src/controllers/UserController.ts`:
   - `listUsers`, `getUserById`, `createUser`, `updateUser`, `deactivateUser`.
4. In `src/controllers/RoleController.ts`:
   - `listRoles`, `createRole`, `updateRole`.
5. Wire routes in:
   - `src/routes/public/authRoutes.ts` -> mounted at `/api/v1/public/auth`
   - `src/routes/erp/authRoutes.ts` -> mounted at `/api/v1/erp/auth`
   - `src/routes/erp/userRoutes.ts` -> mounted at `/api/v1/erp/users`
   - `src/routes/erp/roleRoutes.ts` -> mounted at `/api/v1/erp/roles`
6. Apply Zod schema validation to all request bodies.

Verification: Test complete login flow: Staff login -> receive access token & refresh cookie -> call `/refresh-token` -> receive new access token.
```

---

## Phase 2: Master Product & Inventory Engine

### Prompt 11: Products, Batches, Serials & Stock Mongoose Models (D2, D3)
```text
Task: Implement Mongoose schemas and models for Product & Inventory domain matching `Database-Schema.md` §2.

Technical Requirements:
1. In `src/models/Product.ts`:
   - Implement `IProduct` and `ProductSchema` per `Database-Schema.md` §2.1.
   - Fields: `sku` (uppercase), `nameEn`, `nameBn`, `category`, `hsCode`, `baseUom`, `brand`, `isMedical`, `isExpirable`, `minStockQty`, `retailPrice`, `showroomPrice`, `resellerTierPrices`, `barcodes`, `seoContent`, `isActive`.
   - Explicit indexes: `{ sku: 1 }` unique, `{ category: 1, isActive: 1 }`, `{ barcodes: 1 }`, `{ isMedical: 1 }`.
2. In `src/models/UomConversion.ts`:
   - Implement `IUomConversion` per `Database-Schema.md` §2.2.
   - Explicit index: `{ productId: 1, fromUom: 1, toUom: 1 }` unique, `{ sku: 1 }`.
3. In `src/models/ProductBatch.ts`:
   - Implement `IProductBatch` per `Database-Schema.md` §2.3.
   - Fields: `productId`, `sku`, `batchNumber`, `category` (EXPIRY_CONTROLLED, NON_EXPIRING), `manufacturingDate`, `expiryDate`, `currentQty`, `reservedQty`, `unitCost` (WAC), `warehouseId`.
   - Explicit indexes: `{ sku: 1, batchNumber: 1, warehouseId: 1 }` unique, `{ expiryDate: 1 }`, `{ warehouseId: 1, currentQty: 1 }`, `{ productId: 1 }`.
4. In `src/models/UnitSerial.ts`:
   - Implement `IUnitSerial` per `Database-Schema.md` §2.4.
   - Explicit indexes: `{ serialNumber: 1 }` unique, `{ status: 1 }`, `{ batchId: 1 }`, `{ productId: 1 }`, `{ soldToCustomerId: 1 }`, `{ warrantyExpiryDate: 1 }`.
5. In `src/models/StockLedger.ts`:
   - Implement `IStockLedger` per `Database-Schema.md` §2.5.
   - Explicit indexes: `{ sku: 1, createdAt: -1 }`, `{ batchId: 1, createdAt: -1 }`, `{ warehouseId: 1, movementType: 1 }`, `{ referenceNo: 1 }`.

Verification: Initialize models in test runner and verify MongoDB creates all single, compound, and unique indexes correctly.
```

---

### Prompt 12: Multi-UOM Conversion Engine Service
```text
Task: Implement the multi-tier Unit of Measure (UOM) conversion calculation service.

Technical Requirements:
1. Refer to `prd.md` §6.2, Fix #8, and `Database-Schema.md` §2.2.
2. In `src/services/UomService.ts`:
   - Manage conversion multipliers: Carton -> Box -> Piece for each SKU.
   - Method `convertToBaseUom(productId: string, fromUom: string, quantity: number): Promise<number>`
   - Method `convertFromBaseUom(productId: string, toUom: string, baseQty: number): Promise<number>`
   - Cache active conversion factors in Redis (`uom:<productId>:<fromUom>:<toUom>`) for ultra-low latency billing queries.
3. Handle edge cases: If `fromUom === toUom`, return quantity directly without database lookup. If conversion path missing, throw `ValidationError('UOM conversion factor not defined for this SKU')`.

Verification: Unit test 1 Carton = 20 Boxes and 1 Box = 10 Pieces -> verify 2 Cartons convert to 400 Pieces correctly.
```

---

### Prompt 13: FEFO Batch Allocation & Moving Average Cost (WAC) Calculator
```text
Task: Build the First-Expiry-First-Out (FEFO) batch inventory allocation service and Weighted Average Cost (WAC) engine.

Technical Requirements:
1. Refer to `prd.md` §3, Fix #4, and `Database-Schema.md` §2.3.
2. In `src/services/InventoryBatchService.ts`:
   - Method `allocateFefoStock(sku: string, warehouseId: string, requiredQty: number, session?: ClientSession)`:
     - Query `product_batches` where `sku`, `warehouseId`, `currentQty > 0`, and `expiryDate > now`.
     - Sort strictly by `expiryDate: 1` (FEFO).
     - If total available stock across non-expired batches < `requiredQty`, throw `InsufficientStockError`.
     - Deduct stock from batches in sequence, updating `currentQty` atomically.
   - Method `calculateNewWacCost(existingQty: number, existingWac: number, incomingQty: number, incomingUnitCost: number): number`:
     $$\text{New WAC} = \frac{(\text{existingQty} \times \text{existingWac}) + (\text{incomingQty} \times \text{incomingUnitCost})}{\text{existingQty} + \text{incomingQty}}$$
     - Enforce 2 decimal precision (BDT).

Verification: Create two batches with different expiry dates; verify allocation service consumes older batch first.
```

---

### Prompt 14: Atomic Inventory Movement Ledger Service (StockLedger)
```text
Task: Build the immutable stock movement ledger service with multi-document ACID transactions.

Technical Requirements:
1. Refer to `Database.md` §7.1 and `Database-Schema.md` §2.5.
2. In `src/services/StockLedgerService.ts`:
   - Method `recordMovement(movementData: StockMovementDTO, session: ClientSession)`:
     - Supported types: `GRN`, `DISPATCH_CHALLAN`, `TRANSFER_IN`, `TRANSFER_OUT`, `PHYSICAL_ADJUSTMENT`, `RETURN_RESTOCK`.
     - Require string `referenceNo` (e.g. "ORD-2026-00481", "CH-2026-00124") and `referenceType`.
     - Atomically adjust `ProductBatch.currentQty` and append an immutable record to `stock_ledger`.
     - Validate that stock deduction never causes `currentQty` to drop below zero.
3. Ensure all operations execute within an active Mongoose transaction session (`session: ClientSession`).

Verification: Execute stock deduction inside an aborted transaction and verify zero changes in `product_batches` and `stock_ledger`.
```

---

### Prompt 15: Individual Equipment Serial Tracker & QR Code Service
```text
Task: Build the individual serial tracker service for medical equipment with QR code generation.

Technical Requirements:
1. Refer to `prd.md` §3, §6.2, and `Database-Schema.md` §2.4.
2. In `src/services/SerialTrackingService.ts`:
   - Method `generateSerialsForBatch(batchId: string, serialList: string[], warrantyMonths: number, session: ClientSession)`:
     - Check if product has `isMedical: true`.
     - Validate uniqueness of each serial number across system.
     - Generate secure QR payload pointing to public verification endpoint:
       `https://sunbirdcorp.com/verify-serial/<serialNumber>`
     - Bulk insert records into `unit_serials` collection with `status: 'AVAILABLE'`.
   - Method `bindSerialToCustomer(serialNumber: string, customerId: string, challanId: string, session: ClientSession)`:
     - Transition status from `AVAILABLE` to `DISPATCHED_SOLD`.
     - Compute and record `warrantyExpiryDate` based on `warrantyMonths`.

Verification: Generate 5 serials for an ultrasound machine batch, bind 1 to an order, and verify status transition.
```

---

### Prompt 16: Product & Inventory Controllers & Routes
```text
Task: Implement controllers and wire express routes for products, batches, serials, and inventory movements.

Technical Requirements:
1. Refer to `api-spec.md` §3.1–§3.6.
2. In `src/controllers/ProductController.ts`:
   - `listPublicProducts` (with search, category, brand, pagination, SEO tags).
   - `getPublicProductDetail` (by ID or SKU).
   - `createProduct`, `updateProduct`, `deactivateProduct` (ERP only).
3. In `src/controllers/InventoryController.ts`:
   - `listBatches` (with FEFO filter and near-expiry alert).
   - `createBatch`, `adjustStockMovement`, `listLedgerHistory`.
   - `listSerials`, `verifyWarrantyQr`.
4. Mount routes:
   - `src/routes/public/productRoutes.ts` -> `/api/v1/public/products`
   - `src/routes/erp/productRoutes.ts` -> `/api/v1/erp/products`
   - `src/routes/erp/inventoryRoutes.ts` -> `/api/v1/erp/inventory`

Verification: Test public product catalog listing and ERP batch stock adjustment route.
```

---

## Phase 3: Procurement, RFQ & Import LC Supply Chain

### Prompt 17: Procurement & Import Mongoose Models (D4, D5)
```text
Task: Implement Mongoose schemas and models for Procurement & LC domain matching `Database-Schema.md` §3.

Technical Requirements:
1. In `src/models/Supplier.ts`:
   - Implement `ISupplier` per `Database-Schema.md` §3.1.
   - Fields: `supplierCode`, `companyName`, `country`, `currency` (BDT, USD, EUR, CNY, JPY), `supplierType` (LOCAL, FOREIGN, INDENTING_AGENT), `aiRiskScore`, `isActive`.
   - Explicit indexes: `{ supplierCode: 1 }` unique, `{ supplierType: 1, isActive: 1 }`, `{ country: 1 }`.
2. In `src/models/SupplierQuotation.ts`:
   - Implement `ISupplierQuotation` per `Database-Schema.md` §3.2.
   - Explicit indexes: `{ rfqNumber: 1 }` unique, `{ supplierId: 1, sku: 1 }`, `{ sku: 1 }`, `{ validUntil: 1 }`.
3. In `src/models/ComparativeStatement.ts`:
   - Implement `IComparativeStatement` per `Database-Schema.md` §3.3.
   - Explicit indexes: `{ csNumber: 1 }` unique, `{ sku: 1 }`, `{ status: 1 }`, `{ productId: 1 }`.
4. In `src/models/PurchaseOrder.ts`:
   - Implement `IPurchaseOrder` per `Database-Schema.md` §3.4.
   - Explicit indexes: `{ poNumber: 1 }` unique, `{ supplierId: 1, status: 1 }`, `{ status: 1 }`.
5. In `src/models/ImportLC.ts`:
   - Implement `IImportLC` per `Database-Schema.md` §3.5.
   - Explicit indexes: `{ lcNumber: 1 }` unique, `{ status: 1 }`, `{ supplierId: 1 }`, `{ purchaseOrderId: 1 }`.
6. In `src/models/LandedCost.ts`:
   - Implement `ILandedCost` per `Database-Schema.md` §3.6.
   - Explicit indexes: `{ lcId: 1 }` unique, `{ lcNumber: 1 }`, `{ isFinalized: 1 }`.

Verification: Ensure all 6 models register and validate schemas with explicit indexes.
```

---

### Prompt 18: Supplier Master & Vendor Portal Service
```text
Task: Build the supplier management engine and authenticated vendor portal endpoints.

Technical Requirements:
1. Refer to `prd.md` §4, §5.3, and `api-spec.md` §4.1, §4.2.
2. In `src/services/SupplierService.ts`:
   - Manage vendor profiles, bank details, SWIFT codes, and historical performance metrics.
   - Link vendor users to `suppliers` collection via `userId`.
3. In `src/services/RfqService.ts`:
   - Allow procurement officers to broadcast RFQs to registered suppliers.
   - Allow suppliers authenticated via `/api/v1/portal/vendor/*` to submit bid quotations with currency, lead times, and payment terms before `validUntil` expiration.

Verification: Submit a vendor quotation bid via portal route and verify quotation status.
```

---

### Prompt 19: 100-Point Comparative Statement (CS) Engine & Gemini AI Integration
```text
Task: Build the 100-point CS evaluation matrix and Google Gemini AI procurement summary advisor.

Technical Requirements:
1. Refer to `prd.md` §3, §4, `architecture.md` §1.1, and `api-spec.md` §4.3.
2. In `src/services/ComparativeStatementService.ts`:
   - Compile bids submitted for an RFQ into a single CS document.
   - Compute 100-point weighted score:
     - Price Score: Max 50 points (lowest bid gets 50, others scored proportionally: $50 \times \frac{\text{lowestPrice}}{\text{bidPrice}}$)
     - Lead Time Score: Max 25 points ($25 \times \frac{\text{shortestLeadTime}}{\text{bidLeadTime}}$)
     - Terms Score: Max 15 points (LC / credit terms weight)
     - Vendor Reliability Score: Max 10 points (from `aiRiskScore`)
3. In `src/integrations/geminiAdvisor.ts`:
   - Connect to Google Gemini 1.5 Pro API using `@google/genai` or Axios.
   - Formulate prompt with anonymized bid matrix and prompt Gemini for structured comparative narrative and risk recommendation.
   - Store generated narrative in `comparative_statements.aiSummary`.

Verification: Test CS compilation with 3 bids and assert highest composite score matches expected calculation.
```

---

### Prompt 20: Purchase Order (PO) Engine & Approval Threshold Triggers
```text
Task: Build the Purchase Order generator from finalized CS with automated Quorum Approval tier assignment.

Technical Requirements:
1. Refer to `prd.md` §4, §5.2, and `Database-Schema.md` §3.4.
2. In `src/services/PurchaseOrderService.ts`:
   - Method `createPoFromCs(csId: string, winningBidId: string, userId: string, session: ClientSession)`:
     - Generate sequential PO code via `CounterService` (e.g. `PO-2026-00042`).
     - Calculate BDT grand total using active exchange rate.
     - Automatically determine `approvalQuorumTier`:
       - $\le 500,000$ BDT: Tier 1 (Manager approval)
       - $500,001 - 1,000,000$ BDT: Tier 2 (Officer/Checker approval)
       - $1,000,001 - 5,000,000$ BDT: Tier 3 (2 Directors Quorum)
       - $> 5,000,000$ BDT: Tier 4 (3 Directors Quorum)
     - If Tier 3 or 4, create record in `quorum_approvals` collection and set PO status to `SUBMITTED`.

Verification: Create PO of 1,500,000 BDT and verify automatic assignment of Tier 3 Quorum requirement.
```

---

### Prompt 21: Import Letter of Credit (LC) Sourcing & Demurrage Tracking Engine
```text
Task: Build the Import LC lifecycle tracking engine including 3-tier FX rates and port demurrage penalty calculator.

Technical Requirements:
1. Refer to `prd.md` §3, §4, `Database-Schema.md` §3.5, and `api-spec.md` §4.5.
2. In `src/services/ImportLcService.ts`:
   - Lifecycle stages: `DRAFT` -> `LC_OPENED` -> `SHIPMENT_IN_TRANSIT` -> `PORT_ARRIVED` -> `CUSTOMS_CLEARED` -> `FINAL_SETTLEMENT`.
   - Track 3 distinct foreign exchange rates:
     - Opening Rate (LC margin calculation)
     - Bill of Entry / Customs Assessment Rate
     - Settlement Rate (bank final debit)
   - Demurrage Calculator: Track port free days (typically 4 days for sea ports). Calculate daily penalty fees if customs clearance exceeds free window.

Verification: Test LC stage progression and verify demurrage calculation when port clearance takes 10 days.
```

---

### Prompt 22: Landed Cost Allocation & Inventory WAC Capitalization Engine
```text
Task: Build the landed cost breakdown engine and finalize batch inventory capitalization on Goods Receipt (GRN).

Technical Requirements:
1. Refer to `prd.md` §3, §4, `Database-Schema.md` §3.6, and `api-spec.md` §4.6.
2. In `src/services/LandedCostService.ts`:
   - Calculate total landed expenditure: $\text{FOB} + \text{Customs Duty (CD)} + \text{Regulatory Duty (RD)} + \text{AIT} + \text{VAT} + \text{C&F Charges} + \text{Port Handling} + \text{Inland Freight} + \text{Insurance} + \text{Bank Charges}$.
   - Cost allocation methods: `BY_VALUE`, `BY_QUANTITY`, `BY_WEIGHT`.
   - Compute final landed unit cost per SKU.
   - Method `finalizeLandedCost(lcId: string, session: ClientSession)`:
     - Capitalize landed unit cost into `ProductBatch.unitCost`.
     - Update product moving WAC in `ProductBatch`.
     - Trigger automatic Goods Receipt Note (GRN) inventory movement in `stock_ledger`.
     - Generate balanced accounting Journal Entry in `journal_entries` (Debit 1200 Inventory Merchandise, Credit 2010 Accounts Payable & Custom duties).

Verification: Finalize a landed cost record and verify that corresponding batch `unitCost` and accounting JVs update atomically.
```

---

### Prompt 23: Procurement Controllers & Routes
```text
Task: Implement controllers and wire express routes for suppliers, quotations, CS, POs, LCs, and landed costs.

Technical Requirements:
1. Refer to `api-spec.md` §4.1–§4.6.
2. In `src/controllers/ProcurementController.ts`:
   - Handlers for suppliers, quotations, comparative statements, PO generation, LC stage transitions, and landed cost finalization.
3. Wire routes:
   - `src/routes/portal/vendorRoutes.ts` -> `/api/v1/portal/vendor`
   - `src/routes/erp/procurementRoutes.ts` -> `/api/v1/erp/procurement`
4. Enforce Zod validation and `hasPermission('PROCUREMENT', ...)` authorization guards on all routes.

Verification: Execute POST request to create Comparative Statement and assert response structure.
```

---

## Phase 4: Sales, E-Commerce, POS & Logistics Distribution

### Prompt 24: Sales, POS & Logistics Mongoose Models (D6, D7, D8, D9)
```text
Task: Implement Mongoose schemas and models for Sales, POS & Distribution domain matching `Database-Schema.md` §4.

Technical Requirements:
1. In `src/models/Customer.ts`:
   - Implement `ICustomer` per `Database-Schema.md` §4.1.
   - Fields: `fullName`, `email`, `mobile`, `customerType` (RETAIL, B2B_HOSPITAL, B2B_CLINIC, RESELLER), `buyerBin` (13-digit NBR BIN), `isGuest`, `isActive`.
   - Explicit indexes: `{ mobile: 1 }` unique, `{ customerType: 1, isActive: 1 }`, `{ companyName: 1 }`, `{ isGuest: 1 }`.
2. In `src/models/CustomerCreditProfile.ts`:
   - Implement `ICustomerCreditProfile` per `Database-Schema.md` §4.2.
   - Fields: `customerId`, `creditLimitBDT`, `creditTermDays`, `currentOutstandingAR`, `unbilledDispatches`, `isCreditLocked`, `lockReason`, `approvedByDirector`.
   - Explicit indexes: `{ customerId: 1 }` unique, `{ isCreditLocked: 1 }`.
3. In `src/models/Order.ts`:
   - Implement `IOrder` per `Database-Schema.md` §4.3.
   - Order statuses: `PENDING`, `PARTIALLY_PENDING`, `CONFIRMED`, `ALLOCATED`, `DISPATCHED`, `DELIVERED`, `CANCELLED`, `RTO_IN_TRANSIT`, `RESTOCKED`.
   - Fields: `orderNo`, `orderChannel` (ECOMMERCE, POS_SHOWROOM, B2B_DIRECT, RESELLER), `items`, `grandTotal`, `paymentMethod`, `paymentStatus`, `splitShipmentRef`, `idempotencyKey`.
   - Explicit indexes: `{ orderNo: 1 }` unique, `{ customerId: 1, orderStatus: 1 }`, `{ orderStatus: 1, createdAt: -1 }`, `{ paymentStatus: 1 }`, `{ salesRepId: 1 }`, `{ createdAt: -1 }`, `{ idempotencyKey: 1 }` sparse-unique.
4. In `src/models/DeliveryChallan.ts`:
   - Implement `IDeliveryChallan` per `Database-Schema.md` §4.4.
   - Statuses: `DRAFT`, `DISPATCHED`, `DELIVERED`, `RETURNED_RTO`, `SPLIT_PARTIAL`.
   - Explicit indexes: `{ challanNo: 1 }` unique, `{ orderId: 1 }`, `{ customerId: 1 }`, `{ status: 1 }`, `{ dispatchTime: -1 }`.
5. In `src/models/SalesInvoice.ts`:
   - Implement `ISalesInvoice` per `Database-Schema.md` §4.5.
   - Explicit indexes: `{ invoiceNo: 1 }` unique, `{ customerId: 1, paymentStatus: 1 }`, `{ status: 1 }`, `{ dueDate: 1 }`, `{ orderId: 1 }`.
6. In `src/models/CourierConsignment.ts`:
   - Implement `ICourierConsignment` per `Database-Schema.md` §4.6.
   - Explicit indexes: `{ trackingCode: 1 }` unique, `{ consignmentId: 1 }` unique, `{ orderId: 1 }`, `{ deliveryStatus: 1 }`, `{ remittanceId: 1 }`.

Verification: Ensure all 6 models compile and build indexes in MongoDB Atlas.
```

---

### Prompt 25: B2B Credit Limit & Aging Hard-Lock Gate Service
```text
Task: Build the B2B customer credit exposure gate and automated hard-lock engine.

Technical Requirements:
1. Refer to `prd.md` §4, Fix #7, and `Database-Schema.md` §4.2.
2. In `src/services/CustomerCreditService.ts`:
   - Method `checkCreditExposure(customerId: string, newOrderAmount: number): Promise<boolean>`:
     - Fetch `customer_credit_profiles`.
     - Calculate Total Exposure:
       $$\text{Total Exposure} = \text{currentOutstandingAR} + \text{unbilledDispatches} + \text{newOrderAmount}$$
     - Check Overdue Aging: Query unpaid `sales_invoices` for this customer where `dueDate < now`.
     - If Total Exposure > `creditLimitBDT` OR any invoice is overdue beyond `creditTermDays`:
       - Automatically update `isCreditLocked: true` and set `lockReason`.
       - Throw `CreditLockedError` with details.
   - Method `directorOverrideCreditLock(customerId: string, directorId: string, reason: string, session: ClientSession)`:
     - Allow authorized Director with MFA to unlock credit temporarily for specific order dispatch.

Verification: Simulate an order pushing exposure over limit, verify `CreditLockedError` is thrown, and test Director override.
```

---

### Prompt 26: E-Commerce Cart & Checkout Service (Redis Stock TTL Locks)
```text
Task: Build the public storefront cart validation and checkout service with Redis TTL inventory locks.

Technical Requirements:
1. Refer to `prd.md` §2, §6, and `api-spec.md` §5.1.
2. In `src/services/CartCheckoutService.ts`:
   - Method `createOrderWithStockLock(checkoutData: CheckoutDTO)`:
     - Use Redis distributed lock / TTL reservation (`stock_lock:<sku>`) for 15 minutes to guarantee stock availability while customer completes payment gateway flow.
     - Increment `ProductBatch.reservedQty` atomically.
     - Generate sequential order number via `CounterService` (e.g. `ORD-2026-00481`).
     - Calculate 15% NBR VAT, shipping fees, and net grand total.
     - If payment method is `ONLINE_SSLCOMMERZ`, initiate SSLCOMMERZ gateway session and return `gatewayUrl`.
     - If `COD`, set order status to `CONFIRMED` and schedule courier consignment.
3. Enforce `X-Idempotency-Key` checking on all checkouts to eliminate accidental duplicate charges.

Verification: Submit checkout request and assert generation of order number and Redis stock reservation lock.
```

---

### Prompt 27: Showroom POS Terminal Direct Checkout Service
```text
Task: Build the high-velocity showroom POS checkout service with single-transaction atomic billing.

Technical Requirements:
1. Refer to `prd.md` §5.2, `architecture.md` §2.1, and `api-spec.md` §5.3.
2. In `src/services/PosCheckoutService.ts`:
   - Method `processPosCheckout(posData: PosCheckoutDTO, cashierId: string)`:
     - Execute inside Mongoose transaction `runInTransaction`.
     - Validate cashier's showroom warehouse assignment.
     - Deduct stock directly from available batch inventory (`ProductBatch.currentQty`).
     - Log movement in `stock_ledger` (`movementType: 'POS_BATCH'`).
     - Generate atomic `DeliveryChallan` (NBR Mushak-6.3) and `SalesInvoice`.
     - Create balanced double-entry accounting journal in `journal_entries`:
       - Debit 1010 Cash on Hand (or 1030 MFS Clearing if bKash/Nagad)
       - Credit 4010 Sales Revenue
       - Credit 2050 VAT Payable (15% Mushak-6.3)
       - Debit 5010 COGS / Credit 1200 Inventory Merchandise (at WAC cost)
     - Return change amount and printable POS thermal invoice payload.

Verification: Execute POS checkout transaction and verify stock deduction, invoice creation, and balanced JV within a single atomic step.
```

---

### Prompt 28: NBR Form Mushak-6.3 Delivery Challan & Tax Invoice Generator
```text
Task: Build the statutory Bangladesh NBR Form Mushak-6.3 delivery challan and tax invoice generation service.

Technical Requirements:
1. Refer to `prd.md` §6.2, `architecture.md` §1.1, and `Database-Schema.md` §4.4, §4.5.
2. In `src/services/DocumentService.ts`:
   - Generate sequential gapless challan numbers (`CH-2026-XXXXX`) and invoice numbers (`INV-2026-XXXXX`).
   - Format Mushak-6.3 compliance data:
     - Seller BIN: Sun Bird Corporation NBR BIN
     - Buyer BIN / NID (if registered B2B customer)
     - Bilingual Item Description (Bangla + English)
     - 8-digit NBR HS Code
     - Base UOM, Quantity, Unit Price, 15% VAT, Supplementary Duty (SD)
     - Vehicle Number, Driver Name, Dispatch Timestamp
   - Use `pdfkit` or HTML-to-PDF template to render printable statutory Mushak-6.3 PDF document and store in AWS S3 / MinIO.

Verification: Generate a challan and verify generated PDF data matches NBR Mushak-6.3 mandatory field specifications.
```

---

### Prompt 29: Courier Logistics Service (Pathao & Steadfast APIs)
```text
Task: Build the third-party courier logistics booking and public AWB tracking service.

Technical Requirements:
1. Refer to `prd.md` §6, `architecture.md` §1.1, and `api-spec.md` §5.5.
2. In `src/integrations/pathaoClient.ts` and `src/integrations/steadfastClient.ts`:
   - Connect to Pathao Merchant API (OAuth token, create order, calculate shipping fee).
   - Connect to Steadfast Courier API (API key header, create order, track status).
3. In `src/services/LogisticsService.ts`:
   - Method `dispatchOrderToCourier(orderId: string, provider: 'PATHAO' | 'STEADFAST', session: ClientSession)`:
     - Generate consignment payload with recipient address, phone, weight, and COD amount.
     - Call carrier API, receive Consignment ID and Tracking Code (AWB).
     - Save to `courier_consignments` collection.
     - Transition Order status to `DISPATCHED`.
   - Method `trackShipmentPublic(trackingCode: string)`: Public lookup without sensitive pricing details.

Verification: Mock carrier API responses and verify consignment record creation and order status transition.
```

---

### Prompt 30: Sales, POS & Logistics Controllers & Routes
```text
Task: Implement controllers and wire express routes for orders, credit profiles, POS, challans, invoices, and logistics.

Technical Requirements:
1. Refer to `api-spec.md` §5.1–§5.5.
2. In `src/controllers/SalesController.ts`, `PosController.ts`, `LogisticsController.ts`:
   - Implement handlers for public checkout, order tracking, POS billing, credit profile queries, challan printing, and consignment booking.
3. Wire routes:
   - `src/routes/public/checkoutRoutes.ts` -> `/api/v1/public/checkout`
   - `src/routes/public/trackingRoutes.ts` -> `/api/v1/public/track-order`
   - `src/routes/erp/salesRoutes.ts` -> `/api/v1/erp/sales`
   - `src/routes/erp/posRoutes.ts` -> `/api/v1/erp/pos`
   - `src/routes/erp/logisticsRoutes.ts` -> `/api/v1/erp/logistics`

Verification: Test POS checkout route and public tracking route via Postman/Supertest.
```

---

## Phase 5: Double-Entry Accounting, GL, Fixed Assets & Loans

### Prompt 31: Chart of Accounts, Journals, Assets & Loans Mongoose Models (D10, Aux)
```text
Task: Implement Mongoose schemas and models for Accounting & Finance domain matching `Database-Schema.md` §5.

Technical Requirements:
1. In `src/models/ChartOfAccounts.ts`:
   - Implement `IChartOfAccounts` per `Database-Schema.md` §5.1.
   - Explicit indexes: `{ accountCode: 1 }` unique, `{ accountType: 1 }`.
2. In `src/models/JournalEntry.ts`:
   - Implement `IJournalEntry` per `Database-Schema.md` §5.2.
   - Enforce pre-save balance check: `Math.abs(totalDebit - totalCredit) < 0.001`.
   - Explicit indexes: `{ voucherNo: 1 }` unique, `{ transactionDate: -1 }`, `{ status: 1 }`, `{ voucherType: 1 }`, `{'lines.accountCode': 1}`, `{ idempotencyKey: 1 }` sparse-unique, `{ createdBy: 1 }`.
3. In `src/models/FixedAsset.ts`:
   - Implement `IFixedAsset` per `Database-Schema.md` §5.3.
   - Explicit indexes: `{ assetCode: 1 }` unique, `{ status: 1 }`, `{ category: 1 }`, `{ warehouseId: 1 }`.
4. In `src/models/Loan.ts`:
   - Implement `ILoan` per `Database-Schema.md` §5.4.
   - Explicit indexes: `{ loanCode: 1 }` unique, `{ loanType: 1, status: 1 }`, `{ borrowerId: 1, loanType: 1 }`, `{ status: 1 }`.
5. In `src/models/Partner.ts`:
   - Implement `IPartner` per `Database-Schema.md` §5.5.
   - Explicit indexes: `{ userId: 1 }` unique, `{ isActive: 1 }`.

Verification: Ensure Mongoose models compile and validate strict pre-save hook on `JournalEntry`.
```

---

### Prompt 32: Double-Entry Accounting Core Engine & Voucher Posting Service
```text
Task: Build the mathematical double-entry accounting engine and voucher posting service.

Technical Requirements:
1. Refer to `prd.md` §3, §4, `Database.md` §8, and `Database-Schema.md` §5.2.
2. In `src/services/AccountingService.ts`:
   - Method `createJournalVoucher(voucherData: CreateVoucherDTO, userId: string, session: ClientSession)`:
     - Verify strict balance: $\sum \text{debits} \equiv \sum \text{credits}$. If discrepancy $> 0$, throw `DoubleEntryImbalanceError`.
     - Validate that all `accountCode` references exist in active `chart_of_accounts`.
     - Check Quorum Policy: If `totalDebit > 1,000,000` BDT, require Tier 3 Quorum Approval (2 Directors); if `> 5,000,000` BDT, require Tier 4 Quorum (3 Directors).
     - Save as `DRAFT` or `SUBMITTED` until approval confirmed, then transition to `POSTED`.
   - Method `reverseJournalVoucher(voucherNo: string, reason: string, userId: string, session: ClientSession)`:
     - Create an exact opposite contra-entry, link `reversalOf`, and mark original voucher `REVERSED`.

Verification: Submit unbalanced voucher (Debit: 50,000, Credit: 48,000) and verify `DoubleEntryImbalanceError` rejection.
```

---

### Prompt 33: Financial Reporting Engine (Trial Balance, P&L, Balance Sheet & GL)
```text
Task: Build the real-time financial reporting aggregation engine.

Technical Requirements:
1. Refer to `prd.md` §3, §4, and `api-spec.md` §6.3.
2. In `src/services/FinancialReportService.ts`:
   - Method `getTrialBalance(startDate: Date, endDate: Date)`:
     - Aggregate lines of all `POSTED` journal entries. Sum net debit and credit per account code (1010 to 6510). Assert total debits equal total credits.
   - Method `getProfitAndLoss(startDate: Date, endDate: Date)`:
     - Revenue (4000s) minus Cost of Goods Sold (5010) = Gross Profit.
     - Gross Profit minus Operating Expenses (6000s) = Net Operating Profit.
   - Method `getBalanceSheet(asOfDate: Date)`:
     - Assets (1000s) = Liabilities (2000s) + Equity (3000s) + Current Period Net Profit.
   - Method `getGeneralLedgerDrilldown(accountCode: number, startDate: Date, endDate: Date)`:
     - Detailed chronological listing of all voucher lines impacting the account with running balance.

Verification: Post balanced sales and purchase JVs, execute Trial Balance aggregation, and verify net zero balance difference.
```

---

### Prompt 34: Fixed Asset Register & Straight-Line (SLM) Depreciation Engine
```text
Task: Build the fixed asset register and monthly automated depreciation scheduler.

Technical Requirements:
1. Refer to `prd.md` §4, `Database-Schema.md` §5.3, and `api-spec.md` §6.4.
2. In `src/services/FixedAssetService.ts`:
   - Register assets with `assetCode`, purchase price, salvage value, and useful life in months.
   - Calculate Monthly Straight-Line Depreciation:
     $$\text{Monthly Depreciation} = \frac{\text{purchasePriceBDT} - \text{salvageValueBDT}}{\text{usefulLifeMonths}}$$
   - Method `runMonthlyDepreciation(fiscalMonthYear: string, session: ClientSession)`:
     - Iterate through active assets where `accumulatedDepreciation < purchasePrice - salvageValue`.
     - Update `accumulatedDepreciation` and `currentBookValue`.
     - Automatically post consolidated Journal Entry:
       - Debit 6310 Depreciation Expense
       - Credit 1590 Accumulated Depreciation

Verification: Run depreciation on an asset costing 120,000 BDT with 12 months life and verify 10,000 BDT deduction and JV generation.
```

---

### Prompt 35: Multi-Type Loan Management Engine
```text
Task: Build the multi-type loan management engine supporting interest-bearing and interest-free loans.

Technical Requirements:
1. Refer to `prd.md` §4, `Database-Schema.md` §5.4, and `api-spec.md` §6.5.
2. In `src/services/LoanService.ts`:
   - Supported types: `BANK_LOAN`, `PARTNER_DIRECTOR_LOAN`, `SUPPLIER_CREDIT`, `EMPLOYEE_LOAN`, `CUSTOMER_ADVANCE`.
   - Interest Calculation:
     - If `isInterestFree: true` (e.g. Director or Employee personal advance), interest accrued is strictly zero.
     - If interest-bearing, compute EMI schedule based on `FLAT` or `REDUCING_BALANCE` formula.
   - Method `recordLoanRepayment(loanCode: string, paymentAmount: number, session: ClientSession)`:
     - Deduct from principal and interest, update schedule, and post loan clearance JV.

Verification: Create an interest-free employee loan of 50,000 BDT and assert repayment schedule has zero interest components.
```

---

### Prompt 36: Partnership Capital Accounts & Profit Allocation Engine
```text
Task: Build the partnership capital accounts ledger and profit sharing distribution service.

Technical Requirements:
1. Refer to `prd.md` §4, `Database-Schema.md` §5.5, and `api-spec.md` §6.6.
2. In `src/services/PartnerService.ts`:
   - Manage partner capital accounts, drawings, profit sharing percentages, and current balances.
   - Method `distributeAnnualProfit(fiscalYear: string, netProfitBDT: number, session: ClientSession)`:
     - Require Tier 4 Quorum Approval (All Directors sign-off).
     - Calculate each partner's share based on `profitShareRatio` (must sum to 100%).
     - Credit partner capital accounts and generate accounting JV (Debit 3020 Retained Earnings, Credit 3010 Partner Capital Accounts).

Verification: Distribute 1,000,000 BDT profit between two 50/50 partners and verify capital account balance updates.
```

---

### Prompt 37: Accounting Controllers & Routes
```text
Task: Implement controllers and wire express routes for COA, journal entries, financial reports, assets, loans, and partners.

Technical Requirements:
1. Refer to `api-spec.md` §6.1–§6.6.
2. In `src/controllers/AccountingController.ts`, `AssetController.ts`, `LoanController.ts`:
   - Handlers for COA, manual JV creation, trial balance, P&L, balance sheet, depreciation runs, loan repayments, and profit distribution.
3. Wire routes:
   - `src/routes/erp/accountingRoutes.ts` -> `/api/v1/erp/accounts`
   - `src/routes/erp/assetRoutes.ts` -> `/api/v1/erp/assets`
   - `src/routes/erp/loanRoutes.ts` -> `/api/v1/erp/loans`
   - `src/routes/erp/partnerRoutes.ts` -> `/api/v1/erp/partners`
4. Enforce `X-Idempotency-Key` and `hasPermission('ACCOUNTING', ...)` guards.

Verification: Query `/api/v1/erp/accounts/coa` and verify 35 standard accounts returned.
```

---

## Phase 6: Human Resources & GPS Geofenced Payroll Engine

### Prompt 38: Employee, Attendance & Payroll Mongoose Models (D11)
```text
Task: Implement Mongoose schemas and models for HRM & Payroll domain matching `Database-Schema.md` §6.

Technical Requirements:
1. In `src/models/EmployeeProfile.ts`:
   - Implement `IEmployeeProfile` per `Database-Schema.md` §6.1.
   - Fields: `userId`, `employeeCode`, `department`, `designation`, `joiningDate`, `basicSalary`, `houseRentAllowance`, `medicalAllowance`, `conveyanceAllowance`, `grossSalary`, `salesCommissionRate`, `assignedWarehouseId`, `isActive`.
   - Explicit indexes: `{ employeeCode: 1 }` unique, `{ userId: 1 }` unique, `{ department: 1 }`, `{ isActive: 1 }`.
2. In `src/models/AttendancePunch.ts`:
   - Implement `IAttendancePunch` per `Database-Schema.md` §6.2.
   - Explicit indexes: `{ employeeId: 1, punchDate: -1 }`, `{ punchDate: -1 }`, `{ isLate: 1, punchDate: -1 }`.
3. In `src/models/PayrollRun.ts`:
   - Implement `IPayrollRun` per `Database-Schema.md` §6.3.
   - Fields: `payrollRunCode`, `monthYear`, `employeeId`, `grossSalary`, `commissionAddition`, `lwpDeduction`, `lateDeduction`, `loanDeduction`, `netPay`, `status`, `journalRef`, `idempotencyKey`.
   - Explicit indexes: `{ payrollRunCode: 1 }` unique, `{ monthYear: 1, employeeId: 1 }` unique, `{ status: 1 }`, `{ monthYear: 1, status: 1 }`, `{ employeeId: 1, monthYear: -1 }`, `{ idempotencyKey: 1 }` sparse-unique.

Verification: Ensure models compile and all compound indexes register properly in MongoDB.
```

---

### Prompt 39: Staff Master & Compensation Structure Service
```text
Task: Build the staff master and salary grade configuration service.

Technical Requirements:
1. Refer to `prd.md` §4, `Database-Schema.md` §6.1, and `api-spec.md` §7.1.
2. In `src/services/EmployeeService.ts`:
   - Manage staff onboarding, department assignment, designated warehouse binding, and salary components.
   - Enforce statutory formula:
     $$\text{Gross Salary} = \text{basicSalary} + \text{houseRentAllowance} + \text{medicalAllowance} + \text{conveyanceAllowance}$$
   - Associate sales commission percentage to sales staff (`salesCommissionRate: 1.5% - 3.0%`).

Verification: Create an employee record and assert gross salary equals sum of individual allowances.
```

---

### Prompt 40: Mobile GPS Geofenced Attendance Punch Engine (Haversine Formula)
```text
Task: Build the mobile geofenced clock-in/out attendance punch engine.

Technical Requirements:
1. Refer to `prd.md` §6, `Database-Schema.md` §6.2, and `api-spec.md` §7.2.
2. In `src/services/AttendanceService.ts`:
   - Method `recordPunch(employeeId: string, punchData: PunchDTO)`:
     - Fetch employee's assigned `assignedWarehouseId` from `warehouses`.
     - Calculate great-circle distance between mobile coordinates and warehouse GPS using Haversine Formula:
       $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
     - If distance $> 50$ meters, mark `isWithinGeofence: false` and flag anomaly.
     - Check Shift Timing: If punch time is $> 15$ minutes past scheduled shift start, mark `isLate: true`.
     - Save punch record in `attendance_punches`.

Verification: Test punch at 20 meters (valid) and 150 meters (geofence violation flagged).
```

---

### Prompt 41: Monthly Payroll Computation Engine & Salary JV Auto-Poster
```text
Task: Build the monthly payroll batch computation engine and automated double-entry salary JV poster.

Technical Requirements:
1. Refer to `prd.md` §3, §6, Fix #2, `Database-Schema.md` §6.3, and `api-spec.md` §7.3.
2. In `src/services/PayrollService.ts`:
   - Method `computeMonthlyPayroll(monthYear: string, session: ClientSession)`:
     - Iterate through active employees.
     - Calculate Realized Sales Commissions: Sum sales commission for paid orders where `salesRepId === employeeId` during the month.
     - Calculate Attendance Deductions:
       - 3 late punches = 0.5 day deduction.
       - Absent days without approved leave = LWP deduction (full daily rate).
     - Loan EMI Deductions: Deduct active employee loan monthly installment.
     - Compute Net Pay: Enforce statutory minimum wage floor (never negative).
   - Method `postPayrollToGl(monthYear: string, approvedBy: string, session: ClientSession)`:
     - Post consolidated Journal Entry:
       - Debit 6110 Salaries & Allowances Expense (Gross)
       - Debit 6120 Sales Commissions Expense
       - Credit 2100 Accrued Salaries Payable (Net Pay)
       - Credit 1420 Employee Advance / Loan Recoveries
     - Mark payroll run `POSTED`.

Verification: Compute payroll for employee with 3 lates and 1 loan installment; verify exact net pay deduction and balanced JV generation.
```

---

### Prompt 42: HRM & Payroll Controllers & Routes
```text
Task: Implement controllers and wire express routes for employee profiles, mobile punches, and payroll runs.

Technical Requirements:
1. Refer to `api-spec.md` §7.1–§7.3.
2. In `src/controllers/HrmController.ts`:
   - Handlers for employee CRUD, mobile clock-in/out, monthly payroll batch computation, and GL posting.
3. Wire routes:
   - `src/routes/portal/employeeRoutes.ts` -> `/api/v1/portal/employee` (for staff attendance & payslips)
   - `src/routes/erp/hrmRoutes.ts` -> `/api/v1/erp/hrm` (for HR managers)
4. Enforce `hasPermission('HR', ...)` and `X-Idempotency-Key` on payroll processing.

Verification: Test mobile punch endpoint `/api/v1/portal/employee/punch` with valid mock coordinates.
```

---

## Phase 7: Quorum Approvals, Governance, CRM & System Auxiliaries

### Prompt 43: Quorum, CRM, Audit & Auxiliary Mongoose Models (D12, Aux)
```text
Task: Implement Mongoose schemas and models for Quorum, CRM, Audit & System Auxiliaries matching `Database-Schema.md` §7.

Technical Requirements:
1. In `src/models/Counter.ts`:
   - Implement `CounterSchema` per `Database-Schema.md` §7.1.
2. In `src/models/Warehouse.ts`:
   - Implement `WarehouseSchema` per `Database-Schema.md` §7.2.
   - Explicit indexes: `{ warehouseCode: 1 }` unique, `{ type: 1, isActive: 1 }`, `{ district: 1 }`.
3. In `src/models/CrmActivity.ts`:
   - Implement `CrmActivitySchema` per `Database-Schema.md` §7.3.
   - Explicit indexes: `{ activityNumber: 1 }` unique, `{ contactMobile: 1 }`, `{ assignedStaffId: 1, status: 1 }`, `{ followUpDate: 1 }`, `{ customerId: 1 }`, `{ activityType: 1, status: 1 }`.
4. In `src/models/ApprovalRequest.ts`:
   - Implement `ApprovalRequestSchema` per `Database-Schema.md` §7.4.
   - Explicit indexes: `{ requestCode: 1 }` unique, `{ documentType: 1, currentStatus: 1 }`, `{ requestedBy: 1 }`, `{ createdAt: -1 }`.
5. In `src/models/QuorumApproval.ts`:
   - Implement `QuorumApprovalSchema` per `Database-Schema.md` §7.5.
   - Explicit indexes: `{ targetId: 1, targetCollection: 1 }`, `{ isComplete: 1 }`, `{ targetCollection: 1, isComplete: 1 }`, `{'approvals.directorId': 1}`, `{ createdAt: -1 }`, `{ emergencyOverride: 1 }`.
6. In `src/models/AuditLog.ts`:
   - Implement `AuditLogSchema` per `Database-Schema.md` §7.6.
   - Explicit indexes: `{ targetCollection: 1, targetId: 1 }`, `{ actorId: 1 }`, `{ createdAt: -1 }`.

Verification: Ensure all models compile and compound indexes are active in MongoDB.
```

---

### Prompt 44: Atomic Gapless Sequence Counter Service
```text
Task: Build the atomic gapless sequence counter service for statutory NBR documents.

Technical Requirements:
1. Refer to `architecture.md` §5.2 and `Database-Schema.md` §7.1.
2. In `src/services/CounterService.ts`:
   - Method `getNextSequence(counterKey: string, session?: ClientSession): Promise<string>`:
     - Use MongoDB atomic `$inc` operation on `counters` collection:
       `CounterModel.findByIdAndUpdate(counterKey, { $inc: { seq: 1 } }, { new: true, upsert: true, session })`
     - Formats supported:
       - `CH-2026-00001` (Mushak-6.3 Delivery Challan)
       - `INV-2026-00001` (Tax Invoice)
       - `JV-2026-00001` (Journal Voucher)
       - `PO-2026-00001` (Purchase Order)
       - `PR-2026-10` (Monthly Payroll Run)
       - `CRM-2026-00001` (CRM Activity)
   - Guarantee zero gaps and zero duplicate numbers even during high concurrency.

Verification: Simulate 50 concurrent counter increments and assert no duplicate numbers generated.
```

---

### Prompt 45: Multi-Director Cryptographic Quorum Approval Engine
```text
Task: Build the multi-director cryptographic quorum approval engine for high-value transactions.

Technical Requirements:
1. Refer to `prd.md` §4, `architecture.md` §5.2, and `Database-Schema.md` §7.5.
2. In `src/services/QuorumApprovalService.ts`:
   - Method `recordDirectorSignature(quorumId: string, directorUser: IUser, signatureData: SignDTO, session: ClientSession)`:
     - Verify user has `userType: 'DIRECTOR'`.
     - Enforce TOTP MFA verification.
     - Validate SHA-256 digital signature: Hash of `targetId + directorId + approvedAt + secret`.
     - Prevent duplicate signatures: Check if director already signed this quorum.
     - Increment `approvals` array.
     - If `approvals.length >= requiredCount` (2 for Tier 3, 3 for Tier 4):
       - Set `isComplete: true`, `completedAt: now`.
       - Automatically trigger final posting of target document (PO, JV, Loan, Credit Override).
   - Method `emergencyOverride(quorumId: string, managingDirector: IUser, reason: string, session: ClientSession)`:
     - Restricted to `MD` role. Log emergency override in `audit_logs` with high-priority security alert.

Verification: Test 2-director quorum workflow: 1st signature leaves quorum pending, 2nd signature marks quorum complete and posts target document.
```

---

### Prompt 46: Append-Only Immutable Database Audit Trail Service
```text
Task: Build the tamper-proof, append-only database audit logging service.

Technical Requirements:
1. Refer to `prd.md` §4, `Database.md` §10, and `Database-Schema.md` §7.6.
2. In `src/services/AuditLogService.ts`:
   - Method `logAction(entry: AuditEntryDTO)`:
     - Captures `actorId`, `actorRole`, `action` (e.g. `ORDER_CREATED`, `VOUCHER_POSTED`, `STOCK_ADJUSTED`), `targetCollection`, `targetId`, `beforeSnapshot`, `afterSnapshot`, `ipAddress`, `userAgent`.
     - Appends document to `audit_logs` collection.
3. Database Security Guard: In `src/models/AuditLog.ts`, install pre-hooks blocking `updateOne`, `updateMany`, `deleteOne`, `deleteMany`, and `findOneAndUpdate` to enforce write-once, append-only immutability at the application layer.

Verification: Attempt to delete an audit log document and assert that the operation is blocked with an error.
```

---

### Prompt 47: CRM Leads, Enquiries & Hospital Follow-Up Service
```text
Task: Build the CRM activity tracking service for doctor visits, equipment demos, and complaints.

Technical Requirements:
1. Refer to `prd.md` §4, `Database-Schema.md` §7.3, and `api-spec.md` §8.3.
2. In `src/services/CrmService.ts`:
   - Manage activities: `LEAD`, `ENQUIRY`, `VISIT_LOG`, `COMPLAINT`, `QUOTATION_FOLLOWUP`.
   - Link activities to customer accounts and assigned sales representatives.
   - Filter scheduled follow-up reminders (`followUpDate`) for sales officer dashboards.

Verification: Create a visit log activity and query upcoming follow-ups for the week.
```

---

### Prompt 48: Multi-Warehouse & Showroom Branch Management Service
```text
Task: Build the multi-location warehouse and showroom branch management service.

Technical Requirements:
1. Refer to `prd.md` §4, `Database-Schema.md` §7.2, and `api-spec.md` §8.5.
2. In `src/services/WarehouseService.ts`:
   - Manage locations: `CENTRAL_WAREHOUSE`, `SHOWROOM_BRANCH`, `TRANSIT_DEPOT`.
   - Store GPS coordinates (`gpsLatitude`, `gpsLongitude`, `geofenceRadiusMeters: 50`) for staff attendance verification.
   - Track district-level geographical coverage across Bangladesh.

Verification: Query warehouses by district and verify GPS coordinates.
```

---

### Prompt 49: Quorum, CRM & System Controllers & Routes
```text
Task: Implement controllers and wire express routes for Quorum, workflow approvals, CRM, audit logs, and warehouses.

Technical Requirements:
1. Refer to `api-spec.md` §8.1–§8.5.
2. In `src/controllers/QuorumController.ts`, `CrmController.ts`, `AuditLogController.ts`, `WarehouseController.ts`:
   - Implement handlers for quorum signing, approval requests, CRM logging, audit trail search, and warehouse directory.
3. Wire routes:
   - `src/routes/erp/quorumRoutes.ts` -> `/api/v1/erp/approvals/quorum`
   - `src/routes/erp/approvalRoutes.ts` -> `/api/v1/erp/approvals/requests`
   - `src/routes/erp/crmRoutes.ts` -> `/api/v1/erp/crm`
   - `src/routes/erp/auditRoutes.ts` -> `/api/v1/erp/audit-logs`
   - `src/routes/erp/warehouseRoutes.ts` -> `/api/v1/erp/warehouses`

Verification: Test quorum signature endpoint with valid mock Director token and signature payload.
```

---

## Phase 8: External Gateways, Webhooks & Asynchronous BullMQ Queues

### Prompt 50: SSLCOMMERZ Payment IPN Webhook & Order Reconciliation
```text
Task: Implement the SSLCOMMERZ Instant Payment Notification (IPN) webhook handler and order reconciliation service.

Technical Requirements:
1. Refer to `architecture.md` §1.1, `Database-Schema.md` §4.3, and `api-spec.md` §9.1.
2. In `src/integrations/sslcommerzGateway.ts`:
   - Connect to SSLCOMMERZ validation API (`/validator/api/validationserverAPI.php`) to verify transaction authenticity.
3. In `src/services/PaymentWebhookService.ts`:
   - Handle incoming `POST /api/v1/webhooks/sslcommerz/ipn`.
   - Validate `verify_sign` and transaction status (`VALID`).
   - Execute in Mongoose ACID transaction:
     - Find Order by `tran_id` (`orderNo`).
     - Update `paymentStatus: 'PAID'`.
     - Commit reserved stock in `product_batches` (convert `reservedQty` to permanent deduction).
     - Generate automated Sales Receipt Journal Entry (Debit 1030 MFS / Bank Clearing, Credit 1100 AR / Sales).
     - Trigger automated delivery challan creation and courier dispatch queue.

Verification: Simulate valid and invalid SSLCOMMERZ IPN callbacks and verify order state transitions.
```

---

### Prompt 51: Courier Status Webhook Handlers (Pathao & Steadfast)
```text
Task: Implement webhook listeners for Pathao and Steadfast courier status notifications.

Technical Requirements:
1. Refer to `architecture.md` §1.1, `Database-Schema.md` §4.6, and `api-spec.md` §9.2, §9.3.
2. In `src/controllers/WebhookController.ts`:
   - Endpoint `POST /api/v1/webhooks/pathao/status` (verify `X-Pathao-Signature`).
   - Endpoint `POST /api/v1/webhooks/steadfast/status` (verify bearer secret).
3. In `src/services/CourierWebhookService.ts`:
   - Update `courier_consignments.deliveryStatus`.
   - If status transitions to `DELIVERED`:
     - Update Order status to `DELIVERED`.
     - Record COD collected amount in `courier_consignments.codAmountCollected`.
     - Unlock sales representative commission for monthly payroll inclusion.
   - If status transitions to `RETURNED`:
     - Transition Order status to `RTO_IN_TRANSIT`.
     - When returned parcel received in warehouse, trigger restock and reverse inventory ledger movement.

Verification: Submit mock webhook for delivered parcel and verify sales commission realization flag.
```

---

### Prompt 52: BullMQ Background Queues & Schedulers
```text
Task: Setup BullMQ background queues for asynchronous tasks, notification dispatch, and daily cron jobs.

Technical Requirements:
1. Refer to `architecture.md` §1.1.
2. In `src/queues/queueManager.ts`:
   - Initialize BullMQ with Redis connection for:
     - `EmailQueue` (Order receipts, PO dispatch to vendors)
     - `SmsQueue` (Customer order notifications, OTP dispatch)
     - `InventoryAlertQueue` (FEFO near-expiry alerts, low stock threshold warnings)
     - `DailyCronQueue` (Midnight tasks: check overdue customer credit profiles, generate daily attendance summary, trigger SLM depreciation)
3. Implement resilient worker processors with 3 retries and exponential backoff.

Verification: Queue an email notification job and assert worker processes and completes the job successfully.
```

---

## Phase 9: Seeding, Automated Testing & Production Deployment

### Prompt 53: Comprehensive Database Seeder Script (Initial Master Data)
```text
Task: Build an idempotent database seeding script populating baseline data across all core collections.

Technical Requirements:
1. Refer to `Database.md` §1, §8, and `Database-Schema.md`.
2. In `src/seeders/masterSeeder.ts`:
   - Check if database already initialized; if not, populate:
     - Roles: `Super Admin`, `Managing Director`, `Director of Finance`, `Inventory Manager`, `Accounts Officer`, `Sales Executive`, `POS Cashier`, `HR Officer`.
     - Super Admin user and 3 Directors (with pre-hashed bcrypt passwords and placeholder TOTP secrets).
     - Standard 35 Chart of Accounts (COA codes 1010 to 6510 from `Database-Schema.md` §5.1).
     - Central Warehouses (Tejgaon Central Depot, Banani Showroom, Chittagong Depot with GPS coordinates).
     - Sample Medical & Diagnostic SKUs with 8-digit NBR HS codes, UOM conversions, and tiered pricing.
     - Sequence Counters initialized for 2026.
3. Add npm script: `"seed": "ts-node src/seeders/masterSeeder.ts"`.

Verification: Run `npm run seed` on clean database and verify all initial collections populated.
```

---

### Prompt 54: Automated Integration & Unit Test Suite
```text
Task: Implement comprehensive unit and integration test suites using Jest, Supertest, and MongoMemoryServer.

Technical Requirements:
1. Configure `jest.config.ts` with `ts-jest` for TypeScript test execution.
2. Test Suites:
   - `auth.test.ts`: Login, JWT issuance, refresh token family rotation, OTP verification.
   - `inventory.test.ts`: FEFO stock allocation, WAC calculation, medical equipment serial generation.
   - `accounting.test.ts`: Balanced journal entries accepted, unbalanced entries rejected with 422, Quorum trigger above 10 Lakh.
   - `creditGate.test.ts`: Hard-lock when customer exposure exceeds limit.
   - `pos.test.ts`: Single-transaction POS checkout with stock deduction, challan, and invoice generation.
   - `payroll.test.ts`: 3 lates deduction, commission addition, statutory minimum wage enforcement.
3. Add npm script: `"test": "jest --runInBand --detectOpenHandles"`.

Verification: Run `npm test` and ensure all test suites pass with >80% code coverage.
```

---

### Prompt 55: Production Docker, Nginx & Deployment Blueprint
```text
Task: Create production Docker multi-stage build, docker-compose orchestration, and Nginx reverse proxy configuration.

Technical Requirements:
1. In `Dockerfile`:
   - Multi-stage build (`builder` with devDependencies compiling TypeScript -> `runner` with lean alpine Node.js image and production dependencies only).
2. In `docker-compose.yml`:
   - Services for `api`, `redis`, `mongodb` (for local staging replication), and `nginx`.
3. In `nginx/nginx.conf`:
   - Reverse proxy routing `/api/v1/*` to Express upstream.
   - Rate limiting zones (`public_zone: 120r/m`, `erp_zone: 300r/m`).
   - Security headers: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff.
   - Gzip and Brotli compression for API responses.
4. Document deployment commands in `README.md`.

Verification: Execute `docker compose up --build` and verify `GET /api/v1/health` responds through Nginx port 80/443.
```

---

*Document v1.0 — Backend Master Prompts Blueprint — Sun Bird Corporation Integrated Cloud ERP Platform*  
*Node.js · Express.js · TypeScript · MongoDB Atlas · Redis BullMQ · Next.js 14+*
