import { apiClient } from '../lib/api';
import {
  InventoryDashboardData,
  StockOverviewItem,
  WarehouseBin,
  ProductBatch,
  StockTransfer,
  StockAdjustment,
  PhysicalCount,
  ExpiryManagementData,
  ReorderAlert,
  InventorySettings,
} from '../types';

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      q.append(k, String(v));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const inventoryManagementService = {
  // ─── 01. DASHBOARD ─────────────────────────────────────────────────────────
  async getDashboard(params: {
    warehouseId?: string;
    categoryId?: string;
    brandId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ success: boolean; data: InventoryDashboardData }> {
    return apiClient(`/erp/inventory-management/dashboard${buildQuery(params)}`);
  },

  // ─── 02. STOCK OVERVIEW ────────────────────────────────────────────────────
  async getStockOverview(params: {
    warehouseId?: string;
    categoryId?: string;
    brandId?: string;
    stockStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: StockOverviewItem[]; total: number; page: number; limit: number; totalPages: number }> {
    return apiClient(`/erp/inventory-management/stock-overview${buildQuery(params)}`);
  },

  // ─── 03. WAREHOUSES ────────────────────────────────────────────────────────
  async listWarehouses(): Promise<{ success: boolean; data: any[] }> {
    return apiClient('/erp/inventory-management/warehouses');
  },

  // ─── 04. WAREHOUSE BINS ────────────────────────────────────────────────────
  async listBins(params: {
    warehouseId?: string;
    zone?: string;
    aisle?: string;
    binType?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: WarehouseBin[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/inventory-management/bins${buildQuery(params)}`);
  },

  async createBin(data: Partial<WarehouseBin>): Promise<{ success: boolean; data: WarehouseBin }> {
    return apiClient('/erp/inventory-management/bins', { method: 'POST', body: JSON.stringify(data) });
  },

  async getBin(id: string): Promise<{ success: boolean; data: WarehouseBin }> {
    return apiClient(`/erp/inventory-management/bins/${id}`);
  },

  async updateBin(id: string, data: Partial<WarehouseBin>): Promise<{ success: boolean; data: WarehouseBin }> {
    return apiClient(`/erp/inventory-management/bins/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteBin(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient(`/erp/inventory-management/bins/${id}`, { method: 'DELETE' });
  },

  async getBinOccupancy(warehouseId: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient(`/erp/inventory-management/bins/occupancy/${warehouseId}`);
  },

  // ─── 05. BATCH / LOT MANAGEMENT ───────────────────────────────────────────
  async listBatches(params: {
    sku?: string;
    warehouseId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: ProductBatch[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/inventory-management/batches${buildQuery(params)}`);
  },

  async getBatch(id: string): Promise<{ success: boolean; data: ProductBatch }> {
    return apiClient(`/erp/inventory-management/batches/${id}`);
  },

  // ─── 06. EXPIRY MANAGEMENT ─────────────────────────────────────────────────
  async getExpiryManagement(params: {
    warehouseId?: string;
    daysThreshold?: number;
  } = {}): Promise<{ success: boolean; data: ExpiryManagementData }> {
    return apiClient(`/erp/inventory-management/expiry${buildQuery(params)}`);
  },

  // ─── 07. FEFO ALLOCATION ───────────────────────────────────────────────────
  async allocateStock(data: { sku: string; warehouseId: string; quantity: number; method?: 'FEFO' | 'FIFO' }): Promise<{ success: boolean; data: any[] }> {
    return apiClient('/erp/inventory-management/allocation/allocate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ─── 08. STOCK RESERVATION ────────────────────────────────────────────────
  async reserveStock(data: { sku: string; warehouseId: string; quantity: number; referenceNo?: string }): Promise<{ success: boolean; data: any }> {
    return apiClient('/erp/inventory-management/reservation/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async releaseReservation(data: { sku: string; warehouseId: string; quantity: number; referenceNo?: string }): Promise<{ success: boolean; data: any }> {
    return apiClient('/erp/inventory-management/reservation/release', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ─── 09. STOCK TRANSFERS ──────────────────────────────────────────────────
  async listTransfers(params: {
    sourceWarehouseId?: string;
    destinationWarehouseId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: StockTransfer[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/inventory-management/transfers${buildQuery(params)}`);
  },

  async createTransfer(data: Partial<StockTransfer> & { items: any[] }): Promise<{ success: boolean; data: StockTransfer }> {
    return apiClient('/erp/inventory-management/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTransfer(id: string): Promise<{ success: boolean; data: StockTransfer }> {
    return apiClient(`/erp/inventory-management/transfers/${id}`);
  },

  async submitTransfer(id: string): Promise<{ success: boolean; data: StockTransfer }> {
    return apiClient(`/erp/inventory-management/transfers/${id}/submit`, { method: 'POST', body: '{}' });
  },

  async approveTransfer(id: string): Promise<{ success: boolean; data: StockTransfer }> {
    return apiClient(`/erp/inventory-management/transfers/${id}/approve`, { method: 'POST', body: '{}' });
  },

  async dispatchTransfer(id: string, data: { vehicleNumber?: string; driverName?: string; challanNumber?: string }): Promise<{ success: boolean; data: StockTransfer }> {
    return apiClient(`/erp/inventory-management/transfers/${id}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async receiveTransfer(id: string, data: { receivedItems?: any[] }): Promise<{ success: boolean; data: StockTransfer }> {
    return apiClient(`/erp/inventory-management/transfers/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelTransfer(id: string, reason: string): Promise<{ success: boolean; data: StockTransfer }> {
    return apiClient(`/erp/inventory-management/transfers/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ─── 10. STOCK ADJUSTMENTS ────────────────────────────────────────────────
  async listAdjustments(params: {
    warehouseId?: string;
    adjustmentType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: StockAdjustment[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/inventory-management/adjustments${buildQuery(params)}`);
  },

  async createAdjustment(data: Partial<StockAdjustment> & { items: any[] }): Promise<{ success: boolean; data: StockAdjustment }> {
    return apiClient('/erp/inventory-management/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAdjustment(id: string): Promise<{ success: boolean; data: StockAdjustment }> {
    return apiClient(`/erp/inventory-management/adjustments/${id}`);
  },

  async submitAdjustment(id: string): Promise<{ success: boolean; data: StockAdjustment }> {
    return apiClient(`/erp/inventory-management/adjustments/${id}/submit`, { method: 'POST', body: '{}' });
  },

  async approveAdjustment(id: string): Promise<{ success: boolean; data: StockAdjustment }> {
    return apiClient(`/erp/inventory-management/adjustments/${id}/approve`, { method: 'POST', body: '{}' });
  },

  async postAdjustment(id: string): Promise<{ success: boolean; data: StockAdjustment }> {
    return apiClient(`/erp/inventory-management/adjustments/${id}/post`, { method: 'POST', body: '{}' });
  },

  async rejectAdjustment(id: string, reason: string): Promise<{ success: boolean; data: StockAdjustment }> {
    return apiClient(`/erp/inventory-management/adjustments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ─── 11 & 12. PHYSICAL STOCK COUNT & RECONCILIATION ──────────────────────
  async listCounts(params: {
    warehouseId?: string;
    countType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: PhysicalCount[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/inventory-management/physical-counts${buildQuery(params)}`);
  },

  async createCount(data: { warehouseId: string; countType?: string; countDate?: string; remarks?: string }): Promise<{ success: boolean; data: PhysicalCount }> {
    return apiClient('/erp/inventory-management/physical-counts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getCount(id: string): Promise<{ success: boolean; data: PhysicalCount }> {
    return apiClient(`/erp/inventory-management/physical-counts/${id}`);
  },

  async recordCounts(id: string, items: Array<{ batchId: string; countedQty: number; notes?: string }>): Promise<{ success: boolean; data: PhysicalCount }> {
    return apiClient(`/erp/inventory-management/physical-counts/${id}/record`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  async reconcileCount(id: string): Promise<{ success: boolean; data: PhysicalCount }> {
    return apiClient(`/erp/inventory-management/physical-counts/${id}/reconcile`, {
      method: 'POST',
      body: '{}',
    });
  },

  // ─── 13. DAMAGED / EXPIRED STOCK ─────────────────────────────────────────
  async getDamagedAndExpired(warehouseId?: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient(`/erp/inventory-management/damaged-expired${buildQuery({ warehouseId })}`);
  },

  // ─── 14. STOCK MOVEMENT HISTORY ──────────────────────────────────────────
  async getMovementHistory(params: {
    sku?: string;
    warehouseId?: string;
    movementType?: string;
    referenceNo?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ success: boolean; items: any[]; total: number; page: number; totalPages: number }> {
    return apiClient(`/erp/inventory-management/movements/history${buildQuery(params)}`);
  },

  // ─── 15. REORDER ALERTS ───────────────────────────────────────────────────
  async getReorderAlerts(warehouseId?: string): Promise<{ success: boolean; data: ReorderAlert[] }> {
    return apiClient(`/erp/inventory-management/alerts/reorder${buildQuery({ warehouseId })}`);
  },

  // ─── 16. INVENTORY REPORTS ────────────────────────────────────────────────
  async getReports(reportType: string, warehouseId?: string): Promise<{ success: boolean; data: any }> {
    return apiClient(`/erp/inventory-management/reports${buildQuery({ reportType, warehouseId })}`);
  },

  // ─── 17. INVENTORY SETTINGS ───────────────────────────────────────────────
  async getSettings(): Promise<{ success: boolean; data: InventorySettings }> {
    return apiClient('/erp/inventory-management/settings');
  },

  async updateSettings(data: Partial<InventorySettings>): Promise<{ success: boolean; data: InventorySettings }> {
    return apiClient('/erp/inventory-management/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ─── 18. ACTIVITY LOGS ────────────────────────────────────────────────────
  async getActivityLogs(limit?: number): Promise<{ success: boolean; data: any[] }> {
    return apiClient(`/erp/inventory-management/activity-logs${buildQuery({ limit })}`);
  },
};
