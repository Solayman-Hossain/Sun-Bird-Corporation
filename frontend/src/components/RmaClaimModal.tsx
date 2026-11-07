'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, FileText, Send } from 'lucide-react';
import { submitDisputeClaim } from '../lib/api';

interface RmaClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderId?: string;
}

export function RmaClaimModal({ isOpen, onClose, defaultOrderId }: RmaClaimModalProps) {
  const [orderId, setOrderId] = useState(defaultOrderId || '');
  const [productSku, setProductSku] = useState('');
  const [productName, setProductName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [claimType, setClaimType] = useState('DAMAGED_IN_TRANSIT');
  const [description, setDescription] = useState('');
  const [submittedClaim, setSubmittedClaim] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !customerPhone || !description) return;

    setLoading(true);
    const res = await submitDisputeClaim({
      orderId,
      productSku: productSku || 'MED-GEN-01',
      productName: productName || 'Medical Equipment Unit',
      customerName: customerName || 'Valued Customer',
      customerPhone,
      claimType,
      description,
    });
    setLoading(false);

    if (res.success && res.data) {
      setSubmittedClaim(res.data);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedClaim(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">ওয়ারেন্টি ক্লেইম ও কমপ্লেইন পোর্টাল (RMA Service)</h3>
              <p className="text-[11px] text-slate-400">Sun Bird Corporation কর্পোরেট ডিসপুট রেজোলিউশন</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {submittedClaim ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">আপনার ক্লেইম টিকিট নিবন্ধিত হয়েছে!</h4>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto text-left space-y-1.5">
                <div className="text-xs text-slate-500">টিকিট নম্বর (Ticket Number):</div>
                <div className="text-lg font-mono font-bold text-emerald-700">{submittedClaim.claimNumber}</div>
                <div className="text-xs text-slate-500">অর্ডার নম্বর: <strong className="text-slate-800">{submittedClaim.orderId}</strong></div>
                <div className="text-xs text-slate-500">স্ট্যাটাস: <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px]">অ্যাডমিন রিভিউতে প্রক্রিয়াধীন</span></div>
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                আমাদের বায়োমেডিকেল ইঞ্জিনিয়ারিং ও কোয়ালিটি টিম ২৪ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করবে এবং রিপ্লেসমেন্ট প্রদান করবে।
              </p>
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  ডেলিভারির সময় প্যাকেজ ক্ষতিগ্রস্ত থাকলে, সিল কাটা থাকলে অথবা মেশিনের ওয়ারেন্টি সার্ভিস লাগলে নিচের ফর্মটি পূরণ করুন।
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">অর্ডার নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ORD-2026-0091"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">কাস্টমার মোবাইল *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">আপনার নাম</label>
                  <input
                    type="text"
                    placeholder="আপনার নাম বা ক্লিনিকের নাম"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">পণ্যের SKU / মডেল</label>
                  <input
                    type="text"
                    placeholder="e.g. MED-BPM-ARM বা BP Machine"
                    value={productSku}
                    onChange={(e) => setProductSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-semibold text-slate-700 block mb-1">সমস্যার ধরন (Claim Type) *</label>
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500 bg-white"
                >
                  <option value="DAMAGED_IN_TRANSIT">কুরিয়ার ট্রানজিটে ক্ষতিগ্রস্থ / ভাঙা প্যাকেট</option>
                  <option value="DEFECTIVE_PRODUCT">ত্রুটিপূর্ণ যন্ত্র / ডিসপ্লে বা পাওয়ার কাজ করে না</option>
                  <option value="WARRANTY_SERVICE">ওয়ারেন্টি সার্ভিসিং ও পার্টস সাপোর্ট</option>
                  <option value="WRONG_ITEM_DELIVERED">ভুল সাইজ বা ভিন্ন পণ্য ডেলিভারি হয়েছে</option>
                  <option value="EXPIRED_BATCH">মেয়াদ উত্তীর্ণ বা সিল খোলা পণ্য</option>
                </select>
              </div>

              <div className="text-xs">
                <label className="font-semibold text-slate-700 block mb-1">সমস্যার বিস্তারিত বিবরণ *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="কী সমস্যা হচ্ছে বিস্তারিত লিখুন..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'জমা হচ্ছে...' : 'ক্লেইম টিকিট জমা দিন'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

