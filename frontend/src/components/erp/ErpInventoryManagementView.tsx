'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Warehouse,
  RefreshCw,
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Truck,
  ArrowRightLeft,
  ClipboardList,
  BarChart3,
  Settings,
  Activity,
  Box,
  Layers,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckSquare,
  Filter,
  RotateCcw,
  Eye,
  Send,
  ThumbsUp,
  Archive,
} from 'lucide-react';
import { inventoryManagementService } from '../../services/inventoryManagement.service';
import {
  InventorySubmodule,
  InventoryDashboardData,
  StockOverviewItem,
  WarehouseBin,
  ProductBatch,
  StockTransfer,
  StockAdjustment,
  PhysicalCount,
  ExpiryManagementData,
  ReorderAlert,
} from '../../types';
import './ErpInventoryManagementView.css';

interface Props {
  currentSubmodule?: InventorySubmodule;
  onSubmoduleChange?: (sub: InventorySubmodule) => void;
}

function fmt(n: number | undefined | null, dec = 0): string {
  if (n === undefined || n === null) return '0';
  return n.toLocaleString('en-BD', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(d?: string): number {
  if (!d) return Infinity;
  const diff = new Date(d).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function expiryClass(d?: string): string {
  const days = daysUntil(d);
  if (days < 0) return 'erp-inv-expiry-critical';
  if (days <= 30) return 'erp-inv-expiry-critical';
  if (days <= 60) return 'erp-inv-expiry-warning';
  if (days <= 90) return 'erp-inv-expiry-attention';
  return 'erp-inv-expiry-ok';
}

function statusBadge(status: string) {
  const cls = `erp-inv-status erp-inv-status-${status.toLowerCase().replace(/ /g, '_').replace(/_/g, '_')}`;
  const labels: Record<string, string> = {
    draft: 'Draft', submitted: 'Submitted', approved: 'Approved',
    in_transit: 'In Transit', received: 'Received', cancelled: 'Cancelled',
    posted: 'Posted', rejected: 'Rejected', planned: 'Planned',
    in_progress: 'In Progress', completed: 'Completed', reconciled: 'Reconciled',
    in_stock: 'In Stock', low_stock: 'Low Stock', out_of_stock: 'Out of Stock', expired: 'Expired',
  };
  return <span className={cls}>{labels[status.toLowerCase()] || status}</span>;
}

export const ErpInventoryManagementView: React.FC<Props> = ({
  currentSubmodule = 'inv-dashboard',
  onSubmoduleChange,
}) => {
  const [activeSub, setActiveSub] = useState<InventorySubmodule>(currentSubmodule);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<InventoryDashboardData | null>(null);
  const [stockOverview, setStockOverview] = useState<StockOverviewItem[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [bins, setBins] = useState<WarehouseBin[]>([]);
  const [binTotal, setBinTotal] = useState(0);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [transferTotal, setTransferTotal] = useState(0);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [adjustmentTotal, setAdjustmentTotal] = useState(0);
  const [physicalCounts, setPhysicalCounts] = useState<PhysicalCount[]>([]);
  const [countTotal, setCountTotal] = useState(0);
  const [expiryData, setExpiryData] = useState<ExpiryManagementData | null>(null);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [damagedStock, setDamagedStock] = useState<any[]>([]);
  const [movementHistory, setMovementHistory] = useState<any[]>([]);
  const [movementTotal, setMovementTotal] = useState(0);
  const [reports, setReports] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setActiveSub(currentSubmodule);
    setCurrentPage(1);
    setSearchTerm('');
    setStatusFilter('ALL');
  }, [currentSubmodule]);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubChange = (sub: InventorySubmodule) => {
    setActiveSub(sub);
    onSubmoduleChange?.(sub);
  };

  // ─── Data loaders ────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.getDashboard({ warehouseId: warehouseFilter || undefined });
      setDashboard(res.data);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter]);

  const loadStockOverview = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.getStockOverview({
        warehouseId: warehouseFilter || undefined,
        stockStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });
      setStockOverview(res.items || []);
      setStockTotal(res.total || 0);
      setStockTotalPages(res.totalPages || 1);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load stock overview', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter, statusFilter, searchTerm]);

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.listWarehouses();
      setWarehouses(res.data || []);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load warehouses', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBins = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.listBins({
        warehouseId: warehouseFilter || undefined,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });
      setBins(res.items || []);
      setBinTotal(res.total || 0);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load bins', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter, searchTerm]);

  const loadBatches = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.listBatches({
        warehouseId: warehouseFilter || undefined,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });
      setBatches(res.items || []);
      setBatchTotal(res.total || 0);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load batches', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter, searchTerm]);

  const loadExpiry = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.getExpiryManagement({
        warehouseId: warehouseFilter || undefined,
      });
      setExpiryData(res.data);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load expiry data', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter]);

  const loadTransfers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.listTransfers({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });
      setTransfers(res.items || []);
      setTransferTotal(res.total || 0);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load transfers', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  const loadAdjustments = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.listAdjustments({
        warehouseId: warehouseFilter || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });
      setAdjustments(res.items || []);
      setAdjustmentTotal(res.total || 0);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load adjustments', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter, statusFilter, searchTerm]);

  const loadCounts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.listCounts({
        warehouseId: warehouseFilter || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });
      setPhysicalCounts(res.items || []);
      setCountTotal(res.total || 0);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load counts', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter, statusFilter, searchTerm]);

  const loadDamaged = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.getDamagedAndExpired(warehouseFilter || undefined);
      setDamagedStock(res.data || []);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load damaged stock', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter]);

  const loadMovements = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.getMovementHistory({
        warehouseId: warehouseFilter || undefined,
        referenceNo: searchTerm || undefined,
        page,
        limit: 30,
      });
      setMovementHistory(res.items || []);
      setMovementTotal(res.total || 0);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load movements', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter, searchTerm]);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.getReorderAlerts(warehouseFilter || undefined);
      setReorderAlerts(res.data || []);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load alerts', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter]);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryManagementService.getReports('VALUATION', warehouseFilter || undefined);
      setReports(res.data);
    } catch (err: any) {
      showMsg(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseFilter]);

  // On submodule mount, load relevant data
  useEffect(() => {
    if (activeSub === 'inv-dashboard') loadDashboard();
    else if (activeSub === 'inv-stock-overview') loadStockOverview(1);
    else if (activeSub === 'inv-warehouses') loadWarehouses();
    else if (activeSub === 'inv-bins') loadBins(1);
    else if (activeSub === 'inv-batches') loadBatches(1);
    else if (activeSub === 'inv-expiry') loadExpiry();
    else if (activeSub === 'inv-transfers') loadTransfers(1);
    else if (activeSub === 'inv-adjustments') loadAdjustments(1);
    else if (activeSub === 'inv-physical-count' || activeSub === 'inv-reconciliation') loadCounts(1);
    else if (activeSub === 'inv-damaged-expired') loadDamaged();
    else if (activeSub === 'inv-movement-history') loadMovements(1);
    else if (activeSub === 'inv-alerts') loadAlerts();
    else if (activeSub === 'inv-reports') loadReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSub]);

  // ─── Transfer Actions ─────────────────────────────────────────────────────
  const handleTransferAction = async (id: string, action: string) => {
    try {
      setLoading(true);
      if (action === 'submit') await inventoryManagementService.submitTransfer(id);
      if (action === 'approve') await inventoryManagementService.approveTransfer(id);
      if (action === 'dispatch') await inventoryManagementService.dispatchTransfer(id, {});
      if (action === 'receive') await inventoryManagementService.receiveTransfer(id, {});
      if (action === 'cancel') await inventoryManagementService.cancelTransfer(id, 'Cancelled by ERP user');
      showMsg(`Transfer ${action} successful`);
      loadTransfers(currentPage);
    } catch (err: any) {
      showMsg(err.message || `Failed to ${action} transfer`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Adjustment Actions ───────────────────────────────────────────────────
  const handleAdjustmentAction = async (id: string, action: string) => {
    try {
      setLoading(true);
      if (action === 'submit') await inventoryManagementService.submitAdjustment(id);
      if (action === 'approve') await inventoryManagementService.approveAdjustment(id);
      if (action === 'post') await inventoryManagementService.postAdjustment(id);
      if (action === 'reject') await inventoryManagementService.rejectAdjustment(id, 'Rejected by ERP user');
      showMsg(`Adjustment ${action} successful`);
      loadAdjustments(currentPage);
    } catch (err: any) {
      showMsg(err.message || `Failed to ${action} adjustment`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Count Actions ────────────────────────────────────────────────────────
  const handleCountReconcile = async (id: string) => {
    try {
      setLoading(true);
      await inventoryManagementService.reconcileCount(id);
      showMsg('Count reconciled and stock adjusted');
      loadCounts(currentPage);
    } catch (err: any) {
      showMsg(err.message || 'Failed to reconcile count', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER SUBMODULE CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  const renderDashboard = () => {
    if (loading && !dashboard) {
      return <div className="erp-inv-loading"><RefreshCw className="animate-spin" size={18} /> Loading dashboard...</div>;
    }
    const d = dashboard;
    if (!d) return <div className="erp-inv-empty">No data yet. <button className="erp-inv-btn erp-inv-btn-primary" onClick={loadDashboard}>Load</button></div>;

    return (
      <>
        {/* KPI Grid */}
        <div className="erp-inv-kpi-grid">
          {[
            { label: 'Total Products', value: fmt(d.totalProducts), sub: 'Active in catalog', icon: <Package size={16} />, cls: 'erp-inv-kpi-green' },
            { label: 'Active SKUs', value: fmt(d.totalActiveSKUs), sub: 'With stock in hand', icon: <Layers size={16} />, cls: 'erp-inv-kpi-green' },
            { label: 'Warehouses', value: fmt(d.totalWarehouses), sub: 'Operational', icon: <Warehouse size={16} />, cls: 'erp-inv-kpi-blue' },
            { label: 'Available Stock', value: fmt(d.totalAvailableStock), sub: 'Sellable units', icon: <Box size={16} />, cls: 'erp-inv-kpi-green' },
            { label: 'Reserved Stock', value: fmt(d.totalReservedStock), sub: 'Locked by orders', icon: <CheckSquare size={16} />, cls: 'erp-inv-kpi-gold' },
            { label: 'In Transit', value: fmt(d.totalInTransitStock), sub: 'Inter-warehouse', icon: <Truck size={16} />, cls: 'erp-inv-kpi-blue' },
            { label: 'Damaged', value: fmt(d.totalDamagedStock), sub: 'Quarantined', icon: <AlertTriangle size={16} />, cls: 'erp-inv-kpi-orange' },
            { label: 'Expired Stock', value: fmt(d.totalExpiredStock), sub: 'Write-off needed', icon: <AlertCircle size={16} />, cls: 'erp-inv-kpi-red' },
            { label: 'Low Stock', value: fmt(d.lowStockProducts), sub: 'SKUs below reorder', icon: <TrendingDown size={16} />, cls: 'erp-inv-kpi-orange' },
            { label: 'Out of Stock', value: fmt(d.outOfStockProducts), sub: 'Zero available', icon: <AlertCircle size={16} />, cls: 'erp-inv-kpi-red' },
            { label: 'Near Expiry', value: fmt(d.expiringProducts), sub: '≤30 days', icon: <Calendar size={16} />, cls: 'erp-inv-kpi-orange' },
            { label: 'Expired Batches', value: fmt(d.expiredBatches), sub: 'Needs action', icon: <Archive size={16} />, cls: 'erp-inv-kpi-red' },
            { label: 'Transfers Pending', value: fmt(d.stockTransfersPending), sub: 'Awaiting action', icon: <ArrowRightLeft size={16} />, cls: 'erp-inv-kpi-blue' },
            { label: 'Adj. Pending', value: fmt(d.stockAdjustmentsPending), sub: 'For approval', icon: <ClipboardList size={16} />, cls: 'erp-inv-kpi-gold' },
            { label: 'Pending Counts', value: fmt(d.pendingStockCounts), sub: 'Planned / in progress', icon: <CheckSquare size={16} />, cls: 'erp-inv-kpi-blue' },
            { label: 'Inventory Value', value: `৳${fmt(d.inventoryValuation, 0)}`, sub: 'Moving Avg Cost', icon: <DollarSign size={16} />, cls: 'erp-inv-kpi-gold' },
          ].map((k) => (
            <div key={k.label} className="erp-inv-kpi-card">
              <div className={`erp-inv-kpi-icon ${k.cls}`}>{k.icon}</div>
              <div className="erp-inv-kpi-label">{k.label}</div>
              <div className="erp-inv-kpi-value">{k.value}</div>
              <div className="erp-inv-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Warehouse Summary + Category Summary */}
        <div className="erp-inv-two-col">
          <div className="erp-inv-panel">
            <div className="erp-inv-panel-title"><Warehouse size={14} /> Warehouse Stock Summary</div>
            {d.warehouseStockSummary.length === 0
              ? <p className="erp-inv-empty" style={{ padding: '1rem' }}>No data</p>
              : d.warehouseStockSummary.map((w) => (
                <div key={w.warehouseId} className="erp-inv-wh-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{w.warehouseName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{w.warehouseCode} · {w.batchCount} batches</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#1e3932' }}>{fmt(w.stockQty)} units</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>৳{fmt(w.valuation, 0)}</div>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="erp-inv-panel">
            <div className="erp-inv-panel-title"><BarChart3 size={14} /> Category Stock Summary</div>
            {d.categoryStockSummary.length === 0
              ? <p className="erp-inv-empty" style={{ padding: '1rem' }}>No data</p>
              : d.categoryStockSummary.map((c) => (
                <div key={c.category} className="erp-inv-wh-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{c.category}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.skuCount} SKUs</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#1e3932' }}>{fmt(c.stockQty)} units</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>৳{fmt(c.valuation, 0)}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </>
    );
  };

  const renderStockOverview = () => (
    <>
      <div className="erp-inv-toolbar">
        <div className="erp-inv-search">
          <Search className="erp-inv-search-icon" />
          <input placeholder="Search SKU, batch, product..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="erp-inv-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadStockOverview(1)}><RefreshCw size={14} /> Refresh</button>
        <button className="erp-inv-btn erp-inv-btn-primary" onClick={() => loadStockOverview(1)}><Filter size={14} /> Apply</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr>
              <th>Product / SKU</th>
              <th>Batch</th>
              <th>Warehouse</th>
              <th>Expiry</th>
              <th>Physical</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Damaged</th>
              <th>Value (৳)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="erp-inv-loading">Loading...</td></tr>
            ) : stockOverview.length === 0 ? (
              <tr><td colSpan={10} className="erp-inv-empty">No stock records found</td></tr>
            ) : stockOverview.map(item => (
              <tr key={item._id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.sku}</div>
                </td>
                <td style={{ fontSize: '0.82rem' }}>{item.batchNumber}</td>
                <td style={{ fontSize: '0.82rem' }}>{item.warehouseName}</td>
                <td>
                  {item.expiryDate
                    ? <span className={expiryClass(item.expiryDate)}>{fmtDate(item.expiryDate)}</span>
                    : <span style={{ color: '#94a3b8' }}>—</span>
                  }
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(item.physicalQuantity)}</td>
                <td style={{ textAlign: 'right', color: '#c89348' }}>{fmt(item.reservedQuantity)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e3932' }}>{fmt(item.availableQuantity)}</td>
                <td style={{ textAlign: 'right', color: '#dc2626' }}>{fmt(item.damagedQuantity)}</td>
                <td style={{ textAlign: 'right', fontSize: '0.82rem' }}>৳{fmt(item.stockValue, 0)}</td>
                <td>{statusBadge(item.stockStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="erp-inv-pagination">
          <span>Showing {stockOverview.length} of {stockTotal} records</span>
          <div className="erp-inv-page-btns">
            <button className="erp-inv-page-btn" disabled={stockPage <= 1} onClick={() => { setStockPage(p => p - 1); loadStockOverview(stockPage - 1); }}>‹ Prev</button>
            <button className="erp-inv-page-btn" disabled={stockPage >= stockTotalPages} onClick={() => { setStockPage(p => p + 1); loadStockOverview(stockPage + 1); }}>Next ›</button>
          </div>
        </div>
      </div>
    </>
  );

  const renderWarehouses = () => (
    <>
      <div className="erp-inv-toolbar">
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={loadWarehouses}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr>
              <th>Code</th><th>Name</th><th>Type</th><th>District</th><th>Central Hub</th><th>Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="erp-inv-loading">Loading...</td></tr>
              : warehouses.length === 0 ? <tr><td colSpan={6} className="erp-inv-empty">No warehouses found</td></tr>
                : warehouses.map(w => (
                  <tr key={w._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{w.warehouseCode}</td>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td>{statusBadge(w.type?.toLowerCase())}</td>
                    <td>{w.district}</td>
                    <td>{w.isCentralHub ? <CheckCircle size={14} color="#059669" /> : '—'}</td>
                    <td>{w.isActive ? <span className="erp-inv-status erp-inv-status-approved">Active</span> : <span className="erp-inv-status erp-inv-status-cancelled">Inactive</span>}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderBins = () => (
    <>
      <div className="erp-inv-toolbar">
        <div className="erp-inv-search">
          <Search className="erp-inv-search-icon" />
          <input placeholder="Search bin code, zone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadBins(1)}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr>
              <th>Bin Code</th><th>Zone</th><th>Aisle</th><th>Rack</th><th>Shelf</th><th>Type</th><th>Warehouse</th><th>Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="erp-inv-loading">Loading...</td></tr>
              : bins.length === 0 ? <tr><td colSpan={8} className="erp-inv-empty">No bins found</td></tr>
                : bins.map(b => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.binCode}</td>
                    <td>{b.zone}</td>
                    <td>{b.aisle}</td>
                    <td>{b.rack}</td>
                    <td>{b.shelf}</td>
                    <td>{b.binType}</td>
                    <td style={{ fontSize: '0.82rem' }}>{typeof b.warehouseId === 'object' ? b.warehouseId.name : b.warehouseId}</td>
                    <td>{b.isActive ? <span className="erp-inv-status erp-inv-status-approved">Active</span> : <span className="erp-inv-status erp-inv-status-cancelled">Inactive</span>}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="erp-inv-pagination">
          <span>{binTotal} bins total</span>
        </div>
      </div>
    </>
  );

  const renderBatches = () => (
    <>
      <div className="erp-inv-toolbar">
        <div className="erp-inv-search">
          <Search className="erp-inv-search-icon" />
          <input placeholder="Search batch, SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadBatches(1)}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr>
              <th>SKU</th><th>Batch #</th><th>Category</th><th>Expiry</th><th>Qty</th><th>Reserved</th><th>Damaged</th><th>Unit Cost</th><th>Warehouse</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="erp-inv-loading">Loading...</td></tr>
              : batches.length === 0 ? <tr><td colSpan={9} className="erp-inv-empty">No batches found</td></tr>
                : batches.map(b => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.sku}</td>
                    <td style={{ fontSize: '0.82rem' }}>{b.batchNumber}</td>
                    <td>{statusBadge(b.category.toLowerCase())}</td>
                    <td>
                      {b.expiryDate
                        ? <span className={expiryClass(b.expiryDate)}>{fmtDate(b.expiryDate)}</span>
                        : <span style={{ color: '#94a3b8' }}>—</span>
                      }
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(b.currentQty)}</td>
                    <td style={{ textAlign: 'right', color: '#c89348' }}>{fmt(b.reservedQty)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{fmt(b.damagedQty)}</td>
                    <td style={{ textAlign: 'right' }}>৳{fmt(b.unitCost, 2)}</td>
                    <td style={{ fontSize: '0.82rem' }}>{typeof b.warehouseId === 'object' ? b.warehouseId.name : b.warehouseId}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="erp-inv-pagination">
          <span>{batchTotal} batches total</span>
        </div>
      </div>
    </>
  );

  const renderExpiry = () => {
    if (loading && !expiryData) return <div className="erp-inv-loading"><RefreshCw className="animate-spin" size={18} /> Loading...</div>;
    const d = expiryData;
    if (!d) return <div className="erp-inv-empty"><button className="erp-inv-btn erp-inv-btn-primary" onClick={loadExpiry}>Load Expiry Data</button></div>;

    return (
      <>
        {/* Summary boxes */}
        <div className="erp-inv-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
          {[
            { label: 'Expired', value: d.summary.expiredCount, cls: 'erp-inv-kpi-red' },
            { label: 'Critical (≤30d)', value: d.summary.criticalCount, cls: 'erp-inv-kpi-red' },
            { label: 'Warning (≤60d)', value: d.summary.warningCount, cls: 'erp-inv-kpi-orange' },
            { label: 'Attention (≤90d)', value: d.summary.attentionCount, cls: 'erp-inv-kpi-gold' },
            { label: 'Total at Risk', value: d.summary.totalAtRisk, cls: 'erp-inv-kpi-orange' },
          ].map(k => (
            <div key={k.label} className="erp-inv-kpi-card">
              <div className={`erp-inv-kpi-icon ${k.cls}`}><AlertTriangle size={16} /></div>
              <div className="erp-inv-kpi-label">{k.label}</div>
              <div className="erp-inv-kpi-value">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Expired Batches */}
        {d.expired.length > 0 && (
          <div className="erp-inv-panel" style={{ marginBottom: '1rem' }}>
            <div className="erp-inv-panel-title" style={{ color: '#dc2626' }}><AlertCircle size={14} /> Expired Batches ({d.expired.length})</div>
            <div className="erp-inv-table-wrap" style={{ border: 'none' }}>
              <table className="erp-inv-table">
                <thead><tr><th>SKU</th><th>Batch</th><th>Expiry Date</th><th>Qty</th><th>Warehouse</th></tr></thead>
                <tbody>
                  {d.expired.map(b => (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.sku}</td>
                      <td>{b.batchNumber}</td>
                      <td><span className="erp-inv-expiry-critical">{fmtDate(b.expiryDate)}</span></td>
                      <td>{fmt(b.currentQty)}</td>
                      <td style={{ fontSize: '0.82rem' }}>{typeof b.warehouseId === 'object' ? (b.warehouseId as any).name : b.warehouseId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Critical batches */}
        {d.critical.length > 0 && (
          <div className="erp-inv-panel" style={{ marginBottom: '1rem' }}>
            <div className="erp-inv-panel-title" style={{ color: '#ea580c' }}><AlertTriangle size={14} /> Critical — Expiring in ≤30 Days ({d.critical.length})</div>
            <div className="erp-inv-table-wrap" style={{ border: 'none' }}>
              <table className="erp-inv-table">
                <thead><tr><th>SKU</th><th>Batch</th><th>Expiry Date</th><th>Days Left</th><th>Qty</th></tr></thead>
                <tbody>
                  {d.critical.map(b => (
                    <tr key={b._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.sku}</td>
                      <td>{b.batchNumber}</td>
                      <td><span className="erp-inv-expiry-critical">{fmtDate(b.expiryDate)}</span></td>
                      <td><span className="erp-inv-expiry-critical">{daysUntil(b.expiryDate)} days</span></td>
                      <td>{fmt(b.currentQty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderTransfers = () => (
    <>
      <div className="erp-inv-toolbar">
        <div className="erp-inv-search">
          <Search className="erp-inv-search-icon" />
          <input placeholder="Search transfer number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="erp-inv-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          {['DRAFT','SUBMITTED','APPROVED','IN_TRANSIT','RECEIVED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadTransfers(1)}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr>
              <th>Transfer #</th><th>From</th><th>To</th><th>Items</th><th>Total Value</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="erp-inv-loading">Loading...</td></tr>
              : transfers.length === 0 ? <tr><td colSpan={8} className="erp-inv-empty">No stock transfers found</td></tr>
                : transfers.map(t => {
                  const src = typeof t.sourceWarehouseId === 'object' ? t.sourceWarehouseId.name : t.sourceWarehouseId;
                  const dst = typeof t.destinationWarehouseId === 'object' ? t.destinationWarehouseId.name : t.destinationWarehouseId;
                  return (
                    <tr key={t._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t.transferNumber}</td>
                      <td style={{ fontSize: '0.82rem' }}>{src}</td>
                      <td style={{ fontSize: '0.82rem' }}>{dst}</td>
                      <td style={{ textAlign: 'center' }}>{t.items.length}</td>
                      <td style={{ textAlign: 'right' }}>৳{fmt(t.totalValue, 0)}</td>
                      <td>{statusBadge(t.status.toLowerCase())}</td>
                      <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{fmtDate(t.createdAt)}</td>
                      <td>
                        <div className="erp-inv-action-row">
                          {t.status === 'DRAFT' && <button className="erp-inv-action-btn erp-inv-action-btn-blue" onClick={() => handleTransferAction(t._id, 'submit')}><Send size={11} /> Submit</button>}
                          {t.status === 'SUBMITTED' && <button className="erp-inv-action-btn erp-inv-action-btn-green" onClick={() => handleTransferAction(t._id, 'approve')}><ThumbsUp size={11} /> Approve</button>}
                          {t.status === 'APPROVED' && <button className="erp-inv-action-btn erp-inv-action-btn-gold" onClick={() => handleTransferAction(t._id, 'dispatch')}><Truck size={11} /> Dispatch</button>}
                          {t.status === 'IN_TRANSIT' && <button className="erp-inv-action-btn erp-inv-action-btn-green" onClick={() => handleTransferAction(t._id, 'receive')}><CheckCircle size={11} /> Receive</button>}
                          {['DRAFT','SUBMITTED','APPROVED'].includes(t.status) && <button className="erp-inv-action-btn erp-inv-action-btn-red" onClick={() => handleTransferAction(t._id, 'cancel')}><Archive size={11} /> Cancel</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
        <div className="erp-inv-pagination">
          <span>{transferTotal} transfers total</span>
        </div>
      </div>
    </>
  );

  const renderAdjustments = () => (
    <>
      <div className="erp-inv-toolbar">
        <div className="erp-inv-search">
          <Search className="erp-inv-search-icon" />
          <input placeholder="Search adjustment number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="erp-inv-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          {['DRAFT','SUBMITTED','APPROVED','POSTED','REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadAdjustments(1)}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr>
              <th>Adj. #</th><th>Warehouse</th><th>Type</th><th>Items</th><th>Valuation Δ</th><th>GL Linked</th><th>Status</th><th>Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="erp-inv-loading">Loading...</td></tr>
              : adjustments.length === 0 ? <tr><td colSpan={9} className="erp-inv-empty">No stock adjustments found</td></tr>
                : adjustments.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{a.adjustmentNumber}</td>
                    <td style={{ fontSize: '0.82rem' }}>{typeof a.warehouseId === 'object' ? a.warehouseId.name : a.warehouseId}</td>
                    <td>{a.adjustmentType}</td>
                    <td style={{ textAlign: 'center' }}>{a.items.length}</td>
                    <td style={{ textAlign: 'right', color: a.totalValuationChange < 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                      {a.totalValuationChange < 0 ? '–' : '+'}৳{fmt(Math.abs(a.totalValuationChange), 0)}
                    </td>
                    <td style={{ textAlign: 'center' }}>{a.journalEntryId ? <CheckCircle size={14} color="#059669" /> : '—'}</td>
                    <td>{statusBadge(a.status.toLowerCase())}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{fmtDate(a.createdAt)}</td>
                    <td>
                      <div className="erp-inv-action-row">
                        {a.status === 'DRAFT' && <button className="erp-inv-action-btn erp-inv-action-btn-blue" onClick={() => handleAdjustmentAction(a._id, 'submit')}><Send size={11} /> Submit</button>}
                        {a.status === 'SUBMITTED' && <button className="erp-inv-action-btn erp-inv-action-btn-green" onClick={() => handleAdjustmentAction(a._id, 'approve')}><ThumbsUp size={11} /> Approve</button>}
                        {a.status === 'APPROVED' && <button className="erp-inv-action-btn erp-inv-action-btn-gold" onClick={() => handleAdjustmentAction(a._id, 'post')}><CheckSquare size={11} /> Post</button>}
                        {['DRAFT','SUBMITTED'].includes(a.status) && <button className="erp-inv-action-btn erp-inv-action-btn-red" onClick={() => handleAdjustmentAction(a._id, 'reject')}>Reject</button>}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="erp-inv-pagination">
          <span>{adjustmentTotal} adjustments total</span>
        </div>
      </div>
    </>
  );

  const renderPhysicalCounts = () => (
    <>
      <div className="erp-inv-toolbar">
        <div className="erp-inv-search">
          <Search className="erp-inv-search-icon" />
          <input placeholder="Search count number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="erp-inv-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          {['PLANNED','IN_PROGRESS','COMPLETED','RECONCILED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadCounts(1)}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr>
              <th>Count #</th><th>Warehouse</th><th>Type</th><th>Count Date</th><th>Items</th><th>Variance Value</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="erp-inv-loading">Loading...</td></tr>
              : physicalCounts.length === 0 ? <tr><td colSpan={8} className="erp-inv-empty">No physical counts found</td></tr>
                : physicalCounts.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.countNumber}</td>
                    <td style={{ fontSize: '0.82rem' }}>{typeof c.warehouseId === 'object' ? c.warehouseId.name : c.warehouseId}</td>
                    <td>{c.countType}</td>
                    <td>{fmtDate(c.countDate)}</td>
                    <td style={{ textAlign: 'center' }}>{c.items.length}</td>
                    <td style={{ textAlign: 'right', color: c.totalVarianceValue !== 0 ? '#ea580c' : '#059669', fontWeight: 700 }}>
                      {c.totalVarianceValue !== 0 ? (c.totalVarianceValue > 0 ? '+' : '') : ''}৳{fmt(c.totalVarianceValue, 0)}
                    </td>
                    <td>{statusBadge(c.status.toLowerCase())}</td>
                    <td>
                      {c.status === 'COMPLETED' && (
                        <button className="erp-inv-action-btn erp-inv-action-btn-gold" onClick={() => handleCountReconcile(c._id)}>
                          <RotateCcw size={11} /> Reconcile
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="erp-inv-pagination">
          <span>{countTotal} counts total</span>
        </div>
      </div>
    </>
  );

  const renderDamagedExpired = () => (
    <>
      <div className="erp-inv-toolbar">
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={loadDamaged}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr><th>SKU</th><th>Batch</th><th>Category</th><th>Expiry Date</th><th>Available Qty</th><th>Damaged Qty</th><th>Expired Qty</th><th>Warehouse</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="erp-inv-loading">Loading...</td></tr>
              : damagedStock.length === 0 ? <tr><td colSpan={8} className="erp-inv-empty">No damaged or expired stock</td></tr>
                : damagedStock.map((b: any) => (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.sku}</td>
                    <td>{b.batchNumber}</td>
                    <td>{b.category}</td>
                    <td><span className={expiryClass(b.expiryDate)}>{fmtDate(b.expiryDate)}</span></td>
                    <td style={{ textAlign: 'right' }}>{fmt(b.currentQty)}</td>
                    <td style={{ textAlign: 'right', color: '#ea580c', fontWeight: 700 }}>{fmt(b.damagedQty)}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>{fmt(b.expiredQty)}</td>
                    <td style={{ fontSize: '0.82rem' }}>{typeof b.warehouseId === 'object' ? b.warehouseId.name : b.warehouseId}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderMovementHistory = () => (
    <>
      <div className="erp-inv-toolbar">
        <div className="erp-inv-search">
          <Search className="erp-inv-search-icon" />
          <input placeholder="Reference No, SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadMovements(1)}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="erp-inv-table-wrap">
        <table className="erp-inv-table">
          <thead>
            <tr><th>Date</th><th>SKU</th><th>Movement Type</th><th>Qty Change</th><th>Unit Cost</th><th>Reference No</th><th>Reference Type</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="erp-inv-loading">Loading...</td></tr>
              : movementHistory.length === 0 ? <tr><td colSpan={7} className="erp-inv-empty">No movement history</td></tr>
                : movementHistory.map((m: any, i: number) => (
                  <tr key={m._id || i}>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{fmtDate(m.createdAt)}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{m.sku}</td>
                    <td>{statusBadge(m.movementType?.toLowerCase().replace('_', '_') || 'adjust')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: m.qtyChange >= 0 ? '#059669' : '#dc2626' }}>
                      {m.qtyChange >= 0 ? '+' : ''}{fmt(m.qtyChange)}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '0.82rem' }}>{m.unitCost ? `৳${fmt(m.unitCost, 2)}` : '—'}</td>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{m.referenceNo || '—'}</td>
                    <td style={{ fontSize: '0.78rem' }}>{m.referenceType || '—'}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        <div className="erp-inv-pagination">
          <span>{movementTotal} records total</span>
        </div>
      </div>
    </>
  );

  const renderAlerts = () => (
    <>
      <div className="erp-inv-toolbar">
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={loadAlerts}><RefreshCw size={14} /> Refresh</button>
      </div>
      {reorderAlerts.length === 0 && !loading
        ? <div className="erp-inv-empty"><CheckCircle size={48} className="erp-inv-empty-icon" /><p>All products are adequately stocked! No reorder alerts.</p></div>
        : (
          <div className="erp-inv-table-wrap">
            <table className="erp-inv-table">
              <thead>
                <tr><th>SKU</th><th>Product</th><th>Category</th><th>Min Level</th><th>Available</th><th>Deficit</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="erp-inv-loading">Loading...</td></tr>
                  : reorderAlerts.map(a => (
                    <tr key={a.sku}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{a.sku}</td>
                      <td style={{ fontWeight: 600 }}>{a.productName}</td>
                      <td style={{ fontSize: '0.82rem' }}>{a.category}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(a.minReorderLevel)} {a.uom}</td>
                      <td style={{ textAlign: 'right', color: a.availableStock === 0 ? '#dc2626' : '#ea580c', fontWeight: 700 }}>{fmt(a.availableStock)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(a.deficit)}</td>
                      <td>{statusBadge(a.status.toLowerCase())}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
    </>
  );

  const renderReports = () => (
    <>
      <div className="erp-inv-toolbar">
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={loadReports}><RefreshCw size={14} /> Refresh</button>
      </div>
      {reports && reports.summary && (
        <div className="erp-inv-panel">
          <div className="erp-inv-panel-title"><BarChart3 size={14} /> Inventory Valuation by Category</div>
          <div className="erp-inv-table-wrap" style={{ border: 'none' }}>
            <table className="erp-inv-table">
              <thead><tr><th>Category</th><th>Total Qty</th><th>Valuation (৳)</th><th>Batches</th></tr></thead>
              <tbody>
                {reports.summary.map((r: any) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r._id}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r.totalQty)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e3932' }}>৳{fmt(r.totalValuation, 0)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r.batchCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  const renderSettings = () => (
    <div className="erp-inv-panel" style={{ maxWidth: 500 }}>
      <div className="erp-inv-panel-title"><Settings size={14} /> Inventory Settings</div>
      <table className="erp-inv-table">
        <tbody>
          {[
            ['Default Allocation Method', 'FEFO (First Expiry, First Out)'],
            ['Costing Method', 'Moving Weighted Average Cost (WAC)'],
            ['Expiry Warning Threshold', '30 days'],
            ['Expiry Critical Threshold', '15 days'],
            ['Negative Stock Allowed', 'No'],
            ['Auto Reorder Trigger', 'Yes'],
            ['Default UOM', 'PIECE'],
          ].map(([k, v]) => (
            <tr key={k}><td style={{ fontWeight: 600, color: '#64748b' }}>{k}</td><td style={{ fontWeight: 700 }}>{v}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderActivityLogs = () => (
    <>
      <div className="erp-inv-toolbar">
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadMovements(1)}><RefreshCw size={14} /> Refresh</button>
      </div>
      {renderMovementHistory()}
    </>
  );

  const renderContent = () => {
    switch (activeSub) {
      case 'inv-dashboard': return renderDashboard();
      case 'inv-stock-overview': return renderStockOverview();
      case 'inv-warehouses': return renderWarehouses();
      case 'inv-bins': return renderBins();
      case 'inv-batches': return renderBatches();
      case 'inv-expiry': return renderExpiry();
      case 'inv-fefo': return <div className="erp-inv-empty"><Package size={48} className="erp-inv-empty-icon" /><p>FEFO Allocation — select SKU + warehouse and quantity to run allocation.</p></div>;
      case 'inv-reservation': return <div className="erp-inv-empty"><CheckSquare size={48} className="erp-inv-empty-icon" /><p>Stock Reservation — integrated with Sales Orders and E-commerce checkout.</p></div>;
      case 'inv-transfers': return renderTransfers();
      case 'inv-adjustments': return renderAdjustments();
      case 'inv-physical-count': return renderPhysicalCounts();
      case 'inv-reconciliation': return renderPhysicalCounts();
      case 'inv-damaged-expired': return renderDamagedExpired();
      case 'inv-movement-history': return renderMovementHistory();
      case 'inv-alerts': return renderAlerts();
      case 'inv-reports': return renderReports();
      case 'inv-settings': return renderSettings();
      case 'inv-activity-logs': return renderActivityLogs();
      default: return renderDashboard();
    }
  };

  const submoduleTitles: Record<InventorySubmodule, string> = {
    'inv-dashboard': 'Inventory Dashboard',
    'inv-stock-overview': 'Stock Overview',
    'inv-warehouses': 'Warehouse Management',
    'inv-bins': 'Warehouse Locations / Bins',
    'inv-batches': 'Batch / Lot Management',
    'inv-expiry': 'Expiry Management',
    'inv-fefo': 'FEFO Allocation',
    'inv-reservation': 'Stock Reservation',
    'inv-transfers': 'Stock Transfers',
    'inv-adjustments': 'Stock Adjustments',
    'inv-physical-count': 'Physical Stock Count',
    'inv-reconciliation': 'Stock Reconciliation',
    'inv-damaged-expired': 'Damaged / Expired Stock',
    'inv-movement-history': 'Stock Movement History',
    'inv-alerts': 'Reorder & Low Stock Alerts',
    'inv-reports': 'Inventory Reports',
    'inv-settings': 'Inventory Settings',
    'inv-activity-logs': 'Inventory Activity Logs',
  };

  return (
    <div className="erp-inv-container">
      {/* Header */}
      <div className="erp-inv-header">
        <div>
          <h1 className="erp-inv-title">
            <Package size={22} /> {submoduleTitles[activeSub]}
            <span className="erp-inv-badge">Module 06</span>
          </h1>
        </div>
        <button className="erp-inv-btn erp-inv-btn-secondary" onClick={() => loadDashboard()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Alert bar */}
      {message && (
        <div className={`erp-inv-alert ${message.type === 'success' ? 'erp-inv-alert-success' : 'erp-inv-alert-error'}`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default ErpInventoryManagementView;
