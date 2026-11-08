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
