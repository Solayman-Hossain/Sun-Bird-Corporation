'use client';

import React, { useState, useMemo } from 'react';
import './ErpOrdersView.css';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Filter,
  CheckSquare,
  Square,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface ErpOrder {
  id: string;
  orderNumber: string;
  challanNumber: string;
  customerName: string;
  customerPhone: string;
  district: string;
  totalAmount: number;
  vatAmount: number;
  paymentMethod: 'COD' | 'ONLINE_SSLCOMMERZ' | 'BANK_TRANSFER';
  paymentStatus: 'PAID' | 'PENDING';
  orderStatus: 'PENDING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  courierProvider?: 'Pathao' | 'Steadfast';
  courierTracking?: string;
  date: string;
  itemsSummary: string;
}

const INITIAL_ERP_ORDERS: ErpOrder[] = [
  {
    id: 'ord-101',
    orderNumber: 'SBC-ORD-2026-9021',
    challanNumber: 'CH-2026-9021',
    customerName: 'ডাঃ আশরাফুল ইসলাম (সেন্ট্রাল ক্লিনিক)',
    customerPhone: '01711-234567',
    district: 'Dhaka',
    totalAmount: 17768,
    vatAmount: 2318,
    paymentMethod: 'ONLINE_SSLCOMMERZ',
    paymentStatus: 'PAID',
    orderStatus: 'PACKED',
    courierProvider: 'Pathao',
    courierTracking: 'PATH-984210',
    date: 'Today, 10:15 AM',
    itemsSummary: '2x Compressor Nebulizer, 5x IV Cannula 20G',
  },
  {
    id: 'ord-102',
    orderNumber: 'SBC-ORD-2026-9022',
    challanNumber: 'CH-2026-9022',
    customerName: 'মেডিসিন পয়েন্ট ফার্মেসি',
    customerPhone: '01811-345678',
    district: 'Chittagong',
    totalAmount: 9450,
    vatAmount: 1232,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING',
    date: 'Today, 11:30 AM',
    itemsSummary: '2x Upper Arm BP Monitor, 1x OLED Oximeter',
  },
  {
    id: 'ord-103',
    orderNumber: 'SBC-ORD-2026-9023',
    challanNumber: 'CH-2026-9023',
    customerName: 'গ্রীন লাইফ হসপিটাল আইসিইউ ডিপার্টমেন্ট',
    customerPhone: '01911-456789',
    district: 'Dhaka',
    totalAmount: 145000,
    vatAmount: 18913,
    paymentMethod: 'BANK_TRANSFER',
    paymentStatus: 'PAID',
    orderStatus: 'DISPATCHED',
    courierProvider: 'Pathao',
    courierTracking: 'PATH-984215',
    date: 'Yesterday, 04:45 PM',
    itemsSummary: '1x Electric ICU Bed 5-Function, 1x Multipara Monitor',
  },
  {
    id: 'ord-104',
    orderNumber: 'SBC-ORD-2026-9019',
    challanNumber: 'CH-2026-9019',
    customerName: 'প্রফেসর ডাঃ এম. এ. মতিন',
    customerPhone: '01611-567890',
    district: 'Sylhet',
    totalAmount: 3860,
    vatAmount: 504,
    paymentMethod: 'COD',
    paymentStatus: 'PAID',
    orderStatus: 'DELIVERED',
    courierProvider: 'Steadfast',
    courierTracking: 'ST-BD-672109',
    date: '04 Nov 2026',
    itemsSummary: '2x Fingertip Pulse Oximeter 50D',
  },
  {
    id: 'ord-105',
    orderNumber: 'SBC-ORD-2026-9018',
    challanNumber: 'CH-2026-9018',
    customerName: 'রংপুর কমিউনিটি মেডিকেল সেন্টার',
    customerPhone: '01711-998877',
    district: 'Rangpur',
    totalAmount: 48500,
    vatAmount: 6326,
    paymentMethod: 'ONLINE_SSLCOMMERZ',
    paymentStatus: 'PAID',
    orderStatus: 'DISPATCHED',
    courierProvider: 'Steadfast',
    courierTracking: 'ST-BD-672112',
    date: '03 Nov 2026',
    itemsSummary: '1x 12-Lead Diagnostic ECG Machine',
  },
];

export function ErpOrdersView() {
  const [orders, setOrders] = useState<ErpOrder[]>(INITIAL_ERP_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const { showToast } = useToast();

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchStatus =
        statusFilter === 'ALL' ||
        ord.orderStatus === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.challanNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.district.toLowerCase().includes(q) ||
        ord.customerPhone.includes(q);

      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  // Bulk Actions
  const handleBulkMarkPacked = () => {
    if (selectedOrderIds.length === 0) return;
    setOrders((prev) =>
      prev.map((ord) =>
        selectedOrderIds.includes(ord.id) && ord.orderStatus === 'PENDING'
          ? { ...ord, orderStatus: 'PACKED' }
          : ord
      )
    );
    showToast(`${selectedOrderIds.length}টি অর্ডার "Packed" হিসেবে মার্ক করা হয়েছে।`, 'success');
    setSelectedOrderIds([]);
  };

  const handleBulkDispatch = () => {
    if (selectedOrderIds.length === 0) return;
    setOrders((prev) =>
      prev.map((ord) => {
        if (selectedOrderIds.includes(ord.id)) {
          const provider = ord.district === 'Dhaka' ? 'Pathao' : 'Steadfast';
          const randomTrk =
            provider === 'Pathao'
              ? `PATH-${Math.floor(100000 + Math.random() * 900000)}`
              : `ST-BD-${Math.floor(100000 + Math.random() * 900000)}`;
          return {
            ...ord,
            orderStatus: 'DISPATCHED',
            courierProvider: provider,
            courierTracking: randomTrk,
          };
        }
        return ord;
      })
    );
    showToast(`${selectedOrderIds.length}টি অর্ডার কুরিয়ার হাবে প্রেরিত (Dispatched) হয়েছে।`, 'success');
    setSelectedOrderIds([]);
  };

  const handleBulkGenerateMushak = () => {
    if (selectedOrderIds.length === 0) return;
    showToast(`${selectedOrderIds.length}টি অর্ডারের এনবিআর মূসক-৬.৩ চালান ব্যাচ জেনারেট হয়েছে।`, 'success');
  };

  const handleUpdateSingleStatus = (id: string, newStatus: ErpOrder['orderStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, orderStatus: newStatus } : o))
    );
    showToast(`অর্ডার #${id} স্ট্যাটাস আপডেট হয়েছে: ${newStatus}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="অর্ডার নম্বর, মোবাইল বা জেলা খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1e3932]"
          />
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedOrderIds.length > 0 && (
            <span className="text-xs font-bold text-slate-700 mr-1">
              সিলেক্টেড: {selectedOrderIds.length}
            </span>
          )}

          <button
            type="button"
            disabled={selectedOrderIds.length === 0}
            onClick={handleBulkMarkPacked}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Mark Packed</span>
          </button>

          <button
            type="button"
            disabled={selectedOrderIds.length === 0}
            onClick={handleBulkDispatch}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Dispatch to Courier</span>
          </button>

          <button
            type="button"
            disabled={selectedOrderIds.length === 0}
            onClick={handleBulkGenerateMushak}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Bulk Mushak-6.3</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'ALL', label: 'সকল অর্ডার (All)' },
          { key: 'PENDING', label: 'অপেক্ষমাণ (Pending)' },
          { key: 'PACKED', label: 'প্যাকড (Packed)' },
          { key: 'DISPATCHED', label: 'ডিসপ্যাচড (In Transit)' },
          { key: 'DELIVERED', label: 'ডেলিভার্ড (Delivered)' },
          { key: 'CANCELLED', label: 'বাতিল (Cancelled)' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-[#1e3932] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf8f5] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="cursor-pointer text-slate-600"
                  >
                    {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                      <CheckSquare className="w-4 h-4 text-[#1e3932]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">অর্ডার কোড ও চালান</th>
                <th className="p-3.5">গ্রাহক ও জেলা</th>
                <th className="p-3.5 text-right">সর্বমোট BDT</th>
                <th className="p-3.5 text-center">পেমেন্ট</th>
                <th className="p-3.5 text-center">কুরিয়ার ও স্ট্যাটাস</th>
                <th className="p-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    কোন অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isSelected = selectedOrderIds.includes(ord.id);
                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOrder(ord.id)}
                          className="cursor-pointer text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#1e3932]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-900">
                          #{ord.orderNumber}
                        </div>
                        <div className="text-[11px] font-mono text-[#1e3932]">
                          চালান: {ord.challanNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {ord.date}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {ord.customerPhone} • <strong className="text-slate-700">{ord.district}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                          {ord.itemsSummary}
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <div className="font-extrabold text-slate-900 text-sm">
                          ৳{ord.totalAmount.toLocaleString('en-US')}
                        </div>
                        <div className="text-[10px] text-[#1e3932]">
                          ভ্যাট: ৳{ord.vatAmount.toLocaleString('en-US')}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {ord.paymentStatus === 'PAID' ? 'PAID' : 'COD'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {ord.paymentMethod === 'ONLINE_SSLCOMMERZ' ? 'SSLCOMMERZ' : ord.paymentMethod}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            ord.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.orderStatus === 'DISPATCHED'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.orderStatus === 'PACKED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : ord.orderStatus === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                        {ord.courierTracking && (
                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                            {ord.courierProvider}: {ord.courierTracking}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {ord.orderStatus === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSingleStatus(ord.id, 'PACKED')}
                              className="px-2 py-1 bg-slate-100 hover:bg-[#1e3932] hover:text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Pack
                            </button>
                          )}
                          {ord.orderStatus === 'PACKED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateSingleStatus(ord.id, 'DISPATCHED')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Dispatch
                            </button>
                          )}
                          <a
                            href={`/track?id=${ord.orderNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            title="লাইভ ট্র্যাকিং দেখুন"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

