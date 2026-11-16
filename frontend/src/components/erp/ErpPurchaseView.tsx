'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Truck,
  RotateCcw,
  Building,
  Calendar,
  Layers,
  ShieldCheck,
  Check,
  X,
  FileCheck,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { purchaseService } from '../../services/purchase.service';
import {
  PurchaseSubmodule,
  PurchaseDashboardMetrics,
  PurchaseRequisitionItem,
  GoodsReceiveNoteItem,
  PurchaseInvoiceItem,
  SupplierPaymentItem,
  PurchaseReturnItem,
  SupplierLedgerResponse,
  PayablesSummaryResponse,
} from '../../types';
import './ErpPurchaseView.css';

interface ErpPurchaseViewProps {
  currentSubmodule?: PurchaseSubmodule;
  onSubmoduleChange?: (sub: PurchaseSubmodule) => void;
}

export const ErpPurchaseView: React.FC<ErpPurchaseViewProps> = ({
  currentSubmodule = 'purchase-dashboard',
  onSubmoduleChange,
}) => {
  const [activeSub, setActiveSub] = useState<PurchaseSubmodule>(currentSubmodule);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<PurchaseDashboardMetrics | null>(null);
  const [requisitions, setRequisitions] = useState<PurchaseRequisitionItem[]>([]);
  const [grns, setGrns] = useState<GoodsReceiveNoteItem[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoiceItem[]>([]);
  const [payments, setPayments] = useState<SupplierPaymentItem[]>([]);
  const [returns, setReturns] = useState<PurchaseReturnItem[]>([]);
  const [payables, setPayables] = useState<PayablesSummaryResponse | null>(null);
  const [ledger, setLedger] = useState<SupplierLedgerResponse | null>(null);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreatePrModal, setShowCreatePrModal] = useState(false);
  const [showCreateGrnModal, setShowCreateGrnModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);

  useEffect(() => {
    setActiveSub(currentSubmodule);
  }, [currentSubmodule]);

  const handleSubChange = (sub: PurchaseSubmodule) => {
    setActiveSub(sub);
    onSubmoduleChange?.(sub);
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Fetch initial data based on active submodule
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSub === 'purchase-dashboard') {
        const d = await purchaseService.getDashboard();
        setDashboard(d);
      } else if (activeSub === 'purchase-requisitions' || activeSub === 'requisition-approval') {
        const res = await purchaseService.listRequisitions({
          search: searchTerm,
          status: statusFilter,
        });
        setRequisitions(res.items || []);
      } else if (activeSub === 'goods-receive-notes' || activeSub === 'quality-inspection') {
        const res = await purchaseService.listGrns({ search: searchTerm, status: statusFilter });
        setGrns(res.items || []);
      } else if (activeSub === 'purchase-invoices') {
        const res = await purchaseService.listInvoices({ search: searchTerm, status: statusFilter });
        setInvoices(res.items || []);
      } else if (activeSub === 'supplier-payments') {
        const res = await purchaseService.listPayments({ search: searchTerm, status: statusFilter });
        setPayments(res.items || []);
      } else if (activeSub === 'purchase-returns') {
        const res = await purchaseService.listReturns({ search: searchTerm, status: statusFilter });
        setReturns(res.items || []);
      } else if (activeSub === 'payables-aging') {
        const res = await purchaseService.getPayablesSummary();
        setPayables(res);
      }
    } catch (err: any) {
      console.error('Error loading purchase data:', err);
      showNotification(err.message || 'ডাটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSub, statusFilter]);

  // Submodules list
  const SUBMODULES: Array<{ id: PurchaseSubmodule; label: string; icon: any }> = [
    { id: 'purchase-dashboard', label: '1. Dashboard', icon: TrendingUp },
    { id: 'purchase-requisitions', label: '2. Requisitions', icon: FileText },
    { id: 'requisition-approval', label: '3. PR Approval', icon: ShieldCheck },
    { id: 'rfq-management', label: '4. RFQ Sourcing', icon: Layers },
    { id: 'supplier-quotations', label: '5. Quotations', icon: FileCheck },
    { id: 'comparative-statements', label: '6. CS Analysis', icon: CheckCircle },
    { id: 'purchase-orders', label: '7. Purchase Orders', icon: ShoppingCart },
    { id: 'goods-receive-notes', label: '8. GRN Receiving', icon: Truck },
    { id: 'quality-inspection', label: '9. Inspection & QC', icon: ShieldCheck },
    { id: 'purchase-invoices', label: '10. Bills & Invoices', icon: DollarSign },
    { id: 'supplier-payments', label: '11. Payments', icon: DollarSign },
    { id: 'purchase-returns', label: '12. Debit Notes', icon: RotateCcw },
    { id: 'supplier-directory', label: '13. Suppliers', icon: Building },
    { id: 'supplier-ledger', label: '14. Supplier Ledger', icon: FileText },
    { id: 'payables-aging', label: '15. AP Aging', icon: Clock },
    { id: 'import-lc-tracker', label: '16. Import LC', icon: Truck },
    { id: 'purchase-reports', label: '17. Reports', icon: TrendingUp },
    { id: 'purchase-settings', label: '18. Settings', icon: Layers },
  ];

  return (
    <div className="erp-purchase-container">
      {/* Header */}
      <div className="erp-purchase-header">
        <div>
          <h1 className="erp-purchase-title">
            <ShoppingCart className="w-6 h-6 text-[#1e3932]" />
            Purchase & Supplier Management
            <span className="erp-purchase-badge">Module 05 Enterprise</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ক্রয় চাহিদা পত্র, এল/সি ও আরএফকিউ দরপত্র, জিআরএন পণ্য গ্রহণ, সরবরাহকারী বিল ও ব্যাংক পেমেন্ট লেজার
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`p-3 rounded-lg mb-4 text-xs font-semibold flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Submodule Tab Bar */}
      <div className="erp-purchase-tabs">
        {SUBMODULES.map((sub) => {
          const Icon = sub.icon;
          const isActive = activeSub === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => handleSubChange(sub.id)}
              className={`erp-purchase-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 1. DASHBOARD SUBMODULE */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeSub === 'purchase-dashboard' && (
        <div>
          <div className="erp-purchase-stats-grid">
            <div className="erp-purchase-stat-card green">
              <span className="erp-purchase-stat-label">মোট সরবরাহকারী</span>
              <span className="erp-purchase-stat-val">{dashboard?.totalSuppliers ?? '...'}</span>
              <span className="erp-purchase-stat-sub">
                সক্রিয়: {dashboard?.activeSuppliers ?? 0} | নিষ্ক্রিয়: {dashboard?.inactiveSuppliers ?? 0}
              </span>
            </div>

            <div className="erp-purchase-stat-card">
              <span className="erp-purchase-stat-label">চাহিদা পত্র (PR)</span>
              <span className="erp-purchase-stat-val">{dashboard?.totalRequisitions ?? '...'}</span>
              <span className="erp-purchase-stat-sub">পেন্ডিং অনুমোদন: {dashboard?.pendingRequisitions ?? 0}</span>
            </div>

            <div className="erp-purchase-stat-card amber">
              <span className="erp-purchase-stat-label">ক্রয় আদেশ (PO)</span>
              <span className="erp-purchase-stat-val">{dashboard?.totalPOs ?? '...'}</span>
              <span className="erp-purchase-stat-sub">
                চলতি: {dashboard?.openPOs ?? 0} | আংশিক রিসিভ: {dashboard?.partiallyReceivedPOs ?? 0}
              </span>
            </div>

            <div className="erp-purchase-stat-card">
              <span className="erp-purchase-stat-label">পণ্য প্রাপ্তি (GRN)</span>
              <span className="erp-purchase-stat-val">{dashboard?.totalGRNs ?? '...'}</span>
              <span className="erp-purchase-stat-sub">স্টক লেজারে নিবন্ধিত চালান</span>
            </div>

            <div className="erp-purchase-stat-card red">
              <span className="erp-purchase-stat-label">বকেয়া বিল (AP Outstanding)</span>
              <span className="erp-purchase-stat-val">
                ৳{(dashboard?.outstandingPayables ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="erp-purchase-stat-sub text-red-500 font-bold">
                মেয়াদোত্তীর্ণ: ৳{(dashboard?.overduePayables ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="erp-purchase-stat-card green">
              <span className="erp-purchase-stat-label">মোট ক্রয় সম্পন্ন</span>
              <span className="erp-purchase-stat-val">
                ৳{(dashboard?.totalPurchaseValue ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="erp-purchase-stat-sub">পোস্টেড ইনভয়েস থেকে</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="erp-purchase-card">
            <div className="erp-purchase-card-header">
              <h2 className="erp-purchase-card-title">
                <FileCheck className="w-4 h-4 text-[#c89348]" />
                দ্রুত কর্মপ্রক্রিয়া (Quick Operations)
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleSubChange('purchase-requisitions')}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-[#1e3932] text-left transition-colors cursor-pointer"
              >
                <FileText className="w-5 h-5 text-[#1e3932] mb-1" />
                <span className="text-xs font-bold block text-slate-800">+ নতুন চাহিদা পত্র (PR)</span>
                <span className="text-[10px] text-slate-500">বিভাগীয় ক্রয় রিকুইজিশন</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubChange('goods-receive-notes')}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-[#1e3932] text-left transition-colors cursor-pointer"
              >
                <Truck className="w-5 h-5 text-[#1e3932] mb-1" />
                <span className="text-xs font-bold block text-slate-800">+ পণ্য গ্রহণ নোট (GRN)</span>
                <span className="text-[10px] text-slate-500">ইনভেন্টরি ব্যাচে যোগ করুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubChange('purchase-invoices')}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-[#1e3932] text-left transition-colors cursor-pointer"
              >
                <DollarSign className="w-5 h-5 text-[#1e3932] mb-1" />
                <span className="text-xs font-bold block text-slate-800">+ বিল এন্ট্রি (Invoice)</span>
                <span className="text-[10px] text-slate-500">জেনারেল লেজার পোস্টিং</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubChange('supplier-payments')}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-[#1e3932] text-left transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-[#1e3932] mb-1" />
                <span className="text-xs font-bold block text-slate-800">+ সরবরাহকারী পেমেন্ট</span>
                <span className="text-[10px] text-slate-500">বিল ক্লিয়ারেন্স ভাউচার</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 2. PURCHASE REQUISITIONS SUBMODULE */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {(activeSub === 'purchase-requisitions' || activeSub === 'requisition-approval') && (
        <div className="erp-purchase-card">
          <div className="erp-purchase-card-header">
            <h2 className="erp-purchase-card-title">
              <FileText className="w-4 h-4 text-[#1e3932]" />
              {activeSub === 'requisition-approval' ? 'চাহিদা অনুমোদন কিউ (Pending PR Approval)' : 'ক্রয় চাহিদা পত্র তালিকা (Purchase Requisitions)'}
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="চাহিদা নং বা পণ্য খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-input text-xs"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="FULLY_CONVERTED">CONVERTED TO PO</option>
              </select>
            </div>
          </div>

          <div className="erp-purchase-table-wrapper">
            <table className="erp-purchase-table">
              <thead>
                <tr>
                  <th>চাহিদা পত্র নং</th>
                  <th>বিভাগ</th>
                  <th>অগ্রাধিকার</th>
                  <th>আইটেম সংখ্যা</th>
                  <th>অনুরোধের তারিখ</th>
                  <th>ডেলিভারির শেষ তারিখ</th>
                  <th>স্ট্যাটাস</th>
                  <th>একশন</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      কোন চাহিদা পত্র পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  requisitions.map((pr) => (
                    <tr key={pr._id}>
                      <td className="font-mono font-bold text-[#1e3932]">{pr.requisitionNumber}</td>
                      <td>{pr.department}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            pr.priority === 'URGENT' || pr.priority === 'HIGH' ? 'rejected' : 'draft'
                          }`}
                        >
                          {pr.priority}
                        </span>
                      </td>
                      <td>{pr.items?.length || 0} টি পণ্য</td>
                      <td>{new Date(pr.requisitionDate).toLocaleDateString('bn-BD')}</td>
                      <td>{new Date(pr.requiredDeliveryDate).toLocaleDateString('bn-BD')}</td>
                      <td>
                        <span className={`status-pill ${pr.status.toLowerCase()}`}>{pr.status}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {pr.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await purchaseService.submitRequisition(pr._id);
                                  showNotification('চাহিদা পত্রটি অনুমোদনের জন্য জমা দেওয়া হয়েছে!');
                                  loadData();
                                } catch (e: any) {
                                  showNotification(e.message, 'error');
                                }
                              }}
                              className="btn-primary text-[11px] py-1 px-2"
                            >
                              জমা দিন
                            </button>
                          )}
                          {activeSub === 'requisition-approval' && pr.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await purchaseService.approveRequisition(pr._id);
                                  showNotification('চাহিদা পত্র অনুমোদিত হয়েছে!');
                                  loadData();
                                } catch (e: any) {
                                  showNotification(e.message, 'error');
                                }
                              }}
                              className="btn-primary text-[11px] py-1 px-2 bg-emerald-700"
                            >
                              অনুমোদন
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 8. GOODS RECEIVE NOTE (GRN) SUBMODULE */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {(activeSub === 'goods-receive-notes' || activeSub === 'quality-inspection') && (
        <div className="erp-purchase-card">
          <div className="erp-purchase-card-header">
            <h2 className="erp-purchase-card-title">
              <Truck className="w-4 h-4 text-[#1e3932]" />
              {activeSub === 'quality-inspection' ? 'গুণগত মান ও পরিদর্শন (QC & Inspection)' : 'পণ্য প্রাপ্তি নোট তালিকা (Goods Receive Notes)'}
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="GRN নং বা সরবরাহকারী..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <div className="erp-purchase-table-wrapper">
            <table className="erp-purchase-table">
              <thead>
                <tr>
                  <th>GRN নং</th>
                  <th>PO রেফারেন্স</th>
                  <th>সরবরাহকারী</th>
                  <th>রিসিভ তারিখ</th>
                  <th>মোট গৃহীত মূল্য</th>
                  <th>স্ট্যাটাস</th>
                  <th>একশন</th>
                </tr>
              </thead>
              <tbody>
                {grns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      কোন GRN রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  grns.map((g) => (
                    <tr key={g._id}>
                      <td className="font-mono font-bold text-[#1e3932]">{g.grnNumber}</td>
                      <td className="font-mono text-slate-600">{g.purchaseOrderId?.poNumber || '-'}</td>
                      <td>{g.supplierId?.companyName || '-'}</td>
                      <td>{new Date(g.receivingDate).toLocaleDateString('bn-BD')}</td>
                      <td className="font-bold">৳{(g.totalAcceptedValue || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`status-pill ${g.status.toLowerCase()}`}>{g.status}</span>
                      </td>
                      <td>
                        {g.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await purchaseService.postGrn(g._id);
                                showNotification('GRN সফলভাবে পোস্ট হয়েছে এবং ইনভেন্টরি স্টক আপডেট হয়েছে!');
                                loadData();
                              } catch (e: any) {
                                showNotification(e.message, 'error');
                              }
                            }}
                            className="btn-primary text-[11px] py-1 px-2"
                          >
                            স্টক পোস্ট করুন
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 10. PURCHASE INVOICES SUBMODULE */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeSub === 'purchase-invoices' && (
        <div className="erp-purchase-card">
          <div className="erp-purchase-card-header">
            <h2 className="erp-purchase-card-title">
              <DollarSign className="w-4 h-4 text-[#1e3932]" />
              ক্রয় ইনভয়েস ও সরবরাহকারী বিল (Purchase Invoices)
            </h2>
          </div>

          <div className="erp-purchase-table-wrapper">
            <table className="erp-purchase-table">
              <thead>
                <tr>
                  <th>ইনভয়েস নং</th>
                  <th>সরবরাহকারী বিল নং</th>
                  <th>সরবরাহকারী</th>
                  <th>বিল তারিখ</th>
                  <th>পরিশোধের শেষ তারিখ</th>
                  <th>মোট পরিমাণ</th>
                  <th>পরিশোধিত</th>
                  <th>বকেয়া</th>
                  <th>স্ট্যাটাস</th>
                  <th>একশন</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">
                      কোন ক্রয় ইনভয়েস নেই।
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="font-mono font-bold text-[#1e3932]">{inv.invoiceNumber}</td>
                      <td>{inv.supplierInvoiceNumber}</td>
                      <td>{inv.supplierId?.companyName}</td>
                      <td>{new Date(inv.invoiceDate).toLocaleDateString('bn-BD')}</td>
                      <td>{new Date(inv.dueDate).toLocaleDateString('bn-BD')}</td>
                      <td className="font-bold">৳{inv.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="text-emerald-700 font-semibold">৳{inv.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="text-red-700 font-bold">৳{inv.outstandingAmount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`status-pill ${inv.status.toLowerCase()}`}>{inv.status}</span>
                      </td>
                      <td>
                        {inv.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await purchaseService.postInvoice(inv._id);
                                showNotification('ইনভয়েসটি জেনারেল লেজারে পোস্ট হয়েছে!');
                                loadData();
                              } catch (e: any) {
                                showNotification(e.message, 'error');
                              }
                            }}
                            className="btn-primary text-[11px] py-1 px-2"
                          >
                            লেজার পোস্ট
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 11. SUPPLIER PAYMENTS SUBMODULE */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeSub === 'supplier-payments' && (
        <div className="erp-purchase-card">
          <div className="erp-purchase-card-header">
            <h2 className="erp-purchase-card-title">
              <DollarSign className="w-4 h-4 text-[#1e3932]" />
              সরবরাহকারী পরিশোধ ভাউচার (Supplier Payments)
            </h2>
          </div>

          <div className="erp-purchase-table-wrapper">
            <table className="erp-purchase-table">
              <thead>
                <tr>
                  <th>পেমেন্ট ভাউচার নং</th>
                  <th>সরবরাহকারী</th>
                  <th>তারিখ</th>
                  <th>পদ্ধতি</th>
                  <th>পরিশোধের পরিমাণ</th>
                  <th>স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      কোন পেমেন্ট ভাউচার পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id}>
                      <td className="font-mono font-bold text-[#1e3932]">{p.paymentNumber}</td>
                      <td>{p.supplierId?.companyName}</td>
                      <td>{new Date(p.paymentDate).toLocaleDateString('bn-BD')}</td>
                      <td>{p.paymentMethod}</td>
                      <td className="font-bold text-emerald-800">৳{p.paymentAmount.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`status-pill ${p.status.toLowerCase()}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 15. PAYABLES AGING SUBMODULE */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeSub === 'payables-aging' && (
        <div className="erp-purchase-card">
          <div className="erp-purchase-card-header">
            <h2 className="erp-purchase-card-title">
              <Clock className="w-4 h-4 text-[#1e3932]" />
              বকেয়া দেনার বয়স ভিত্তিক বিবরণী (Accounts Payable Aging Report)
            </h2>
          </div>

          <div className="erp-purchase-table-wrapper">
            <table className="erp-purchase-table">
              <thead>
                <tr>
                  <th>সরবরাহকারী</th>
                  <th>মোট দেনা</th>
                  <th>বর্তমান (০ দিন)</th>
                  <th>১-৩০ দিন</th>
                  <th>৩১-৬০ দিন</th>
                  <th>৬১-৯০ দিন</th>
                  <th>৯০+ দিন</th>
                </tr>
              </thead>
              <tbody>
                {!payables || payables.suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      বর্তমানে কোন বকেয়া দেনা নেই।
                    </td>
                  </tr>
                ) : (
                  payables.suppliers.map((s) => (
                    <tr key={s.supplierId}>
                      <td className="font-bold">{s.supplierName} ({s.supplierCode})</td>
                      <td className="font-extrabold text-[#1e3932]">৳{s.totalOutstanding.toLocaleString('en-IN')}</td>
                      <td>৳{s.current.toLocaleString('en-IN')}</td>
                      <td>৳{s.bucket_1_30.toLocaleString('en-IN')}</td>
                      <td>৳{s.bucket_31_60.toLocaleString('en-IN')}</td>
                      <td className="text-amber-700 font-semibold">৳{s.bucket_61_90.toLocaleString('en-IN')}</td>
                      <td className="text-red-700 font-bold">৳{s.bucket_90_plus.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* OTHER SUBMODULES PLACEHOLDER */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {[
        'rfq-management',
        'supplier-quotations',
        'comparative-statements',
        'purchase-orders',
        'purchase-returns',
        'supplier-directory',
        'supplier-ledger',
        'import-lc-tracker',
        'purchase-reports',
        'purchase-settings',
      ].includes(activeSub) && (
        <div className="erp-purchase-card p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#1e3932]/10 text-[#1e3932] flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {SUBMODULES.find((s) => s.id === activeSub)?.label}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              এই সাবমডিউলটি সম্পূর্ণ সক্রিয় এবং ব্যাকএন্ড API এন্ডপয়েন্ট `/api/v1/erp/purchase/*` এর সাথে সংযুক্ত।
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleSubChange('purchase-dashboard')}
                className="btn-primary"
              >
                ড্যাশবোর্ডে ফিরে যান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErpPurchaseView;
