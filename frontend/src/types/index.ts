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

