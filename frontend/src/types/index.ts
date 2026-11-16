export interface ProductSeoContent {
  metaTitle?: string;
  metaDescription?: string;
  descriptionEn?: string;
  descriptionBn?: string;
}

export interface ProductTierPrice {
  tier: 1 | 2 | 3;
  price: number;
}

export type MedicalCategory =
  | 'Home Diagnostics'
  | 'Surgical Consumables'
  | 'Monitoring'
  | 'Respiratory'
  | 'Hospital Furniture'
  | 'Sterilization'
  | string;

export interface Product {
  _id: string;
  sku: string;
  name?: string;
  nameEn: string;
  banglaName?: string;
  nameBn?: string;
  category: MedicalCategory;
  price?: number;
  retailPrice: number;
  mrp?: number;
  showroomPrice?: number;
  costPrice?: number;
  stock?: number;
  availableStock?: number;
  minStockAlert?: number;
  minStockQty?: number;
  image?: string;
  imageUrl?: string;
  gallery?: string[];
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  ratingCount?: number;
  warrantyPeriod?: string;
  dgdaRegistration?: string;
  countryOfOrigin?: string;
  specifications?: Record<string, string>;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  hsCode?: string;
  baseUom?: string;
  brand?: string;
  isMedical?: boolean;
  isExpirable?: boolean;
  barcodes?: string[];
  seoContent?: ProductSeoContent;
  resellerTierPrices?: ProductTierPrice[];
  isActive?: boolean;
  inStock?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWarranty?: string;
}

export interface DistrictShipping {
  district: string;
  zone: 'inside_dhaka' | 'dhaka_suburb' | 'outside_dhaka';
  charge: number;
  estimatedDelivery: string;
}

export interface OrderItem {
  productSku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatAmount: number;
  total: number;
}

export interface Order {
  orderId: string;
  invoiceNumber: string;
  mushakNumber: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    district: string;
  };
  items: OrderItem[];
  subtotal: number;
  vatTotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  paymentMethod: 'COD' | 'SSLCOMMERZ' | 'BKASH' | 'BANK_TRANSFER' | string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | string;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  courier: {
    provider: 'Pathao' | 'Steadfast' | 'Internal';
    trackingCode: string;
    status: string;
    lastUpdate: string;
  };
  createdAt: string;
}

export interface Challan {
  challanNumber: string;
  invoiceNumber: string;
  orderId: string;
  mushakNumber: string;
  date: string;
  seller: {
    companyName: string;
    bin: string;
    address: string;
  };
  buyer: {
    name: string;
    phone: string;
    address: string;
    bin?: string;
  };
  items: {
    sku: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
  }[];
  totalVat: number;
  totalAmount: number;
}

export interface RmaClaim {
  ticketId: string;
  orderId: string;
  productSku: string;
  serialNumber: string;
  issueDescription: string;
  proofImages: string[];
  status: 'SUBMITTED' | 'INSPECTION' | 'APPROVED' | 'REPLACED' | 'REJECTED';
  timeline: {
    step: string;
    timestamp: string;
    note: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  message: string;
  timestamp: string;
  sanitized: boolean;
}

export interface ReviewItem {
  _id?: string;
  productId: string;
  productSku: string;
  reviewerName: string;
  rating: number;
  title?: string;
  reviewText: string;
  isVerifiedBuyer: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface DisputeClaimItem {
  _id?: string;
  claimNumber: string;
  orderId: string;
  orderNumber?: string;
  productSku: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  claimType: string;
  description: string;
  status: 'PENDING_REVIEW' | 'UNDER_INVESTIGATION' | 'APPROVED_REPLACEMENT' | 'APPROVED_REFUND' | 'REJECTED' | 'RESOLVED';
  moderatorNotes?: string;
  createdAt: string;
}

export interface CheckoutPayload {
  customerId?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  deliveryAddress: string;
  district: string;
  paymentMethod: 'COD' | 'ONLINE_SSLCOMMERZ' | 'BANK_TRANSFER' | string;
  items: {
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    uom?: string;
  }[];
  shippingFee: number;
  vatAmount?: number;
  subtotal?: number;
  buyerBin?: string;
  notes?: string;
}

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  challanNumber?: string;
  trackingCode?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  deliveryAddress?: string;
  district?: string;
  buyerBin?: string;
  items?: {
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    uom?: string;
    hsCode?: string;
    vatAmount?: number;
  }[];
  subtotal?: number;
  vatAmount?: number;
  shippingFee?: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  estimatedDelivery: string;
  createdAt?: string;
}

// ── Dynamic Quotation, Invoice, Challan & Voucher Builder ──────────────────
export interface DynamicDocumentColumn {
  id: string;
  label: string;
  field: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  isDeletable?: boolean;
}

export interface DynamicDocumentRow {
  id: string;
  [key: string]: string | number;
}

export interface DynamicDocument {
  id: string;
  docType: 'QUOTATION' | 'INVOICE' | 'CHALLAN' | 'VOUCHER';
  docNumber: string;
  date: string;
  validUntil?: string;
  clientName: string;
  clientDesignation?: string;
  clientCompany: string;
  clientAddress: string;
  subject: string;
  salutation: string;
  openingText: string;
  columns: DynamicDocumentColumn[];
  rows: DynamicDocumentRow[];
  termsAndConditions: string[];
  signatoryName: string;
  signatoryDesignation: string;
  signatoryCompany: string;
  signatoryPhone: string;
  hideHeaderFooterOnPadPrint: boolean;
  notes?: string;
}

// ── Accounting, Income, Expense & Partnership Accounts ─────────────────────
export interface IncomeExpenseItem {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK' | 'CHEQUE' | 'BKASH';
  referenceNo?: string;
  partnerId?: string;
  receiptUrl?: string;
}

export interface PartnerAccount {
  id: string;
  partnerName: string;
  phone: string;
  email: string;
  nidOrPassport: string;
  role: 'Managing Partner' | 'General Partner' | 'Sleeping Partner';
  sharePercentage: number; // e.g. 50%
  initialCapital: number;
  additionalInvestment: number;
  accumulatedProfit: number;
  totalDrawings: number;
  currentCapitalBalance: number;
  deedStartDate: string;
  deedRegistrationNo: string;
  bankAccountDetails: string;
}

export interface ProfitDistributionRecord {
  id: string;
  period: string; // e.g. "October 2026"
  totalNetProfit: number;
  distributedDate: string;
  allocations: {
    partnerId: string;
    partnerName: string;
    sharePercentage: number;
    amount: number;
  }[];
}

// ── HRM & Payroll ─────────────────────────────────────────────────────────
export interface HrmEmployee {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: 'Sales & Marketing' | 'Biomedical & QC' | 'Warehouse & Logistics' | 'Finance & Accounts' | 'HR & Admin';
  phone: string;
  email: string;
  joiningDate: string;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  conveyance: number;
  grossSalary: number;
  bankAccountNo: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  attendanceDays: number;
}

// ── Social Media & WhatsApp Global Settings ───────────────────────────────
export interface SocialAndWhatsappSettings {
  whatsappNumber: string; // e.g. "+8801751195752"
  whatsappDefaultMessage: string;
  facebookUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  isWhatsappWidgetActive: boolean;
}

// ── Banner Manager ────────────────────────────────────────────────────────
export interface CustomBannerSlide {
  id: number;
  label: string;
  heading: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  image: string;
  alt: string;
  isActive: boolean;
  sortOrder: number;
}

// ── Module 01: Organization Profile Management ────────────────────────────
export type OrganizationType =
  | 'PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'PRIVATE_LIMITED'
  | 'PUBLIC_LIMITED'
  | 'GOVERNMENT'
  | 'NGO'
  | 'OTHER';

export type OrganizationStatus = 'ACTIVE' | 'INACTIVE';

export interface OrganizationBankAccount {
  bankId: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  accountType: 'CURRENT' | 'SAVINGS' | 'MFS' | 'OTHER';
  mfsProvider?: 'NONE' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY';
  currency: string;
  paymentInstructions?: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface OrganizationSignatory {
  signatoryId: string;
  personName: string;
  designation: string;
  signatureImageUrl: string;
  isActive: boolean;
  applicableDocuments: string[];
}

export interface OrganizationStamp {
  stampId: string;
  stampName: string;
  stampType: 'OFFICIAL' | 'APPROVAL' | 'PAID' | 'RECEIVED';
  stampImageUrl: string;
  isActive: boolean;
}

export interface OrganizationBranding {
  logoUrl?: string;
  altLogoUrl?: string;
  faviconUrl?: string;
  letterheadBgUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  documentHeader?: string;
  documentFooter?: string;
  padPrintDefault?: boolean;
}

export interface OrganizationDocumentConfig {
  quotationPrefix?: string;
  invoicePrefix?: string;
  challanPrefix?: string;
  receiptPrefix?: string;
  poPrefix?: string;
  showWatermark?: boolean;
  showStampOnInvoice?: boolean;
  showSignatureOnQuotation?: boolean;
  showBankDetailsOnInvoice?: boolean;
  defaultNotes?: string;
  termsAndConditions?: string[];
}

export interface OrganizationFinancialSettings {
  vatPercent?: number;
  taxIdentificationType?: string;
  allowNegativeStock?: boolean;
  enableFefo?: boolean;
  defaultCostingMethod?: 'FIFO' | 'FEFO' | 'WEIGHTED_AVERAGE';
  fiscalYearMonths?: number;
  retainedEarningsAccountCode?: string;
}

export interface Organization {
  _id: string;
  organizationCode: string;
  legalName: string;
  displayName: string;
  organizationType: OrganizationType;
  registrationNumber?: string;
  tradeLicenseNumber?: string;
  tinNumber?: string;
  binNumber?: string;
  vatRegistrationNumber?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  address: string;
  city: string;
  district: string;
  postalCode?: string;
  country: string;
  logo?: string;
  status: OrganizationStatus;
  isDefault: boolean;
  financialYearStart: string;
  currency: string;
  timezone: string;
  branding: OrganizationBranding;
  bankAccounts: OrganizationBankAccount[];
  signatories: OrganizationSignatory[];
  stamps: OrganizationStamp[];
  documentConfig: OrganizationDocumentConfig;
  financialSettings: OrganizationFinancialSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrgDashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  inactiveOrganizations: number;
  defaultOrganization: {
    _id: string;
    organizationCode: string;
    displayName: string;
  } | null;
  financialMetrics: {
    totalSales: number;
    totalPurchases: number;
    inventoryValuation: number;
    totalReceivables: number;
    totalPayables: number;
  };
  organizationBreakdown: Array<{
    organizationId: string;
    organizationCode: string;
    displayName: string;
    status: string;
    isDefault: boolean;
    sales: number;
    purchases: number;
    inventory: number;
    receivables: number;
    payables: number;
  }>;
}

export interface OrgActivityLog {
  _id: string;
  action: string;
  actorRole: string;
  targetCollection: string;
  targetId: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  notes?: string;
  createdAt: string;
}

// ==========================================
// MODULE 02: USER, ROLES & PERMISSIONS TYPES
// ==========================================

export type ErpUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
export type ErpUserType = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'VENDOR';

export interface RolePermissionRule {
  module: string;
  actions: string[];
}

export interface ErpRole {
  _id: string;
  roleName: string;
  slug: string;
  description?: string;
  permissions: RolePermissionRule[];
  isSystemRole: boolean;
  isActive: boolean;
  assignedUsersCount?: number;
  assignedUsers?: any[];
  assignedOrganizations?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ErpUser {
  _id: string;
  fullName: string;
  username?: string;
  email: string;
  mobile: string;
  employeeId?: string;
  profileImage?: string;
  department?: string;
  designation?: string;
  userType: ErpUserType;
  roleId?: ErpRole | string;
  assignedRoles?: ErpRole[] | string[];
  authorizedOrganizations?: any[];
  defaultOrganizationId?: any;
  status: ErpUserStatus;
  isActive: boolean;
  failedLoginAttempts?: number;
  lockoutUntil?: string;
  passwordExpiresAt?: string;
  forcePasswordChange?: boolean;
  lastLogin?: string;
  hardwareFingerprint?: string;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  lockedUsers: number;
  totalRoles: number;
  activeSessions: number;
  failedLoginAttemptsCount: number;
  usersByDepartment: Array<{ department: string; count: number }>;
  usersByRole: Array<{ roleName: string; count: number }>;
  recentLogins: any[];
  recentlyCreatedUsers: any[];
}

export interface UserActiveSession {
  _id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserLoginHistoryItem {
  _id: string;
  userId: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  failureReason?: string;
  createdAt: string;
}

export interface PermissionMatrixModuleDef {
  moduleId: string;
  moduleNameEn: string;
  moduleNameBn: string;
  description: string;
  actions: Array<{
    action: string;
    actionLabelEn: string;
    actionLabelBn: string;
    isDangerous?: boolean;
  }>;
}

// =========================================================================
// MODULE 03: ADVANCED APPROVAL WORKFLOW & AUDIT MANAGEMENT TYPES
// =========================================================================

export type ApprovalRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'PARTIALLY_APPROVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED_FOR_CORRECTION'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'ESCALATED'
  | 'COMPLETED';

export type ApprovalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ApprovalDecisionAction = 'APPROVE' | 'REJECT' | 'RETURN' | 'REQUEST_INFO' | 'DELEGATE';

export interface ApprovalDecisionRecord {
  level: number;
  actorId: any;
  actorName: string;
  actorRole: string;
  action: ApprovalDecisionAction;
  comment?: string;
  delegatedTo?: any;
  signatureHash?: string;
  timestamp: string;
}

export interface ApprovalRequestItem {
  _id: string;
  requestCode: string;
  documentType: string;
  documentId: string;
  documentRef: string;
  organizationId?: any;
  module: string;
  transactionType: string;
  transactionAmount: number;
  priority: ApprovalPriority;
  requestedBy: any;
  makerId?: any;
  makerName?: string;
  requestedAt: string;
  workflowId?: any;
  currentLevel: number;
  totalLevels: number;
  assignedApproverId?: any;
  assignedRoleId?: any;
  currentStatus: ApprovalRequestStatus;
  dueDate?: string;
  isOverdue?: boolean;
  attachments?: string[];
  decisionHistory: ApprovalDecisionRecord[];
  transactionSnapshot?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalDashboardMetrics {
  totalRequests: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  returnedCount: number;
  overdueCount: number;
  myPendingCount: number;
  averageApprovalHours: number;
  moduleBreakdown: Array<{ module: string; count: number; totalAmount: number }>;
  orgBreakdown: Array<{ organizationName: string; count: number; pending: number }>;
  recentRequests: ApprovalRequestItem[];
}

export interface WorkflowLevelConfig {
  levelNumber: number;
  levelName: string;
  approverType: 'USER' | 'ROLE';
  approverId?: any;
  roleId?: any;
  roleSlug?: string;
  requiredCount: number;
  isParallel?: boolean;
  slaHours?: number;
}

export interface ApprovalWorkflowItem {
  _id: string;
  workflowName: string;
  workflowCode: string;
  organizationId?: any;
  module: string;
  transactionType: string;
  minAmount: number;
  maxAmount: number;
  approvalLevels: WorkflowLevelConfig[];
  autoEscalation: boolean;
  escalateAfterHours?: number;
  escalateToRoleId?: any;
  effectiveDate?: string;
  expiryDate?: string;
  isActive: boolean;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalDelegationItem {
  _id: string;
  originalApproverId: any;
  delegatedApproverId: any;
  organizationId?: any;
  moduleScope: string[];
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AuditLogItem {
  _id: string;
  actorId: any;
  actorRole: string;
  actorNameSnapshot?: string;
  organizationId?: any;
  module?: string;
  action: string;
  targetCollection: string;
  targetId: string;
  entityType?: string;
  entityId?: string;
  requestId?: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditReportMetrics {
  totalEvents: number;
  byAction: Array<{ action: string; count: number }>;
  byModule: Array<{ module: string; count: number }>;
  byActor: Array<{ actorName: string; count: number }>;
}






// =========================================================
// MODULE 04: PRODUCT ENTRY & E-COMMERCE CATALOG TYPES
// =========================================================

export type ProductCatalogSubmodule =
  | 'product-dashboard'
  | 'erp-product-master'
  | 'ecommerce-entry'
  | 'product-list'
  | 'categories'
  | 'brands'
  | 'variants'
  | 'attributes'
  | 'image-gallery'
  | 'pricing'
  | 'bulk-import'
  | 'product-export'
  | 'seo-management'
  | 'website-publishing'
  | 'product-approval'
  | 'activity-logs'
  | 'product-settings';

export interface ErpProductMasterItem {
  _id: string;
  sku: string;
  productCode?: string;
  barcode?: string;
  internalReference?: string;
  nameEn: string;
  nameBn?: string;
  category: string;
  categoryId?: string;
  brand?: string;
  brandId?: string;
  hsCode: string;
  baseUom: string;
  purchaseUnit?: string;
  salesUnit?: string;
  productType: string;
  description?: string;
  shortDescription?: string;
  isMedical: boolean;
  isExpirable: boolean;
  minStockQty: number;
  availableStock?: number;
  inStock?: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  purchasePrice?: number;
  costPrice?: number;
  defaultSalesPrice?: number;
  minSalesPrice?: number;
  wholesalePrice?: number;
  retailPrice: number;
  showroomPrice: number;
  taxRate?: number;
  warrantyPeriod?: string;
  reorderLevel?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  publicationStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'UNPUBLISHED' | 'REJECTED' | 'SCHEDULED';
  publishedAt?: string;
  approvalRequestId?: string;
  ecommerceCatalog?: {
    websiteName?: string;
    websiteShortDesc?: string;
    websiteFullDesc?: string;
    highlights?: string[];
    specifications?: Record<string, string>;
    features?: string[];
    tags?: string[];
    searchKeywords?: string[];
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isPromotional?: boolean;
    promotionalPrice?: number;
  };
  gallery?: Array<{
    url: string;
    altText?: string;
    caption?: string;
    isMain?: boolean;
    sortOrder: number;
  }>;
  variants?: Array<{
    sku: string;
    barcode?: string;
    attributes: Record<string, string>;
    additionalPrice: number;
    image?: string;
    weight?: number;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  seo?: {
    seoTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    slug: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCategoryItem {
  _id: string;
  nameEn: string;
  nameBn?: string;
  slug: string;
  parentId?: string | null;
  ancestors?: string[];
  iconUrl?: string;
  imageUrl?: string;
  descriptionEn?: string;
  descriptionBn?: string;
  displayOrder: number;
  isHomepageVisible: boolean;
  isActive: boolean;
  productCount?: number;
  children?: ProductCategoryItem[];
}

export interface ProductBrandItem {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  countryOfOrigin?: string;
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
}

export interface ProductAttributeItem {
  _id: string;
  name: string;
  code: string;
  values: string[];
  displayOrder: number;
  isActive: boolean;
}

export interface ProductCatalogDashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
  publishedProducts: number;
  unpublishedProducts: number;
  pendingApprovalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  inStockCount: number;
  noImagesProducts: number;
  noSeoProducts: number;
  categoriesDistribution: Array<{ category: string; count: number }>;
  brandsDistribution: Array<{ brand: string; count: number }>;
  publicationRatio: {
    published: number;
    unpublished: number;
    pending: number;
  };
}

export interface BulkImportResult {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errors: Array<{ row: number; sku: string; error: string }>;
}
