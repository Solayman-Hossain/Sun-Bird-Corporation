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

export interface Product {
  _id: string;
  sku: string;
  nameEn: string;
  nameBn?: string;
  category: string;
  hsCode: string;
  baseUom: string;
  brand?: string;
  isMedical: boolean;
  isExpirable: boolean;
  minStockQty: number;
  retailPrice: number;
  showroomPrice: number;
  resellerTierPrices?: ProductTierPrice[];
  barcodes?: string[];
  seoContent?: ProductSeoContent;
  isActive: boolean;
  inStock?: boolean;
  availableStock?: number;
  imageUrl?: string;
  averageRating?: number;
  ratingCount?: number;
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

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutPayload {
  customerId?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  deliveryAddress: string;
  district: string;
  paymentMethod: 'COD' | 'ONLINE_SSLCOMMERZ';
  items: {
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    uom: string;
  }[];
  shippingFee: number;
  notes?: string;
}

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  challanNumber?: string;
  customerName: string;
  customerMobile: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  estimatedDelivery: string;
}

