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
- [Phase 10: Secure Media Upload & S3 Pre-Signed Storage Engine (Prompt 56)](#phase-10-secure-media-upload--s3-pre-signed-storage-engine)
- [Phase 11: Real-time Communications & Safety Engine (Prompt 57)](#phase-11-real-time-communications--safety-engine)
- [Phase 12: Customer Reviews, Ratings & Social Proof (Prompt 58)](#phase-12-customer-reviews-ratings--social-proof)
- [Phase 13: Reports, Warranty Claims & RMA Dispute Resolution Engine (Prompts 59–60)](#phase-13-reports-warranty-claims--rma-dispute-resolution-engine)
- [Phase 14: Final Integration, Route Verification & Server Lifecycle (Prompts 61–62)](#phase-14-final-integration-route-verification--server-lifecycle)

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

## Phase 10: Secure Media Upload & S3 Pre-Signed Storage Engine

### Prompt 56: S3 Pre-Signed URL Media Upload Service & Protected Routes
```text
Task: Create the S3 pre-signed URL service and protected routes for secure client-side media file uploads.

Technical Requirements:
1. Create `src/config/s3.ts`:
   - Initialize and export an AWS S3 client configured from environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`), with fallback support for MinIO / local S3 storage.
2. Create `src/services/s3.service.ts`:
   - `generatePresignedUploadUrl(fileName: string, fileType: string, folder: string)`:
     - Validate `fileType` is one of: 'image/webp', 'image/jpeg', 'image/png'.
     - Generate a unique S3 key: `${folder}/${uuid}_${fileName}`.
     - Generate a pre-signed PUT URL with 5-minute expiration (300 seconds).
     - Return `{ uploadUrl, fileUrl }` where fileUrl is the final permanent S3 URL.
   - `generatePresignedReadUrl(fileKey: string)`:
     - Generate a pre-signed GET URL with 5-minute expiration (used by admins/authorized users to view encrypted NID photos or secure attachments).
     - Return the signed URL string.
3. Create `src/controllers/media.controller.ts`:
   - `getPresignedUrl` handler:
     - Extract `fileName` and `fileType` from `req.body`.
     - Validate both fields are present.
     - Determine folder based on context (default: 'listings'). Can accept optional `folder` field ('listings', 'nid', 'selfies').
     - Call `s3Service.generatePresignedUploadUrl(...)`.
     - Send response 200 with `{ success: true, uploadUrl, fileUrl }`.
   - `getPresignedReadUrl` handler:
     - Extract `fileKey` from `req.body` and validate presence.
     - Call `s3Service.generatePresignedReadUrl(fileKey)`.
     - Send response 200 with `{ success: true, signedUrl }`.
4. Create `src/routes/media.routes.ts`:
   - `POST /presigned-url` -> `authGuard` -> `getPresignedUrl`
   - `POST /presigned-read-url` -> `authGuard` -> `getPresignedReadUrl`
5. Register media routes in `src/app.ts` and `src/routes/index.ts` under `/api/v1/media`.
6. Add verification script `src/services/verify-s3-media.ts` and package script `"test:s3-media"`.

Verification: Execute `npm run test:s3-media` and verify all S3 client, upload validation, read signing, and auth guard assertions pass.
```

---

## Phase 11: Real-time Communications & Safety Engine

### Prompt 57: Decoupled Chat Architecture, Regex Sanitizer & Structured Return
```text
Task: Implement a decoupled real-time customer support chat architecture with pattern-matching regex safety filters and structured returns.

Reference: Course Slides 15 (ChatRoom & Message Collections), 20 (Timestamps), 26 (Regex Basics), 31 (Structured Return), 32 (Service Layer Separation), 37 (Last Message Preview + Unread Count).

Technical Requirements:
1. Create `src/models/ChatRoom.ts`:
   - Decoupled room metadata collection: `customerPhone`, `customerName`, `customerEmail`, `orderId`, `status` ('OPEN', 'IN_PROGRESS', 'RESOLVED').
   - Summary fields for fast inbox list rendering: `lastMessagePreview`, `lastMessageSender`, `lastMessageAt`, `unreadCountAdmin`, `unreadCountCustomer`.
   - Index on `{ lastMessageAt: -1 }`.
2. Create `src/models/ChatMessage.ts`:
   - Decoupled message history: `roomId` (ref: ChatRoom), `senderType` ('CUSTOMER', 'AGENT', 'BOT'), `senderName`, `rawText`, `sanitizedText`, `warnings` (string array), `isBlocked` (boolean).
   - Index on `{ roomId: 1, createdAt: 1 }` for chronological rendering with automatic timestamps.
3. Create `src/services/ChatService.ts`:
   - `sanitizeChatMessage(text: string)`:
     - Apply regex to detect sensitive financial numbers: `/\b(?:\d{4}[ -]?){3}\d{4}\b/g` -> mask with `[card hidden]` and emit `FINANCIAL_DATA_DETECTED`.
     - Apply regex to detect external phishing links: `/(https?:\/\/[^\s]+|www\.[^\s]+)/gi` -> mask with `[link hidden]` and emit `EXTERNAL_LINK_DETECTED`.
     - Apply regex to detect phone numbers: `/(?:\+?88)?01[3-9]\d{8}\b/g` -> flag with `PHONE_NUMBER_DETECTED`.
     - Detect malicious script tags: `/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi` -> block and emit `SCRIPT_INJECTION_DETECTED`.
     - Return structured object: `{ sanitizedText, warnings, isBlocked }`.
   - `sendMessage(input)`: Persist message, update room preview, and atomically increment unread counters.
   - `getInboxSummary(status, page, limit)`: Return conversation list with latest preview and aggregated unread count.
   - `getRoomMessages(roomId)`: Return chronological conversation history.
   - `markRoomRead(roomId, viewer)`: Reset unread counter.
4. Create `src/controllers/ChatController.ts` and routes:
   - Public: `POST /api/v1/public/chat/message`, `GET /api/v1/public/chat/rooms/:roomId/messages`.
   - ERP Admin: `GET /api/v1/erp/chat/inbox`, `PATCH /api/v1/erp/chat/rooms/:roomId/read`.

Verification: Send simulated messages containing telephone and credit card numbers; verify masking and structured warning flags.
```

---

## Phase 12: Customer Reviews, Ratings & Social Proof

### Prompt 58: Product Review Model, Service, Rating Aggregation & Storefront Integration
```text
Task: Create the customer review, star rating (1–5), and aggregation engine for medical diagnostic equipment.

Reference: Course Prompt 18 (Review Model, Service, Controller & Routes).

Technical Requirements:
1. Create `src/models/Review.ts`:
   - Fields: `productId` (ref: Product), `productSku`, `reviewerName`, `reviewerPhone`, `customerId` (optional), `orderId` (optional), `rating` (1 to 5), `title`, `reviewText`, `isVerifiedBuyer`, `status` ('APPROVED', 'PENDING', 'REJECTED').
   - Indexes: `{ productId: 1, createdAt: -1 }`, `{ status: 1 }`.
2. Update `src/models/Product.ts`:
   - Add fields `averageRating` (Number, default 5.0) and `ratingCount` (Number, default 0).
3. Create `src/services/ReviewService.ts`:
   - `submitReview(input)`: Validate rating (1–5) and review text; save review; recalculate product `averageRating` and `ratingCount` via Mongoose aggregation pipeline.
   - `recalculateProductRating(productId)`: Aggregate `$avg: "$rating"` and `$sum: 1` on approved reviews.
   - `getProductReviews(productId, page, limit)`: Return approved reviews sorted by `createdAt: -1`.
   - `getModerationQueue(status, page, limit)`: Return reviews for ERP admin review.
   - `moderateReview(reviewId, status)`: Approve/reject review and recalculate ratings.
4. Create `src/controllers/ReviewController.ts` and routes:
   - Public: `POST /api/v1/public/reviews`, `GET /api/v1/public/reviews/:productId`.
   - ERP Admin: `GET /api/v1/erp/reviews`, `PATCH /api/v1/erp/reviews/:id/moderate`.
5. Frontend Integration:
   - Display star ratings on product cards and product detail modal.
   - Include interactive 1–5 star submission form in `ProductModal.tsx`.

Verification: Submit a 5-star review and verify product average rating updates from aggregation.
```

---

## Phase 13: Reports, Warranty Claims & RMA Dispute Resolution Engine

### Prompt 59: Medical RMA & Dispute Claims Engine, Ticket Generation & Resolution
```text
Task: Implement the RMA (Return Merchandise Authorization) warranty claim, damaged goods dispute, and defective batch reporting system.

Reference: Course Prompt 19 (Report Model, Service, Controller & Routes).

Technical Requirements:
1. Create `src/models/DisputeClaim.ts`:
   - Fields: `claimNumber` (unique, e.g. RMA-2026-00001), `orderId`, `orderNumber`, `productSku`, `productName`, `customerName`, `customerPhone`, `customerEmail`, `claimType` ('DAMAGED_IN_TRANSIT', 'DEFECTIVE_PRODUCT', 'WRONG_ITEM_DELIVERED', 'WARRANTY_SERVICE', 'EXPIRED_BATCH', 'OTHER_DISPUTE'), `description`, `evidenceUrls`, `status` ('PENDING_REVIEW', 'UNDER_INVESTIGATION', 'APPROVED_REPLACEMENT', 'APPROVED_REFUND', 'REJECTED', 'RESOLVED'), `moderatorNotes`, `resolvedBy`, `resolvedAt`.
   - Index on `{ status: 1, createdAt: -1 }`.
2. Create `src/services/DisputeService.ts`:
   - `submitClaim(input)`: Validate required order and customer fields; generate gapless RMA sequence using `CounterService.getNextSequence('RMA')`; save claim.
   - `getClaimsQueue(status, page, limit)`: Return claims for admin resolution.
   - `resolveClaim(input)`: Transition claim status (e.g. `APPROVED_REPLACEMENT`, `APPROVED_REFUND`, `REJECTED`) and persist moderator notes.
   - `getCustomerClaims(query)`: Lookup claims by phone number or order ID.
3. Create `src/controllers/DisputeController.ts` and routes:
   - Public: `POST /api/v1/public/disputes/rma`, `GET /api/v1/public/disputes/lookup`.
   - ERP Admin: `GET /api/v1/erp/disputes`, `PATCH /api/v1/erp/disputes/:id/resolve`.
4. Frontend Integration:
   - Create `RmaClaimModal.tsx` in storefront for direct ticket registration.
   - Add RMA moderation tab in `frontend/src/app/erp/page.tsx` for one-click replacement approval.

Verification: Submit an RMA claim; verify `RMA-2026-XXXX` generated sequence and resolution updates.
```

### Prompt 60: Admin Moderation Service, Governance Queue & Banned NID Screening
```text
Task: Create the administrative moderation service integrating dispute claims, review approval, and corporate compliance screening.

Reference: Course Prompt 20 (Admin Service, Controller & Routes).

Technical Requirements:
1. Create `src/services/AdminModerationService.ts`:
   - `getModerationOverview()`: Aggregate counts of pending reviews, pending dispute claims, and active banned NID records.
   - `banCustomerOrUser(targetId, targetType, reason, bannedBy, nid)`: Deactivate user/customer account; persist hashed NID in `BannedNidModel` with reason and audit timestamp.
2. Cross-Module Verification:
   - Connect moderation queue with `CustomerCreditProfile` to automatically prevent high-risk customers from credit terms.
   - Integrate with `AuditLogService` for tamper-evident tracking of admin decisions.

Verification: Run admin overview and verify aggregated pending metrics across reviews, disputes, and banned NIDs.
```

---

## Phase 14: Final Integration, Route Verification & Server Lifecycle

### Prompt 61: Route Registration Verification, Global Security Middlewares & App.ts Finalization
```text
Task: Finalize the Express `app.ts` middleware pipeline and `server.ts` lifecycle management to ensure strict execution order and zero security gaps.

Reference: Course Prompt 23 (Route Registration Verification & App.ts Finalization).

Technical Requirements:
1. Middleware Pipeline Order in `src/app.ts`:
   1. `helmet()` — Security HTTP headers (HSTS, frameguard, nosniff).
   2. `cors({ origin: allowedOrigins, credentials: true })` — CORS with credentials and exposed headers.
   3. `compression()` — Gzip response compression.
   4. `express.json({ limit: '10mb' })` — Body parser.
   5. `express.urlencoded({ extended: true, limit: '10mb' })` — URL-encoded parser.
   6. `cookieParser()` — Cookie parsing for JWT tokens.
   7. `xssSanitizerMiddleware` (`src/middlewares/xssSanitizer.ts`) — In-place recursive sanitization of `<script>` and malicious HTML tags on body, query, and params.
   8. `requestIdMiddleware` — `X-Request-ID` UUID correlation tracking.
   9. `morganMiddleware` — Correlated Winston HTTP access logging.
   10. Route Mounting:
       - Root: `GET /`
       - Health Check: `GET /api/v1/health` (no auth required, returns `{ success: true, message, status: 'UP', version: '1.0.0', uptime, timestamp }`)
       - Auth: `/api/v1/auth`, `/api/v1/public/auth`, `/api/v1/erp/auth`
       - Products: `/api/v1/public/products`, `/api/v1/erp/products`
       - Inventory & Procurement: `/api/v1/erp/inventory`, `/api/v1/erp/procurement`
       - Portals: `/api/v1/portal/vendor`, `/api/v1/portal/customer`, `/api/v1/portal/employee`
       - Sales & Checkout: `/api/v1/public/checkout`, `/api/v1/public/track-order`, `/api/v1/erp/sales`, `/api/v1/erp/pos`, `/api/v1/erp/logistics`
       - Accounting & Governance: `/api/v1/erp/accounts`, `/api/v1/erp/assets`, `/api/v1/erp/loans`, `/api/v1/erp/partners`, `/api/v1/erp/hrm`, `/api/v1/erp/approvals/quorum`, `/rzefjgtপapi/v1/erp/approvals/requests`, `/api/v1/erp/audit-logs`
       - Communications & Reviews: `/api/v1/public/reviews`, `/api/v1/public/chat`, `/api/v1/public/disputes`, `/api/v1/erp/reviews`, `/api/v1/erp/chat`, `/api/v1/erp/disputes`
       - Media & Webhooks: `/api/v1/media`, `/api/v1/webhooks`
   11. Catch-All 404 Route Handler: `app.use((req, res, next) => next(new NotFoundError(...)))`
   12. Centralized RFC 7807 Error Middleware: `app.use(errorHandler)`
2. Server Lifecycle in `src/server.ts`:
   - Establish MongoDB connection before HTTP server begins accepting requests.
   - Fallback-resilient Redis connection handling.
   - Graceful shutdown on `SIGINT` and `SIGTERM`: close HTTP server, disconnect MongoDB, disconnect Redis with 10s safety timeout.
   - Handlers for `unhandledRejection` and `uncaughtException`.

Verification: Execute `npm run test:api-integration` and verify health check, root route, XSS sanitizer, and 404 handler responses.
```

### Prompt 62: Comprehensive API End-to-End Testing with Sample Automated Requests
```text
Task: Build an automated integration verification test script executing real end-to-end HTTP requests against the complete API stack.

Reference: Course Prompt 24 (Comprehensive API Testing with Sample Requests).

Technical Requirements:
1. Create `src/services/verify-full-api-integration.ts`:
   - Initialize ephemeral HTTP server listener on dynamic port.
   - Step 1: Hit `GET /api/v1/health` and verify `success: true`, `status: 'UP'`, `version: '1.0.0'`.
   - Step 2: Hit `GET /` and verify `service: 'Sun Bird Corporation ERP API'`.
   - Step 3: Test XSS middleware with malicious HTML and script injections.
   - Step 4: Submit product review and verify `averageRating` recalculation.
   - Step 5: Send chat message and verify phone/card regex masking and structured return.
   - Step 6: Submit RMA claim and verify `RMA-2026-XXXX` sequence generation and admin resolution.
   - Step 7: Hit invalid endpoint `GET /api/v1/invalid-route` and verify 404 RFC 7807 error.
   - Step 8: Verify admin moderation overview metrics.
2. Add npm script in `package.json`:
   `"test:api-integration": "ts-node -r dotenv/config src/services/verify-full-api-integration.ts"`.
3. Create Postman Collection v2.1.0:
   - Provide `Docs/Sun-Bird-Corporation.postman_collection.json` containing pre-configured request templates for all 14 phases, organized into 9 modules with environment variables (`{{baseUrl}}`, `{{jwtToken}}`).

Verification: Import `Sun-Bird-Corporation.postman_collection.json` into Postman and run `npm run test:api-integration` to verify all requests respond with clean HTTP status codes.
```

---

## Phase 15: Enterprise Core & Foundation Upgrades (Production Modules)

### Prompt 63: SUN BIRD ERP – MODULE 01: ORGANIZATION PROFILE MANAGEMENT
```text
Task: Develop a centralized, multi-organization profile management system within the existing SUN BIRD ERP without rebuilding or redesigning existing architecture.

Technical Requirements:
1. Multi-Organization Domain Architecture:
   - Support multiple legal operating companies under a single management system with tenant isolation.
   - Organization attributes: organizationCode (unique), legalName, displayName, organizationType, registrationNumber, tradeLicenseNumber, tinNumber, binNumber, vatRegistrationNumber, email, phone, alternatePhone, website, address, city, district, postalCode, country (default: Bangladesh), logo, status (ACTIVE/INACTIVE), isDefault (strictly singular default enforcement), financialYearStart, currency (default: BDT), timezone.
2. Sidebar Integration:
   - Preserve existing ERP sidebar styling and structure.
   - Add expandable 'Organization Management' (প্রতিষ্ঠানের ব্যবস্থাপনা) section with 12 submodules:
     1. Organization Dashboard, 2. Organization List, 3. Add Organization, 4. Organization Profile, 5. Logo & Branding, 6. Bank Information, 7. Signature Management, 8. Stamp Management, 9. Document Configuration, 10. Organization Settings, 11. Financial Settings, 12. Activity Logs.
3. Backend Models & Services:
   - `backend/src/models/Organization.ts`: Multi-tenant Mongoose schema with banking details, document branding templates, official digital stamps, authorized signers, and validation rules.
   - `backend/src/services/OrganizationService.ts`: CRUD operations, default organization assignment guard, logo/stamp/signature management, activity logging.
   - `backend/src/controllers/OrganizationController.ts`: RESTful endpoints mounted at `/api/v1/erp/organizations`.
4. Frontend Components & Routes:
   - `frontend/src/components/erp/ErpOrganizationView.tsx`: Comprehensive 12-submodule React interface with bilingual English/Bengali UI and real-time validation.
   - `frontend/src/components/erp/ErpOrganizationView.css`: Unified styling with Forest Green (#1e3932) & Warm Gold (#c89348).
   - Routes: `/erp/organizations` and `/admin/organizations`.

Verification: Execute `src/services/verify-organization-service.ts` (100% assertions passed) and verify zero compilation errors in `tsc --noEmit`.
```

### Prompt 64: SUN BIRD ERP – MODULE 02: USER, ROLES & ADVANCED PERMISSION MANAGEMENT
```text
Task: Implement an enterprise-level User Management, Role Management, and Granular Permission Matrix system with multi-organization tenant access control.

Technical Requirements:
1. User Lifecycle & Access Control:
   - Fields: fullName, username, email, phone, employeeId, department, designation, assignedOrganizations, defaultOrganization, assignedRoles, status (ACTIVE, INACTIVE, SUSPENDED, LOCKED), lastLogin, passwordExpiry, failedLoginAttempts, lockedUntil.
   - Features: Create, edit, activate, suspend, unlock, password reset, force password change on first login, session revocation.
2. Configurable Role-Based Access Control (RBAC):
   - 17 Standard Configurable Roles: Super Admin, System Admin, Managing Director, General Manager, Finance Manager, Accounts Officer, Sales Manager, Sales Executive, Purchase Manager, Store Manager, Inventory Officer, HR Manager, HR Officer, E-commerce Manager, Customer Support, Auditor, Viewer.
   - System-protected role guards preventing deletion or privilege stripping of core administrative roles.
3. Interactive Permission Matrix:
   - Visual matrix across 11 modules: Organization, Users, Inventory, Sales, Purchasing, Accounting, HR, E-commerce, LC, Support, Approvals.
   - 12 granular operations: VIEW, CREATE, EDIT, DELETE, EXPORT, IMPORT, APPROVE, REJECT, PRINT, ATTACH, CANCEL, OVERRIDE.
4. Security & Audit Logging:
   - BCrypt 12-round hashing, brute-force 5-attempt auto-lockout (30 min duration).
   - Refresh token session inspection and revocation (`user_sessions` collection).
   - Detailed login history auditing (`login_history` collection) with IP, user-agent, and status.
5. Backend & Frontend Implementation:
   - `backend/src/models/User.ts`, `backend/src/models/Role.ts`, `backend/src/models/UserSession.ts`, `backend/src/models/LoginHistory.ts`.
   - `backend/src/services/UserService.ts`, `backend/src/services/RoleService.ts`, `backend/src/services/verify-user-management-service.ts`.
   - `backend/src/controllers/UserController.ts`, `backend/src/controllers/RoleController.ts`.
   - `frontend/src/components/erp/ErpUserManagementView.tsx` (12 submodules), `frontend/src/components/erp/ErpUserManagementView.css`.
   - Routes: `/erp/users` and `/admin/users`.

Verification: Execute `src/services/verify-user-management-service.ts` (34 assertions passed) and confirm clean TypeScript compilation.
```

### Prompt 65: SUN BIRD ERP – MODULE 03: ADVANCED APPROVAL WORKFLOW & AUDIT MANAGEMENT
```text
Task: Develop an enterprise-level Approval Workflow and Centralized Tamper-Proof Audit Management System for Sun Bird Corporation ERP.

Technical Requirements:
1. Configurable Multi-Tier Workflow Engine:
   - Support sequential and parallel approval tiers, amount-based threshold tiers, role/user-based approver assignments, auto-escalation SLAs.
   - Domains supported: Purchasing, Sales, Accounting, Inventory, HR/Payroll, Import/LC, E-commerce.
2. Strict Maker–Checker Governance:
   - Request creator (`makerId`) is strictly forbidden from approving, rejecting, or reviewing their own request at any level.
   - Enforced at service layer throwing RFC 7807 ForbiddenError.
3. Delegation Management with Circular Prevention:
   - Time-bounded delegation of approval authority for scheduled leaves/absences.
   - Automated cycle detection using depth-first graph traversal preventing circular delegation chains.
4. Centralized Immutable Audit Trail:
   - Tamper-proof append-only `audit_logs` collection.
   - Pre-hooks on Mongoose schema blocking update and delete mutations (`blockMutation`).
   - Automated Before/After JSON field diff calculation (`computeFieldDiffs`).
5. Sidebar & UI Integration (15 Submodules):
   - Under System Administration, add 'Approval & Audit Management' (অনুমোদন ও অডিট ব্যবস্থাপনা) with 15 submodules:
     1. Approval Dashboard, 2. My Pending Approvals, 3. My Submitted Requests, 4. All Approval Requests, 5. Approval Workflow Configuration, 6. Approval Levels, 7. Approval Matrix, 8. Delegation Management, 9. Approval History, 10. Rejected Requests, 11. Cancelled Requests, 12. Audit Trail, 13. Audit Reports, 14. Approval Notifications, 15. Approval Settings.
6. Backend & Frontend Implementation:
   - `backend/src/models/ApprovalRequest.ts`, `backend/src/models/ApprovalWorkflow.ts`, `backend/src/models/ApprovalDelegation.ts`, `backend/src/models/AuditLog.ts`.
   - `backend/src/services/ApprovalService.ts`, `backend/src/services/ApprovalWorkflowService.ts`, `backend/src/services/ApprovalDelegationService.ts`, `backend/src/services/AuditService.ts`, `backend/src/services/verify-approval-service.ts`.
   - `backend/src/controllers/ApprovalController.ts`, `backend/src/controllers/ApprovalWorkflowController.ts`, `backend/src/controllers/AuditLogController.ts`.
   - `frontend/src/components/erp/ErpApprovalAuditView.tsx`, `frontend/src/components/erp/ErpApprovalAuditView.css`.
   - Direct Routes: `/erp/approvals` and `/admin/approvals`.

Verification: Execute `src/services/verify-approval-service.ts` (31 assertions passed, 0 failed), run `npm run build` with 56/56 pages cleanly generated, and verify HTTP 200 on live routes.
```

---

### Prompt 66: SUN BIRD ERP – MODULE 04: PRODUCT ENTRY & E-COMMERCE CATALOG MANAGEMENT
```text
Task: Develop an enterprise-grade Product Entry and E-Commerce Catalog Management module inside the existing Sun Bird Corporation ERP without rebuilding or redesigning existing modules.

Technical Requirements:
1. Unified Product Master with Single Source of Truth:
   - Reuse existing `products` collection and Mongoose `ProductModel`. Never create duplicate collections.
   - Retain 100% of existing medical/storefront fields (`sku`, `nameEn`, `nameBn`, `hsCode`, `baseUom`, `isMedical`, `retailPrice`, `showroomPrice`, `resellerTierPrices`, `barcodes`, `seoContent`).
   - Add ERP Master extensions: `organizationId`, `productCode`, `internalReference`, `productType`, `manufacturer`, `modelNumber`, `purchasePrice`, `costPrice`, `defaultSalesPrice`, `wholesalePrice`, `warrantyPeriod`, `reorderLevel`, `status`, `publicationStatus`, `publishedAt`, `approvalRequestId`, `ecommerceCatalog`, `gallery`, `variants`, `seo`.
2. Hierarchical Categories, Brands & Variant Attributes:
   - `CategoryModel` (`categories` collection): `parentId`, `ancestors`, `iconUrl`, `displayOrder`, `isHomepageVisible`. Enforce circular dependency prevention (`detectCircularCategory`) using depth-first graph traversal.
   - `BrandModel` (`brands` collection): `logoUrl`, `countryOfOrigin`, `displayOrder`, safe deletion checks against product references.
   - `ProductAttributeModel` (`product_attributes` collection): Variant attributes (e.g. Needle Gauge, Capacity, Size) with configurable values.
3. Central Stock Ledger Authority:
   - Never create an independent or parallel e-commerce inventory stock field.
   - Aggregate stock dynamically in real-time from `ProductBatchModel` (`$group: { _id: '$sku', availableStock: { $sum: '$currentQty' } }`).
4. Strict Internal Cost Protection:
   - Public storefront APIs (`/api/v1/products`) strictly project `-purchasePrice -costPrice -createdBy -__v`.
   - Internal cost prices are strictly gated by RBAC to authorized managerial roles (`super_admin`, `managing_director`, `finance_manager`).
5. Module 03 Approval Integration:
   - Publishing products to the public storefront triggers Module 03 Approval Workflow Engine (`PRODUCT_PUBLICATION`) adhering strictly to Maker–Checker governance.
6. 17 Submodules Accordion & Full ERP Integration:
   - Under Products, introduce an expandable accordion with 17 submodules:
     1. Product Dashboard, 2. ERP Product Master, 3. E-commerce Product Entry, 4. Product List, 5. Product Categories, 6. Brand Management, 7. Product Variants, 8. Product Attributes, 9. Product Image Gallery, 10. Product Pricing, 11. Bulk Product Import, 12. Product Export, 13. SEO Management, 14. Website Publishing, 15. Product Approval, 16. Product Activity Logs, 17. Product Settings.
7. Backend & Frontend Implementation:
   - Models: `backend/src/models/Product.ts`, `Category.ts`, `Brand.ts`, `ProductAttribute.ts`.
   - Services: `backend/src/services/ProductCatalogService.ts`, `CategoryService.ts`, `BrandService.ts`, `ProductAttributeService.ts`.
   - Controller & Routes: `backend/src/controllers/ProductCatalogController.ts`, `backend/src/routes/erp/productCatalogRoutes.ts`.
   - Automated Verification: `backend/src/services/verify-product-catalog-service.ts` (35 assertions passed, 0 failed).
   - Frontend: `frontend/src/types/index.ts`, `frontend/src/services/productCatalog.service.ts`, `frontend/src/components/erp/ErpProductCatalogView.tsx`, `frontend/src/components/erp/ErpProductCatalogView.css`.
   - Routing: Integrated into `frontend/src/app/erp/page.tsx`, `frontend/src/app/erp/products/page.tsx`, and `frontend/src/app/admin/products/page.tsx`.

Verification: Execute `src/services/verify-product-catalog-service.ts` (35 assertions passed), run `npm run build` (56/56 pages cleanly generated), and verify HTTP 200 on `/erp/products`.
```

---

### Prompt 67: SUN BIRD ERP – MODULE 05: PURCHASE & SUPPLIER MANAGEMENT
```text
Task: Develop an enterprise-grade Purchase and Supplier Management system inside Sun Bird Corporation ERP without rebuilding or redesigning existing modules.

Technical Requirements:
1. End-to-End Procurement Lifecycle:
   - Purchase Requisition (PR): Multi-item requisitions with estimated cost, department tracking, Maker-Checker submission to Module 03, approval workflows, and conversion to PO.
   - Goods Receive Note (GRN): Physical receiving, quality inspection status (Passed, Partial, Rejected, Damaged), FEFO batch creation in ProductBatch, and atomic StockLedger movements (GRN_IN).
   - Purchase Invoice (PINV): Supplier bill entry, 3-way matching validation (PO, GRN, Bill), automated double-entry GL voucher posting (DR Inventory 1300, CR Accounts Payable 2100).
   - Supplier Payment (SPAY): Multi-invoice allocation, payment voucher posting (DR Accounts Payable 2100, CR Cash/Bank 1100), running balance reduction, and invoice status updates (PARTIALLY_PAID / PAID).
   - Purchase Return (PRTN): Defective product return to vendor with stock reversal, debit note issuance, and AP liability reduction.
2. Supplier Extended Intelligence:
   - Running balance Supplier Ledger (DR Invoices, CR Payments, CR Returns) with closing balance.
   - Accounts Payable (AP) aging analysis bucketed into Current (0 days), 1-30, 31-60, 61-90, and 90+ days past due.
   - Duplicate vendor prevention checking phone, email, and 11-digit BIN across the organization.
3. 18 Submodules Accordion & Full ERP Integration:
   - Under Purchase, introduce an expandable accordion with 18 submodules:
     1. Purchase Dashboard, 2. Purchase Requisitions, 3. Requisition Approval, 4. RFQ Sourcing, 5. Supplier Quotations, 6. Comparative Statements, 7. Purchase Orders, 8. Goods Receive Notes (GRN), 9. Quality Inspection, 10. Purchase Invoices, 11. Supplier Payments, 12. Purchase Returns, 13. Supplier Directory, 14. Supplier Ledger, 15. AP Aging Analysis, 16. Import LC Tracker, 17. Purchase Reports, 18. Purchase Settings.
4. Backend & Frontend Implementation:
   - Models: `backend/src/models/PurchaseRequisition.ts`, `GoodsReceiveNote.ts`, `PurchaseInvoice.ts`, `SupplierPayment.ts`, `PurchaseReturn.ts`, enhanced `Supplier.ts`, and `PurchaseOrder.ts`.
   - Services: `backend/src/services/PurchaseRequisitionService.ts`, `GrnService.ts`, `PurchaseInvoiceService.ts`, `SupplierPaymentService.ts`, `PurchaseReturnService.ts`, `PurchaseDashboardService.ts`, extended `SupplierService.ts`.
   - Controller & Routes: `backend/src/controllers/PurchaseController.ts`, `backend/src/routes/erp/purchaseRoutes.ts` mounted at `/api/v1/erp/purchase`.
   - Automated Verification: `backend/src/services/verify-purchase-service.ts` (38 assertions passed, 0 failed).
   - Frontend: `frontend/src/types/index.ts`, `frontend/src/services/purchase.service.ts`, `frontend/src/components/erp/ErpPurchaseView.tsx`, `frontend/src/components/erp/ErpPurchaseView.css`.
   - Routing: Integrated into `frontend/src/app/erp/page.tsx`, `frontend/src/app/erp/purchase/page.tsx`, and `frontend/src/app/admin/purchase/page.tsx`.

Verification: Execute `src/services/verify-purchase-service.ts` (38 assertions passed, 0 failed), run `npm run build` on both frontend (58/58 static pages generated) and backend, and verify HTTP 200 on `/erp/purchase`.
```

---

### Prompt 68: SUN BIRD ERP – MODULE 06: INVENTORY & FEFO MANAGEMENT
```text
Task: Implement an enterprise-grade Inventory & FEFO Management system within Sun Bird Corporation ERP without rebuilding or redesigning existing modules.

Technical Requirements:
1. End-to-End Inventory & Stock Movement Architecture:
   - Multi-Warehouse Management: Central hubs, branch warehouses, and retail showrooms with geofenced coordinates and district tagging.
   - Warehouse Locations / Bins: Zone, aisle, rack, shelf location management with capacity and volumetric utilization tracking.
   - Real-data Stock Overview: Physical, Reserved, Available (Physical - Reserved), In-Transit, Damaged, and Expired stock buckets calculated in real time without double-counting.
   - First-Expiry-First-Out (FEFO) Allocation: Strict sorting by expiryDate ascending across sellable non-expired batches with FIFO fallback.
   - Stock Reservation: Order and quote locks decrementing sellable stock and incrementing reservedQty with full release recovery.
   - Inter-Warehouse Stock Transfer: Source stock deduction, immutable TRANSFER_OUT ledger logging, IN_TRANSIT status, and destination batch receipt with TRANSFER_IN ledger logging.
   - Stock Adjustment: DAMAGED, EXPIRED, THEFT, COUNT_VARIANCE, REVALUATION, SCRAP, and INITIAL_STOCK adjustments with double-entry GL Journal Voucher integration (DR/CR 1300 Inventory Asset vs 5300/5400 Shrinkage/Damage Expenses).
   - Physical Stock Count & Reconciliation: Full, cycle, category, and zone counts with automated count variance calculation and auto-posted reconciliation adjustments.
   - Damaged & Expired Stock Management: Write-down tracking, quarantine bins, and near-expiry risk categorization (Expired, Critical ≤30d, Warning ≤60d, Attention ≤90d).
   - Immutable Stock Movement History: Audit ledger tracking with reference documents (TRANSFER, ADJUSTMENT, PHYSICAL_COUNT, ORDER, GRN).
   - Reorder & Low Stock Alerts: Deficit calculation against minStockQty threshold with PO reorder triggers.
2. 18 Submodules Accordion & Full ERP Integration:
   - Under Inventory & FEFO, introduce an expandable accordion with 18 submodules:
     01. Inventory Dashboard, 02. Stock Overview, 03. Warehouse Management, 04. Warehouse Locations / Bins, 05. Batch / Lot Management, 06. Expiry Management, 07. FEFO Allocation, 08. Stock Reservation, 09. Stock Transfer, 10. Stock Adjustment, 11. Physical Stock Count, 12. Stock Reconciliation, 13. Damaged / Expired Stock, 14. Stock Movement History, 15. Reorder & Low Stock Alerts, 16. Inventory Reports, 17. Inventory Settings, 18. Inventory Activity Logs.
3. Backend & Frontend Implementation:
   - Models: `backend/src/models/WarehouseBin.ts`, `StockTransfer.ts`, `StockAdjustment.ts`, `PhysicalCount.ts`, enhanced `ProductBatch.ts`, `Warehouse.ts`, and `StockLedger.ts`.
   - Services: `backend/src/services/WarehouseBinService.ts`, `StockTransferService.ts`, `StockAdjustmentService.ts`, `PhysicalCountService.ts`, `InventoryEngineService.ts`.
   - Controller & Routes: `backend/src/controllers/InventoryManagementController.ts`, `backend/src/routes/erp/inventoryManagementRoutes.ts` mounted at `/api/v1/erp/inventory-management` and `/api/v1/erp/inventory`.
   - Automated Verification: `backend/src/services/verify-inventory-module.ts` (56 assertions passed, 0 failed).
   - Frontend: `frontend/src/types/index.ts`, `frontend/src/services/inventoryManagement.service.ts`, `frontend/src/components/erp/ErpInventoryManagementView.tsx`, `frontend/src/components/erp/ErpInventoryManagementView.css`.
   - Routing: Integrated into `frontend/src/app/erp/page.tsx` under the 'inventory' tab.

Verification: Execute `src/services/verify-inventory-module.ts` (56 assertions passed, 0 failed), run `npm run build` on both frontend (58/58 static pages generated) and backend, and verify zero TypeScript errors.
```

---

### Prompt 69: SUN BIRD ERP – MODULE 07: COMPLETE DOCUMENT MANAGEMENT, DYNAMIC TEMPLATE BUILDER & AUTOMATED DOCUMENT ENGINE
```text
Task: Implement an enterprise-grade Document Management System, Central Dynamic Document Engine, and Visual Template Builder within Sun Bird Corporation ERP without rebuilding or redesigning existing modules.

Technical Requirements:
1. Universal Central Document Engine:
   - Data Resolvers: Automatic cross-entity resolution for Organization Branding (logos, letterheads, signatories, stamps, BIN/VAT), Customer Profiles, Supplier Profiles, and Product Specifications.
   - Dynamic Layout & Multi-Template Architecture: Multiple templates per business document (e.g. Standard PO, Detailed PO, Bangla PO, Somorita Hospital Quotation) without duplicating underlying transactional records.
   - Calculation & Math Engine: Subtotal, item discount, document-level discount, VAT/tax, shipping, and grand total with floating-point rounding precision.
   - Dual-Language Currency Words Engine: English and authentic Unicode Bangla currency conversion (Taka and Paisa across Crore, Lakh, Thousand tiers).
   - High-Fidelity PDF Generation: PDFKit pipeline with configurable margins, brand headers, dynamic tabular columns, totals, terms, and dual signatories with stamps.
   - Immutable Historical Snapshots: Snapshotting issued and approved documents preserving exact visual and numerical state irrespective of future template or organization edits.
   - Accounting & GL Integration: Double-entry Journal Voucher creation for Money Receipts (Receipt vouchers) and Credit Notes (Journal vouchers).
2. 18 Submodules Navigation:
   - Under Invoice & Quotation navigation:
     01. Document Dashboard, 02. Sales Quotation, 03. Proforma Invoice, 04. Sales Invoice, 05. Delivery Challan, 06. Money Receipt, 07. Credit Note, 08. Purchase Order, 09. Purchase Invoice, 10. Document Template Builder, 11. Organization Document Branding, 12. Logo & Letterhead Management, 13. Signature Management, 14. Seal / Stamp Management, 15. Terms & Conditions Library, 16. Print Settings, 17. Document Numbering, 18. Document Activity Logs.
3. 3-Panel Visual Template Builder:
   - Left Palette: Tool controls (paper size A4/Letter/Legal, orientation, language EN/BN/Bilingual, toggle subtotals, VAT, and Amount in Words).
   - Center Canvas: Real-time rendered A4 document canvas with interactive column headers, dynamic item rows, totals calculation, terms block, and signatures.
   - Right Inspector: Column property editor (label, field, width, alignment, format, delete) and intro/closing text notes.
4. Backend & Frontend Implementation:
   - Models: `backend/src/models/DocumentTemplate.ts`, `SalesQuotation.ts`, `ProformaInvoice.ts`, `MoneyReceipt.ts`, `CreditNote.ts`.
   - Services: `backend/src/services/AmountInWordsService.ts`, `DocumentCalculationService.ts`, `DocumentDataResolver.ts`, `DocumentTemplateService.ts`, `SalesDocumentService.ts`, `DocumentPdfService.ts`.
   - Controller & Routes: `backend/src/controllers/DocumentManagementController.ts`, `backend/src/routes/erp/documentManagementRoutes.ts` mounted at `/api/v1/erp/documents` and `/api/v1/erp/document-templates`.
   - Automated Verification: `backend/src/services/verify-document-module.ts` (51 assertions passed, 0 failed).
   - Frontend: `frontend/src/types/index.ts`, `frontend/src/services/documentManagement.service.ts`, `frontend/src/components/erp/ErpDocumentManagementView.tsx`, `frontend/src/components/erp/ErpDocumentManagementView.css`.
   - Routing: Integrated into `frontend/src/app/erp/page.tsx` under the 'documents' tab.

Verification: Execute `npm run test:document-module` (51 assertions passed, 0 failed), run `npm run build` on both frontend (58/58 static pages generated) and backend, and verify zero TypeScript errors.
```

---

*Document v1.5 — Backend Master Prompts Blueprint — Sun Bird Corporation Integrated Cloud ERP Platform*  
*Node.js · Express.js · TypeScript · MongoDB Atlas · Redis BullMQ · Next.js 16+*


---

## PROMPT 69: MODULE 08 — COMPLETE ACCOUNTS, FINANCE, PARTNERSHIP & FINANCIAL MANAGEMENT
```
Implemented Module 08: Accounts, Finance, Partnership and Financial Management extending the existing double-entry accounting engine without duplicate ledgers.

1. Architecture & Core Accounting Engine:
   - Double-Entry Enforcement: Strict debit = credit balance verification in Mongoose pre-validate hook and AccountingService, rejecting unbalanced vouchers.
   - General Ledger & Running Balance: Dynamic aggregation across journal entries computing progressive debit/credit running balances per account.
   - Dual-Tier Approval Integration: Low-value vouchers auto-posted, high-value (>1,000,000 BDT) staged for multi-signatory approval workflow.
   - Idempotency & Concurrency: Idempotency keys preventing duplicate financial postings during concurrent API calls.
   - Organization Isolation: Multi-tenancy isolation via organizationId across all ledger and financial collections.

2. Submodules & Capabilities:
   - 01. Accounts Dashboard: Real-time financial summary (Assets, Liabilities, Equity, Working Capital, Revenue, Expenses, Net Profit), Alerts, Cash Flow breakdown, and Recent Vouchers.
   - 02. Chart of Accounts (COA): 5 core categories (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE), normal balance rules, parent-child hierarchies, and active status tracking.
   - 03. General Ledger: Detailed drilldown per account code with date filtering and progressive balances.
   - 04. Journal Vouchers: Multi-line journal vouchers with double-entry balance check, draft/approval/post workflow, and reversal with audit tracking.
   - 05. Cash Book & Bank Book: Inflows (Receipts) and Outflows (Payments) mapped to GL accounts with real-time balance calculations.
   - 06. Bank Reconciliation: Monthly bank statement line matching against posted journal vouchers with variance reconciliation.
   - 07. Accounts Receivable (AR): Aging analysis (<30, 31-60, 61-90, >90 days), top debtors, customer ledgers, and Money Receipt allocation to invoices.
   - 08. Accounts Payable (AP): Aging buckets, top creditors, supplier ledgers, and Supplier Payment recording with purchase invoice allocation.
   - 09. Partnership Management: Partner profiles, initial capital, additional equity contributions, drawings/withdrawals, annual profit distribution preview & posting via JV, and settlement.
   - 10. Budget Management: Annual/quarterly budgets per account with Budget vs Actual variance analysis and percentage utilization.
   - 11. Financial Reports: Real-time Trial Balance (Debit = Credit verification), Profit & Loss Statement (Gross/Operating/Net profit), Balance Sheet (Assets = Liabilities + Equity), Cash Flow Statement, and Financial Analysis ratios.
   - 12. Accounting Settings: Per-organization default account code mapping and approval threshold automation.

3. Backend & Frontend Implementation:
   - Models: `Budget.ts`, `BankReconciliation.ts`, `PartnerTransaction.ts`, `AccountingSettings.ts`, extended `ChartOfAccounts.ts`, `JournalEntry.ts`, `Partner.ts`, `PurchaseInvoice.ts`.
   - Services: `CashBankService.ts`, `BankReconciliationService.ts`, `ReceivablePayableService.ts`, `PartnerFinancialService.ts`, `BudgetService.ts`, `AccountsDashboardService.ts`, extended `FinancialReportService.ts`.
   - Controller & Routes: `AccountingController.ts` (30+ handlers), `accountingRoutes.ts` (40 endpoints) mounted at `/api/v1/erp/accounts`.
   - Verification: `backend/src/services/verify-accounting-module.ts` (37 assertions across 14 test suites, 100% passed).
   - Frontend: `frontend/src/services/accounting.service.ts` (359 lines), `frontend/src/components/erp/ErpAccountingView.tsx` (real API-connected with 10 tab views and 9 modal workflows).

Verification: Execute `npm run test:accounting-module` (37 assertions passed, 0 failed), run `npm run build` on backend (0 errors) and frontend (0 errors), and verify zero TypeScript compilation issues.
```

---

## PROMPT 70: MODULE 09 — ORDER PROCESSING & E-COMMERCE INTEGRATION
```
Implemented Module 09: Complete Order Processing & E-Commerce Integration in the Sun Bird Corporation ERP & E-commerce application without modifying existing architecture, public website, or database collections.

1. Architecture & Core Workflow Engine:
   - Order-to-Delivery Lifecycle: Managed complete transition matrix across SUBMITTED -> CONFIRMED -> PROCESSING / RESERVED -> PICKING / PICKED -> PACKED / READY_FOR_DISPATCH -> DISPATCHED / IN_TRANSIT -> DELIVERED, preventing invalid status jumps.
   - Atomic FEFO Reservation Engine: First-Expired-First-Out batch inventory reservations allocating exact quantities on ProductBatchModel without duplicate allocations.
   - Multi-Carton Packing: Generates structured packages with carton types, weights (kg), dimensions (L x W x H in cm), packaging materials, and barcode numbers.
   - Physical Stock Ledger Posting: Permanent deduction from batch inventory and posting to StockLedgerModel upon delivery confirmation (movementType: DISPATCH).
   - Dual-Rail Payment & COD Settlement: Advance payment recording and verification for digital channels (bKash, Nagad, Bank Transfer) alongside courier COD cash collection and deposit account reconciliation.
   - Official Document Engine: Automatic generation of NBR Mushak-6.3 Delivery Challan and Sales Invoices using sequential counter sequences.
   - Public Customer-Facing Tracking: Privacy-masked 5-stage delivery tracker accessible via order number or consignment code.
   - Full Audit Logging: Chronological audit trail using AuditLogService.record across all order status transitions, stock locks, payments, and cancellations.

2. Submodules & Capabilities (23 Submodules):
   - 01. Order Processing Dashboard: KPIs (Total Orders, Total Value, Delivered, In Transit, Pending Verification, Due), status/channel distributions, and daily trends.
   - 02. Online Orders: E-commerce online orders queue with customer contacts, delivery instructions, and quick confirmation actions.
   - 03. Sales Orders: B2B direct and manual sales orders creation with multi-item line pricing, item-level discounts, and VAT/tax computation.
   - 04. Order Details: Drawer modal displaying customer address, item lines, payment records, stock reservations, timeline events, and action triggers.
   - 05. Payment Verification: Verification and rejection workflow for bank transfers and mobile wallets with transaction reference checking.
   - 06. Order Approval: High-discount and high-value order approval gates requiring manager authorization.
   - 07. Order Reservation: Batch allocation monitor with one-click reserve and release functionality.
   - 08. Stock Availability: Real-time inventory check across warehouses and bins reporting physical, reserved, and sellable stock.
   - 09. Order Picking: Warehouse picking list generator with barcode scanning simulation, item verification, and completion workflow.
   - 10. Order Packing: Packing session creation with multiple package configurations, gross weights, and dimensions.
   - 11. Packing List: Manifest and shipping label view with package-level item contents.
   - 12. Dispatch Management: Logistics integration supporting Steadfast Courier, Pathao, and Own Fleet with tracking numbers and dispatch notes.
   - 13. Delivery Management: Delivery confirmation with receiver identity, contact, signature/photo evidence, and automatic stock ledger deduction.
   - 14. Delivery Tracking: Real-time 5-stage visual progress timeline (Ordered -> Confirmed -> Packed -> Dispatched -> Delivered).
   - 15. Partial Delivery: Split order fulfillment recording delivered quantities per line item and marking remaining items pending.
   - 16. Order Cancellation: Cancellation modal with reason capture and automatic release of reserved batch inventory.
   - 17. Sales Return Integration: Links delivered orders to RMA and returns processing for damaged or rejected products.
   - 18. Order Timeline: Chronological tamper-proof event audit log tracking every user and system touchpoint.
   - 19. Order Documents: One-click generation and preview of official Delivery Challans and Sales Invoices.
   - 20. Customer Order History: Customer purchase history view reporting lifetime order count and total spend.
   - 21. Order Reports: Fulfillment performance, cancellation reasons, and COD collection reports with date and warehouse filtering.
   - 22. Order Activity Logs: Centralized audit trail filtered by ORDER_PROCESSING module.
   - 23. Order Settings: Organization-level workflow toggles (auto-confirm, auto-reserve, COD limits, courier partners, discount thresholds).

3. Backend & Frontend Implementation:
   - Models: Extended `Order.ts` with organization, warehouse, timeline, payment records, and status fields; created `OrderReservation.ts`, `PickingSession.ts`, `PackingSession.ts`, and `OrderSettings.ts`.
   - Services: `OrderProcessingService.ts`, `OrderReservationService.ts`, `OrderPickingPackingService.ts`, `OrderDispatchDeliveryService.ts`, `OrderPaymentVerificationService.ts`, `OrderTimelineReportService.ts`.
   - Controller & Routes: `OrderProcessingController.ts` (30 handlers), `orderProcessingRoutes.ts` (30 endpoints) mounted at `/api/v1/erp/orders`.
   - Automated Verification: `backend/src/services/verify-order-module.ts` (58 assertions across 15 test steps, 100% passed).
   - Frontend: `frontend/src/services/orderProcessing.service.ts`, `frontend/src/types/index.ts` (`OrderSubmodule`), `frontend/src/components/erp/ErpOrdersView.tsx` (all 23 submodules connected to real APIs), `frontend/src/app/erp/page.tsx` (23-submodule sidebar accordion).

Verification: Execute `npm run test:order-module` (58 assertions passed, 0 failed), run `npm run build` on backend (0 errors) and frontend (58/58 static pages generated in Next.js 16.4.5 Turbopack, 0 errors).
```


---

## PROMPT 71: MODULE 10 — COMPLETE HRM, EMPLOYEE MANAGEMENT, ATTENDANCE, LEAVE, PAYROLL & EXPENSES
```
Implemented Module 10: Complete HRM, Employee Management, Attendance, Leave, Payroll & Salary Management inside Sun Bird Corporation ERP with zero duplicate collections and strict double-entry General Ledger integration.

1. Architecture & Business Logic:
   - Central Employee Master: In-place extension of `EmployeeProfile` with organization isolation, structured personal/contact data, emergency contacts, employment milestones, and salary structure linking.
   - Geofenced & Biometric Attendance: GPS distance verification with configurable geofencing threshold, grace period (15m default), automated late flag calculation, and bulk biometric punch importing.
   - Leave Accrual & Balance Control: Annual quota initialization, paid vs unpaid leaves, balance deduction validation preventing negative balances, and multi-tier approval workflow.
   - Automated Salary & Payroll Batch Computation: Earnings (Basic, HRA, Medical, Conveyance, Allowances), deductions (Tax, Loan installments, Salary advances), and net pay calculation.
   - Real-Time Double-Entry General Ledger Posting: Automated generation and posting of balanced Journal Vouchers via `AccountingService.createJournalVoucher()`:
     * Accrual: Debit Salaries Expense (6110), Credit Accrued Salaries (2100).
     * Salary Advance: Debit Employee Advances (1150), Credit Bank/Cash (1020).
     * Expense Reimbursement: Debit Respective Expense Account, Credit Bank/Cash (1020).
     * Settlement & Disbursement: Debit Accrued Salaries (2100), Credit Bank/Cash (1020), transitioning advances to RECOVERED.
   - Full Audit Logging: Auditing every create, update, approval, and disbursement using AuditLogService.

2. Submodule Coverage (52 Submodules):
   - 01-15 Employee Management: HR Dashboard, Employee Management, Employee Directory, Employee Profile, Employee Onboarding (interactive checklist), Employee Offboarding (departmental clearance: IT, Accounts, Admin, HR), Departments, Designations, Job Grades, Employment Types, Employee Documents, Employee ID Card (digital view with blood group and QR payload), Employee Contacts, Emergency Contacts, Organization Chart.
   - 16-24 Attendance & Schedules: Attendance Management, Attendance Dashboard, Attendance Entry (GPS Geofence + Biometric), Attendance Import, Attendance Correction Requests & Processing, Shift Management, Shift Assignment, Roster Management, Holiday Management.
   - 25-32 Leave & Overtime: Leave Management, Leave Requests, Leave Approval, Leave Types, Leave Balance Tracking, Leave Calendar, Overtime Management, Late & Early Leave Tracking.
   - 33-43 Payroll & Payslips: Payroll Management, Payroll Dashboard, Salary Structure, Salary Components, Salary Assignment, Payroll Processing (batch compute), Payroll Review, Payroll Approval, Salary Payment (bank transfer/cash disbursement), Payslip (digital itemized view and print format), Payroll History.
   - 44-47 Loans, Advances & Claims: Employee Loan (installment schedule generation), Employee Advance (request, approval, disbursement with journal vouchers), Loan Repayment, Expense Reimbursement (receipt submission, managerial approval, accounts settlement).
   - 48-52 Performance, Analytics & Administration: Performance Management (KPI metrics, scoring, increments), Training & Development (programs, certifications, attendee tracking), HR Reports (Headcount report, Payroll analytics), HR Audit Logs, HR Settings (work days, grace periods).

3. Backend & Frontend Implementation:
   - Models (21 Models in backend/src/models/): Department, Designation, JobGrade, EmploymentType, Shift, RosterSchedule, Holiday, AttendanceCorrection, LeaveType, LeaveRequest, LeaveBalance, SalaryComponent, SalaryStructure, PayrollBatch, Payslip, EmployeeAdvance, ExpenseReimbursement, PerformanceReview, TrainingRecord, HrSettings, extended EmployeeProfile.
   - Services: EmployeeManagementService, AttendanceShiftService, LeaveManagementService, PayrollCalculationService, EmployeeLoanAdvanceService, HRAuxiliaryService.
   - Controller & Routes: HrmController (50+ handlers), hrmRoutes.ts (60+ endpoints) mounted at /api/v1/erp/hrm.
   - Automated Verification: backend/src/services/verify-hrm-module.ts (51 assertions across 19 test suites, 100% passed).
   - Frontend Types & Service: frontend/src/types/index.ts (HrmSubmodule), frontend/src/services/hrm.service.ts (60+ typed API client functions).
   - Frontend UI: frontend/src/components/erp/ErpHrmView.tsx (real API-connected view with 6 KPI cards, 5 modal workflows, tables for all submodules), frontend/src/app/erp/page.tsx (52-submodule sidebar accordion under 07. HR & Payroll).

Verification: Execute `npm run test:hrm-module` (51 assertions passed, 0 failed), run `npm run build` on backend (0 errors) and frontend (58/58 static pages generated in Next.js 16.4.5 Turbopack, 0 errors).
```

---

## PROMPT 72: HRM EMPLOYEE DETAILS SHEET — DESKTOP SHEET EXTENSION (AUTO ID, AGAINST LOOKUP, QUALIFICATION, BLOOD GROUP, AUTO GRADE, PRINT, CSV DOWNLOAD & UPDATE)
```text
Task: Implement a full-featured desktop-style Employee Details Sheet in Sun Bird Corporation ERP (/erp/hrm) matching the legacy desktop HR sheet layout, with auto serial employee ID generation, replacement (against) tracking, educational qualification, blood group, auto job grade population, printable format, CSV data export, and complete record management.

1. Business Logic & UI Features:
   - Auto Serial Employee ID: Generates sequential next employee ID (e.g., SBC-EMP-001) using MongoDB atomic counter via GET /api/v1/erp/hrm/employees/next-code on clicking "Add".
   - Replacement / Against Tracking: "Against ID" and "Against Name" (কার পরিবর্তে যোগদান) records who the employee is replacing, with real-time employee code lookup and automatic name population.
   - Educational Qualification: Full entry support for "Qualification" (text) and "High Qualification" (H.S.C, S.S.C, Bachelor/Degree, Masters, Diploma, PhD, Other).
   - Blood Group & Demographics: Standard blood group selection (A+, A-, B+, B-, O+, O-, AB+, AB-), nationality, religion, age, gender, marital status, NID, father/husband name, mother name.
   - Designation-Linked Auto Job Grade: Automatically assigns Job Grade (Grade-A, Grade-B, Grade-C) based on designation hierarchy with manual override.
   - Salary & Allowances: Joining salary, current salary, allowance breakdown, and overtime fields.
   - Leave & Attendance Overview: Numeric counters for Leave Report (CL, SL, WP, ML, EL, GH), WP comment box, and attendance count with signature check.
   - Print Layout: Formatted window.print() view with Sun Bird Corporation official letterhead, complete tabular employee profile, and signature blocks.
   - Data Download: One-click CSV/Excel export of complete employee dataset with UTF-8 BOM encoding.
   - Desktop Toolbar & Navigation: Record navigation (◄◄ First, ◄ Prev, ► Next, ►► Last), Add, Edit, Update, Cancel, Print, Data Download, Resigned List filter, and full tabular "Display" toggle.

2. Backend Implementation:
   - Models: Extended `EmployeeProfile.ts` with 33 sheet fields (againstId, againstName, fatherOrHusbandName, motherName, age, qualification, highQualification, jobGrade, joiningSalary, currentSalary, allowance, overtime, dateOfModify, jobDuration, cityDistrict, depSl, salSl, idCardGiven, isResigned, leaveReport, etc.).
   - Service: Extended `EmployeeManagementService.ts` with `getNextEmployeeCode()` and user auto-creation when registering new employees directly from the sheet.
   - Controller & Routes: `HrmController.ts` delegating create/update to EmployeeManagementService; added `/employees/next-code` route in `hrmRoutes.ts`.
   - Validator: `hrm.validator.ts` updated with optional userId/basicSalary and passthrough support for extended attributes.

3. Frontend Implementation:
   - Component: `frontend/src/components/erp/EmployeeDetailsSheet.tsx` (compact desktop layout, reactive against lookup, auto-grade assignment, navigation, inline editing, printable sheet, CSV export).
   - Integration: Connected into `frontend/src/components/erp/ErpHrmView.tsx` under the `employee-management` submodule.
   - Service: Extended `frontend/src/services/hrm.service.ts` with typed EmployeeProfileData interface and `getNextEmployeeCode()` method.

Verification: Backend test suite `npm run test:hrm-module` passed with 51/51 tests (100%), TypeScript compiled with 0 errors across both backend and frontend (`tsc --noEmit`), and HTTP 200 verified on `/erp/hrm`.
```


---

## PROMPT 73: MODULE 11 — BANNERS, SOCIAL MEDIA, MARKETING & CONTENT MANAGEMENT WITH GEMINI AI CO-PILOT
```text
Task: Implement MODULE 11 — Banners, Social Media, Marketing & Content Management in Sun Bird Corporation ERP and E-Commerce storefront with end-to-end Google Gemini AI Co-Pilot integration across all content generation, campaigns, SEO, and social media copy.

1. Business Logic & Marketing Engine Architecture:
   - Centralized Marketing Hub: Full organization multi-tenancy (organizationId) isolation across all campaigns, banners, landing pages, social accounts, and content items.
   - Website Banners & Homepage Sliders: Main, Hero, Promotional, Category, Product, Brand, Sidebar, Footer, Mobile, and Custom banners with responsive breakpoints, hex colors, overlay controls, and sequential display ordering.
   - Secure Public Display Safeguard: Public endpoints (/api/v1/public/marketing/*) strictly enforce status = 'PUBLISHED', approvalStatus = 'APPROVED', startDate <= now <= endDate, and organization matching. Never displays draft, rejected, or expired banners.
   - Promotional Campaigns: Sequential campaign code generation (CMP-YYYY-XXXX), multi-tier discounts (PERCENTAGE, FIXED_AMOUNT, BUY_X_GET_Y, FREE_SHIPPING), budget tracking, coupon code integration, and quorum approval routing.
   - Content Versioning & Rollback: WebsiteContent and LandingPage records preserve complete historical versions array with author and timestamp; one-click instant rollback capability.
   - Multi-Platform Social Media: Official account connection management (Facebook, Instagram, LinkedIn, YouTube, X), platform character length validation, multi-variant post generation, scheduled auto-publishing, and calendar heatmaps.
   - Gemini AI Co-Pilot Integration: Full integration with Google Gemini 1.5 Pro via @google/genai SDK (MarketingAiService.ts) with human-in-the-loop safeguards and domain-tailored deterministic medical fallbacks. Capabilities include:
     * Banner copy & CTAs
     * Campaign concept, strategy & target audience
     * Multi-platform social captions & trending hashtags
     * SEO metadata, meta title, meta description & keywords
     * Promotional landing page structure & hero copy
     * Content optimization & Tone/Readability enhancement
   - Automated Publishing Scheduler: MarketingSchedulerService automated background jobs for auto-activation, expiration, and social post publishing.
   - Performance & Attribution Analytics: Aggregated real KPIs (campaign counts, status breakdown, spend, clicks, impressions, platform content distribution) with zero fabricated statistics.

2. Submodule Coverage (31 Submodules under 08. Banners & Social):
   - 01-07 Dashboard & Promotions: Marketing Dashboard, Website Banners, Homepage Sliders, Promotional Campaigns, Product Promotions, Category Promotions, Brand Promotions.
   - 08-13 Website & Content: Landing Pages, Website Content, Homepage Sections, Promotional Popups, Announcement Bar, Navigation Menu Management.
   - 14-20 Social Media & Calendars: Social Media Management, Social Media Accounts, Social Media Content, Social Media Calendar, Content Planner, Marketing Calendar, Campaign Scheduler.
   - 21-26 Creative & Publishing: SEO Management, Media Gallery, Content Templates, Content Approval, Scheduled Publishing, Published Content.
   - 27-31 Analytics & Logs: Campaign Analytics, Social Analytics, Marketing Reports, Marketing Settings, Marketing Activity Logs.

3. Backend & Frontend Implementation:
   - Models (9 Models in backend/src/models/): WebsiteBanner, MarketingCampaign, MarketingPromotion, LandingPage, WebsiteContent, SocialAccount, SocialPost, NavigationMenu, MarketingSettings.
   - Services (7 Services in backend/src/services/): MarketingCampaignService, BannerSliderService, WebsiteContentService, SocialMediaService, MarketingSchedulerService, MarketingAnalyticsService, MarketingAiService.
   - RBAC & Permissions: Registered 'marketing' module in permissionRegistry.ts with 9 granular actions.
   - Controller & Routes: MarketingController.ts, marketingRoutes.ts (ERP routes mounted at /api/v1/erp/marketing), publicMarketingRoutes.ts (Storefront public routes at /api/v1/public/marketing).
   - Frontend Types & Service: frontend/src/types/index.ts (MarketingSubmodule), frontend/src/services/marketing.service.ts (typed API client with AI helper functions).
   - Frontend UI: frontend/src/components/erp/ErpMarketingView.tsx, ErpMarketingView.css (responsive layout, 31 submodules, modal forms with AI Co-Pilot auto-generation buttons, audit log viewer, printable views).
   - Public Website Integration: HeroBanner.tsx and AnnouncementBar.tsx reactively consuming live published banners/announcements with graceful fallbacks.
   - ERP Navigation: frontend/src/app/erp/page.tsx updated with expandable accordion for "08. Banners & Social" housing all 31 submodules.

4. Verification:
   - Automated Backend Test Suite: backend/src/services/verify-marketing-module.ts executed with 12/12 test suites passing (100%).
   - Strict TypeScript Compilation: backend/tsconfig.json and frontend/tsconfig.json both compile with 0 errors (`tsc --noEmit`).
```


---

## PROMPT 74: MODULE 12 — IMPORT / LC TRACKER & AI-POWERED IMPORT MANAGEMENT SYSTEM
```text
Task: Implement MODULE 12 — Import / LC Tracker & AI-Powered Import Management System in Sun Bird Corporation ERP with end-to-end Google Gemini AI Co-Pilot integration across all document workflows, LC lifecycle management, shipment tracking, customs clearance, landed cost calculations, and risk mitigation.

1. Business Logic & Import Management Architecture:
   - Centralized Import Hub: Strict organization isolation (organizationId) across all import purchase orders, proforma invoices, LCs, shipments, customs documents, payments, and landed cost records.
   - Comprehensive LC Lifecycle: Complete management of LC application, 3-tier FX tracking (Opening Rate, Customs Assessment Rate, Final Bank Settlement Rate), bank margins, expiry dates, and presentation periods.
   - Immutable LC Amendment History: Multi-amendment version tracking (V1 -> V2 -> Vn), preserving previous values, recording changed clauses, approval signatures, and bank confirmations without overwriting history.
   - Shipments & Vessel Tracking: Multi-shipment support against single LC, BL/AWB mapping, container numbers, transshipment events, and port dwelling tracking against 4-day statutory port free days.
   - Customs & Port Demurrage: Bill of Entry recording with automated statutory duty calculations (Customs Duty, Regulatory Duty, Supplementary Duty, VAT, AIT, Advance Tax), port handling charges, and C&F agency fees.
   - Double-Entry Accounting Posting: Balanced Journal Voucher generation via AccountingService for import disbursements (LC Margins: Debit 1160, Credit 1020; Customs: Debit 1200, Credit 1020; Foreign Supplier Settlement: Debit 2010, Credit 1020).
   - Capitalized Landed Cost Calculation: Integration with LandedCostService allocating expenses (BY_VALUE, BY_WEIGHT, BY_QUANTITY) to inventory batches and moving WAC capitalization upon customs clearance.
   - Contextual Gemini AI Co-Pilot Integration (ImportAiService.ts):
     * AI Document Reading & OCR Data Extraction: Structured field extraction from Proforma Invoices, Commercial Invoices, and Packing Lists.
     * AI Cross-Document Comparison: Side-by-side discrepancy detection (PI vs PO, Commercial Invoice vs PI) with mismatch severity scoring.
     * AI Shipment Delay & Demurrage Risk Prediction: Transit time analysis, feeder vessel queue risk, and proactive port dwell alerts.
     * AI Landed Cost Advice: Heuristic expense categorization, anomaly detection, and optimal allocation method recommendations.
     * Contextual Import AI Assistant: Natural language question answering with live database metrics and suggested action plans.
     * AI Executive MIS Summaries: Automated management narratives for monthly import registers and financial exposure reports.

2. Submodule Coverage (34 Submodules under 09. Import / LC Tracker):
   - 01-09 Management & LC Lifecycle: Import Dashboard, Import Purchase Requisition, Import Purchase Order, Proforma Invoice (PI), Import Supplier Management, LC Application & Opening, LC Amendment Management, LC Register, Bank & Financial Documents.
   - 10-18 Shipment & Shipping Docs: Shipment Management, Shipment Tracking, Commercial Invoice, Packing List, Bill of Lading (BL), Airway Bill (AWB), Certificate of Origin, Insurance Documents, Inspection Certificates.
   - 19-26 Customs, Costing & GRN: Customs & Port Clearance, Bill of Entry, Duty VAT & Tax Management, Freight & Logistics Expenses, Import Payment Management, LC Margin & Bank Charges, Landed Cost Calculation, Import Goods Receive (GRN) Integration.
   - 27-34 Repository, AI & Governance: Import Document Management, Import Approval Center, Import Alerts & Notifications, Import AI Assistant, Import MIS & Analytics, Import Reports, Import Settings, Import Activity & Audit Logs.

3. Backend & Frontend Implementation:
   - Models: Extended ImportLC, extended LandedCost, unified ProformaInvoice, LCAmendment, ImportShipment, ImportDocument, CustomsClearance, ImportPayment, ImportRiskAlert, ImportSettings.
   - Services: ImportLcService, ImportShipmentService, ImportFinanceService, ImportDocumentService, ImportAnalyticsService, ImportAiService.
   - Permissions: Registered 'import' module in permissionRegistry.ts with 14 granular actions.
   - Controller & Routes: ImportController.ts, importRoutes.ts mounted at /api/v1/erp/import.
   - Frontend Types & Service: ImportSubmodule in frontend/src/types/index.ts, import.service.ts typed API client.
   - Frontend UI: ErpImportTrackerView.tsx, ErpImportTrackerView.css (15 KPI cards, AI Co-Pilot banner, data tables, modals for LC/PI/Shipment/Customs/Payment, and AI assistant drawer).
   - ERP Navigation: frontend/src/app/erp/page.tsx updated with expandable sidebar accordion "09. Import / LC Tracker" with all 34 submodules.

4. Verification:
   - Automated Backend Test Suite: backend/src/services/verify-import-module.ts executed with 29/29 test suites passing (100%).
   - Strict TypeScript Compilation: backend/tsconfig.json and frontend/tsconfig.json both compile with 0 errors (`tsc --noEmit`).
```
