'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { CartDrawer } from '../../components/CartDrawer';
import { CustomerSupportChat } from '../../components/CustomerSupportChat';
import { User, Package, Receipt, MapPin, Phone, ArrowLeft, Printer, ShieldCheck } from 'lucide-react';

export default function CustomerAccountPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'invoices'>('orders');

  const customer = {
    name: 'ড. মো: রফিকুল ইসলাম',
    designation: 'চিফ কনসালট্যান্ট ও ডিরেক্টর',
    organization: 'সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স',
    mobile: '01711-000000',
    email: 'dr.rafiqul@centraldiag.com',
    address: 'প্লট ১২, রোড ৪, ব্লক ডি, ধানমন্ডি, ঢাকা-১২০৫',
    customerType: 'HOSPITAL_B2B',
  };

  const pastOrders = [
    {
      orderId: 'ORD-2026-9481',
      date: '০৩ নভেম্বর ২০২৬',
      challanNumber: 'CH-2026-0812',
      itemsCount: 4,
      totalAmount: 18450,
      paymentMethod: 'ONLINE_SSLCOMMERZ',
      status: 'DELIVERED',
      itemsSummary: 'Sterile IV Cannula (50 Pcs), Digital BP Machine (2 Pcs), Glucose Strips Kit (3 Sets)',
    },
    {
      orderId: 'ORD-2026-8720',
      date: '২৮ অক্টোবর ২০২৬',
      challanNumber: 'CH-2026-0745',
      itemsCount: 2,
      totalAmount: 7600,
      paymentMethod: 'COD',
      status: 'DELIVERED',
      itemsSummary: '10-Lead Universal ECG Cable (2 Sets), Alcohol Swabs Box (5 Pcs)',
    },
    {
      orderId: 'ORD-2026-8104',
      date: '১৫ অক্টোবর ২০২৬',
      challanNumber: 'CH-2026-0689',
      itemsCount: 1,
      totalAmount: 3800,
      paymentMethod: 'COD',
      status: 'DELIVERED',
      itemsSummary: 'NIV Full Face CPAP/BiPAP Mask (1 Pc)',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Navbar showSearch={false} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>হোমে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">গ্রাহক অ্যাকাউন্ট ও অর্ডার হিস্ট্রি</span>
        </div>

        {/* Profile Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-emerald-500/20">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {customer.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  ভেরিফাইড কাস্টমার
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {customer.designation} • <strong className="text-slate-700">{customer.organization}</strong>
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 font-mono">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {customer.mobile}
                </span>
                <span>•</span>
                <span>{customer.email}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 w-full sm:w-auto">
            <div className="text-slate-400 font-medium">ডিফল্ট ডেলিভারি ঠিকানা:</div>
            <div className="font-semibold text-slate-800 line-clamp-2 max-w-xs">
              {customer.address}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>অর্ডার হিস্ট্রি ({pastOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>এনবিআর মূসক-৬.৩ চালান সমূহ</span>
          </button>
        </div>

        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {pastOrders.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {order.orderId}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{order.date}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-emerald-700 font-semibold">
                      চালান: {order.challanNumber}
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] self-start sm:self-auto">
                    ✓ ডেলিভারি সম্পন্ন
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="text-slate-400">অর্ডারকৃত পণ্য: </span>
                  <span className="font-medium text-slate-800">{order.itemsSummary}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500">পরিশোধিত মূল্য: </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ৳ {order.totalAmount.toLocaleString('en-US')}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({order.paymentMethod === 'COD' ? 'ক্যাশ অন ডেলিভারি' : 'অনলাইন কার্ড/বিকাশ'})
                    </span>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>চালান প্রিন্ট</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 pb-3 border-b border-slate-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">
                জাতীয় রাজস্ব বোর্ড (NBR) ট্যাক্স চালান আর্কাইভ
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              সান বার্ড কর্পোরেশন হতে ক্রয়কৃত সকল পণ্যের আইনসম্মত মূসক-৬.৩ চালান এখানে সংরক্ষিত রয়েছে। 
              হাসপাতাল ও ডায়াগনস্টিক সেন্টারের ইনপুট ভ্যাট রিবেট গ্রহণের জন্য এই চালানসমূহ ব্যবহারযোগ্য।
            </p>

            <div className="space-y-3 pt-2">
              {pastOrders.map((o) => (
                <div
                  key={o.challanNumber}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900">
                      মূসক-৬.৩ চালান নং: {o.challanNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ইস্যুর তারিখ: {o.date} • মোট মূল্য: ৳{o.totalAmount.toLocaleString('en-US')}
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>PDF ডাউনলোড</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <CartDrawer onProceedToCheckout={() => {}} />
      <CustomerSupportChat />
    </div>
  );
}

