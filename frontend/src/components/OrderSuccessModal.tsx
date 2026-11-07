'use client';

import React from 'react';
import { CheckCircle2, Receipt, Truck, ArrowRight, ShieldCheck, Printer } from 'lucide-react';
import { OrderConfirmation } from '../types';

interface OrderSuccessModalProps {
  order: OrderConfirmation | null;
  onClose: () => void;
}

export function OrderSuccessModal({ order, onClose }: OrderSuccessModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6 text-center">
        {/* Animated Check Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            অর্ডার সফলভাবে গৃহীত হয়েছে
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-2">
            ধন্যবাদ, আপনার অর্ডার নিশ্চিত হয়েছে!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            সান বার্ড সেন্ট্রাল ওয়্যারহাউজ থেকে মালামাল প্রস্তুত ও চালানের কাজ শুরু হয়েছে।
          </p>
        </div>

        {/* Order Details Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">অর্ডার নম্বর:</span>
            <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">মূসক-৬.৩ চালান নম্বর:</span>
            <span className="font-mono font-bold text-emerald-700">{order.challanNumber || 'CH-2026-AUTO'}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">গ্রাহকের মোবাইল:</span>
            <span className="font-mono font-semibold text-slate-800">{order.customerMobile}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500">পরিশোধ পদ্ধতি:</span>
            <span className="font-semibold text-slate-800">
              {order.paymentMethod === 'COD' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'অনলাইন পেমেন্ট'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 font-bold text-slate-900 text-sm">
            <span>সর্বমোট পরিশোধিত / প্রদেয়:</span>
            <span className="text-emerald-700 text-base">৳ {order.totalAmount.toLocaleString('en-US')}</span>
          </div>
        </div>

        {/* ERP & NBR Audit Indicator */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-left space-y-1 text-[11px] text-emerald-900">
          <div className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>অটোমেটিক ইআরপি অ্যাকাউন্টিং ও স্টক আপডেট সম্পন্ন:</span>
          </div>
          <p className="text-emerald-800 leading-relaxed">
            • সেন্ট্রাল ডিপো থেকে স্টক মাইনাস করা হয়েছে।<br />
            • অ্যাকাউন্টিং লেজারে রেভিনিউ (`4010`) ও COGS (`5010`) পোস্ট হয়েছে।<br />
            • পাঠাও/স্টেডফাস্ট কুরিয়ারে বুকিং রিকুয়েস্ট পাঠানো হয়েছে।
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>চালান প্রিন্ট করুন</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/25"
          >
            <span>আরও কেনাকাটা করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

