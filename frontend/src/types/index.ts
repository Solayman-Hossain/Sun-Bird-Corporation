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
export type HrmSubmodule =
  | 'hr-dashboard'
  | 'employee-management'
  | 'employee-directory'
  | 'employee-profile'
  | 'employee-onboarding'
  | 'employee-offboarding'
  | 'departments'
  | 'designations'
  | 'job-grades'
  | 'employment-types'
  | 'employee-documents'
  | 'employee-id-card'
  | 'employee-contacts'
  | 'emergency-contacts'
  | 'org-chart'
  | 'attendance-management'
  | 'attendance-dashboard'
  | 'attendance-entry'
  | 'attendance-import'
  | 'attendance-correction'
  | 'shift-management'
  | 'shift-assignment'
  | 'roster-management'
  | 'holiday-management'
  | 'leave-management'
  | 'leave-requests'
  | 'leave-approval'
  | 'leave-types'
  | 'leave-balance'
  | 'leave-calendar'
  | 'overtime-management'
  | 'late-early-leave'
  | 'payroll-management'
  | 'payroll-dashboard'
  | 'salary-structure'
  | 'salary-components'
  | 'salary-assignment'
  | 'payroll-processing'
  | 'payroll-review'
  | 'payroll-approval'
  | 'salary-payment'
  | 'payslip'
  | 'payroll-history'
  | 'employee-loan'
  | 'employee-advance'
  | 'loan-repayment'
  | 'expense-reimbursement'
  | 'performance-management'
  | 'training-development'
  | 'hr-reports'
  | 'hr-audit-logs'
  | 'hr-settings';

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


// =========================================================
// MODULE 05: PURCHASE & SUPPLIER MANAGEMENT TYPES
// =========================================================

export type PurchaseSubmodule =
  | 'purchase-dashboard'
  | 'purchase-requisitions'
  | 'requisition-approval'
  | 'rfq-management'
  | 'supplier-quotations'
  | 'comparative-statements'
  | 'purchase-orders'
  | 'goods-receive-notes'
  | 'quality-inspection'
  | 'purchase-invoices'
  | 'supplier-payments'
  | 'purchase-returns'
  | 'supplier-directory'
  | 'supplier-ledger'
  | 'payables-aging'
  | 'import-lc-tracker'
  | 'purchase-reports'
  | 'purchase-settings';

export interface PurchaseDashboardMetrics {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  totalRequisitions: number;
  pendingRequisitions: number;
  pendingQuotations: number;
  pendingApprovals: number;
  totalPOs: number;
  openPOs: number;
  partiallyReceivedPOs: number;
  completedPOs: number;
  totalGRNs: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalPurchaseValue: number;
  outstandingPayables: number;
  overduePayables: number;
  totalPayments: number;
  totalReturns: number;
  totalReturnValue: number;
  monthlyPurchaseTrend: Array<{ month: string; amount: number; count: number }>;
  topPurchasedProducts: Array<{ sku: string; productName: string; totalQty: number; totalSpend: number }>;
  supplierWiseSummary: Array<{ supplierId: string; supplierName: string; supplierCode: string; totalSpend: number; poCount: number }>;
}

export interface PurchaseRequisitionItem {
  _id: string;
  requisitionNumber: string;
  department: string;
  requisitionDate: string;
  requiredDeliveryDate: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'PARTIALLY_CONVERTED' | 'FULLY_CONVERTED' | 'CANCELLED';
  items: Array<{
    productId: string;
    sku: string;
    productName: string;
    requestedQty: number;
    uom: string;
    estimatedUnitPrice: number;
    estimatedTotal: number;
    reason?: string;
    convertedQty: number;
  }>;
  notes?: string;
  requestedBy?: { _id: string; fullName: string; email: string };
  warehouseId?: { _id: string; name: string };
  createdAt: string;
}

export interface GoodsReceiveNoteItem {
  _id: string;
  grnNumber: string;
  receivingDate: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  purchaseOrderId: { _id: string; poNumber: string };
  supplierId: { _id: string; companyName: string; supplierCode: string };
  warehouseId: { _id: string; name: string };
  totalAcceptedValue: number;
  items: Array<{
    productId: string;
    sku: string;
    productName: string;
    orderedQty: number;
    currentReceivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    damagedQty: number;
    uom: string;
    batchNumber?: string;
    expiryDate?: string;
    unitCost: number;
    inspectionStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'PARTIAL';
  }>;
  receivingNotes?: string;
  postedAt?: string;
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  _id: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  matchingStatus: 'UNMATCHED' | 'MATCHED' | 'DISCREPANCY';
  supplierId: { _id: string; companyName: string; supplierCode: string; phone?: string; email?: string };
  purchaseOrderId?: { _id: string; poNumber: string };
  items: Array<{
    sku: string;
    productName: string;
    qty: number;
    uom: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  createdAt: string;
}

export interface SupplierPaymentItem {
  _id: string;
  paymentNumber: string;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_BANKING' | 'OTHER';
  paymentAmount: number;
  currency: string;
  chequeNumber?: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED';
  supplierId: { _id: string; companyName: string; supplierCode: string };
  allocations: Array<{
    invoiceId: string;
    allocatedAmount: number;
  }>;
  notes?: string;
  createdAt: string;
}

export interface PurchaseReturnItem {
  _id: string;
  returnNumber: string;
  returnDate: string;
  reason: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'REJECTED' | 'CANCELLED';
  supplierId: { _id: string; companyName: string; supplierCode: string };
  totalReturnValue: number;
  items: Array<{
    sku: string;
    productName: string;
    returnedQty: number;
    uom: string;
    unitCost: number;
    lineTotal: number;
  }>;
  createdAt: string;
}

export interface SupplierLedgerEntry {
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'RETURN';
  reference: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface SupplierLedgerResponse {
  supplier: { _id: string; companyName: string; supplierCode: string };
  entries: SupplierLedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  closingBalance: number;
}

export interface PayablesSummaryResponse {
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    supplierCode: string;
    totalOutstanding: number;
    current: number;
    bucket_1_30: number;
    bucket_31_60: number;
    bucket_61_90: number;
    bucket_90_plus: number;
    invoiceCount: number;
  }>;
  totals: {
    totalOutstanding: number;
    current: number;
    bucket_1_30: number;
    bucket_31_60: number;
    bucket_61_90: number;
    bucket_90_plus: number;
  };
}


// ─── MODULE 06: INVENTORY & FEFO MANAGEMENT TYPES ───────────────────────────

export type InventorySubmodule =
  | 'inv-dashboard'
  | 'inv-stock-overview'
  | 'inv-warehouses'
  | 'inv-bins'
  | 'inv-batches'
  | 'inv-expiry'
  | 'inv-fefo'
  | 'inv-reservation'
  | 'inv-transfers'
  | 'inv-adjustments'
  | 'inv-physical-count'
  | 'inv-reconciliation'
  | 'inv-damaged-expired'
  | 'inv-movement-history'
  | 'inv-alerts'
  | 'inv-reports'
  | 'inv-settings'
  | 'inv-activity-logs';

export interface InventoryDashboardData {
  totalProducts: number;
  totalActiveSKUs: number;
  totalWarehouses: number;
  totalStockQuantity: number;
  totalAvailableStock: number;
  totalReservedStock: number;
  totalInTransitStock: number;
  totalDamagedStock: number;
  totalExpiredStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  expiringProducts: number;
  expiredBatches: number;
  stockTransfersPending: number;
  stockAdjustmentsPending: number;
  pendingStockCounts: number;
  inventoryValuation: number;
  warehouseStockSummary: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    stockQty: number;
    reservedQty: number;
    valuation: number;
    batchCount: number;
  }>;
  categoryStockSummary: Array<{
    category: string;
    stockQty: number;
    valuation: number;
    skuCount: number;
  }>;
  monthlyStockMovement: Array<{
    _id: { year: number; month: number; type: string };
    totalQty: number;
    count: number;
  }>;
  topMovingProducts: Array<{ _id: string; dispatchedQty: number }>;
  slowMovingProducts: Array<{ _id: string; dispatchedQty: number }>;
}

export interface StockOverviewItem {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  binCode?: string;
  batchNumber: string;
  expiryDate?: string;
  manufacturingDate?: string;
  categoryType: 'EXPIRY_CONTROLLED' | 'NON_EXPIRING';
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  inTransitQuantity: number;
  damagedQuantity: number;
  expiredQuantity: number;
  uom: string;
  unitCost: number;
  stockValue: number;
  reorderLevel: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
}

export interface WarehouseBin {
  _id: string;
  organizationId?: string;
  warehouseId: string | { _id: string; name: string; warehouseCode: string };
  binCode: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  binType: 'STANDARD' | 'COLD_STORAGE' | 'HAZARDOUS' | 'QUARANTINE' | 'STAGING';
  capacityCbf?: number;
  currentUtilizedCbf?: number;
  maxWeightKg?: number;
  isActive: boolean;
  notes?: string;
  totalBatches?: number;
  totalStockQty?: number;
  isOccupied?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBatch {
  _id: string;
  organizationId?: string;
  productId: string | { _id: string; nameEn: string; sku: string; category: string };
  sku: string;
  batchNumber: string;
  category: 'EXPIRY_CONTROLLED' | 'NON_EXPIRING';
  manufacturingDate?: string;
  expiryDate?: string;
  baseUom: string;
  currentQty: number;
  reservedQty: number;
  damagedQty?: number;
  expiredQty?: number;
  unitCost: number;
  hasIndividualSerials: boolean;
  warrantyMonths: number;
  warehouseId: string | { _id: string; name: string; warehouseCode: string };
  binId?: string | { _id: string; binCode: string; zone: string; aisle: string };
  locationStatus: 'ON_HAND' | 'IN_TRANSIT';
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferItem {
  productId: string;
  batchId: string;
  sourceBinId?: string;
  destBinId?: string;
  sku: string;
  batchNumber: string;
  requestedQty: number;
  dispatchedQty: number;
  receivedQty: number;
  damagedQty: number;
  uom: string;
  unitCost: number;
  notes?: string;
}

export interface StockTransfer {
  _id: string;
  transferNumber: string;
  organizationId?: string;
  sourceWarehouseId: string | { _id: string; name: string; warehouseCode: string };
  destinationWarehouseId: string | { _id: string; name: string; warehouseCode: string };
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  items: StockTransferItem[];
  totalQuantity: number;
  totalValue: number;
  requestedBy: string | { _id: string; name: string; email: string };
  approvedBy?: string | { _id: string; name: string };
  approvedAt?: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  challanNumber?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustmentItem {
  productId: string;
  batchId: string;
  binId?: string;
  sku: string;
  batchNumber: string;
  currentQty: number;
  adjustedQty: number;
  differenceQty: number;
  unitCost: number;
  totalValueChange: number;
  reason?: string;
}

export interface StockAdjustment {
  _id: string;
  adjustmentNumber: string;
  organizationId?: string;
  warehouseId: string | { _id: string; name: string; warehouseCode: string };
  adjustmentType: 'DAMAGED' | 'EXPIRED' | 'THEFT' | 'COUNT_VARIANCE' | 'REVALUATION' | 'SCRAP' | 'INITIAL_STOCK' | 'OTHER';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'REJECTED';
  items: StockAdjustmentItem[];
  totalValuationChange: number;
  journalEntryId?: string;
  requestedBy: string | { _id: string; name: string; email: string };
  approvedBy?: string | { _id: string; name: string };
  approvedAt?: string;
  postedBy?: string;
  postedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalCountItem {
  productId: string;
  batchId: string;
  binId?: string;
  sku: string;
  batchNumber: string;
  systemQty: number;
  countedQty: number;
  varianceQty: number;
  unitCost: number;
  varianceValue: number;
  countedBy?: string;
  countedAt?: string;
  notes?: string;
}

export interface PhysicalCount {
  _id: string;
  countNumber: string;
  organizationId?: string;
  warehouseId: string | { _id: string; name: string; warehouseCode: string };
  countDate: string;
  countType: 'FULL' | 'CYCLE' | 'CATEGORY' | 'ZONE';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'RECONCILED' | 'CANCELLED';
  items: PhysicalCountItem[];
  totalVarianceValue: number;
  reconciliationAdjustmentId?: string;
  conductedBy: string | { _id: string; name: string; email: string };
  reconciledBy?: string;
  reconciledAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpiryManagementData {
  summary: {
    expiredCount: number;
    criticalCount: number;
    warningCount: number;
    attentionCount: number;
    totalAtRisk: number;
  };
  expired: ProductBatch[];
  critical: ProductBatch[];
  warning: ProductBatch[];
  attention: ProductBatch[];
}

export interface ReorderAlert {
  productId: string;
  sku: string;
  productName: string;
  category: string;
  uom: string;
  image?: string;
  minReorderLevel: number;
  availableStock: number;
  reservedStock: number;
  deficit: number;
  status: 'OUT_OF_STOCK' | 'LOW_STOCK';
}

export interface InventorySettings {
  defaultAllocationMethod: 'FEFO' | 'FIFO';
  expiryWarningDays: number;
  expiryCriticalDays: number;
  defaultUom: string;
  negativeStockAllowed: boolean;
  autoReorderTrigger: boolean;
  costingMethod: 'MOVING_AVERAGE' | 'FIFO_COST' | 'STANDARD_COST';
}


// ─── MODULE 07: DOCUMENT MANAGEMENT & DYNAMIC TEMPLATE ENGINE TYPES ─────────

export type DocumentSubmodule =
  | 'doc-dashboard'
  | 'doc-quotations'
  | 'doc-proformas'
  | 'doc-sales-invoices'
  | 'doc-challans'
  | 'doc-receipts'
  | 'doc-credit-notes'
  | 'doc-purchase-orders'
  | 'doc-purchase-invoices'
  | 'doc-template-builder'
  | 'doc-branding'
  | 'doc-letterheads'
  | 'doc-signatures'
  | 'doc-seals'
  | 'doc-terms'
  | 'doc-print-settings'
  | 'doc-numbering'
  | 'doc-activity-logs';

export type DocumentTypeEnum =
  | 'SALES_QUOTATION'
  | 'PROFORMA_INVOICE'
  | 'SALES_INVOICE'
  | 'DELIVERY_CHALLAN'
  | 'MONEY_RECEIPT'
  | 'CREDIT_NOTE'
  | 'PURCHASE_ORDER'
  | 'PURCHASE_INVOICE';

export interface TemplateColumn {
  id: string;
  label: string;
  field: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'date' | 'auto_sl' | 'formula';
  visible: boolean;
  headerBackground?: string;
  fontWeight?: string;
  isDeletable?: boolean;
}

export interface DocumentTemplateItem {
  _id: string;
  organizationId: string | { _id: string; displayName: string; legalName: string; organizationCode: string };
  name: string;
  documentType: DocumentTypeEnum;
  language: 'EN' | 'BN' | 'BILINGUAL';
  version: number;
  paperSize: 'A4' | 'A5' | 'LETTER';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  headerSettings: {
    showLogo: boolean;
    logoPosition: 'left' | 'center' | 'right';
    showOrgDetails: boolean;
    showDocNumber: boolean;
    showStatus: boolean;
    docTitle: string;
    docSubtitle?: string;
    customHeaderText?: string;
    showBinVat?: boolean;
  };
  recipientSettings: {
    showRecipient: boolean;
    recipientLabel: string;
    showAddress: boolean;
    showContact: boolean;
    showBinVat: boolean;
  };
  introductionText?: string;
  closingText?: string;
  tableDefinition: {
    columns: TemplateColumn[];
    defaultRows?: any[];
    showSubtotal: boolean;
    showDiscount: boolean;
    showTax: boolean;
    showShipping: boolean;
    showGrandTotal: boolean;
    showAmountInWords: boolean;
    amountInWordsLanguage: 'EN' | 'BN' | 'BILINGUAL';
  };
  termsAndConditions: Array<{
    id: string;
    textBn?: string;
    textEn?: string;
    order: number;
    isActive: boolean;
  }>;
  signatureSettings: Array<{
    id: string;
    title: string;
    personName?: string;
    designation?: string;
    signatureImageUrl?: string;
    alignment: 'left' | 'center' | 'right';
    required: boolean;
  }>;
  sealSettings: {
    showSeal: boolean;
    stampType?: 'OFFICIAL' | 'APPROVAL' | 'PAID' | 'RECEIVED';
    stampImageUrl?: string;
    position: 'left' | 'center' | 'right';
  };
  footerSettings: {
    footerText?: string;
    showPageNumber: boolean;
    pageNumberFormat?: string;
  };
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesQuotationItem {
  _id: string;
  quotationNumber: string;
  organizationId: string | { _id: string; displayName: string };
  customerId: string | { _id: string; fullName: string; companyName?: string; mobile: string; email?: string; billingAddress?: string };
  customerName?: string;
  customerAddress?: string;
  title?: string;
  quotationDate: string;
  validityDays: number;
  expiryDate: string;
  subject: string;
  currency: string;
  items: Array<{
    sku?: string;
    productName?: string;
    description?: string;
    name?: string;
    brand?: string;
    origin?: string;
    uom?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxAmount?: number;
    lineTotal?: number;
  }>;
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  taxAmount?: number;
  shippingCharge?: number;
  grandTotal: number;
  amountInWordsEn: string;
  amountInWordsBn: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
  termsAndConditions?: string[];
  notes?: string;
  createdAt: string;
}

export interface ProformaInvoiceItem {
  _id: string;
  proformaNumber: string;
  organizationId: string | { _id: string; displayName: string };
  customerId: string | { _id: string; fullName: string; mobile: string; billingAddress?: string };
  customerName?: string;
  proformaDate: string;
  paymentTerms: string;
  deliveryTerms?: string;
  currency: string;
  items: Array<{
    sku?: string;
    productName?: string;
    uom?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxAmount?: number;
    lineTotal?: number;
  }>;
  subtotal: number;
  grandTotal: number;
  amountInWordsEn: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SENT' | 'CONVERTED' | 'CANCELLED';
  createdAt: string;
}

export interface MoneyReceiptDocItem {
  _id: string;
  receiptNumber: string;
  customerId: string | { _id: string; fullName: string; mobile: string };
  customerName?: string;
  receiptDate: string;
  paymentMethod: string;
  bankName?: string;
  chequeNumber?: string;
  transactionRef?: string;
  amount: number;
  amountInWordsEn: string;
  forParticulars: string;
  status: 'DRAFT' | 'APPROVED' | 'POSTED' | 'CANCELLED';
  journalEntryId?: string;
  isPosted?: boolean;
  createdAt: string;
}

// =========================================================
// MODULE 09: ORDER PROCESSING & E-COMMERCE INTEGRATION TYPES
// =========================================================

export type OrderSubmodule =
  | 'order-dashboard'
  | 'online-orders'
  | 'sales-orders'
  | 'order-details'
  | 'payment-verification'
  | 'order-approval'
  | 'order-reservation'
  | 'stock-availability'
  | 'order-picking'
  | 'order-packing'
  | 'packing-list'
  | 'dispatch-management'
  | 'delivery-management'
  | 'delivery-tracking'
  | 'partial-delivery'
  | 'order-cancellation'
  | 'sales-return'
  | 'order-timeline'
  | 'order-documents'
  | 'customer-history'
  | 'order-reports'
  | 'order-activity-logs'
  | 'order-settings';


export interface CreditNoteDocItem {
  _id: string;
  creditNoteNumber: string;
  customerId: string | { _id: string; fullName: string; mobile: string };
  customerName?: string;
  creditDate: string;
  reason: string;
  subtotal: number;
  totalAmount?: number;
  grandTotal?: number;
  amountInWordsEn: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'CANCELLED';
  journalEntryId?: string;
  isPosted?: boolean;
  createdAt: string;
}

// Module 11 — Banners, Social Media, Marketing & Content Management Submodules (31 Submodules)
export type MarketingSubmodule =
  | 'marketing-dashboard'
  | 'website-banners'
  | 'homepage-sliders'
  | 'promotional-campaigns'
  | 'product-promotions'
  | 'category-promotions'
  | 'brand-promotions'
  | 'landing-pages'
  | 'website-content'
  | 'homepage-sections'
  | 'promotional-popups'
  | 'announcement-bar'
  | 'navigation-menu'
  | 'social-media-management'
  | 'social-accounts'
  | 'social-content'
  | 'social-calendar'
  | 'content-planner'
  | 'marketing-calendar'
  | 'campaign-scheduler'
  | 'seo-management'
  | 'media-gallery'
  | 'content-templates'
  | 'content-approval'
  | 'scheduled-publishing'
  | 'published-content'
  | 'campaign-analytics'
  | 'social-analytics'
  | 'marketing-reports'
  | 'marketing-settings'
  | 'marketing-activity-logs';

export type ImportSubmodule =
  | 'import-dashboard'
  | 'import-purchase-requisition'
  | 'import-purchase-order'
  | 'proforma-invoice'
  | 'import-supplier-management'
  | 'lc-application-opening'
  | 'lc-amendment-management'
  | 'lc-register'
  | 'bank-financial-documents'
  | 'shipment-management'
  | 'shipment-tracking'
  | 'commercial-invoice'
  | 'packing-list'
  | 'bill-of-lading'
  | 'airway-bill'
  | 'certificate-of-origin'
  | 'insurance-documents'
  | 'inspection-certificates'
  | 'customs-port-clearance'
  | 'bill-of-entry'
  | 'duty-vat-tax-management'
  | 'freight-logistics-expenses'
  | 'import-payment-management'
  | 'lc-margin-bank-charges'
  | 'landed-cost-calculation'
  | 'import-goods-receive-grn'
  | 'import-document-management'
  | 'import-approval-center'
  | 'import-alerts-notifications'
  | 'import-ai-assistant'
  | 'import-mis-analytics'
  | 'import-reports'
  | 'import-settings'
  | 'import-activity-audit-logs';



