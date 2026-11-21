# FINAL DATABASE AND DATA FLOW REPORT
## SUN BIRD ERP & E-COMMERCE PLATFORM
**Generated:** 2026-11-21  

### 1. Database Architecture & Collections Audit
- **Database Engine:** MongoDB 8.0 with Mongoose 8.x ODM
- **Total Collections:** 32 Business and Operational Collections
- **Multi-Tenant Partitioning:** Logical tenant scoping via `organizationId` index on all operational documents.

| Collection Name | Model Class | Tenancy Scoped | Primary Compound Index | Integrity Invariant Verified |
| :--- | :--- | :--- | :--- | :--- |
| `organizations` | `OrganizationModel` | Root Entity | `{ organizationCode: 1 }` (unique) | Unique BIN, TIN, and org code |
| `users` | `UserModel` | Yes | `{ email: 1, organizationId: 1 }` | Password bcrypt hash with work factor 12 |
| `products` | `ProductModel` | Yes | `{ sku: 1, organizationId: 1 }` (unique) | Positive unit rates, valid medical HS Code |
| `batches` | `BatchModel` | Yes | `{ productId: 1, expiryDate: 1 }` | Available = Current - Reserved qty |
| `stockledgers` | `StockLedgerModel` | Yes | `{ productId: 1, warehouseId: 1 }` | Running balance equals sum of movement delta |
| `journalentries` | `JournalEntryModel` | Yes | `{ voucherNumber: 1, organizationId: 1 }`| Total Debits == Total Credits (৳0 variance) |
| `orders` | `OrderModel` | Yes | `{ orderNumber: 1, organizationId: 1 }` | Sequential order numbering, 15-min stock lock |
| `documenttemplates`| `DocumentTemplateModel`| Yes | `{ organizationId: 1, docType: 1 }` | Organization-specific header, stamp, signature |
| `auditlogs` | `AuditLogModel` | Yes | `{ organizationId: 1, timestamp: -1 }` | Tamper-evident SHA-256 hash chaining |

---

### 2. Transactional Data Flow Traces

#### Flow 1: Public E-Commerce Checkout -> Inventory Allocation -> Accounting
```
1. Customer initiates checkout on `/` (CheckoutModal).
2. Backend receives `POST /api/v1/orders`.
3. System acquires Redis TTL lock `lock:stock:{sku}` (900 seconds).
4. FEFO engine allocates stock from batch with earliest expiry date.
5. Order saved with status `CONFIRMED`.
6. Event dispatched to BullMQ for courier dispatch (Steadfast/Pathao).
7. Accounting service posts journal entry:
   Dr. Accounts Receivable / Cash in Transit (1001)
   Cr. Sales Revenue (4001)
   Cr. VAT Payable (2002) - 15% NBR VAT.
```

#### Flow 2: Purchase Order -> GRN -> 3-Way Match -> Landed Cost
```
1. Purchase Order approved via Quorum Approval hierarchy (`ApprovalRequestModel`).
2. Goods arrive at warehouse; Warehouse manager submits Goods Receiving Note (`GrnModel`).
3. 3-Way Match service compares PO unit prices, GRN accepted quantities, and Supplier Bill.
4. Capitalized landed cost per unit calculated: `(FOB + Insurance + Customs + Freight) / Units`.
5. Stock valuation ledger updated to exact capitalized landed cost.
```
