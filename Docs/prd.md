Sun Bird Corporation Cloud ERP — Product Requirements Document (PRD)
Version: 1.3
Date: 14 October 2026
Status: Requirements baseline for implementation planning
Primary business: Sun Bird Corporation
Base currency: BDT (Bangladeshi Taka)
Primary language: Bangla and English (bilingual interface)
1. Product Vision
Build a secure, cloud-based, integrated business platform for Sun Bird Corporation that combines a public ecommerce storefront with a private, login-protected ERP. The public homepage must be an ecommerce storefront. All operational modules—inventory, purchasing/import, sales, accounts, HR/payroll, CRM, POS, assets, partnerships, loans, vendor/reseller management, reports, approvals and AI tools—must be accessible only after authorized users sign in to the ERP or a specifically authorized portal.
The system must support imported medical supplies, medical equipment, electrical/electronic items and general imported goods, with a scalable product catalogue of at least 5,000 SKUs.
2. Core Product Rule
Public website = ecommerce storefront. Private ERP = all internal operations.
- Visitors can browse public products and categories, search, view product details, contact the company, use the cart and proceed through the configured checkout flow.
- Internal modules must not appear as public pages or expose internal data to unauthenticated users.
- The public site may include a clearly labeled ERP Login link, but it must lead to a protected sign-in page.
- Customer, reseller, vendor and employee portals must enforce their own role and data-access boundaries.
- Ecommerce, POS, reseller and ERP sales must use one authoritative product master and inventory ledger.
3. Goals and Success Criteria
1. Present a professional, responsive ecommerce storefront as the homepage.
2. Maintain one authoritative product, batch, stock and order record across all sales channels.
3. Track batch number, expiry date, barcode/QR and FEFO for applicable products.
4. Support purchase/import workflows, landed costs, supplier comparisons and LC/import tracking.
5. Provide accounting with balanced double-entry journals, approval workflows and audit trails.
6. Support HR, biometric attendance, monthly payroll and controlled payroll adjustments.
7. Provide customer, vendor, reseller and partner management.
8. Protect salary, bank, purchase-cost, margin and partner-finance data by role.
9. Provide actionable dashboards and reports without replacing the underlying auditable transaction records.
10. Support secure backups, restore tests and controlled go-live.
4. User Types and Access
- Super Admin: system configuration, access policy and approved administration.
- Admin/Operations: operational setup and assigned business functions.
- Finance/Accounts: accounting, receipts, payments, journals, reconciliation and finance reports within assigned permissions.
- Sales: quotations, orders, invoices and customer follow-up.
- Inventory/Warehouse: receipts, transfers, stock counts, batch/expiry and dispatch.
- Purchase/Import: purchase requests, supplier quotations, purchase orders, import/LC records and landed costs.
- HR: employee records, attendance exceptions, payroll preparation and HR documents.
- Approver/Checker: approval of transactions within delegated limits; cannot approve own transaction.
- Ecommerce Manager: product publishing, ecommerce orders, offers and fulfilment coordination.
- Reseller: own account, permitted catalogue/pricing and own orders only.
- Vendor: own profile and permitted purchase/order documents only.
- Employee: own permitted profile, attendance and payslip information only.
- Customer: own profile, cart, orders, payments and order tracking only.
Access must be enforced on the backend/API, not only by hiding buttons or menus. Apply least privilege and log access to sensitive information. Consider MFA for privileged accounts.
5. Information Architecture and Routes
5.1 Public ecommerce routes
- / — ecommerce homepage
- /products — product catalogue
- /categories — category browsing
- /offers — approved promotions
- /about — company information
- /contact — contact details and enquiry form
- /cart — shopping cart
- /checkout — checkout, delivery and configured payment options
- /account — customer sign-in/profile
- /my-orders — authenticated customer's orders
- /track-order — order tracking with appropriate verification
- /privacy-policy, /terms, /shipping-policy, /return-policy — business-approved policies
5.2 Private ERP routes
- /erp/login
- /erp/dashboard
- /erp/inventory
- /erp/purchase
- /erp/imports
- /erp/sales
- /erp/accounts
- /erp/hrm
- /erp/payroll
- /erp/crm
- /erp/pos
- /erp/ecommerce-orders
- /erp/vendors
- /erp/resellers
- /erp/assets
- /erp/partnerships
- /erp/loans
- /erp/reports
- /erp/approvals
- /erp/settings
- /erp/audit-logs
5.3 Restricted portals
- /reseller — reseller portal
- /vendor-portal — vendor portal
- /employee-portal — employee self-service
Every protected route must validate session and permissions server-side. Direct URL access without permission must be denied.
6. Public Ecommerce Requirements
6.1 Homepage layout
- Company logo and navigation.
- Prominent product search.
- Category navigation and featured categories.
- Featured/new/popular products based on configured business rules.
- Approved offers and promotional banners.
- Product cards with image, name, SKU where appropriate, price or approved quote-required label, stock/availability indicator where safe, and product detail link.
- Company introduction, contact/support information and footer policy links.
- Cart and customer-account access.
- Clearly separated ERP Login link.
6.2 Product catalogue and detail pages
- Categories and subcategories.
- Search by product name, SKU, barcode or approved keywords.
- Filters such as category, brand, availability and other configured attributes.
- Product images, description, specifications, unit, SKU and approved public price.
- Show “Request a Quote” instead of price when configured for that product/customer segment.
- Do not reveal internal cost, margin, supplier price, internal stock movements or restricted notes.
- Product availability must be based on the shared stock service and must not promise stock that is already reserved or unavailable.
- Product metadata should support SEO title, description, canonical URL, structured data and sitemap generation.
6.3 Cart and checkout
- Add, remove and update quantities.
- Validate availability and price again at checkout.
- Capture customer contact, delivery address and delivery preference.
- Apply approved coupons/discounts and tax/shipping rules where configured.
- Create a unique order and payment reference.
- Support configured payment methods only; do not claim a payment provider is integrated until credentials and testing are complete.
- Handle pending, successful, failed, cancelled and refunded payment states.
- Prevent duplicate payment callbacks from creating duplicate payments or orders.
- Confirm order only according to the configured payment and fulfilment policy.
6.4 Customer account and order tracking
- Customer registration/sign-in and account recovery.
- View own order history and order details.
- Track order status and delivery where an integration or authorized update exists.
- Protect personal information and prevent enumeration of other customers' orders.
6.5 Ecommerce operations
Ecommerce orders must flow into the ERP order queue. Order acceptance, reservation, picking, dispatch, invoicing, payment reconciliation, cancellation and returns must update the same operational records used by the ERP and POS.
7. Private ERP Functional Modules
7.1 Dashboard
- Role-specific KPIs for sales, orders, inventory, receivables/payables, cash/bank, purchase, attendance and payroll as permitted.
- Date, business unit, category and other relevant filters.
- Drill-down from summary metrics to authorized source records.
- Clearly distinguish live values, period totals and manually entered estimates.
7.2 Product and inventory management
- Product master with unique SKU and configurable barcode/QR.
- Categories, brands, units of measure, specifications, images and status.
- Warehouses/locations, receipts, issues, transfers, returns, stock counts and adjustments.
- Batch/lot number and expiry date for applicable products.
- FEFO (First Expiry, First Out) pick recommendations for expiry-controlled goods.
- Reorder thresholds and low-stock alerts.
- Stock reservation for confirmed orders; release reservation on eligible cancellation/expiry.
- Inventory movement ledger with source document, actor, timestamp and reason.
- Do not directly overwrite on-hand stock without a controlled stock movement/adjustment.
- Duplicate SKU/barcode prevention and configurable permissions for product publishing.
7.3 Purchase, supplier and Comparative Statement (CS) management
- Supplier master, terms and contact information (local and foreign vendors).
- Purchase requisition, supplier quotation entry with MOQs and shipping timelines.
- Auto-Generated Comparative Statement (CS): System automatically compiles and formats comparative statements to evaluate supplier bids by pricing, lead time, and commercial terms.
- Compare supplier price, lead time, quality/terms and other configured criteria with AI CS Advisor assistance.
- Track ordered, received, pending and cancelled quantities.
- Link receipts and supplier invoices to accounting.
7.4 Import and landed-cost management
- Track import shipment, supplier, purchase order, LC/reference, shipment milestones and relevant documents.
- Record product quantities, currency, exchange rate and approved conversion rules.
- Record freight, insurance, duty, port, clearing, bank and other applicable landed-cost components.
- Landed Cost Calculator: Allocate landed cost by a configurable method (for example value, quantity or weight) approved by finance to determine exact unit cost.
- Keep original foreign-currency values and BDT accounting values where applicable.
- Require finance review for exchange-rate and landed-cost adjustments.
- Link batch/expiry and goods receipt records when applicable.
7.5 Sales, invoicing and editable document generation
- Editable Document Generator (Crucial Feature):
  - Editable Quotations: Draft, customize, version, and print or export customer price quotes before finalizing.
  - Editable Delivery Challans (চালান): Generate, customize, print, and track delivery notes for shipment dispatch with courier/driver reference and customer receiving acknowledgment.
  - Editable Invoices: Create, customize, edit (pre-posting), and print or email digital tax/sales invoices.
- Leads/quotes, sales orders, delivery challans, invoices, receipts, credit notes, returns and cancellations.
- Customer-specific pricing and discounts subject to permissions and approval limits.
- Credit limits and receivables tracking if enabled by finance policy.
- Every invoice, delivery challan, receipt and credit note has a unique reference.
- Sales posting must link to inventory and accounting according to approved accounting rules.
7.6 Point of Sale (POS)
- Fast product lookup by barcode/QR or SKU.
- Cart, approved discounts, customer selection, payment and receipt printing/export.
- Stock validation and immediate movement through the shared inventory ledger.
- Handle interrupted or retried requests idempotently to prevent duplicate sales.
- Configure cashier permissions, shift/cash reconciliation and refunds.
7.7 Accounts and financial management
- Chart of accounts, journal entries, cash/bank accounts, receipts, payments and reconciliation.
- Accounts receivable/payable, customer advances and supplier advances where applicable.
- General ledger, trial balance, income statement, balance sheet and cash-flow reporting as configured.
- Double-entry journals must balance: total debits equal total credits.
- Posted accounting records must not be silently deleted or edited; use reversal/adjustment entries.
- Closed accounting periods must reject unauthorized postings.
- Maker-checker approval and audit trail for controlled transactions.
- Financial reports must be traceable to underlying transaction IDs.
7.8 HRM and employee records
- Employee master, job/department/designation, joining and separation records, document records and status history.
- Role-controlled access to personal, salary and bank data.
- Employee lifecycle events with effective dates and approvals where required.
- Employee portal access to permitted personal data and documents.
7.9 Biometric attendance
- Integration approach depends on the selected ZKTeco/device model and supported protocol/API.
- Preserve raw device events as an immutable source log.
- Normalize logs, ignore duplicate events, match shifts and generate daily attendance.
- Support overnight shifts and approved attendance corrections.
- Route exceptions to authorized review before payroll finalization.
- Do not mark biometric integration complete until the actual device, protocol, network and test data are verified.
7.10 Monthly payroll
- Configurable salary components, earnings, allowances, overtime and authorized deductions.
- Payroll calculation: Net payable = gross earnings − authorized deductions − loan recovery.
- Attendance/LWP and other deductions require configured policy and authorization.
- Monthly payroll run with draft, review, approval, finalization and posting states.
- Payslips visible only to authorized HR/finance staff and the relevant employee.
- Prevent duplicate posting of the same payroll period/run.
- Finalized payroll changes must use an approved adjustment in a subsequent or designated period; preserve the original run.
- Statutory deductions, tax and benefits rules must be confirmed by the business and relevant advisers before production use.
7.11 CRM and customer service
- Customer and organization records, contacts, enquiry history, sales follow-ups and complaint/support tracking.
- Task reminders and assigned ownership.
- Customer data visible only to authorized roles.
- AI-assisted draft replies may be offered, but human review is required before sending business-critical messages.
7.12 Vendor and reseller portals
- Vendor: own profile and only authorized purchase/order/document information.
- Reseller: permitted catalogue, approved pricing/terms, own orders and statements as configured.
- No cross-vendor or cross-reseller access.
- Changes to payment terms, credit limits or pricing require permission and possibly approval.
7.13 Asset management
- Asset register, category, tag/serial number, purchase date/cost, custodian, location, warranty and status.
- Assignment, transfer, maintenance and disposal history.
- Depreciation method and useful life must be approved by finance before enabling depreciation posting.
- Asset transactions must link to supporting documents and accounting where applicable.
7.14 Partnership balance and profit/loss allocation
- Maintain partner capital, current accounts, contributions, withdrawals and approved allocations separately.
- The previously selected business rule is equal allocation among eligible partners; capital ratio does not automatically determine profit/loss allocation.
- Formula: distributable profit or loss ÷ eligible partner count.
- Define eligibility dates, treatment of new/exiting partners, rounding precision and deterministic residual handling before go-live.
- Require authorized approval and preserve the calculation basis and period.
7.15 Loan management
Support the following distinct loan/advance types:
- BANK_LOAN
- PARTNER_DIRECTOR_LOAN
- SUPPLIER_CREDIT
- EMPLOYEE_LOAN
- CUSTOMER_ADVANCE
- The business policy includes both interest-bearing and interest-free loans.
- Store principal, lender/borrower, type, start date, repayment schedule, interest terms (if applicable), outstanding balance and supporting contract/document.
- Interest must never be calculated for a loan explicitly marked interest-free.
- Interest rate, calculation method, frequency, day-count convention, fees and repayment allocation order must be configured from the actual contract and approved by finance.
- Repayments must be idempotent and must not be applied twice if a request is retried.
- Partner/director loans must be separate from partner capital/current account balances.
7.16 Reports and exports
- Sales, margin (restricted), inventory, batch/expiry, FEFO, purchases, import landed cost, receivables/payables, cash/bank, journals, HR, attendance, payroll, assets, partnership and loan reports.
- Date, status, warehouse, category and other relevant filters.
- Export to approved formats such as CSV/XLSX/PDF if implemented.
- Exports must apply the same permissions and sensitive-field restrictions as on-screen views.
- Report totals must reconcile to the underlying records and accounting ledger.
7.17 AI and automation
Potential assisted functions:
- Product descriptions, SEO titles and metadata drafts.
- Search keyword suggestions and catalogue categorization suggestions.
- Drafting routine notices, customer replies and internal summaries.
- Demand/reorder suggestions based on historical sales and stock data.
- Alerts for low stock, approaching expiry, overdue receivables, pending approvals and attendance exceptions.
AI output is advisory and must be reviewed before publishing, posting accounting entries, changing payroll, approving transactions or sending legally/financially significant communication. Do not send sensitive employee, customer or financial data to an AI provider unless the data-sharing terms and access controls have been approved.
8. Core Business Rules and Data Integrity
1. One authoritative product master and stock ledger for ecommerce, POS, reseller and ERP orders.
2. Stock is changed through traceable movements, receipts, issues, transfers, returns or approved adjustments—not silent edits.
3. Reserve stock according to the order acceptance policy and release it on eligible cancellation/expiry.
4. Use unique IDs for SKU/barcode where applicable, orders, invoices, payments, journals and source documents.
5. Use idempotency keys or equivalent safeguards for payment webhooks, posting actions, POS retries and loan repayments.
6. Posted journals must balance and be immutable except through reversal/adjustment.
7. Maker submits; checker approves; posting is a separate controlled action where required. A maker cannot approve their own transaction.
8. Approval states: Draft → Submitted → Pending Approval → Approved → Posted. Rejected transactions return to the maker for correction. Posted transactions require reversal/adjustment to correct.
9. Closed periods block unauthorized posting.
10. Payroll formula and finalized-run adjustment policy must be enforced consistently.
11. Equal partner allocation applies to eligible partners under the approved eligibility and rounding policy.
12. Interest-free loans must not accrue interest.
13. Customer, employee, vendor and reseller users can access only their own permitted records.
14. All sensitive actions require actor, timestamp, source record and reason where relevant.
15. Avoid hard deletion of posted/financial/stock transactions; use status transitions, reversals and retention rules.
9. Suggested Chart of Accounts Starting Point
The following codes are an illustrative starting structure and must be reconciled with the company's existing books and accountant before posting production transactions.

| Account Code | Account Name / Description | Category | Normal Balance |
| :--- | :--- | :--- | :--- |
| 1000 | Cash / Bank Accounts | Current Asset | Debit |
| 1100 | Employee Loan Receivable | Current Asset | Debit |
| 1200 | Inventory Ledger | Current Asset | Debit |
| 1300 | Supplier Advances | Current Asset | Debit |
| 2000 | Accounts Payable | Current Liability | Credit |
| 2100 | Bank Loan Payable | Liability | Credit |
| 2200 | Partner / Director Loan Payable | Liability | Credit |
| 2300 | Salary Payable | Current Liability | Credit |
| 2400 | Customer Advances | Current Liability | Credit |
| 2500 | Payroll Deductions Payable | Current Liability | Credit |
| 3000 | Partner Capital Account | Equity | Credit |
| 3100 | Partner Current Account | Equity | Credit |
| 3200 | Profit Appropriation / Retained Earnings | Equity | Credit |
| 4000 | Sales Revenue | Revenue | Credit |
| 5000 | Cost of Goods Sold (COGS) | Expense | Debit |
| 6000 | Salary & Wage Expense | Expense | Debit |
| 6100 | Interest Expense | Expense | Debit |
| 6200 | Training & Administrative Expense | Expense | Debit |



10. High-Level Data Model
Use MongoDB document collections with ObjectId references, embedded sub-documents, timestamps, status fields and audit metadata. The finalized schema (35 collections, Mongoose v8.x) is specified in [`Database-Schema.md`](file:///e:/Documents/Sun%20Bird%20Corporation/Database-Schema.md).
Core and security
- organizations, business_units, users, roles, permissions, user_roles, role_permissions, sessions, approval_limits, audit_logs, attachments, system_settings
Product and inventory
- products, product_categories, brands, units, product_barcodes, warehouses, warehouse_locations, batches, stock_movements, stock_balances (derived/reconciled), stock_reservations, stock_counts, stock_adjustments, expiry_alerts
Purchase and import
- suppliers, purchase_requisitions, supplier_quotations, quotation_lines, purchase_orders, purchase_order_lines, goods_receipts, goods_receipt_lines, supplier_invoices, import_shipments, lc_records, import_documents, landed_costs, landed_cost_allocations
Sales and customer
- customers, customer_addresses, quotes, quote_lines, sales_orders, sales_order_lines, invoices, invoice_lines, delivery_notes, payments, payment_allocations, credit_notes, returns, pos_sessions, pos_transactions
Ecommerce
- carts, cart_items, web_orders, web_order_lines, promotions, coupons, payment_events, shipments, tracking_events, customer_accounts
Accounts
- chart_of_accounts, accounting_periods, journal_entries, journal_lines, receipts, disbursements, bank_accounts, bank_reconciliations, ar_items, ap_items, tax_rules (if configured)
HR and payroll
- employees, departments, designations, employment_events, shifts, biometric_devices, biometric_raw_logs, attendance_days, attendance_exceptions, salary_components, payroll_runs, payroll_lines, payroll_adjustments, employee_loans, payslips
Vendor, reseller and CRM
- vendors, resellers, reseller_price_rules, crm_activities, enquiries, support_cases, tasks, notifications
Assets, partners and loans
- assets, asset_events, maintenance_records, partners, partner_capital_transactions, partner_allocations, loans, loan_schedules, loan_transactions, loan_interest_entries
Workflow and reporting
- approval_requests, approval_actions, idempotency_keys, scheduled_jobs, report_runs, backup_runs, integration_events
11. Technology Architecture (Finalized & Locked)
- Frontend: Next.js + TypeScript + Tailwind CSS, responsive web interface (Storefront, ERP Portal, POS).
- Backend/API: Node.js with Express.js + TypeScript, layered Clean Architecture (Controllers, Services, Repositories).
- Database: MongoDB Atlas (M10/M20 Dedicated Replica Set, Mongoose v8.x, 35 collections) with multi-document ACID transactions.
- Background processing: Redis 7.x + BullMQ for async jobs (notifications, SMS OTP, PDF/Excel generation, courier webhooks, recurring cron).
- Files: Secure Object Storage (AWS S3 / MinIO) with pre-signed URLs for invoices, challans, CS PDFs, product media, and exports.
- Authentication: Dual-Token JWT (15-min Access Token + 7-day HttpOnly Refresh Token), Argon2id hashing, and mandatory MFA (TOTP / SMS) for privileged director/admin roles.
- Integrations: SSLCOMMERZ (Cards, bKash, Nagad), Pathao Courier, Steadfast Courier, Greenweb SMS, ZKTeco ADMS biometric attendance sync.
- Deployment: Docker multi-stage containerization, NGINX reverse proxy, PM2 cluster / Kubernetes, automated CI/CD pipeline. Secrets managed via `.env` with `.env.example` template.
- Observability: Winston + Morgan centralized logging, Prometheus/Grafana metrics, Sentry error tracking, and immutable audit trail (`audit_logs`).
- Backups: Automated daily MongoDB Atlas snapshots + S3 write-once backups with 30-day point-in-time recovery (PITR) and verified quarterly test restores.
The public storefront (`/`) and private ERP (`/erp/*`) interact with the same authorized backend and authoritative business records. Public endpoints strictly filter out internal cost prices, margin percentages, and private ERP metadata.
12. Non-Functional Requirements
Security and privacy
- HTTPS in production.
- Backend-enforced RBAC and least privilege.
- Secure password storage and session handling.
- Rate limiting and abuse protection for authentication, checkout and public forms.
- Input validation, output encoding and protection against common web vulnerabilities.
- Secrets stored in deployment secrets management, not in the repository.
- Audit sensitive reads/changes as appropriate.
- Data retention and deletion policy approved by the business.
Reliability and performance
- Paginate large lists and use server-side filtering for large datasets.
- Index common lookup and reporting fields.
- Avoid long-running work inside web requests; use jobs for heavy exports/imports.
- Use transactions for inventory, accounting and order posting.
- Retry transient integrations safely with idempotency.
- Define target response times, availability and recovery objectives before launch.
Accessibility and usability
- Responsive desktop, tablet and mobile layouts.
- Clear error messages and validation.
- Consistent Bangla/English language handling and currency/date formatting.
- Keyboard-accessible forms and readable contrast.
13. Acceptance Criteria / UAT Checklist
Public ecommerce
- [ ] Unauthenticated visitor sees the ecommerce storefront at /.
- [ ] Internal ERP data and modules are not publicly accessible.
- [ ] Search, category browsing and product detail pages work.
- [ ] Checkout revalidates price and availability.
- [ ] Duplicate payment callback does not duplicate order/payment records.
- [ ] Customer can see only their own orders and tracking information.
Inventory and orders
- [ ] Ecommerce, POS and reseller orders update the same inventory ledger.
- [ ] Duplicate SKU/barcode rules work as configured.
- [ ] Batch and expiry are captured for expiry-controlled products.
- [ ] FEFO suggestion prioritizes the earliest eligible expiry.
- [ ] Stock cannot be oversold beyond the configured reservation/availability rules.
- [ ] Stock adjustment requires authorization, reason and audit entry.
Accounting and approvals
- [ ] Unbalanced journal is blocked.
- [ ] Maker cannot approve their own transaction.
- [ ] Posted transaction correction uses reversal/adjustment.
- [ ] Closed-period posting is blocked unless an authorized close/reopen policy permits it.
- [ ] Duplicate posting/retry does not create duplicate journals.
- [ ] Customer advance settlement cannot be applied twice.
Loans and partnership
- [ ] Interest-free loan produces no interest accrual.
- [ ] Interest-bearing loan follows the approved contract method and schedule.
- [ ] Duplicate repayment is ignored/rejected safely.
- [ ] Equal profit/loss allocation and rounding residual follow the approved policy.
- [ ] Partner loans remain distinct from partner capital/current balances.
HR and payroll
- [ ] Duplicate biometric events do not create duplicate attendance events.
- [ ] Overnight shift matching follows approved shift rules.
- [ ] Attendance exceptions require authorized resolution where configured.
- [ ] Payroll formula reconciles to earnings, deductions and loan recovery.
- [ ] Finalized payroll cannot be silently edited; adjustment workflow is available.
- [ ] Duplicate payroll posting is blocked.
- [ ] Unauthorized salary/bank access is denied and logged.
Operations and resilience
- [ ] Vendor/reseller/employee/customer accounts cannot access another party's records.
- [ ] Reports reconcile to underlying records and accounting ledger.
- [ ] Backup restoration is tested in a non-production environment.
- [ ] Integration failures are visible and can be retried without duplicate transactions.
14. Delivery Phases
Phase 0 — Discovery and decisions
- Confirm business workflows, legal/accounting policies, user roles and approval limits.
- Confirm current data sources, opening balances and migration approach.
- Select hosting, payment, shipping, biometric and notification integrations.
- Approve data model and UX wireframes.
Phase 1 — Foundation
- Repository, environments, authentication, RBAC, audit logging and core database.
- Product master, categories, warehouses and initial data import.
- Public ecommerce shell and protected ERP shell.
Phase 2 — Inventory, purchasing and ecommerce
- Stock ledger, batch/expiry, FEFO, reservations and stock count/adjustment.
- Supplier, purchase order, goods receipt and landed-cost workflows.
- Catalogue, cart, checkout, order queue and payment/shipping integrations.
Phase 3 — Sales, POS and accounting
- Quotes/orders/invoices/receipts/returns.
- POS and shared inventory posting.
- Chart of accounts, journal engine, approval flow, AR/AP and finance reports.
Phase 4 — HR, attendance and payroll
- Employee records, biometric ingestion, shift rules, attendance exceptions, payroll runs and payslips.
Phase 5 — CRM, portals, assets, partners and loans
- Customer support, vendor/reseller portals, assets, partner allocation and loan schedules.
Phase 6 — AI, reporting and hardening
- Approved AI-assisted tools, alerts, expanded reports, security testing, performance checks, backup/restore drill and UAT.
Phase 7 — Controlled go-live
- Migrate validated opening data, train users, reconcile totals, obtain sign-off and launch in stages with rollback plan.
15. Go-Live Decisions Required
The PRD establishes requirements but does not invent the following business-specific details. Confirm them before production configuration:
1. Legal company details, business units and warehouse structure.
2. Product categories, units, pricing policy, quote-only items and public stock visibility.
3. Partner eligibility rules, treatment of joining/leaving partners, allocation period and rounding method.
4. Loan contract rates, calculation method, frequency, day-count basis, fees and repayment allocation order.
5. Biometric model/protocol, device locations, network access and overnight shift rules.
6. Salary components, overtime, attendance cut-off, deductions, statutory rules and payroll approval authority.
7. Chart of accounts, opening balances, fiscal year, tax configuration and period-close rules.
8. Maker/checker roles, transaction approval limits and escalation rules.
9. Payment gateway, shipping provider, refund process and settlement reconciliation.
10. Supplier/customer/reseller terms, credit limits and price lists.
11. Asset depreciation policy and disposal rules.
12. Hosting provider, backup retention, recovery time and recovery point objectives.
13. Data migration scope, duplicate cleanup and reconciliation owner.
14. Privacy, data retention, AI provider/data-sharing approval and customer-facing policies.
16. Definition of Done
A module is complete only when:
- Its authorized user flows work end-to-end.
- Permissions are enforced server-side and tested with allowed and denied users.
- Validations, error states, audit trails and duplicate/retry handling work.
- Transactional records reconcile to inventory/accounting where applicable.
- UAT scenarios are passed and documented.
- User documentation/training notes are provided.
- Monitoring, backup and recovery expectations are met for the module.
- The module has been deployed and verified in the intended environment.
Important status note: This PRD is a product and implementation specification. It does not mean that the ERP, payment gateway, biometric integration, cloud deployment or any listed module has already been built, connected or tested.
17. Confirmed Business Decisions — 15 October 2026
This section records decisions confirmed by the business owner after reviewing the initial PRD gap register. Where the answer does not define a complete operational rule, the item is marked Pending configuration rather than being silently inferred.
17.1 Legal entity and company structure
- The ERP is for Sun Bird Corporation as one legal entity.
- Multi-company / multi-legal-entity accounting is not in the initial scope. The data model may retain a future extension path, but the first release must not present multiple legal entities as an available operating feature.
17.2 Release scope and target date
- Target go-live: 1 November 2026.
- Business intent is to bring all modules listed in this PRD into the first production release, including public ecommerce, inventory, purchase/import/LC, sales, accounting, HR/payroll, POS, CRM, assets, partnership accounting, loans, vendor/reseller/employee access where specified, reporting, approvals and AI-assisted features.
- This is a target, not a statement that the modules are already built or tested. A module may go live only after its required tests and approvals pass.
- Mandatory go-live gates: Migration Reconciliation, Security Testing, User Acceptance Testing (UAT), and Director Go/No-Go approval. The release plan must include a rollback/recovery approach.
17.3 Internal users and privileged access
- Initial expected internal user count: 5.
- Directors are the privileged decision-makers for access to sensitive information, including salary/bank data, purchase cost and margin, partner finance, and consolidated stock across all warehouses.
- Enforce permissions server-side and use least-privilege access. Director access must be explicitly provisioned to named accounts; it must not be implemented as a shared login.
- Warehouse, branch, reseller, vendor and customer account counts remain Pending configuration; the initial internal-user count does not determine the number of external accounts.
17.4 Fiscal year, accounting setup and migration
- Fiscal year: January–December.
- Existing records are expected to be supplied from Excel for migration.
- The three Directors will decide/approve the Chart of Accounts, inventory valuation method and opening balances before production posting.
- Migration must include duplicate checks, validation, opening-balance reconciliation and written sign-off. The exact Excel workbooks, data owners and reconciliation checklist remain Pending configuration.
17.5 Approval authority and segregation of duties
- The Admin role is the proposed routine transaction approver, with a stated threshold of BDT 1,000,000 (10 lakh).
- Transactions above BDT 1,000,000 must be referred to the three Directors for a decision.
- The precise treatment of a transaction equal to exactly BDT 1,000,000, whether all three Directors must agree unanimously or may decide by another rule, and whether approval is individual or joint must be documented before production. Until confirmed, the system should not assume a voting rule.
- Maker-checker segregation is mandatory: a user who creates a controlled transaction must not approve/post that same transaction. A separate authorized checker must approve it. Posting must be blocked until approval is complete.
- The approval matrix must cover purchase orders, discounts, stock adjustments, refunds, journals, payroll and loans. Emergency overrides, if any, require documented authorization and audit logging.
17.6 Product and inventory visibility
- Batch and expiry tracking is required for all products, per the business decision supplied. The implementation team should validate whether non-expiring goods need an explicit “not applicable” expiry state so that the rule remains usable for every SKU.
- Public customers must not see stock status or exact stock quantities on the public ecommerce storefront.
- Units of measure (piece, box, carton, set, etc.), conversion rules, and any product-specific exceptions remain Pending configuration.
17.7 Ecommerce refunds and remaining commerce rules
- Customer refunds are to be paid through a bank.
- Payment gateway, delivery provider, COD support, cancellation windows, return eligibility, refund timing, shipping charges, tax handling and settlement reconciliation remain Pending configuration. The PRD must not claim a gateway or delivery integration is selected until one is named and approved.
- The refund workflow must capture the original order/payment reference, refund approval, bank transaction/reference, amount, date, reason and reconciliation status, with appropriate audit history.
17.8 HR, mobile attendance and payroll
- Mobile-phone-based attendance is the intended approach.
- The Director responsible for Admin/HR will directly oversee HR operations, attendance, payroll policy, loan rules, backup and security oversight.
- Mobile attendance method (GPS/geofence, selfie, device binding, or another control), shift and overnight-duty rules, attendance cut-off, leave/overtime, payroll components, deductions, statutory treatment and bank payroll process remain Pending configuration and must be approved before the HR/payroll module is finalized.
- HR/payroll data must be protected by role-based access, audit trails and restricted exports.
17.9 Partnership accounting
- Eligible partners are intended to share profit and loss equally, regardless of their capital contribution ratio.
- Eligibility dates, new/retiring partner treatment, partial-period allocation, negative-profit handling and rounding residuals remain Pending configuration.
- “Cash/bank” was supplied as the intended context for partnership-related transactions; the exact posting and settlement workflow requires confirmation during detailed design.
17.10 Loan schedules
- Loan schedules may be entered manually as source terms, but the software must automatically calculate and generate repayment schedules from those terms.
- Interest method, rate, frequency, day-count basis, fees, repayment allocation order, early settlement and overdue rules remain Pending configuration. The generated schedule must be reviewable and auditable; it must not invent missing contractual terms.
17.11 Security, backup and AI
- The Director responsible for Admin/HR will directly oversee the stated operational areas of HR, backup and security. Named technical incident responders, emergency-access procedures, hosting region, uptime target, RTO/RPO and backup retention are still Pending configuration.
- AI features are intended to be included in the release, subject to security and data-protection approval.
- AI provider, processing terms, approved use cases, sensitive-data exclusions, retention and human-review requirements must be approved before production AI is enabled. No sensitive salary, bank, partner-finance or other restricted data may be sent to an external AI provider unless explicitly approved under a documented policy.
17.12 CRM, assets, portals and localization
- CRM must support a traditional lead/opportunity pipeline, not only enquiry history.
- Fixed-asset depreciation posting is required in the intended scope; the depreciation method, useful lives, residual values, posting frequency and disposal rules must be approved by the accounting decision-makers.
- Vendor, reseller and employee portals are intended to be private/internal-access portals, not public storefront pages. Any external vendor/reseller login must still be authenticated and limited to that party's own permitted records.
- Bangla is the default interface language, with English available as an alternative.
- Number format, timezone, date format and any locale-specific statutory display conventions remain Pending configuration. The application should use a single configured timezone consistently for transactions, audit events and reports.
18. Outstanding Configuration Decisions Before Production
The following items remain open even after the business answers above. The product team must obtain written approval rather than invent values:
1. Names and account access setup for the three Directors and five initial internal users.
2. Exact approval treatment at the BDT 1,000,000 boundary; unanimity vs other decision rule for the three Directors; emergency override rules.
3. Units of measure and conversion factors; expiry handling for product types that do not normally expire.
4. Excel source workbook inventory, field mapping, duplicate-cleanup owner and signed migration reconciliation totals.
5. Chart of Accounts, inventory valuation method, opening balances, accounting period-close rules, tax/VAT treatment and depreciation policy.
6. Payment gateway (if any), COD decision, delivery provider, cancellation/return rules, bank refund procedure and settlement reconciliation.
7. Mobile attendance controls, shift rules, overnight duties, leave, overtime, attendance cut-off, payroll components, deductions, statutory obligations and payroll approval.
8. Loan contract inputs and calculation rules; partnership eligibility and partial-period/rounding rules.
9. Hosting region, uptime target, RTO/RPO, backup retention, restore-test frequency, monitoring and incident escalation contacts.
10. AI provider and data-processing terms, approved use cases, prohibited data classes and human-review policy.
11. The first-day report list, report owners, sensitive export permissions, and portal account counts.
12. Timezone, date format, and Bangla/International numeral display preference.
19. Updated Go-Live Acceptance Gate
The target date of 1 November 2026 is accepted as a business target, but release approval requires all of the following:
- Excel migration completed and reconciled, with signed opening balances and stock quantities/values.
- Role and approval matrix tested, including Director-only sensitive data and maker-checker enforcement.
- Security testing completed, critical/high findings resolved or explicitly risk-accepted by authorized Directors, and backup restore demonstrated.
- UAT scenarios passed and documented for each module included in the release.
- Bank refund, accounting postings, stock movements, payroll/loan calculations and audit trails tested where those modules are enabled.
- Data protection and AI processing policy approved before AI is enabled in production.
- Three Directors have recorded the Go/No-Go decision. If a mandatory gate fails, delay the affected module or the release rather than bypassing the gate.
Status: This addendum records the business decisions provided on 15 October 2026. Items marked Pending configuration are not approved business rules and must be resolved before the affected production module is activated.
20. Payment Gateway and Cash on Delivery — Updated Decision (15 October 2026)
20.1 Cash on Delivery (COD)
- Cash on Delivery is REQUIRED (Must Have) for the public e-commerce checkout. Customers must be able to select COD, subject to configured delivery coverage and any approved order restrictions.
- COD is a payment method distinct from online payment. It must remain available even if an online payment gateway is integrated.
- The COD order must not be marked paid merely because it was confirmed, dispatched, or marked delivered. Payment collection and settlement must be recorded and reconciled.
- Required order/payment state handling must support, at minimum: order Pending/Confirmed/Dispatched/Delivered/Delivery Failed/Returned and payment Unpaid/Collected/Partially Settled (if supported)/Settled/Reconciled. Exact state transitions and whether partial COD is permitted remain configuration decisions.
- The system must record the collector (courier or own delivery staff), collection date/time, amount collected, delivery reference/proof where available, cash handover or courier remittance, fees/deductions, bank/cash receipt, and reconciliation status.
- Courier cash must be represented as a receivable/clearing balance until the remittance is received and reconciled. Own-driver collections must be handed over and acknowledged under a controlled cash process.
- Failed delivery, cancellation, return-to-origin, redelivery, customer refusal, short collection, lost remittance and COD refund scenarios must have auditable workflows and corresponding inventory/accounting effects.
- Pending configuration: courier provider(s), serviceable areas, delivery charges, COD fees, collection/remittance frequency, settlement evidence, return-to-origin fees, redelivery rules, partial COD support, order-value limits, cash handling limits and the approved return/cancellation policy.
20.2 SSLCOMMERZ online payment
- SSLCOMMERZ is the proposed online payment gateway, subject to merchant onboarding/approval, commercial terms, settlement-bank eligibility, API integration, security review and end-to-end testing. It is not to be described as already approved or live until those checks are complete.
- Online payment and COD must be separately selectable and separately reconciled. The system must support server-side transaction validation and verified gateway notifications; a browser redirect or success page alone is not proof of payment.
- Accounting must distinguish gross order value, gateway fees/adjustments, net settlement, refunds and chargebacks/disputes where applicable. Reconciliation must use gateway transaction and bank settlement references.
- Bank refunds remain the stated refund channel. Whether refunds are manual bank transfers or use an integrated gateway refund API, and the approval/processing SLA, remain pending.
- Pending configuration: merchant account status, current signed fees, supported channels, settlement cycle, refund/chargeback fees, credentials and secret management, webhook/IPN endpoint, retry/idempotency handling, settlement bank, and production activation approval.
20.3 Control and approval requirements
- COD collection, courier remittance, gateway settlement, refunds and adjustments must follow maker-checker controls: the person initiating a controlled transaction must not approve/post that same transaction.
- Payment credentials and secrets must be stored server-side in approved secret storage and must never be embedded in public/front-end code or committed to source control.
- Before go-live, UAT must cover successful and failed online payment, duplicate notification, delayed settlement, COD collection, courier remittance mismatch, failed delivery, return-to-origin, refund, and month-end reconciliation.
- The COD requirement is confirmed. SSLCOMMERZ remains a proposed provider pending verification; delivery operations and commercial/payment configuration remain open.

21. Finalized Configuration Specifications & Policy Resolutions (17 October 2026)
This section officially resolves all outstanding configuration decisions and policies previously flagged as open in Section 18 and Section 20, providing an authoritative and unambiguous baseline for development.

21.1 Organization & Privileged Governance
- Single Legal Entity: Sun Bird Corporation.
- Board of Directors (3): Managing Director (MD), Director (Admin & HR), Director (Finance & Commercial).
- Privileged Scope: All 3 Directors possess full visibility into salaries, bank statements, landed margins, supplier costs, and consolidated multi-warehouse stock.
- Initial Internal User Accounts (5):
  1. System Administrator / IT Operations
  2. Accounts & Finance Officer
  3. Commercial & Procurement Specialist
  4. Warehouse & Inventory Controller
  5. Sales & Showroom POS Cashier

21.2 Approval Limits & Quorum Rules
- Tier 1 (Up to BDT 1,00,000): Operational/Departmental Manager approval.
- Tier 2 (BDT 1,00,001 to 10,00,000): Admin / Operations Head approval.
- Tier 3 (BDT 10,00,001 to 50,00,000): Automatically routed to the Board of Directors; requires approval from at least 2 out of 3 Directors (Majority Quorum).
- Tier 4 (Above BDT 50,00,000, Partner Capital Withdrawals, or New Loans): Requires unanimous agreement from all 3 Directors (3 of 3 Unanimous Quorum).
- Maker-Checker Separation: Strictly enforced at API and database level. The user creating or drafting a transaction can never approve or post it.
- Emergency Overrides: Any bypass requires MFA, recorded reason, and an immediate notification alert dispatched to all Directors.

21.3 Inventory Valuation & Batch/Expiry Rules
- Valuation Method: Moving Weighted Average Cost (WAC) compliant with BAS / IAS-2.
  $$\text{Unit Cost}_{\text{new}} = \frac{(\text{On-Hand Qty} \times \text{Current Cost}) + (\text{Received Qty} \times \text{Landed Cost})}{\text{On-Hand Qty} + \text{Received Qty}}$$
- Landed Cost Apportionment: Landed import costs (duty, freight, clearing, L/C charges) are allocated across purchase order line items based on individual Line Item Value (FOB) by default, or gross weight for bulk shipments.
- Categorized Batch/Expiry Rules:
  - EXPIRY_CONTROLLED (Medical consumables, diagnostics, reagents): Mandatory Batch Number, Manufacturing Date, and Expiry Date. Enforces FEFO picking logic and generates automated near-expiry alerts at 90, 60, and 30 days.
  - NON_EXPIRING (Medical equipment, electronics, hardware, general goods): Mandatory Batch/Lot Number for warranty and L/C consignment tracking. Expiry Date is set to NULL / N/A, and stock is issued using standard FIFO.

21.4 Chart of Accounts (COA) & Excel Migration Specifications
- Standardized 4-digit Chart of Accounts across 6 core categories (35 essential accounts):
  - 1000–1999 (Assets): 1010 Cash on Hand (Till), 1020 Bank Account, 1030 MFS Clearing (bKash/Nagad), 1100 Accounts Receivable, 1150 Accounts Receivable — Courier Clearing (Pathao/Steadfast), 1200 Inventory Ledger, 1250 Inventory in Transit (L/C), 1300 Supplier Advances, 1810 Office Equipment, 1820 Machinery, 1830 Furniture, 1840 Vehicles, 1890 Accumulated Depreciation.
  - 2000–2999 (Liabilities): 2010 Accounts Payable, 2020 Import L/C Payable, 2050 Output VAT Payable, 2100 Bank Term Loan Payable, 2200 Partner/Director Loan Payable, 2300 Salary Payable, 2400 Customer Advances.
  - 3000–3999 (Equity): 3010 Partner Capital (MD), 3020 Partner Capital (Admin), 3030 Partner Capital (Finance), 3110 Partner Current Accounts, 3200 Retained Earnings, 3999 Opening Balance Equity Offset.
  - 4000–4999 (Revenue): 4010 E-Commerce Sales, 4020 Showroom POS Sales, 4030 Corporate Wholesale Sales, 4090 Delivery Fee Income.
  - 5000–5999 (COGS): 5010 Product Purchase Cost, 5020 Import Customs Duty, 5030 C&F & Port Charges, 5040 Freight & Shipping.
  - 6000–6999 (Operating Expenses): 6010 Staff Salaries, 6100 Rent, 6200 Utilities, 6300 Courier Freight & COD Charges, 6350 Gateway Fees (SSLCOMMERZ), 6400 Depreciation, 6500 Loan Interest.
- Migration Balancing Rule: Opening trial balances imported from Excel must balance perfectly:
  $$\sum \text{Debit Balances} - \sum \text{Credit Balances} = 0.00\text{ BDT}$$
  Any temporary opening equity adjustment is held in account `3999 Opening Balance Equity Offset` pending Director sign-off.

21.5 Courier API (Pathao & Steadfast) & Cash on Delivery (COD) Reconciliation
- Integrated Providers: Pathao Courier REST API & Steadfast Courier REST API.
- Automated Consignment Note: On order approval, ERP invokes the Courier API to generate the tracking ID and barcode label printed on the Delivery Challan (চালান).
- Accounting Flow for COD:
  1. Order Dispatch:
     Debit: 1150 Accounts Receivable — Courier Clearing (Pathao / Steadfast)
     Credit: 4010 E-Commerce Sales Revenue
     Credit: 2050 VAT / Output Tax Payable
  2. Delivery & Cash Remittance:
     Debit: 1020 Bank Account (Net cash received)
     Debit: 6300 Courier Delivery & COD Commission Expense
     Credit: 1150 Accounts Receivable — Courier Clearing
- Undelivered / Return-to-Origin (RTO): Restocked into inventory with condition inspection; return courier fee debited to Courier Expense.

21.6 Mobile Attendance Verification, Leave Management & HR Policies
- Verification Controls: Staff check-in via native Mobile App or PWA with mandatory GPS Geofencing (50-meter radius around registered office/warehouse coordinates) and Device Hardware Fingerprinting.
- Shift Schedule: Regular Shift 09:30 AM to 06:30 PM (Saturday through Thursday; Friday weekly off).
- Grace Period: 15 minutes (lateness recorded after 09:45 AM). Three consecutive late arrivals result in a 0.5-day salary deduction.
- Exceptions & Leave Integration: Missed punches and leave applications require digital submission and approval by Director (Admin & HR). Approved Casual Leave (CL), Sick/Medical Leave (SL), and Earned Leave (EL) explicitly suppress the automatic absenteeism deduction for the approved dates. Unapproved absences deterministically trigger Leave Without Pay (LWP) deduction in the monthly payroll run.
- Friday / Holiday Duty: Emergency weekend or public holiday duty assigned by Admin triggers either statutory Overtime (OT at 1.5x hourly rate) or Compensatory Off (C-Off) credit to the employee leave ledger.

21.7 Loan Amortization Engine & Repayment Hierarchy
- Supported Products: Commercial Bank Loans, Partner/Director Advances, and Employee Salary Advances.
- Interest Engine: Automated Reducing Balance Amortization. Interest-free loans are strictly flagged `is_interest_bearing = false` with zero interest accrual.
- Repayment Allocation Hierarchy:
  1. Outstanding Late Penalties / Contract Fees
  2. Accrued Interest
  3. Principal Repayment
- Rounding: All calculated monthly installments are rounded half-up to the nearest 1.00 BDT.

21.8 Fixed Asset Depreciation Engine
- Method: Straight-Line Method (SLM) calculated and posted monthly on the 1st of each month.
- Standard Depreciation Rates:
  - IT, Computers & Electronic Equipment: 25.0% annual (4 years useful life)
  - Medical & Showroom Equipment: 15.0% annual (6.67 years useful life)
  - Office Furniture & Fixtures: 10.0% annual (10 years useful life)
  - Vehicles & Delivery Transport: 20.0% annual (5 years useful life)
- Automated Posting:
  Debit: 6400 Depreciation Expense
  Credit: 1890 Accumulated Depreciation

21.9 Payment Gateway (SSLCOMMERZ) & Bank Refund SLA
- Channels: Cards (Visa, MasterCard, AMEX), Mobile Financial Services (bKash, Nagad, Rocket, Upay), and Net Banking.
- IPN Verification: Server-to-server webhook validated via SSLCOMMERZ transaction query API with SHA256 signature checks.
- Refund Policy: Customer refunds executed exclusively via Bank Transfer (BEFTN/NPSB) within a strict SLA of 2 business days following Return Quality Acceptance.

21.10 AI Integration Engine (4 Core Pillars & Fallback Architecture)
1. AI CS Advisor: Compiles multi-vendor bids, evaluates landed cost, lead time, MOQ, and computes the 100-point algorithm:
   $$\text{Score} = \text{Price Score (50)} + \text{Lead Time Score (25)} + \text{Payment Term Score (15)} + \text{Vendor Rating (10)}$$
   The engine highlights supplier risk factors (hidden freight, long shipping windows).
2. AI Content Generator: Automatically drafts SEO-optimized product titles, bilingual (Bangla & English) descriptions, and technical specifications for imported medical equipment and consumables.
3. AI Sales & Demand Forecasting: Evaluates 30/60/90-day sales velocity, seasonal trends, and lead times to generate intelligent reorder suggestions and buffer stock recommendations.
4. AI Smart Customer Support: 24/7 web chatbot widget integrated with order tracking and product catalog APIs to answer customer inquiries without human agent intervention.
- Fallback & Cost Guard: System enforces a sliding-window rate limit and response timeout (5 seconds) on Google Gemini API calls. If the API is unreachable or rate-limited, system falls back gracefully to rule-based scoring and static templates with zero downtime.

21.11 Localization & System Standards
- System Timezone: `Asia/Dhaka` (UTC+6) utilized consistently across database records, attendance punches, and transaction logs.
- Currency Symbol: `BDT (৳)`.
- Date Standard: `DD/MM/YYYY`.
- Numeral Display: International digits (`0–9`) formatted with South Asian comma grouping (`1,00,000.00` BDT) across financial statements and reports.

21.12 Medical Equipment Unit Serial Number, Warranty & RMA Engine
- Individual Serial Number Tracking: Every physical unit of imported medical equipment, diagnostic machinery, and electronics carries an immutable, unique Serial Number / QR Code tag bound to its parent batch and L/C consignment.
- Warranty Engine: Tracks warranty duration (e.g. 12, 24, 36 months) starting deterministically from customer Delivery Challan confirmation date.
- RMA (Return Merchandise Authorization) Lifecycle:
  1. Customer / Hospital logs warranty claim with Serial Number.
  2. ERP validates active warranty window and generates RMA Docket (`RMA-2026-0001`).
  3. Quality Control (QC) inspection categorizes disposition:
     - Minor Repair: Fixed in-house; labor/spares cost logged.
     - Replacement Unit: Defective unit transferred to `DEFECTIVE_RMA_HOLDING`; replacement unit issued under new Challan.
     - Factory Vendor Return: Exported back to foreign manufacturer under warranty replacement credit.

21.13 Sales Representative Performance Commission Engine
- Sales Attribution: Every showroom POS sale, corporate B2B quotation, and assisted e-commerce order tags an authenticated `salesRepId`.
- Commission Structure:
  - Base Commission: Configured percentage (e.g. 1.0% to 3.0%) on net collected revenue (excluding VAT and courier charges).
  - Target Accelerator: If monthly collected sales exceed individual sales quota (e.g. > BDT 10,00,000), commission rate accelerates by 0.5%.
- Payroll Integration: Commission is computed on the 28th of each month on realized (collected) funds and automatically injected into the monthly payroll run as `Sales Commission Earning`, itemized on the digital payslip.

21.14 B2B Customer Credit Limit, Credit Terms & Aging Analysis
- Credit Profile: Authorized corporate buyers (hospitals, diagnostic centers, institutions) carry configured Credit Limits (e.g. BDT 5,00,000) and Credit Terms (Net 15, Net 30, Net 60 days).
- Automated Credit Check Gate: On Sales Order placement, the ERP evaluates:
  $$\text{Effective Exposure} = \text{Current Outstanding AR} + \text{Unbilled Dispatches} + \text{New Order Value}$$
  If $\text{Effective Exposure} > \text{Approved Credit Limit}$, the order is locked in `CREDIT_LIMIT_EXCEEDED` and cannot be packed or dispatched without explicit digital approval from Director (Finance).
- AR Aging Ledger: Categorizes receivables into `0-30 Days`, `31-60 Days`, `61-90 Days`, and `> 90 Days Overdue` with automated overdue reminders sent to customer finance contacts.

21.15 Tiered Pricing Engine (Retail, Showroom & Reseller Wholesale)
- Multi-Tier Price Architecture: Products maintain 3 structured price points:
  1. Retail MRP: Public e-commerce storefront price.
  2. Showroom Price: Counter price with discretionary staff discount limit ($\le 5\%$).
  3. Reseller / B2B Wholesale Tier: Contractual tier pricing (Tier-1, Tier-2, Tier-3) accessible exclusively after authenticated login into `/reseller` or corporate sales order entry.
- Margin Protection Floor Guard: No user (except Director) can sell below the Moving Weighted Average Cost (WAC) plus minimum statutory VAT.

21.16 Multi-Level Unit of Measure (UOM) Conversion Engine
- Base Unit of Measure: All inventory ledgers store physical quantities in the lowest atomic Base Unit (e.g. `Piece`, `Kit`, `Vial`, `Meter`).
- Conversion Hierarchy:
  - Purchase UOM: e.g. `Carton` (1 Carton = 24 Boxes)
  - Wholesale UOM: e.g. `Box` (1 Box = 100 Pieces)
  - Sales UOM: `Piece` (Base Unit = 1)
- Automated Ledger Normalization: When goods receipt records 10 Cartons, the inventory ledger atomically increments by $10 \times 24 \times 100 = 24,000\text{ Pieces}$. POS sales in pieces decrement the single atomic balance seamlessly.

21.17 Inter-Warehouse Two-Step Transfer & In-Transit Protocol
- Handshake Protocol:
  1. Step 1 (Dispatch): Source Warehouse (e.g. Port Warehouse) creates Stock Transfer Order (`STO-2026-0001`). Stock moves from `Available` to `In-Transit Warehouse Location`. Transfer Challan and Gate Pass are printed.
  2. Step 2 (Receipt & QC): Destination Warehouse (e.g. Central Warehouse) scans barcode upon truck arrival.
     - If received quantity matches dispatch: Stock transferred to `Available Central Stock`.
     - If shortage/damage: Discrepancy is recorded with photos. Undamaged units are received; damaged/lost units auto-post to `5090 Stock Transit Loss Expense` with an insurance investigation flag.

21.18 Bangladesh NBR Mushak-6.3 & Customs HS Code Compliance
- Tax Invoice / Challan Standardization: Delivery Challans and Invoices comply with National Board of Revenue (NBR) Value Added Tax and Supplementary Duty Act 2012 (Form Mushak-6.3).
- Mandatory Fields:
  - Company BIN: Sun Bird Corporation 13-digit Business Identification Number.
  - Buyer BIN: Mandatory for corporate B2B clients claiming VAT input rebate.
  - H.S. Code (Harmonized System Code): 8-digit international customs tariff code attached to each medical and electronic SKU.
  - Segregated Tax Columns: Subtotal, Trade Discount, Supplementary Duty (SD), Value Added Tax (VAT @ statutory rate: 0%, 5%, 7.5%, 15%), and Grand Total.

22. Operational Resilience, Edge-Case Handling & Security Specifications (Validation Baseline)
This section incorporates the comprehensive engineering baselines established in Requirements.validation.md, codifying all missing flows, edge cases, error recovery architectures, security protections, validation rules, notification matrices, and disaster continuity protocols.

22.1 End-to-End Operational Lifecycles & Flow Specifications
22.1.1 Guest Checkout to Authenticated Customer Conversion
- Flow: When a guest customer places an order via mobile/email without signing up, the system creates an unverified profile with `is_guest = true`.
- Post-Checkout Action: The order confirmation and SMS tracking page provide a frictionless 1-click password setup. Setting a password sets `is_guest = false`, auto-linking all previous guest orders associated with that phone number and email address into the authenticated customer account.

22.1.2 Partial Fulfillment & Split Shipments
- Flow: If an order contains in-stock items and backordered or in-transit L/C items, the operations team can trigger a Split Dispatch.
- System Behavior: Generates individual Delivery Challans (e.g. `CH-001-A` and `CH-001-B`), each linked to unique Pathao/Steadfast consignment IDs. Delivery fees are applied only once, while inventory is decremented atomically as each consignment is packed.

22.1.3 Return-to-Origin (RTO) & Failed Delivery Flow
- Flow: If delivery fails after 3 courier attempts or customer rejects parcel at doorstep, the Courier API pushes a `FAILED_DELIVERY` event.
- ERP Action: Order transitions to `RTO_IN_TRANSIT`.
- Warehouse Inspection: When parcel physically returns, warehouse scans Challan barcode:
  - Undamaged items: Restocked into available inventory (`RESTOCKED`).
  - Damaged items: Transferred to `DAMAGED_TRANSIT_INVENTORY`, triggering an automated courier compensation claim.

22.1.4 Import L/C Amendments & Post-Clearance Cost Adjustments
- Flow: When a foreign supplier or bank amends an L/C, the system retains immutable version history (`LC-2026-01-V1` -> `LC-2026-01-V2`).
- Demurrage / Post-Clearance Expenses: If unexpected port demurrage, customs penalty, or extra clearing charges arrive after stock has already been received or partially sold, the ERP posts an automatic adjustment journal:
  - Debit: 5030 C&F & Port Charges (for units already sold)
  - Debit: 1200 Inventory Ledger (for remaining on-hand units)
  - Credit: 2010 Accounts Payable / 1020 Bank

22.1.5 Challan Gate Pass Revision & Tax Credit Note Engine
- Gate Pass Revision: If carton damage is discovered at the warehouse gate prior to departure, Challan status moves to `REVISED`. An amendment reason is recorded, stock reservation adjusted, and revised Challan `CH-XXXX-REV1` is printed.
- Invoice Cancellation / Return: Sales invoices are never hard-deleted. A formal Credit Note (`CN-XXXX`) is generated with linked reversal journals, auto-adjusting output VAT against NBR returns.

22.1.6 POS Showroom Shift Handover & Cash Discrepancy Protocol
- Shift Close: Cashier conducts physical cash count at till close.
- Discrepancy Handling:
  - Cash Shortage: Debit `1180 Cashier Shortage Receivable`, Credit `1010 Cash on Hand`. Requires Manager review.
  - Cash Overage: Debit `1010 Cash on Hand`, Credit `4080 Miscellaneous Cash Overages`.

22.1.7 Mid-Month Employee Full & Final Settlement (F&F) and Overnight Shift Matching
- Employee Separation: Pro-rated salary calculated for active days, active loan balance deducted from net pay, and remaining liabilities settled via formal F&F voucher.
- Overnight Shift Matching: Punches crossing midnight (e.g. 08:00 PM to 05:00 AM) are bound to the preceding day's shift ID using shift window tolerance (+/- 4 hours), preventing orphaned daily logs.

22.2 Edge Cases, Concurrency & Boundary Conditions
22.2.1 MongoDB Atlas Atomic Concurrency & Inventory Reservation (Last SKU Protection)
- Concurrency Protection: To prevent stock overselling when multiple web buyers and showroom cashiers attempt to purchase the last available unit simultaneously, stock queries execute atomic conditional decrement inside an Atlas replica set session:
  ```typescript
  const updatedStock = await StockBalanceModel.findOneAndUpdate(
    { sku: item.sku, availableQty: { $gte: item.quantity } },
    { 
      $inc: { availableQty: -item.quantity, reservedQty: item.quantity },
      $set: { updatedAt: new Date() }
    },
    { new: true, session }
  );
  if (!updatedStock) {
    throw new InsufficientStockException(`SKU ${item.sku} is out of stock.`);
  }
  ```
  The winning transaction reserves stock; subsequent concurrent requests fail gracefully with an `OUT_OF_STOCK` error.

22.2.2 7-Day Expiry Buffer Guard (Unsellable Buffer)
- Medical Regulatory Guard: Batches with `Expiry Date <= Current Date + 7 Days` are automatically locked from sale and excluded from FEFO pick recommendations, preventing shipment of expired medical consumables.

22.2.3 Three-Tier Foreign Exchange (FX) Accounting on L/C Settlements
- Realized FX Tracking: Distinguishes between L/C opening rate, customs assessment rate, and final bank settlement rate:
  Debit: 2020 Accounts Payable — Foreign Supplier (Opening Rate)
  Debit: 6510 Foreign Exchange Loss (or Credit 4095 FX Gain)
  Credit: 1020 Bank Account (Settlement Rate)
  Inventory asset valuation remains anchored to customs landing cost.

22.2.4 Banker's Half-Even Rounding & Cent Offset Account
- Rounding Engine: Multi-item invoices and VAT lines round to 2 decimal places using Banker's Rounding (Round-Half-Even). Any 0.01 BDT residual difference between debit and credit sums auto-routes to account `6299 Cent Rounding Adjustment`.

22.2.5 Deterministic Attendance Millisecond Grace Threshold
- Grace Enforcement: Check-in grace period is strictly evaluated as `<= 09:45:59.999`. A punch at `09:46:00` or later is deterministically flagged as `LATE`.

22.2.6 Net Salary Floor Guard
- Loan Recovery Rollover: Net payable salary cannot fall below 0.00 BDT. If authorized loan deductions exceed earnings due to unpaid leave (LWP), the unrecovered installment automatically rolls over into `Loan Arrears Balance`.

22.2.7 Redis 15-Minute TTL Stock Reservation for Cart Checkout
- Cart Reservation Expiry: Cart stock reservations hold a 15-minute Time-To-Live (TTL) in Redis. If payment confirmation is not received within 15 minutes, the key expires and stock reservation is automatically released back to public inventory.

22.3 Error Handling Architecture & Transaction Atomicity
22.3.1 SSLCOMMERZ Dropped Callbacks & Reconciliation Cron Job
- In addition to real-time server-to-server IPN webhooks, an automated background job executes every 10 minutes, querying the SSLCOMMERZ Transaction Query API for all orders stuck in `PENDING_PAYMENT` for over 15 minutes to guarantee payment recovery.

22.3.2 Idempotent Payment Webhook Processing
- The `payment_events` collection enforces a database-level unique compound index on `{ gatewayTransactionId: 1, provider: 1 }`. Duplicate or delayed callbacks return HTTP 200 OK immediately without double-posting accounting journals.

22.3.3 Courier API Timeout & BullMQ Exponential Backoff Queue
- If Pathao or Steadfast APIs return 500/503 errors during dispatch, orders transition to `DISPATCH_PENDING_COURIER_SYNC` in a Redis BullMQ persistent queue, executing automated retries with exponential backoff (5 retries over 2 hours).

22.3.4 ACID Multi-Document Database Transaction Rollback Engine
- Every multi-step operation (Order Checkout, Goods Receipt, Challan Generation, Payroll Posting) is wrapped in an atomic MongoDB Atlas Multi-Document Session Transaction. If any sub-step fails, all inventory movements and accounting vouchers roll back completely.

22.4 Security & Threat Model
22.4.1 Insecure Direct Object Reference (IDOR) Protection
- All customer, invoice, and payslip endpoints enforce authenticated user ownership in Mongoose queries:
  ```typescript
  const order = await OrderModel.findOne({ _id: req.params.id, customerId: req.user.id });
  ```
  Unauthorized requests return HTTP 404 Not Found to prevent resource enumeration.

22.4.2 Database & Application-Level Maker-Checker Enforcement
- Strict maker-checker enforcement: Mongoose pre-save validation hooks and backend middleware throw a validation error if `doc.approvedBy.equals(doc.createdBy)`. Transactions requiring Director Quorums require approvals from separate authenticated user identities.

22.4.3 Sensitive Field Masking
- API serializers strictly exclude (`@Exclude()`) purchase cost, margin, salary, and vendor bank details for all roles lacking explicit `ROLE_DIRECTOR` authority.

22.4.4 SMS OTP Rate Limiting & Secrets Isolation
- Sliding-window rate limiter restricts OTP requests to a maximum of 3 per phone number per 15 minutes, and 10 per public IP per hour.
- All API keys, credentials, and secrets are injected via runtime environment variables and never exposed to client-side bundles.

22.5 Validation Rules & Role Permission Matrix
22.5.1 Business Logic Validation Constraints
- Phone Number: Must match `^(?:\+?880|0)1[3-9]\d{8}$`.
- National ID (NID): Must be exactly 10, 13, or 17 numeric digits.
- Line Item Quantities: Must be positive integer (> 0) and <= available on-hand stock.
- Sales Discounts: Maximum 20.0% by sales staff; discounts > 20% require Director approval.
- Voucher Balancing: $\lvert \sum \text{Debit} - \sum \text{Credit} \rvert \le 0.001$.

22.5.2 Role Permission Grid
- Directors: Full access to all business, financial, salary, and audit records.
- Super Admin: System setup, user provisioning, and audit logs. No unverified financial voucher posting.
- Admin/Operations: Operational approvals up to BDT 10 Lakh. Oversees HR, attendance, and logistics.
- Accounts/Finance: Journal vouchers, bank reconciliation, tax, and landed costs within assigned scopes.
- Sales/POS: Quotations, delivery challans, sales orders, customer invoices, and POS cashiering. Cost prices and margins hidden.
- Warehouse: Goods receipts, stock movements, and dispatch notes. No financial ledger access.
- Reseller/Vendor/Customer: Strictly isolated access to own orders, statements, and profiles.

22.6 Multi-Channel Notification Catalog
- NOTIF-01: SMS OTP for COD Orders > BDT 5,000.
- NOTIF-02: SMS + Email dispatch notice with live courier tracking link on Challan issuance.
- NOTIF-03: In-App + Email notification to Directors for transactions exceeding BDT 10 Lakh.
- NOTIF-04: In-App low stock threshold alert to warehouse team.
- NOTIF-05: Near-expiry warning (60 days) to sales and warehouse controllers.
- NOTIF-06: Attendance 3x late arrival notice to employee and HR supervisor.
- NOTIF-07: Courier remittance discrepancy push alert to Finance Officer.
- NOTIF-08: High-priority SMS + Email alert to all Directors on Emergency Override invocation.

22.7 Exception Management & Disaster Continuity
22.7.1 Showroom POS Offline IndexedDB Mode
- Broadband Failure Protocol: POS switches seamlessly to offline mode using browser IndexedDB. Cashier continues barcode scanning and thermal receipt printing. Each offline sale is signed with `SHA256(TerminalID + Counter + Timestamp + Total)`. Max offline limit: 100 sales or BDT 2,00,000 revenue.
- Auto-Sync: On network reconnection, transactions sync via `POST /api/pos/sync-batch` with atomic stock validation.

22.7.2 Emergency Director Override Protocol
- Emergency Bypass: Authorized Admin can bypass transactional limits for critical hospital shipments via 2FA and mandatory 50-character reason logging. Actions carry `EMERGENCY_OVERRIDDEN` tags and notify all Directors immediately, requiring retrospective review within 24 hours.

22.7.3 Unmatched Bank Reconciliation Resolution
- Unidentified bank deposits post to `2410 Unidentified Bank Receipts Clearing` and appear in the Finance Dashboard with aging analysis until reallocated to specific customer invoices.

22.7.4 Mandatory Launch Gates (Reconciliation, Security, UAT, Director Sign-Off)
- Gate 1: Excel Migration Reconciled with 0.00 BDT variance.
- Gate 2: Security & RBAC negative penetration tests passed.
- Gate 3: End-to-end workflow UAT completed.
- Gate 4: Formal written Go/No-Go sign-off by all three Directors.

