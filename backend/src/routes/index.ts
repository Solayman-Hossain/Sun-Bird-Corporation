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
import publicCheckoutRouter from './public/checkoutRoutes';
import publicTrackingRouter from './public/trackingRoutes';
import erpSalesRouter from './erp/salesRoutes';
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
import erpCrmRouter from './erp/crmRoutes';
import erpAuditRouter from './erp/auditRoutes';
import erpWarehouseRouter from './erp/warehouseRoutes';
import webhookRouter from './webhooks/webhookRoutes';
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

// Public storefront checkout mounted at /api/v1/public/checkout
apiV1Router.use('/public/checkout', publicCheckoutRouter);

// Public order and shipment tracking mounted at /api/v1/public/track-order
apiV1Router.use('/public/track-order', publicTrackingRouter);

// ERP sales, credit profiles, challans, invoices, and orders mounted at /api/v1/erp/sales
apiV1Router.use('/erp/sales', erpSalesRouter);

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

// ERP Workflow Maker-Checker Requests mounted at /api/v1/erp/approvals/requests
apiV1Router.use('/erp/approvals/requests', erpApprovalRouter);

// ERP CRM Activities, Doctor Visits, Leads & Follow-ups mounted at /api/v1/erp/crm
apiV1Router.use('/erp/crm', erpCrmRouter);

// ERP Immutable Audit Trail mounted at /api/v1/erp/audit-logs
apiV1Router.use('/erp/audit-logs', erpAuditRouter);

// ERP Multi-Warehouse Directory & Geofencing mounted at /api/v1/erp/warehouses
apiV1Router.use('/erp/warehouses', erpWarehouseRouter);

// External Payment & Courier Webhooks mounted at /api/v1/webhooks
apiV1Router.use('/webhooks', webhookRouter);

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

