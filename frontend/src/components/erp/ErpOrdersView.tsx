'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './ErpOrdersView.css';
import {
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Filter,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Plus,
  RefreshCw,
  X,
  ArrowRight,
  Eye,
  DollarSign,
  Calendar,
  Layers,
  Ban,
  RotateCcw,
  User,
  MapPin,
  Check,
  Sliders,
  BarChart3,
  TrendingUp,
  Download,
  Boxes,
  ClipboardList,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { OrderSubmodule } from '../../types';
import {
  orderProcessingService,
  OrderProcessingItem,
  OrderDashboardData,
  StockAvailabilityItem,
  OrderSettingsData,
} from '../../services/orderProcessing.service';

interface ErpOrdersViewProps {
  initialSubmodule?: OrderSubmodule;
  onSubmoduleChange?: (submodule: OrderSubmodule) => void;
}

export const ErpOrdersView: React.FC<ErpOrdersViewProps> = ({
  initialSubmodule = 'order-dashboard',
  onSubmoduleChange,
}) => {
  const { showToast } = useToast();

  // Active Submodule State
  const [submodule, setSubmodule] = useState<OrderSubmodule>(initialSubmodule);

  // Synchronize with parent
  useEffect(() => {
    if (initialSubmodule && initialSubmodule !== submodule) {
      setSubmodule(initialSubmodule);
    }
  }, [initialSubmodule]);

  const changeSubmodule = (newSub: OrderSubmodule) => {
    setSubmodule(newSub);
    if (onSubmoduleChange) onSubmoduleChange(newSub);
  };

  // Global State
  const [loading, setLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderProcessingItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');

  // Selected Order for Modal/Drawer Details
  const [selectedOrder, setSelectedOrder] = useState<OrderProcessingItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Action Modals State
  const [actionModalType, setActionModalType] = useState<
    'CREATE_ORDER' | 'VERIFY_PAYMENT' | 'REJECT_PAYMENT' | 'RECORD_PAYMENT' | 'HOLD_ORDER' | 'CANCEL_ORDER' | 'PICKING' | 'PACKING' | 'DISPATCH' | 'DELIVERY' | 'PARTIAL_DELIVERY' | null
  >(null);
  const [modalOrderId, setModalOrderId] = useState<string>('');
  const [modalReason, setModalReason] = useState<string>('');
  const [selectedPaymentNumber, setSelectedPaymentNumber] = useState<string>('');

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<OrderDashboardData | null>(null);

  // Settings Data
  const [settings, setSettings] = useState<OrderSettingsData | null>(null);

  // Stock Availability Data
  const [stockCheckSku, setStockCheckSku] = useState('');
  const [stockResults, setStockResults] = useState<StockAvailabilityItem[]>([]);

  // Reports Data
  const [reportType, setReportType] = useState('summary');
  const [reportData, setReportData] = useState<any>(null);

  // Public Tracking Query
  const [trackingSearch, setTrackingSearch] = useState('');
  const [publicTrackingResult, setPublicTrackingResult] = useState<any>(null);

  // New Manual Order Form State
  const [manualOrderForm, setManualOrderForm] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    shippingAddress: '',
    paymentMethod: 'COD',
    items: [
      { productId: '', sku: '', productName: '', qty: 1, unitPrice: 0, discountAmount: 0, taxRate: 5, uom: 'PCS' },
    ],
    shippingCharge: 120,
    notes: '',
  });

  // Dispatch Form State
  const [dispatchForm, setDispatchForm] = useState({
    deliveryMethod: 'COURIER',
    courierPartner: 'STEADFAST',
    trackingNumber: '',
    deliveryPerson: '',
    deliveryPersonPhone: '',
    dispatchNotes: '',
  });

  // Delivery Confirm Form State
  const [deliveryForm, setDeliveryForm] = useState({
    receiverName: '',
    receiverContact: '',
    notes: '',
  });

  // Payment Recording Form State
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'BKASH',
    amount: 0,
    transactionRef: '',
    notes: '',
  });

  // Packing Form State
  const [packingForm, setPackingForm] = useState({
    packageType: 'CARTON',
    weightKg: 2.5,
    lengthCm: 35,
    widthCm: 25,
    heightCm: 20,
    packagingMaterial: 'Standard Heavy Carton',
    notes: 'Fragile Handle With Care',
  });

  // ─── DATA FETCHING ────────────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderProcessingService.getDashboard();
      setDashboardData(data);
    } catch (e: any) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (filters: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const data = await orderProcessingService.listOrders({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        orderStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
        orderChannel: channelFilter !== 'ALL' ? channelFilter : undefined,
        ...filters,
      });
      setOrders(data.orders || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: any) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, channelFilter]);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await orderProcessingService.getSettings();
      setSettings(data);
    } catch (e: any) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const fetchReports = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const data = await orderProcessingService.getReports(type);
      setReportData(data);
    } catch (e: any) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect based on active submodule
  useEffect(() => {
    if (submodule === 'order-dashboard') {
      fetchDashboard();
    } else if (submodule === 'online-orders') {
      fetchOrders({ orderSource: 'ONLINE' });
    } else if (submodule === 'sales-orders') {
      fetchOrders({ orderSource: 'ERP_MANUAL' });
    } else if (submodule === 'order-settings') {
      fetchSettings();
    } else if (submodule === 'order-reports') {
      fetchReports(reportType);
    } else {
      fetchOrders();
    }
  }, [submodule, fetchDashboard, fetchOrders, fetchSettings, fetchReports, reportType]);

  // Open Drawer for Order Details
  const handleOpenDetails = async (order: OrderProcessingItem) => {
    setSelectedOrder(order);
    setIsDetailDrawerOpen(true);
    try {
      const full = await orderProcessingService.getOrder(order._id);
      setSelectedOrder(full.order);
    } catch (e) {
      console.error('Failed to fetch full order:', e);
    }
  };

  // ─── ACTION HANDLERS ──────────────────────────────────────────────────────
  const handleConfirmOrder = async (id: string) => {
    try {
      await orderProcessingService.confirmOrder(id, 'Confirmed by Staff');
      showToast('অর্ডার সফলভাবে নিশ্চিত (Confirmed) করা হয়েছে!', 'success');
      fetchOrders();
      if (selectedOrder?._id === id) handleOpenDetails({ ...selectedOrder, orderStatus: 'CONFIRMED' });
    } catch (e: any) {
      showToast(e.message || 'Confirm failed', 'error');
    }
  };

  const handleReserveStock = async (id: string) => {
    try {
      await orderProcessingService.reserveStock(id);
      showToast('ইনভেন্টরি থেকে FEFO ব্যাচ স্টক সফলভাবে রিজার্ভ করা হয়েছে!', 'success');
      fetchOrders();
      if (selectedOrder?._id === id) handleOpenDetails(selectedOrder);
    } catch (e: any) {
      showToast(e.message || 'Stock reservation failed', 'error');
    }
  };

  const handleHoldOrderSubmit = async () => {
    if (!modalReason.trim()) {
      showToast('হোল্ড করার কারণ উল্লেখ করুন', 'error');
      return;
    }
    try {
      await orderProcessingService.holdOrder(modalOrderId, modalReason);
      showToast('অর্ডার সফলভাবে হোল্ড করা হয়েছে!', 'success');
      setActionModalType(null);
      setModalReason('');
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Hold failed', 'error');
    }
  };

  const handleReleaseHold = async (id: string) => {
    try {
      await orderProcessingService.releaseHold(id, 'Hold released by staff');
      showToast('অর্ডার হোল্ড মুক্ত করা হয়েছে!', 'success');
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Release hold failed', 'error');
    }
  };

  const handleCancelOrderSubmit = async () => {
    if (!modalReason.trim()) {
      showToast('বাতিল করার কারণ উল্লেখ করুন', 'error');
      return;
    }
    try {
      await orderProcessingService.cancelOrder(modalOrderId, modalReason);
      showToast('অর্ডার বাতিল এবং রিজার্ভেশন স্টক অবমুক্ত করা হয়েছে!', 'success');
      setActionModalType(null);
      setModalReason('');
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Cancel failed', 'error');
    }
  };

  const handleVerifyPayment = async (orderId: string, paymentNo: string) => {
    try {
      await orderProcessingService.verifyPayment(orderId, paymentNo);
      showToast(`পেমেন্ট ${paymentNo} সফলভাবে ভেরিফাই করা হয়েছে!`, 'success');
      fetchOrders();
      if (selectedOrder) handleOpenDetails(selectedOrder);
    } catch (e: any) {
      showToast(e.message || 'Payment verification failed', 'error');
    }
  };

  const handleRejectPaymentSubmit = async () => {
    if (!modalReason.trim()) {
      showToast('প্রত্যাখ্যানের কারণ উল্লেখ করুন', 'error');
      return;
    }
    try {
      await orderProcessingService.rejectPayment(modalOrderId, selectedPaymentNumber, modalReason);
      showToast(`পেমেন্ট ${selectedPaymentNumber} প্রত্যাখ্যান করা হয়েছে!`, 'success');
      setActionModalType(null);
      setModalReason('');
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Reject payment failed', 'error');
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      showToast('সঠিক পেমেন্টের পরিমাণ লিখুন', 'error');
      return;
    }
    try {
      await orderProcessingService.recordPayment(modalOrderId, paymentForm);
      showToast(`৳${paymentForm.amount.toLocaleString()} পেমেন্ট সফলভাবে এন্ট্রি হয়েছে!`, 'success');
      setActionModalType(null);
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Record payment failed', 'error');
    }
  };

  const handleCreatePicking = async (orderId: string) => {
    try {
      await orderProcessingService.createPickingList(orderId, { pickerName: 'Warehouse Picker' });
      showToast('ওয়্যারহাউজ পিকিং লিস্ট জেনারেট করা হয়েছে!', 'success');
      fetchOrders();
      if (selectedOrder) handleOpenDetails(selectedOrder);
    } catch (e: any) {
      showToast(e.message || 'Picking creation failed', 'error');
    }
  };

  const handleCreatePackingSubmit = async () => {
    try {
      await orderProcessingService.createPackingSession(modalOrderId, {
        packages: [
          {
            packageType: packingForm.packageType,
            weightKg: packingForm.weightKg,
            lengthCm: packingForm.lengthCm,
            widthCm: packingForm.widthCm,
            heightCm: packingForm.heightCm,
            packagingMaterial: packingForm.packagingMaterial,
            notes: packingForm.notes,
            items: [],
          },
        ],
      });
      showToast('প্যাকিং সম্পন্ন হয়েছে এবং প্যাকেজ বারকোড জেনারেট হয়েছে!', 'success');
      setActionModalType(null);
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Packing failed', 'error');
    }
  };

  const handleDispatchSubmit = async () => {
    try {
      await orderProcessingService.dispatchOrder(modalOrderId, dispatchForm);
      showToast('অর্ডার কুরিয়ার/ডেলিভারিতে সফলভাবে ডিসপ্যাচ করা হয়েছে!', 'success');
      setActionModalType(null);
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Dispatch failed', 'error');
    }
  };

  const handleDeliverySubmit = async () => {
    if (!deliveryForm.receiverName.trim()) {
      showToast('গ্রহীতার নাম লিখুন', 'error');
      return;
    }
    try {
      await orderProcessingService.confirmDelivery(modalOrderId, deliveryForm);
      showToast('ডেলিভারি সফলভাবে নিশ্চিত এবং ইনভেন্টরি লেজার আপডেট হয়েছে!', 'success');
      setActionModalType(null);
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Delivery confirmation failed', 'error');
    }
  };

  const handleCreateManualOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderForm.shippingAddress) {
      showToast('ডেলিভারি ঠিকানা আবশ্যক', 'error');
      return;
    }
    if (!manualOrderForm.items.length || !manualOrderForm.items[0].sku) {
      showToast('কমপক্ষে একটি পণ্য যোগ করুন', 'error');
      return;
    }
    try {
      await orderProcessingService.createManualOrder({
        customerId: manualOrderForm.customerId || '6afdb4fbd39ff1f17559d5c0', // fallback or real customer
        shippingAddress: manualOrderForm.shippingAddress,
        contactPhone: manualOrderForm.customerPhone,
        paymentMethod: manualOrderForm.paymentMethod,
        shippingCharge: manualOrderForm.shippingCharge,
        notes: manualOrderForm.notes,
        items: manualOrderForm.items.map((i) => ({
          sku: i.sku,
          productName: i.productName,
          qty: Number(i.qty),
          unitPrice: Number(i.unitPrice),
          discountAmount: Number(i.discountAmount || 0),
          taxRate: Number(i.taxRate || 0),
          uom: i.uom || 'PCS',
        })),
      });
      showToast('নতুন সেলস অর্ডার সফলভাবে তৈরি হয়েছে!', 'success');
      setActionModalType(null);
      fetchOrders();
    } catch (e: any) {
      showToast(e.message || 'Create order failed', 'error');
    }
  };

  const handleStockAvailabilitySearch = async () => {
    if (!stockCheckSku.trim()) return;
    try {
      const res = await orderProcessingService.checkStockAvailability([{ sku: stockCheckSku.trim() }]);
      setStockResults(res);
    } catch (e: any) {
      showToast('Stock check failed', 'error');
    }
  };

  const handlePublicTrackingSearch = async () => {
    if (!trackingSearch.trim()) return;
    try {
      const res = await orderProcessingService.trackPublicOrder(trackingSearch.trim());
      setPublicTrackingResult(res);
    } catch (e: any) {
      showToast('অর্ডার বা ট্র্যাকিং কোড পাওয়া যায়নি', 'error');
      setPublicTrackingResult(null);
    }
  };

  const handleGenerateChallan = async (orderId: string) => {
    try {
      const challan = await orderProcessingService.generateChallan(orderId);
      showToast(`ডেলিভারি চালান ${challan.challanNo} জেনারেট হয়েছে!`, 'success');
      fetchOrders();
    } catch (e: any) {
      showToast('Challan generation failed', 'error');
    }
  };

  const handleGenerateInvoice = async (orderId: string) => {
    try {
      const inv = await orderProcessingService.generateInvoice(orderId);
      showToast(`সেলস ইনভয়েস ${inv.invoiceNo} জেনারেট হয়েছে!`, 'success');
      fetchOrders();
    } catch (e: any) {
      showToast('Invoice generation failed', 'error');
    }
  };

  // Helper for Status Badge
  const renderStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      SUBMITTED: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'নতুন জমা' },
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'নিশ্চিতকৃত' },
      PROCESSING: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'প্রক্রিয়াধীন' },
      RESERVED: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'স্টক রিজার্ভড' },
      PICKING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'পিকিং হচ্ছে' },
      PICKED: { bg: 'bg-purple-200', text: 'text-purple-900', label: 'পিকড' },
      PACKED: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'প্যাকড' },
      READY_FOR_DISPATCH: { bg: 'bg-sky-100', text: 'text-sky-800', label: 'ডিসপ্যাচে প্রস্তুত' },
      DISPATCHED: { bg: 'bg-blue-200', text: 'text-blue-900', label: 'ডিসপ্যাচড' },
      IN_TRANSIT: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'পথে রয়েছে' },
      DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'ডেলিভার্ড' },
      CANCELLED: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'বাতিল' },
      ON_HOLD: { bg: 'bg-red-100', text: 'text-red-800', label: 'হোল্ড' },
    };
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-800', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const renderPaymentStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; label: string }> = {
      UNPAID: { bg: 'bg-rose-50 border-rose-200 text-rose-700', label: 'বকেয়া (Unpaid)' },
      PAID: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'পরিশোধিত (Paid)' },
      PARTIAL: { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'আংশিক (Partial)' },
      COLLECTED: { bg: 'bg-cyan-50 border-cyan-200 text-cyan-700', label: 'কালেক্টেড (COD)' },
    };
    const s = map[status] || { bg: 'bg-slate-50 border-slate-200 text-slate-700', label: status };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium ${s.bg}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── SUBMODULE PILLS NAVIGATION ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'order-dashboard', label: '1. ড্যাশবোর্ড', icon: BarChart3 },
            { id: 'online-orders', label: '2. অনলাইন অর্ডার', icon: ShoppingBag },
            { id: 'sales-orders', label: '3. সেলস অর্ডার (B2B)', icon: FileText },
            { id: 'payment-verification', label: '5. পেমেন্ট ভেরিফিকেশন', icon: DollarSign },
            { id: 'order-reservation', label: '7. স্টক রিজার্ভেশন', icon: Boxes },
            { id: 'stock-availability', label: '8. স্টক প্রাপ্যতা', icon: Layers },
            { id: 'order-picking', label: '9. ওয়্যারহাউজ পিকিং', icon: ClipboardList },
            { id: 'order-packing', label: '10. প্যাকিং লিস্ট', icon: Package },
            { id: 'dispatch-management', label: '12. ডিসপ্যাচ ও কুরিয়ার', icon: Truck },
            { id: 'delivery-management', label: '13. ডেলিভারি ম্যানেজমেন্ট', icon: CheckCircle2 },
            { id: 'delivery-tracking', label: '14. রিয়েল-টাইম ট্র্যাকিং', icon: Clock },
            { id: 'order-reports', label: '21. অর্ডার রিপোর্টস', icon: TrendingUp },
            { id: 'order-settings', label: '23. অর্ডার সেটিংস', icon: Sliders },
          ].map((item) => {
            const Icon = item.icon;
            const active = submodule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => changeSubmodule(item.id as OrderSubmodule)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#e6b980]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 1. ORDER DASHBOARD SUBMODULE ──────────────────────────────────── */}
      {submodule === 'order-dashboard' && (
        <div className="space-y-6">
          {/* Header & Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">অর্ডার প্রসেসিং ও ই-কমার্স হাব</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                রিয়েল-টাইম অর্ডার ফানেল, রিজার্ভেশন ব্যালেন্স, কুরিয়ার ডিসপ্যাচ ও পেমেন্ট রেকনসিলিয়েশন
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchDashboard}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ ডাটা</span>
              </button>
              <button
                type="button"
                onClick={() => setActionModalType('CREATE_ORDER')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1e3932] text-[#e6b980] rounded-xl text-xs font-bold hover:bg-[#162a25] shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ম্যানুয়াল অর্ডার তৈরি</span>
              </button>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">মোট অর্ডার</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {dashboardData?.kpiCards.totalOrders || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                সর্বমোট সেলস ভ্যালু: ৳{(dashboardData?.kpiCards.totalValue || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 uppercase">অপেক্ষমাণ / যাচাই</span>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {dashboardData?.kpiCards.pendingOrders || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">ভেরিফিকেশন ও কনফার্মেশন প্রয়োজন</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 uppercase">প্রসেসিং ও ট্রানজিট</span>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Truck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {(dashboardData?.kpiCards.processingOrders || 0) + (dashboardData?.kpiCards.dispatchedOrders || 0)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">পিকিং, প্যাকিং ও কুরিয়ার পথে</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 uppercase">সফল ডেলিভারি</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {dashboardData?.kpiCards.deliveredOrders || 0}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                আদায়কৃত অর্থ: ৳{(dashboardData?.kpiCards.totalPaid || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Filter Status Tabs & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="অর্ডার নম্বর, কাস্টমার নাম বা মোবাইল নম্বর দিয়ে সার্চ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1e3932]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white"
                >
                  <option value="ALL">সকল স্ট্যাটাস</option>
                  <option value="SUBMITTED">নতুন জমা (Submitted)</option>
                  <option value="CONFIRMED">কনফার্মড (Confirmed)</option>
                  <option value="RESERVED">স্টক রিজার্ভড</option>
                  <option value="PICKING">পিকিং হচ্ছে</option>
                  <option value="PACKED">প্যাকড</option>
                  <option value="DISPATCHED">ডিসপ্যাচড</option>
                  <option value="DELIVERED">ডেলিভার্ড</option>
                  <option value="ON_HOLD">হোল্ড</option>
                  <option value="CANCELLED">বাতিল</option>
                </select>

                <select
                  value={channelFilter}
                  onChange={(e) => {
                    setChannelFilter(e.target.value);
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white"
                >
                  <option value="ALL">সকল চ্যানেল</option>
                  <option value="ECOMMERCE_WEB">অনলাইন ওয়েব</option>
                  <option value="B2B_PORTAL">B2B পোর্টাল</option>
                  <option value="MANUAL">ম্যানুয়াল সেলস</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">অর্ডার নং ও তারিখ</th>
                    <th className="py-3 px-4">কাস্টমার ও ঠিকানা</th>
                    <th className="py-3 px-4">আইটেম সংখ্যা</th>
                    <th className="py-3 px-4">মোট বিল ও বকেয়া</th>
                    <th className="py-3 px-4">পেমেন্ট</th>
                    <th className="py-3 px-4">অর্ডার স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        কোন অর্ডার পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(o)}
                            className="font-bold text-[#1e3932] hover:underline cursor-pointer"
                          >
                            {o.orderNo}
                          </button>
                          <div className="text-[10px] text-slate-400">
                            {new Date(o.createdAt).toLocaleDateString('bn-BD', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {typeof o.customerId === 'object' && o.customerId?.fullName
                              ? o.customerId.fullName
                              : 'Retail Customer'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {o.contactPhone || (typeof o.customerId === 'object' ? o.customerId?.phone : '')}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{o.shippingAddress}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700">{o.items?.length || 0} আইটেম</span>
                          <div className="text-[10px] text-slate-400">
                            {o.items?.[0]?.sku} {o.items?.length > 1 ? `+${o.items.length - 1}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">৳{o.grandTotal?.toLocaleString()}</div>
                          {o.dueAmount > 0 ? (
                            <div className="text-[10px] text-rose-600 font-semibold">বকেয়া: ৳{o.dueAmount.toLocaleString()}</div>
                          ) : (
                            <div className="text-[10px] text-emerald-600 font-medium">সম্পূর্ণ পরিশোধিত</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {renderPaymentStatusBadge(o.paymentStatus)}
                            <div className="text-[10px] text-slate-400 uppercase">{o.paymentMethod}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {renderStatusBadge(o.orderStatus)}
                            {o.isHold && (
                              <span className="block text-[10px] text-red-600 font-bold">⚠️ অন হোল্ড</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(o)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              title="বিস্তারিত দেখুন"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {o.orderStatus === 'SUBMITTED' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmOrder(o._id)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 text-[11px]"
                                title="নিশ্চিত করুন"
                              >
                                কনফার্ম
                              </button>
                            )}

                            {['CONFIRMED', 'PROCESSING'].includes(o.orderStatus) && !o.isHold && (
                              <button
                                type="button"
                                onClick={() => handleReserveStock(o._id)}
                                className="px-2 py-1 rounded-lg bg-cyan-700 text-white font-medium hover:bg-cyan-800 text-[11px]"
                                title="স্টক রিজার্ভ করুন"
                              >
                                রিজার্ভ
                              </button>
                            )}

                            {['RESERVED', 'PICKED'].includes(o.orderStatus) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setModalOrderId(o._id);
                                  setActionModalType('DISPATCH');
                                }}
                                className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 text-[11px]"
                                title="ডিসপ্যাচ করুন"
                              >
                                ডিসপ্যাচ
                              </button>
                            )}

                            {o.orderStatus === 'DISPATCHED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setModalOrderId(o._id);
                                  setActionModalType('DELIVERY');
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 text-[11px]"
                                title="ডেলিভারি কনফার্ম"
                              >
                                ডেলিভার্ড
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
        </div>
      )}

      {/* ─── 2. ONLINE ORDERS SUBMODULE ────────────────────────────────────── */}
      {submodule === 'online-orders' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">পাবলিক ওয়েবসাইট অনলাইন অর্ডার কিউ</h3>
              <p className="text-xs text-slate-500">ই-কমার্স কার্ট ও চেকআউট থেকে প্রাপ্ত সকল কাস্টমার অর্ডার</p>
            </div>
            <button
              type="button"
              onClick={() => fetchOrders({ orderSource: 'ONLINE' })}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">অর্ডার নং</th>
                  <th className="p-3">ক্রেতা ও ফোন</th>
                  <th className="p-3">পেমেন্ট মেথড</th>
                  <th className="p-3">টাকার পরিমাণ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">ব্যবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-[#1e3932]">{o.orderNo}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{o.contactPhone || 'Customer'}</div>
                      <div className="text-[10px] text-slate-400">{o.shippingAddress}</div>
                    </td>
                    <td className="p-3">
                      <span className="uppercase text-[11px] font-bold text-slate-700">{o.paymentMethod}</span>
                      <div className="text-[10px] text-slate-400">{o.paymentStatus}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-900">৳{o.grandTotal.toLocaleString()}</td>
                    <td className="p-3">{renderStatusBadge(o.orderStatus)}</td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(o)}
                        className="px-2 py-1 border border-slate-200 rounded text-[11px] hover:bg-slate-100"
                      >
                        বিস্তারিত
                      </button>
                      {o.orderStatus === 'SUBMITTED' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmOrder(o._id)}
                          className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] hover:bg-emerald-700"
                        >
                          কনফার্ম
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 3. SALES ORDERS (B2B) SUBMODULE ───────────────────────────────── */}
      {submodule === 'sales-orders' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">B2B ও ম্যানুয়াল সেলস অর্ডার</h3>
              <p className="text-xs text-slate-500">হসপিটাল, ক্লিনিক ও রিটেইলারদের সরাসরি বুকিং অর্ডার</p>
            </div>
            <button
              type="button"
              onClick={() => setActionModalType('CREATE_ORDER')}
              className="px-3.5 py-1.5 bg-[#1e3932] text-[#e6b980] rounded-xl text-xs font-bold hover:bg-[#162a25] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সেলস অর্ডার</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">অর্ডার নং</th>
                  <th className="p-3">প্রতিষ্ঠান / ক্লায়েন্ট</th>
                  <th className="p-3">মোট ভ্যালু</th>
                  <th className="p-3">ডিসকাউন্ট ও ভ্যাট</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-[#1e3932]">{o.orderNo}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">
                        {typeof o.customerId === 'object' && o.customerId?.fullName ? o.customerId.fullName : 'B2B Client'}
                      </div>
                      <div className="text-[10px] text-slate-500">{o.contactPhone}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-900">৳{o.grandTotal.toLocaleString()}</td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      ছাড়: ৳{o.discountTotal || 0} | ভ্যাট: ৳{o.vatTotal || 0}
                    </td>
                    <td className="p-3">{renderStatusBadge(o.orderStatus)}</td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(o)}
                        className="px-2 py-1 border border-slate-200 rounded text-[11px] hover:bg-slate-100"
                      >
                        ভিউ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateChallan(o._id)}
                        className="px-2 py-1 bg-slate-800 text-white rounded text-[11px] hover:bg-slate-900"
                      >
                        চালান
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateInvoice(o._id)}
                        className="px-2 py-1 bg-emerald-800 text-white rounded text-[11px] hover:bg-emerald-900"
                      >
                        ইনভয়েস
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 5. PAYMENT VERIFICATION SUBMODULE ──────────────────────────────── */}
      {submodule === 'payment-verification' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">পেমেন্ট ভেরিফিকেশন ও অনুমোদন কিউ</h3>
            <p className="text-xs text-slate-500">বিকাশ, নগদ বা ব্যাংক ট্রান্সফারের ট্রানজ্যাকশন আইডি যাচাই ও অনুমোদন</p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">অর্ডার নং</th>
                  <th className="p-3">পেমেন্ট রেফারেন্স</th>
                  <th className="p-3">মেথড ও ট্রানজ্যাকশন আইডি</th>
                  <th className="p-3">টাকার পরিমাণ</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">যাচাইকরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders
                  .filter((o) => (o.paymentRecords || []).length > 0)
                  .map((o) =>
                    o.paymentRecords?.map((p) => (
                      <tr key={p.paymentNumber} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-[#1e3932]">{o.orderNo}</td>
                        <td className="p-3 font-mono font-medium">{p.paymentNumber}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 uppercase">{p.paymentMethod}</span>
                          <div className="text-[11px] text-slate-500 font-mono">Ref: {p.transactionRef || 'N/A'}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-900">৳{p.amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {p.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerifyPayment(o._id, p.paymentNumber)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] hover:bg-emerald-700"
                              >
                                অনুমোদন
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setModalOrderId(o._id);
                                  setSelectedPaymentNumber(p.paymentNumber);
                                  setActionModalType('REJECT_PAYMENT');
                                }}
                                className="px-2 py-1 bg-rose-600 text-white rounded text-[11px] hover:bg-rose-700"
                              >
                                বাতিল
                              </button>
                            </>
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

      {/* ─── 8. STOCK AVAILABILITY SUBMODULE ───────────────────────────────── */}
      {submodule === 'stock-availability' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">স্টক প্রাপ্যতা ও FEFO ব্যাচ সার্চ</h3>
            <p className="text-xs text-slate-500">ওয়্যারহাউজ ও বিন অনুযায়ী ফিজিক্যাল, রিজার্ভড এবং বিক্রয়যোগ্য ব্যালেন্স</p>
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="পণ্যের SKU লিখুন (e.g. SKU-ORD-01)..."
              value={stockCheckSku}
              onChange={(e) => setStockCheckSku(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1e3932]"
            />
            <button
              type="button"
              onClick={handleStockAvailabilitySearch}
              className="px-4 py-2 bg-[#1e3932] text-[#e6b980] rounded-xl text-xs font-bold hover:bg-[#162a25]"
            >
              চেক করুন
            </button>
          </div>

          {stockResults.length > 0 && (
            <div className="space-y-3 pt-3">
              {stockResults.map((s) => (
                <div key={s.sku} className="border border-slate-200 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{s.productName || s.sku}</span>
                      <span className="ml-2 text-xs text-slate-400 font-mono">[{s.sku}]</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div>
                        ফিজিক্যাল স্টক: <span className="font-bold text-slate-900">{s.physicalStock}</span>
                      </div>
                      <div>
                        রিজার্ভড: <span className="font-bold text-amber-600">{s.reservedStock}</span>
                      </div>
                      <div>
                        বিক্রয়যোগ্য স্টক:{' '}
                        <span className="font-bold text-emerald-600">{s.availableStock}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 font-semibold pt-1">FEFO সক্রিয় ব্যাচসমূহ:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {s.batches?.map((b) => (
                      <div key={b.batchId} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                        <div className="font-mono font-bold text-slate-800">{b.batchNumber}</div>
                        <div className="text-slate-500 text-[10px]">
                          প্রাপ্য স্টক: <span className="font-semibold">{b.availableQty}</span>
                        </div>
                        {b.expiryDate && (
                          <div className="text-amber-700 text-[10px]">
                            মেয়াদ: {new Date(b.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 14. REAL-TIME DELIVERY TRACKING SUBMODULE ───────────────────────── */}
      {submodule === 'delivery-tracking' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">পাবলিক কাস্টমার ট্র্যাকিং হাব</h3>
            <p className="text-xs text-slate-500">
              অর্ডার নম্বর অথবা কুরিয়ার ট্র্যাকিং কোড দিয়ে ৫-ধাপের ডেলিভারি অগ্রগতি যাচাই
            </p>
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="অর্ডার নং অথবা কুরিয়ার ট্র্যাকিং নম্বর লিখুন..."
              value={trackingSearch}
              onChange={(e) => setTrackingSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#1e3932]"
            />
            <button
              type="button"
              onClick={handlePublicTrackingSearch}
              className="px-4 py-2 bg-[#1e3932] text-[#e6b980] rounded-xl text-xs font-bold hover:bg-[#162a25]"
            >
              ট্র্যাক করুন
            </button>
          </div>

          {publicTrackingResult && (
            <div className="mt-6 border border-slate-200 p-6 rounded-2xl bg-slate-50/50 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    অর্ডার নং: {publicTrackingResult.orderNumber}
                  </div>
                  <div className="text-xs text-slate-500">
                    গ্রাহক: {publicTrackingResult.maskedCustomerName} | জেলা: {publicTrackingResult.shippingDistrict}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500">কুরিয়ার পার্টনার</div>
                  <div className="font-bold text-[#1e3932]">{publicTrackingResult.courier}</div>
                  <div className="text-xs font-mono text-slate-500">Ref: {publicTrackingResult.trackingCode}</div>
                </div>
              </div>

              {/* 5-Step Progress Bar */}
              <div className="relative flex items-center justify-between">
                {[
                  { step: 1, label: 'অর্ডার গৃহীত' },
                  { step: 2, label: 'কনফার্ম ও স্টক বুকিং' },
                  { step: 3, label: 'প্যাকিং সম্পন্ন' },
                  { step: 4, label: 'কুরিয়ারে পথে' },
                  { step: 5, label: 'সফল ডেলিভারি' },
                ].map((s) => {
                  const isDone = publicTrackingResult.currentStep >= s.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center flex-1 relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                          isDone ? 'bg-[#1e3932] text-[#e6b980]' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? '✓' : s.step}
                      </div>
                      <span
                        className={`text-[11px] mt-2 font-medium text-center ${
                          isDone ? 'text-slate-900 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Timeline Events */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">অডিট টাইমলাইন লগ:</div>
                <div className="space-y-2">
                  {publicTrackingResult.timeline?.map((t: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
                      <span className="w-2 h-2 rounded-full bg-[#1e3932] mt-1.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-800">{t.event}</div>
                        <div className="text-slate-500 text-[11px]">{t.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(t.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 21. ORDER REPORTS SUBMODULE ───────────────────────────────────── */}
      {submodule === 'order-reports' && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">অর্ডার ও ডেলিভারি রিপোর্ট হাব</h3>
              <p className="text-xs text-slate-500">ফুলফিলমেন্ট, ক্যান্সেলেশন এবং COD কালেকশন এনালাইসিস</p>
            </div>
            <div className="flex gap-2">
              {['summary', 'fulfillment', 'cancellation', 'cod'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setReportType(t);
                    fetchReports(t);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase cursor-pointer ${
                    reportType === t ? 'bg-[#1e3932] text-[#e6b980]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {reportData && (
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <pre className="text-xs text-slate-700 font-mono overflow-auto max-h-96">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ─── 23. ORDER SETTINGS SUBMODULE ──────────────────────────────────── */}
      {submodule === 'order-settings' && settings && (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">অর্ডার প্রসেসিং কনফিগারেশন সেটিংস</h3>
            <p className="text-xs text-slate-500">স্বয়ংক্রিয় অনুমোদন, স্টক রিজার্ভেশন পলিসি ও COD লিমিট</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await orderProcessingService.updateSettings(settings);
                showToast('অর্ডার সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
              } catch (err: any) {
                showToast('Settings update failed', 'error');
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-slate-700 font-semibold mb-1">অর্ডার নম্বর প্রিফিক্স</label>
              <input
                type="text"
                value={settings.orderPrefix}
                onChange={(e) => setSettings({ ...settings, orderPrefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoConfirmOnlineOrders}
                  onChange={(e) => setSettings({ ...settings, autoConfirmOnlineOrders: e.target.checked })}
                  className="rounded text-[#1e3932]"
                />
                <span className="font-medium text-slate-800">অনলাইন অর্ডার স্বয়ংক্রিয়ভাবে নিশ্চিত (Auto-Confirm) করুন</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoReserveOnConfirm}
                  onChange={(e) => setSettings({ ...settings, autoReserveOnConfirm: e.target.checked })}
                  className="rounded text-[#1e3932]"
                />
                <span className="font-medium text-slate-800">অর্ডার কনফার্ম হলেই স্বয়ংক্রিয় FEFO স্টক রিজার্ভেশন করুন</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowPartialDelivery}
                  onChange={(e) => setSettings({ ...settings, allowPartialDelivery: e.target.checked })}
                  className="rounded text-[#1e3932]"
                />
                <span className="font-medium text-slate-800">আংশিক ডেলিভারি (Partial Dispatch) অনুমোদন করুন</span>
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-slate-700 font-semibold mb-1">ক্যাশ অন ডেলিভারি (COD) সর্বোচ্চ লিমিট (টাকা)</label>
              <input
                type="number"
                value={settings.codMaxLimit}
                onChange={(e) => setSettings({ ...settings, codMaxLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1e3932] text-[#e6b980] rounded-xl font-bold hover:bg-[#162a25] cursor-pointer"
            >
              সেটিংস সংরক্ষণ করুন
            </button>
          </form>
        </div>
      )}

      {/* ─── ORDER DETAILS DRAWER / MODAL ───────────────────────────────────── */}
      {isDetailDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>{selectedOrder.orderNo}</span>
                  {renderStatusBadge(selectedOrder.orderStatus)}
                </h3>
                <div className="text-xs text-slate-400">
                  তারিখ: {new Date(selectedOrder.createdAt).toLocaleString('bn-BD')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Customer & Address */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">গ্রাহকের তথ্য</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {typeof selectedOrder.customerId === 'object' && selectedOrder.customerId?.fullName
                      ? selectedOrder.customerId.fullName
                      : 'Customer'}
                  </div>
                  <div className="text-slate-600 mt-1">{selectedOrder.contactPhone}</div>
                  <div className="text-slate-500">{selectedOrder.contactEmail}</div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">ডেলিভারি ঠিকানা</span>
                  <div className="text-slate-700 mt-0.5 font-medium">{selectedOrder.shippingAddress}</div>
                  <div className="text-slate-500 mt-1">মেথড: {selectedOrder.paymentMethod}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900">অর্ডারকৃত পণ্যসমূহ:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">পণ্য / SKU</th>
                        <th className="p-2.5 text-center">পরিমাণ</th>
                        <th className="p-2.5 text-right">একক মূল্য</th>
                        <th className="p-2.5 text-right">মোট</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-800">{item.productName || item.sku}</div>
                            <div className="text-[10px] text-slate-400">{item.sku}</div>
                          </td>
                          <td className="p-2.5 text-center font-medium">
                            {item.qty} {item.uom}
                          </td>
                          <td className="p-2.5 text-right">৳{item.unitPrice.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            ৳{item.lineTotal?.toLocaleString() || (item.qty * item.unitPrice).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-right ml-auto max-w-xs">
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল:</span>
                  <span>৳{selectedOrder.subtotal?.toLocaleString()}</span>
                </div>
                {selectedOrder.discountTotal ? (
                  <div className="flex justify-between text-rose-600">
                    <span>ডিসকাউন্ট:</span>
                    <span>-৳{selectedOrder.discountTotal?.toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-600">
                  <span>ভ্যাট (ট্যাক্স):</span>
                  <span>৳{selectedOrder.vatTotal?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span>৳{selectedOrder.shippingCharge?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1.5">
                  <span>সর্বমোট:</span>
                  <span>৳{selectedOrder.grandTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                  <span>পরিশোধিত:</span>
                  <span>৳{(selectedOrder.paidAmount || 0).toLocaleString()}</span>
                </div>
                {selectedOrder.dueAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>বকেয়া:</span>
                    <span>৳{selectedOrder.dueAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons in Drawer */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
                {selectedOrder.orderStatus === 'SUBMITTED' && (
                  <button
                    type="button"
                    onClick={() => handleConfirmOrder(selectedOrder._id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    কনফার্ম করুন
                  </button>
                )}

                {['CONFIRMED', 'PROCESSING'].includes(selectedOrder.orderStatus) && (
                  <button
                    type="button"
                    onClick={() => handleReserveStock(selectedOrder._id)}
                    className="px-4 py-2 bg-cyan-700 text-white rounded-xl font-bold hover:bg-cyan-800 cursor-pointer"
                  >
                    স্টক রিজার্ভ করুন
                  </button>
                )}

                {['RESERVED'].includes(selectedOrder.orderStatus) && (
                  <button
                    type="button"
                    onClick={() => handleCreatePicking(selectedOrder._id)}
                    className="px-4 py-2 bg-purple-700 text-white rounded-xl font-bold hover:bg-purple-800 cursor-pointer"
                  >
                    পিকিং শুরু করুন
                  </button>
                )}

                {['PICKED'].includes(selectedOrder.orderStatus) && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOrderId(selectedOrder._id);
                      setActionModalType('PACKING');
                    }}
                    className="px-4 py-2 bg-teal-700 text-white rounded-xl font-bold hover:bg-teal-800 cursor-pointer"
                  >
                    প্যাকিং সম্পন্ন করুন
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setModalOrderId(selectedOrder._id);
                    setActionModalType('RECORD_PAYMENT');
                  }}
                  className="px-4 py-2 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 cursor-pointer"
                >
                  পেমেন্ট এন্ট্রি
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateChallan(selectedOrder._id)}
                  className="px-3 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 cursor-pointer"
                >
                  চালান মুদ্রণ
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateInvoice(selectedOrder._id)}
                  className="px-3 py-2 bg-emerald-800 text-white rounded-xl font-semibold hover:bg-emerald-900 cursor-pointer"
                >
                  ইনভয়েস মুদ্রণ
                </button>

                {!selectedOrder.isHold ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOrderId(selectedOrder._id);
                      setActionModalType('HOLD_ORDER');
                    }}
                    className="px-3 py-2 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 cursor-pointer"
                  >
                    হোল্ড
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReleaseHold(selectedOrder._id)}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 cursor-pointer"
                  >
                    হোল্ড মুক্ত
                  </button>
                )}

                {selectedOrder.orderStatus !== 'CANCELLED' && selectedOrder.orderStatus !== 'DELIVERED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOrderId(selectedOrder._id);
                      setActionModalType('CANCEL_ORDER');
                    }}
                    className="px-3 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 cursor-pointer"
                  >
                    অর্ডার বাতিল
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION MODALS ──────────────────────────────────────────────────── */}
      {/* 1. Create Manual Order Modal */}
      {actionModalType === 'CREATE_ORDER' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">নতুন সেলস অর্ডার বুকিং</h3>
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrderSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">গ্রাহকের ফোন / মোবাইল</label>
                <input
                  type="text"
                  required
                  placeholder="017xxxxxxxx"
                  value={manualOrderForm.customerPhone}
                  onChange={(e) => setManualOrderForm({ ...manualOrderForm, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ডেলিভারি ঠিকানা</label>
                <input
                  type="text"
                  required
                  placeholder="বাড়ি নং, রোড নং, এলাকা, জেলা"
                  value={manualOrderForm.shippingAddress}
                  onChange={(e) => setManualOrderForm({ ...manualOrderForm, shippingAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="border border-slate-200 p-3 rounded-xl space-y-2">
                <span className="font-bold text-slate-800">পণ্য নির্বাচন ও মূল্য:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500">পণ্য SKU</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SKU-ORD-01"
                      value={manualOrderForm.items[0]?.sku}
                      onChange={(e) => {
                        const items = [...manualOrderForm.items];
                        items[0].sku = e.target.value;
                        setManualOrderForm({ ...manualOrderForm, items });
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">পরিমাণ</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={manualOrderForm.items[0]?.qty}
                      onChange={(e) => {
                        const items = [...manualOrderForm.items];
                        items[0].qty = Number(e.target.value);
                        setManualOrderForm({ ...manualOrderForm, items });
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">একক মূল্য (৳)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={manualOrderForm.items[0]?.unitPrice}
                      onChange={(e) => {
                        const items = [...manualOrderForm.items];
                        items[0].unitPrice = Number(e.target.value);
                        setManualOrderForm({ ...manualOrderForm, items });
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">ডিসকাউন্ট (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={manualOrderForm.items[0]?.discountAmount}
                      onChange={(e) => {
                        const items = [...manualOrderForm.items];
                        items[0].discountAmount = Number(e.target.value);
                        setManualOrderForm({ ...manualOrderForm, items });
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={manualOrderForm.paymentMethod}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="COD">ক্যাশ অন ডেলিভারি (COD)</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ডেলিভারি চার্জ (৳)</label>
                  <input
                    type="number"
                    value={manualOrderForm.shippingCharge}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, shippingCharge: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1e3932] text-[#e6b980] rounded-xl font-bold hover:bg-[#162a25]"
                >
                  অর্ডার সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Dispatch Modal */}
      {actionModalType === 'DISPATCH' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">কুরিয়ার বা ফ্লিট ডিসপ্যাচ</h3>
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ডেলিভারি মেথড</label>
                <select
                  value={dispatchForm.deliveryMethod}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, deliveryMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="COURIER">কুরিয়ার সার্ভিস</option>
                  <option value="OWN_FLEET">নিজস্ব সান বার্ড ফ্লিট</option>
                  <option value="PICKUP">গ্রাহক পিকআপ</option>
                </select>
              </div>

              {dispatchForm.deliveryMethod === 'COURIER' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">কুরিয়ার পার্টনার</label>
                  <select
                    value={dispatchForm.courierPartner}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, courierPartner: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="STEADFAST">Steadfast Courier</option>
                    <option value="PATHAO">Pathao Courier</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">কুরিয়ার ট্র্যাকিং নম্বর</label>
                <input
                  type="text"
                  placeholder="e.g. ST-89102-TRACK"
                  value={dispatchForm.trackingNumber}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleDispatchSubmit}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  ডিসপ্যাচ নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delivery Modal */}
      {actionModalType === 'DELIVERY' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">ডেলিভারি কনফার্মেশন</h3>
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">গ্রহীতার নাম (Receiver Name)</label>
                <input
                  type="text"
                  required
                  placeholder="কে পণ্য গ্রহণ করেছেন"
                  value={deliveryForm.receiverName}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">গ্রহীতার মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={deliveryForm.receiverContact}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverContact: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মন্তব্য / নোটিশ</label>
                <textarea
                  rows={2}
                  placeholder="ডেলিভারি নোট..."
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleDeliverySubmit}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  ডেলিভার্ড মার্ক করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Hold & Cancel Modal */}
      {(actionModalType === 'HOLD_ORDER' || actionModalType === 'CANCEL_ORDER') && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {actionModalType === 'HOLD_ORDER' ? 'অর্ডার সাময়িক হোল্ড করুন' : 'অর্ডার বাতিল করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">কারণ লিখুন</label>
                <textarea
                  rows={3}
                  required
                  placeholder="কারণ স্পষ্টভাবে উল্লেখ করুন..."
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActionModalType(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold"
                >
                  ফিরে যান
                </button>
                <button
                  type="button"
                  onClick={actionModalType === 'HOLD_ORDER' ? handleHoldOrderSubmit : handleCancelOrderSubmit}
                  className={`px-5 py-2 text-white rounded-xl font-bold ${
                    actionModalType === 'HOLD_ORDER' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErpOrdersView;
