# FINAL DATA FLOW AUDIT
## SUN BIRD ERP & E-COMMERCE PLATFORM
**Generated:** 2026-11-21  

### 1. Architectural Data Flow Overview
Data flows in Sun Bird ERP follow strict multi-tier validation, authorization, and encapsulation principles:

```
[Client (Next.js React 19)]
        │
        ▼ (HTTPS REST / Bearer JWT / Zod Schema)
[Express 5 API Gateway]
        │
        ├──> Tenant Guard (`organizationId` extraction)
        ├──> Auth & RBAC Guard (`verifyToken`, `checkPermission`)
        ├──> Rate Limiter & Sanitize
        │
        ▼
[Business Service Layer]
        │
        ├──> Atomic Transactions (`mongoose.startSession()`)
        ├──> Domain Invariant Enforcer (FEFO, Double Entry, 3-Way Match)
        ├──> Audit Logging (`AuditLogModel` with SHA-256 hash chaining)
        │
        ▼
[MongoDB 8.0 & Redis 7.2]
```

---

### 2. Verified Critical Data Flows

#### 2.1 E-Commerce Public Order to ERP Order & Warehouse FEFO
1. **Public Order Creation:** User adds Mindray Patient Monitor to cart. `CartContext` requests 15-minute reservation from backend via Redis TTL key `lock:stock:{sku}`.
2. **Checkout Submission:** Cart validates customer phone, address, and delivery zone. Calls `POST /api/v1/orders`.
3. **Backend Order Pipeline:**
   - Validates public prices vs DB catalog (prevents client price tampering).
   - Deducts reserved stock and assigns specific batch numbers using FEFO (First-Expired, First-Out).
   - Generates unique Order No (`ORD-YYYYMMDD-XXXX`).
   - Emits asynchronous event to BullMQ queue for Courier Consignment creation (Pathao/Steadfast) and SMS notification.
4. **Accounting Linkage:** Automatically posts unearned revenue or accounts receivable and VAT payable journal entry.

#### 2.2 Purchase Order to GRN to Landed Cost & General Ledger
1. **Purchase Requisition (PR):** Department raises PR. Routed to Financial Approval engine (`ApprovalRequestModel`).
2. **Purchase Order (PO):** Upon approval, PO is finalized and dispatched to vendor.
3. **Goods Receiving Note (GRN):** Warehouse manager inspects physical arrival, enters batch number, manufacturing date, and expiry date.
4. **3-Way Matching:** System verifies PO quantities vs GRN received vs Supplier Invoice amount. If variance <= 0%, status flags as `MATCHED`.
5. **Inventory Capitalization:** Calculates landed cost: `(FOB Price + Freight + Customs Duty + Clearing Agent Fee) / Units`.
6. **Journal Entry:** Debits Inventory Asset (1003), Credits Accounts Payable (2001).

#### 2.3 Import LC Tracking & Landed Cost Capitalization
1. **LC Opening:** Bank opens LC under Bangladesh Bank Guidelines. Margin deposited.
2. **Milestone Tracking:** Marine insurance cover note, Bill of Lading (B/L) issued, ETA Chattogram port tracked.
3. **Customs Clearance & Bill of Entry:** Duty, regulatory duty, VAT, and AIT recorded against LC ID.
4. **Landed Cost Apportionment:** Landed cost engine calculates landed cost per SKU based on weight/CBM apportionment.
5. **Inventory Update:** Inventory valuation ledger updated to exact capitalized landed cost.

#### 2.4 RMA Claim to Technical Inspection to Replacement/Credit
1. **Customer RMA Request:** Serial number validated against database sales records and warranty expiration date.
2. **Physical Receipt & Diagnostics:** Service engineer inspects device, records issue classification, logs replacement parts.
3. **Disposition:**
   - *Repair:* Repaired and returned under warranty.
   - *Replacement:* Replacement unit allocated from reserve buffer; new serial number registered.
   - *Credit Note:* Financial credit note issued, updating accounts receivable ledger.

#### 2.5 AI Assistant Request Pipeline
1. **Query Ingestion:** User asks business question in ERP AI Assistant (`POST /api/v1/ai/dispatch`).
2. **Permission & Tenant Scoping:** AI service bounds query scope to authenticated user's `organizationId` and assigned RBAC modules.
3. **Redaction Filter:** Sanitizes sensitive PII (customer phone numbers, passwords, raw salary records).
4. **Tool Execution:** Executes read-only queries against MIS aggregation services.
5. **Gemini 1.5 Pro Processing:** Model synthesizes executive summary and business insight.
6. **Audit Trail:** Query and tool calls recorded in `AuditLogModel` for compliance.
