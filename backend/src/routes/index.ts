import { Router } from 'express';
import healthRouter from './health.routes';
import testErrorRouter from './test-error.routes';
import rbacTestRouter from './test-rbac.routes';
import publicAuthRouter from './public/authRoutes';
import erpAuthRouter from './erp/authRoutes';
import erpUserRouter from './erp/userRoutes';
import erpRoleRouter from './erp/roleRoutes';
import publicProductRouter from './public/productRoutes';
import erpProductRouter from './erp/productRoutes';
import erpInventoryRouter from './erp/inventoryRoutes';
import erpProcurementRouter from './erp/procurementRoutes';
import portalVendorRouter from './portal/vendorRoutes';
import portalCustomerRouter from './portal/customerRoutes';
import publicCheckoutRouter from './public/checkoutRoutes';
import publicTrackingRouter from './public/trackingRoutes';
import erpSalesRouter from './erp/salesRoutes';
import erpOrderProcessingRouter from './erp/orderProcessingRoutes';
import erpPosRouter from './erp/posRoutes';
import erpLogisticsRouter from './erp/logisticsRoutes';
import erpAccountingRouter from './erp/accountingRoutes';
import erpAssetRouter from './erp/assetRoutes';
import erpLoanRouter from './erp/loanRoutes';
import erpPartnerRouter from './erp/partnerRoutes';
import erpHrmRouter from './erp/hrmRoutes';
import portalEmployeeRouter from './portal/employeeRoutes';
import erpQuorumRouter from './erp/quorumRoutes';
import erpApprovalRouter from './erp/approvalRoutes';
import erpWorkflowRouter from './erp/workflowRoutes';
import erpCrmRouter from './erp/crmRoutes';
import erpAuditRouter from './erp/auditRoutes';
import erpWarehouseRouter from './erp/warehouseRoutes';
import erpOrganizationRouter from './erp/organizationRoutes';
import erpProductCatalogRouter from './erp/productCatalogRoutes';
import erpPurchaseRouter from './erp/purchaseRoutes';
import erpInventoryManagementRouter from './erp/inventoryManagementRoutes';
import erpDocumentManagementRouter from './erp/documentManagementRoutes';
import webhookRouter from './webhooks/webhookRoutes';
import mediaRouter from './media.routes';
import publicReviewRouter from './public/reviewRoutes';
import publicChatRouter from './public/chatRoutes';
import publicDisputeRouter from './public/disputeRoutes';
import erpReviewRouter from './erp/reviewRoutes';
import erpChatRouter from './erp/chatRoutes';
import erpDisputeRouter from './erp/disputeRoutes';
import erpMarketingRouter from './erp/marketingRoutes';
import publicMarketingRouter from './public/marketingRoutes';
import erpImportRouter from './erp/importRoutes';
import { AuthController } from '../controllers/AuthController';
import { InventoryController } from '../controllers/InventoryController';
import { ProductController } from '../controllers/ProductController';
import { authGuard } from '../middlewares/authGuard';
import { hasPermission } from '../middlewares/rbacGuard';
import { validateRequest } from '../middlewares/validateRequest';
import { refreshTokenSchema } from '../validators/auth.validator';
import { verifyWarrantySchema } from '../validators/inventory.validator';
import { createUomConversionSchema } from '../validators/product.validator';

const apiV1Router = Router();

// Health check endpoint mounted at /api/v1/health
apiV1Router.use('/health', healthRouter);

// Public storefront auth endpoints mounted at /api/v1/public/auth
apiV1Router.use('/public/auth', publicAuthRouter);

// ERP auth endpoints mounted at /api/v1/erp/auth
apiV1Router.use('/erp/auth', erpAuthRouter);

// ERP user management endpoints mounted at /api/v1/erp/users
apiV1Router.use('/erp/users', erpUserRouter);

// ERP RBAC role management endpoints mounted at /api/v1/erp/roles
apiV1Router.use('/erp/roles', erpRoleRouter);

// Public storefront products mounted at /api/v1/public/products
apiV1Router.use('/public/products', publicProductRouter);

// ERP master product management mounted at /api/v1/erp/products
apiV1Router.use('/erp/products', erpProductRouter);

// ERP inventory, batches, movements & serials mounted at /api/v1/erp/inventory
apiV1Router.use('/erp/inventory', erpInventoryRouter);

// ERP procurement, suppliers, RFQs, and quotations mounted at /api/v1/erp/procurement
apiV1Router.use('/erp/procurement', erpProcurementRouter);

// Authenticated vendor portal mounted at /api/v1/portal/vendor
apiV1Router.use('/portal/vendor', portalVendorRouter);

// Authenticated customer portal mounted at /api/v1/portal/customer
apiV1Router.use('/portal/customer', portalCustomerRouter);

// Public storefront checkout mounted at /api/v1/public/checkout
apiV1Router.use('/public/checkout', publicCheckoutRouter);

// Public order and shipment tracking mounted at /api/v1/public/track-order
apiV1Router.use('/public/track-order', publicTrackingRouter);

// ERP sales, credit profiles, challans, invoices, and orders mounted at /api/v1/erp/sales
apiV1Router.use('/erp/sales', erpSalesRouter);

// ERP Module 09 Order Processing, picking, packing, dispatch & delivery mounted at /api/v1/erp/orders
apiV1Router.use('/erp/orders', erpOrderProcessingRouter);

// ERP POS showroom checkout and offline batch sync mounted at /api/v1/erp/pos
apiV1Router.use('/erp/pos', erpPosRouter);

// ERP courier logistics and consignment booking mounted at /api/v1/erp/logistics
apiV1Router.use('/erp/logistics', erpLogisticsRouter);

// ERP Chart of Accounts, Journal entries, and financial statements mounted at /api/v1/erp/accounts
apiV1Router.use('/erp/accounts', erpAccountingRouter);

// ERP Fixed Asset register and SLM depreciation mounted at /api/v1/erp/assets
apiV1Router.use('/erp/assets', erpAssetRouter);

// ERP Multi-type loan management and clearance mounted at /api/v1/erp/loans
apiV1Router.use('/erp/loans', erpLoanRouter);

// ERP Partnership capital accounts and profit allocation mounted at /api/v1/erp/partners
apiV1Router.use('/erp/partners', erpPartnerRouter);

// ERP HRM and Payroll batch computation mounted at /api/v1/erp/hrm
apiV1Router.use('/erp/hrm', erpHrmRouter);

// Employee portal mobile attendance punch and payslips mounted at /api/v1/portal/employee
apiV1Router.use('/portal/employee', portalEmployeeRouter);

// ERP Multi-Director Quorum Approvals mounted at /api/v1/erp/approvals/quorum
apiV1Router.use('/erp/approvals/quorum', erpQuorumRouter);

// ERP Workflow Maker-Checker Engine & Requests (Module 03)
apiV1Router.use('/erp/approvals', erpApprovalRouter);
apiV1Router.use('/erp/approvals/requests', erpApprovalRouter);
apiV1Router.use('/erp/approval-workflows', erpWorkflowRouter);

// ERP CRM Activities, Doctor Visits, Leads & Follow-ups mounted at /api/v1/erp/crm
apiV1Router.use('/erp/crm', erpCrmRouter);

// ERP Immutable Audit Trail mounted at /api/v1/erp/audit-logs
apiV1Router.use('/erp/audit-logs', erpAuditRouter);

// ERP Multi-Warehouse Directory & Geofencing mounted at /api/v1/erp/warehouses
apiV1Router.use('/erp/warehouses', erpWarehouseRouter);

// ERP Multi-Organization Management mounted at /api/v1/erp/organizations (Module 01)
apiV1Router.use('/erp/organizations', erpOrganizationRouter);

// ERP Product Entry & E-commerce Catalog Management (Module 04)
apiV1Router.use('/erp/product-catalog', erpProductCatalogRouter);

// ERP Purchase & Supplier Management (Module 05)
apiV1Router.use('/erp/purchase', erpPurchaseRouter);

// ERP Inventory & FEFO Management (Module 06)
apiV1Router.use('/erp/inventory-management', erpInventoryManagementRouter);
apiV1Router.use('/erp/inventory', erpInventoryManagementRouter);

// ERP Document Management & Dynamic Template Engine (Module 07)
apiV1Router.use('/erp/documents', erpDocumentManagementRouter);
apiV1Router.use('/erp/document-templates', erpDocumentManagementRouter);

// ERP Marketing, Banners, Social & Campaigns (Module 11)
apiV1Router.use('/erp/marketing', erpMarketingRouter);

// Public Marketing Banners, Announcements, Content & Landing Pages
apiV1Router.use('/public/marketing', publicMarketingRouter);

// ERP Import / LC Tracker & AI Management System (Module 12)
apiV1Router.use('/erp/import', erpImportRouter);


// External Payment & Courier Webhooks mounted at /api/v1/webhooks
apiV1Router.use('/webhooks', webhookRouter);

// Media pre-signed URL upload & read endpoints mounted at /api/v1/media
apiV1Router.use('/media', mediaRouter);

// Public product reviews & ratings mounted at /api/v1/public/reviews (Prompt 18)
apiV1Router.use('/public/reviews', publicReviewRouter);

// Public live support chat mounted at /api/v1/public/chat (Slides 15, 20, 26, 31, 32, 37)
apiV1Router.use('/public/chat', publicChatRouter);

// Public RMA warranty & defective item disputes mounted at /api/v1/public/disputes (Prompt 19)
apiV1Router.use('/public/disputes', publicDisputeRouter);

// ERP Review Moderation Queue mounted at /api/v1/erp/reviews
apiV1Router.use('/erp/reviews', erpReviewRouter);

// ERP Customer Support Chat Inbox mounted at /api/v1/erp/chat
apiV1Router.use('/erp/chat', erpChatRouter);

// ERP Dispute Resolution & RMA Claims Queue mounted at /api/v1/erp/disputes (Prompt 20)
apiV1Router.use('/erp/disputes', erpDisputeRouter);

// Public warranty verification mounted at /api/v1/public/warranty
const publicWarrantyRouter = Router();
publicWarrantyRouter.post(
  '/verify',
  validateRequest({ body: verifyWarrantySchema }),
  InventoryController.verifyWarrantyQr
);
publicWarrantyRouter.get('/verify/:serialNumber', InventoryController.verifyWarrantyQr);
apiV1Router.use('/public/warranty', publicWarrantyRouter);

// ERP UOM conversion alias mounted at /api/v1/erp/uom-conversions (api-spec.md §3.3)
const erpUomRouter = Router();
erpUomRouter.post(
  '/',
  authGuard,
  hasPermission('products', 'CREATE'),
  validateRequest({ body: createUomConversionSchema }),
  ProductController.createUomConversion
);
apiV1Router.use('/erp/uom-conversions', erpUomRouter);

// Global auth endpoints mounted at /api/v1/auth (api-spec.md §2.4 & §2.5)
const commonAuthRouter = Router();
commonAuthRouter.post(
  '/refresh-token',
  validateRequest({ body: refreshTokenSchema }),
  AuthController.refreshToken
);
commonAuthRouter.post('/logout', AuthController.logout);
apiV1Router.use('/auth', commonAuthRouter);

// Test Error routes for Prompt 03 & 04 verification
apiV1Router.use('/test-error', testErrorRouter);

// RBAC Guard test routes for Prompt 05 verification
apiV1Router.use('/test-rbac', rbacTestRouter);

export default apiV1Router;

