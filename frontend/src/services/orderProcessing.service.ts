import { apiClient } from '../lib/api';

export interface OrderItem {
  productId: string;
  sku: string;
  productName?: string;
  barcode?: string;
  batchNumber?: string;
  batchId?: string;
  warehouseId?: string;
  locationBin?: string;
  qty: number;
  reservedQty?: number;
  pickedQty?: number;
  packedQty?: number;
  dispatchedQty?: number;
  deliveredQty?: number;
  uom: string;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  lineTotal: number;
  itemNotes?: string;
}

export interface OrderPaymentRecord {
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
  paymentDate: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface OrderTimelineEvent {
  status: string;
  event: string;
  timestamp: string;
  userId?: string;
  description?: string;
  metadata?: any;
}

export interface OrderProcessingItem {
  _id: string;
  orderNo: string;
  customerId: any;
  orderSource: string;
  orderChannel: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal?: number;
  vatTotal: number;
  shippingCharge?: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress?: string;
  billingAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  isHold?: boolean;
  holdReason?: string;
  holdBy?: string;
  holdAt?: string;
  releaseHoldReason?: string;
  approvalStatus?: string;
  pickingStatus?: string;
  packingStatus?: string;
  dispatchStatus?: string;
  deliveryStatus?: string;
  codStatus?: string;
  codCollectionAmount?: number;
  timeline?: OrderTimelineEvent[];
  paymentRecords?: OrderPaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderDashboardKPIs {
  totalOrders: number;
  totalValue: number;
  totalPaid: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  dispatchedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  outstandingValue: number;
  todaysOrders?: any;
}

export interface OrderDashboardData {
  kpiCards: OrderDashboardKPIs;
  charts: {
    ordersByStatus: Array<{ status: string; count: number; value: number }>;
    ordersByPaymentStatus: Array<{ status: string; count: number; value: number }>;
    ordersByChannel: Array<{ channel: string; count: number; value: number }>;
    dailyTrends: Array<{ date: string; count: number; value: number }>;
    topProducts: Array<{ sku: string; name: string; qty: number; amount: number }>;
  };
}

export interface StockAvailabilityItem {
  sku: string;
  productName: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  batches: Array<{
    batchId: string;
    batchNumber: string;
    warehouseId: string;
    binId?: string;
    availableQty: number;
    expiryDate?: string;
  }>;
}

export interface OrderSettingsData {
  orderPrefix: string;
  autoConfirmOnlineOrders: boolean;
  autoReserveOnConfirm: boolean;
  autoInvoiceOnDelivery: boolean;
  requirePaymentVerificationForBank: boolean;
  codMaxLimit: number;
  approvalThresholdAmount: number;
  allowPartialDelivery: boolean;
  courierPartners: string[];
  cancellationAllowedStatuses: string[];
  defaultPaymentTerms: string;
  orderNotesTemplate?: string;
}

export const orderProcessingService = {
  // 1. Dashboard
  async getDashboard(params: Record<string, any> = {}): Promise<OrderDashboardData> {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    const res = await apiClient<{ success: boolean; data: OrderDashboardData }>(
      `/erp/orders/dashboard?${q.toString()}`
    );
    return res.data;
  },

  // 2. Orders list
  async listOrders(params: Record<string, any> = {}): Promise<{
    orders: OrderProcessingItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') q.append(k, String(v));
    });
    const res = await apiClient<{
      success: boolean;
      data: { orders: OrderProcessingItem[]; pagination: any };
    }>(`/erp/orders?${q.toString()}`);
    return res.data;
  },

  // 3. Single Order details
  async getOrder(id: string): Promise<{ order: OrderProcessingItem; reservations: any[]; pickingSessions: any[]; packingSessions: any[] }> {
    const res = await apiClient<{
      success: boolean;
      data: { order: OrderProcessingItem; reservations: any[]; pickingSessions: any[]; packingSessions: any[] };
    }>(`/erp/orders/${id}`);
    return res.data;
  },

  // 4. Create manual order
  async createManualOrder(payload: any): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      '/erp/orders',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  // 5. Update status
  async updateStatus(id: string, status: string, reason?: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }
    );
    return res.data;
  },

  // 6. Confirm order
  async confirmOrder(id: string, reason?: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },

  // 7. Hold & Release hold
  async holdOrder(id: string, reason: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/hold`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },

  async releaseHold(id: string, reason: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/release-hold`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },

  // 8. Cancel order
  async cancelOrder(id: string, reason: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },

  // 9. Payment recording & verification
  async recordPayment(id: string, payload: any): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async verifyPayment(id: string, paymentNumber: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/payments/${paymentNumber}/verify`,
      { method: 'POST' }
    );
    return res.data;
  },

  async rejectPayment(id: string, paymentNumber: string, reason: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/payments/${paymentNumber}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return res.data;
  },

  async recordCod(id: string, payload: any): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/cod/collect`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  // 10. Inventory reservation & Stock availability
  async checkStockAvailability(items: Array<{ sku: string; warehouseId?: string }>): Promise<StockAvailabilityItem[]> {
    const res = await apiClient<{ success: boolean; data: StockAvailabilityItem[] }>(
      '/erp/orders/stock-availability',
      {
        method: 'POST',
        body: JSON.stringify({ items }),
      }
    );
    return res.data;
  },

  async reserveStock(id: string, warehouseId?: string): Promise<{ order: OrderProcessingItem; reservation: any }> {
    const res = await apiClient<{ success: boolean; data: { order: OrderProcessingItem; reservation: any } }>(
      `/erp/orders/${id}/reserve`,
      {
        method: 'POST',
        body: JSON.stringify({ warehouseId }),
      }
    );
    return res.data;
  },

  async releaseReservation(id: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/release-reservation`,
      { method: 'POST' }
    );
    return res.data;
  },

  // 11. Picking & Packing
  async createPickingList(id: string, payload: { warehouseId?: string; pickerId?: string; pickerName?: string }): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/orders/${id}/picking`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async updatePickingItem(id: string, pickingId: string, payload: { sku: string; pickedQty: number; barcode?: string }): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/orders/${id}/picking/${pickingId}/items`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async completePicking(id: string, pickingId: string): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/picking/${pickingId}/complete`,
      { method: 'POST' }
    );
    return res.data;
  },

  async createPackingSession(id: string, payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/orders/${id}/packing`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  // 12. Dispatch & Delivery
  async dispatchOrder(id: string, payload: any): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/dispatch`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async confirmDelivery(id: string, payload: any): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/delivery`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async recordPartialDelivery(id: string, payload: any): Promise<OrderProcessingItem> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem }>(
      `/erp/orders/${id}/partial-delivery`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  async generateChallan(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/orders/${id}/generate-challan`,
      { method: 'POST' }
    );
    return res.data;
  },

  async generateInvoice(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/orders/${id}/generate-invoice`,
      { method: 'POST' }
    );
    return res.data;
  },

  // 13. Timeline & Customer History
  async getTimeline(id: string): Promise<OrderTimelineEvent[]> {
    const res = await apiClient<{ success: boolean; data: OrderTimelineEvent[] }>(
      `/erp/orders/${id}/timeline`
    );
    return res.data;
  },

  async getCustomerHistory(customerId: string): Promise<OrderProcessingItem[]> {
    const res = await apiClient<{ success: boolean; data: OrderProcessingItem[] }>(
      `/erp/orders/customer/${customerId}/history`
    );
    return res.data;
  },

  // 14. Reports
  async getReports(reportType: string = 'summary', params: Record<string, any> = {}): Promise<any> {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    const queryString = q.toString() ? `?${q.toString()}` : '';
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/orders/reports/${encodeURIComponent(reportType)}${queryString}`
    );
    return res.data;
  },

  // 15. Settings
  async getSettings(): Promise<OrderSettingsData> {
    const res = await apiClient<{ success: boolean; data: OrderSettingsData }>(
      '/erp/orders/settings'
    );
    return res.data;
  },

  async updateSettings(payload: Partial<OrderSettingsData>): Promise<OrderSettingsData> {
    const res = await apiClient<{ success: boolean; data: OrderSettingsData }>(
      '/erp/orders/settings',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  // 16. Public customer tracking
  async trackPublicOrder(query: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/orders/public/track?query=${encodeURIComponent(query)}`
    );
    return res.data;
  },
};

export default orderProcessingService;
