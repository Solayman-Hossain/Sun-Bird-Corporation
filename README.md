# Sun Bird Corporation — Enterprise Cloud ERP Platform

> **Bangladesh Statutory Compliant Cloud ERP for Medical & Diagnostic Equipment Import, Warehousing, Multi-Warehouse Distribution, Showroom POS, and Geofenced GPS HRM.**

---

## 🌟 Key Architectural Capabilities

- **Bangladesh Statutory Accounting Engine**: Double-entry ledger with automated balanced Journal Vouchers (Dr = Cr) and strict immutability checks (`JournalEntryModel`).
- **NBR Mushak-6.3 Tax Engine**: Automated calculation of 15% VAT, Supplementary Duty (SD), and NBR-compliant tax invoice issuance with 8-digit HS Code classification.
- **Quorum Multi-Director Approvals**: Tiered cryptographic digital approvals (SHA-256 + TOTP MFA) for high-value transactions (> 10 Lakh & > 50 Lakh BDT) across MD, Finance Director, and Admin Director.
- **Inventory FEFO & Serial Allocation**: First-Expired, First-Out (FEFO) batch allocation with WAC inventory valuation, unit serial tracking, and warranty cards.
- **B2B Customer Credit Exposure Gate**: Hard-lock protection preventing dispatch if outstanding credit exceeds approved limits or aging breaches 45 days.
- **Showroom POS Checkout Engine**: Single-transaction atomic checkout generating Order, Mushak-6.3 Invoice, Delivery Challan, Stock Deduction, and JV in a single ACID commit.
- **Geofenced GPS HRM & Payroll**: Haversine formula distance verification (<= 50m) for mobile attendance punches, 3-lates deduction, sales commission realization, and BDT 12,500 statutory wage floor.
- **Payment & Courier Gateways**: SSLCOMMERZ IPN webhook reconciliation, Pathao & Steadfast courier webhooks with automatic COD settlement.
- **Asynchronous Task Queues**: Redis-backed BullMQ workers for email, SMS, inventory alerts, and midnight cron jobs with exponential backoff.

---

## 📁 System Architecture & Directory Layout

```
Sun Bird Corporation/
├── Docs/                     # Master requirements, schemas, and prompt blueprint
│   ├── prompt.md             # Complete 55 Prompts Roadmap (Phases 1-9)
│   ├── Database-Schema.md    # 35 MongoDB Mongoose Schemas & Indexes
│   ├── prd.md                # Product Requirements Document
│   └── api-spec.md           # REST API Specifications
├── nginx/
│   └── nginx.conf            # Reverse proxy, rate limiting, gzip & security headers
├── backend/
│   ├── Dockerfile            # Multi-stage production container build
│   ├── package.json          # Node.js dependencies and test scripts
│   ├── tsconfig.json         # TypeScript compiler configuration
│   ├── jest.config.js        # Jest automated test runner config
│   └── src/
│       ├── config/           # Database, Redis, Logger, Environment setup
│       ├── models/           # 35 Mongoose models with compound indexes
│       ├── services/         # Core business logic services
│       ├── controllers/      # REST API request handlers
│       ├── routes/           # Express router endpoints (/api/v1/*)
│       ├── middlewares/      # JWT auth, RBAC, idempotency, error handling
│       ├── integrations/     # SSLCOMMERZ, Pathao, Steadfast, Gemini CS
│       ├── queues/           # BullMQ queues & worker processors
│       ├── seeders/          # Master database seeder
│       └── __tests__/        # Jest automated integration test suites
├── docker-compose.yml        # Multi-container orchestration (API, Redis, Mongo, Nginx)
└── README.md                 # Deployment runbook and technical documentation
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: v20.x or later
- **npm**: v10.x or later
- **Docker & Docker Compose**: v24.x+ (for containerized deployment)
- **MongoDB**: MongoDB Atlas URI or local MongoDB 7.0 replica set
- **Redis**: Redis 7.0+ (optional for background queues; system falls back gracefully if absent)

### 2. Environment Configuration
Navigate to the `backend/` directory and configure `.env`:

```bash
cd backend
cp .env.example .env
```

Ensure the following variables are set:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sunbird_erp?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379
JWT_SECRET=sunbird_super_secure_jwt_secret_key_2026
JWT_REFRESH_SECRET=sunbird_super_secure_refresh_secret_key_2026
```

### 3. Install Dependencies & Build
```bash
npm install
npm run build
```

---

## 🌾 Master Database Seeder

Sun Bird Corporation includes an idempotent master database seeder that initializes:
- **8 Core RBAC Roles** (`Super Admin`, `Managing Director`, `Director of Finance`, etc.)
- **4 Executive Users** (Super Admin, MD, Finance Director, Admin Director with bcrypt credentials)
- **40 Standard Chart of Accounts (COA)** (Codes 1010 through 6510)
- **3 Warehouses with GPS Coordinates** (Tejgaon Central Depot, Banani Showroom, Chittagong Depot)
- **4 Medical & Diagnostic SKUs** with NBR 8-digit HS codes, tiered pricing, and UOM conversions
- **Fiscal Year 2026 Sequence Counters**

To execute the seeder:
```bash
npm run seed
```

---

## 🧪 Automated Testing Suite

The ERP platform includes comprehensive unit and integration test suites covering critical business transactions:

### Run Jest Test Suite (Prompt 54)
```bash
npm run test:jest
```

**Test Coverage:**
- `src/__tests__/auth.test.ts`: Access/Refresh token rotation & reuse detection
- `src/__tests__/inventory.test.ts`: FEFO stock priority & medical unit serial tracking
- `src/__tests__/accounting.test.ts`: Balanced JV enforcement & Quorum Tier 3/4 triggers
- `src/__tests__/creditGate.test.ts`: Customer credit exposure limits & dispatch hard-locks
- `src/__tests__/pos.test.ts`: Single-transaction POS checkout with atomic billing & stock deduction
- `src/__tests__/payroll.test.ts`: GPS geofenced HRM payroll, lates deduction & statutory wage floor

---

## 🐳 Production Docker & Nginx Deployment (Prompt 55)

The production stack utilizes a multi-stage Docker build with an Alpine runner and an Nginx reverse proxy configured with rate limiting and security headers.

### 1. Build and Start All Services
From the root directory:
```bash
docker compose up --build -d
```

### 2. Verify System Health
```bash
# Direct API health check
curl http://localhost:5000/api/v1/health

# Nginx reverse-proxied health check
curl http://localhost/api/v1/health
```

Expected Response:
```json
{
  "status": "healthy",
  "service": "Sun Bird Corporation ERP API",
  "version": "1.0.0",
  "timestamp": "2026-10-25T13:25:00.000Z",
  "database": "connected"
}
```

### 3. Rate Limiting Zones (Configured in Nginx)
- **Public & Authentication Zone (`/api/v1/auth/*`)**: 120 requests/min (burst 20)
- **ERP Operations & Webhooks Zone (`/api/v1/*`)**: 300 requests/min (burst 50)
- **Security Headers**: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, CSP

---

## 📑 Completed Roadmap Verification

| Phase | Description | Prompts | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Foundation, Auth & Infrastructure | 1–7 | ✅ Complete |
| **Phase 2** | Products, Inventory & FEFO | 8–15 | ✅ Complete |
| **Phase 3** | Procurement & Landed Cost | 16–22 | ✅ Complete |
| **Phase 4** | Sales, POS & Logistics | 23–29 | ✅ Complete |
| **Phase 5** | Double-Entry Accounting & NBR VAT | 30–37 | ✅ Complete |
| **Phase 6** | Human Resources & GPS Geofenced Payroll | 38–42 | ✅ Complete |
| **Phase 7** | Quorum Approvals, CRM & Governance | 43–49 | ✅ Complete |
| **Phase 8** | Webhooks (SSLCOMMERZ, Courier) & BullMQ | 50–52 | ✅ Complete |
| **Phase 9** | Master Seeder, Testing & Production Deployment | 53–55 | ✅ Complete |

*Document v1.0 — Sun Bird Corporation Enterprise Cloud ERP Platform*
