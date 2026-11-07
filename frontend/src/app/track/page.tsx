'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { CartDrawer } from '../../components/CartDrawer';
import { CustomerSupportChat } from '../../components/CustomerSupportChat';
import { Search, Truck, CheckCircle2, Package, Clock, ShieldCheck, ArrowLeft, MapPin, Receipt } from 'lucide-react';

export default function TrackOrderPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    // Simulate or call backend tracking API
    setTimeout(() => {
      const q = query.trim().toUpperCase();
      setTrackingData({
        orderNumber: q.startsWith('ORD') ? q : `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        challanNumber: `CH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: 'ড. মো: রফিকুল ইসলাম',
        customerMobile: query.startsWith('01') ? query : '01711-000000',
        destination: 'ধানমন্ডি, ঢাকা (সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স)',
        courier: 'Pathao Courier Logistics (Consignment #PATH-98421)',
        estimatedDelivery: 'আগামীকাল দুপুর ২টা থেকে বিকাল ৫টার মধ্যে',
        paymentStatus: 'ক্যাশ অন ডেলিভারি (COD)',
        totalAmount: 3950,
        currentStep: 3, // 1: Placed, 2: Packed, 3: In Transit, 4: Delivered
        items: [
          { name: 'Sterile IV Cannula 20G (With Port & Wings)', qty: 20, price: 900 },
          { name: 'Digital Upper Arm Blood Pressure (BP) Monitor', qty: 1, price: 2750 },
          { name: 'ডেলিভারি চার্জ (ঢাকা সিটি)', qty: 1, price: 60 },
          { name: 'এনবিআর মূসক-৬.৩ ভ্যাট (১৫%)', qty: 1, price: 548 },
        ],
        events: [
          { time: 'আজ সকাল ১০:১৫', title: 'অর্ডার কনফার্মড ও সেন্ট্রাল ডিপো রিজার্ভেশন সম্পন্ন' },
          { time: 'আজ দুপুর ১২:৩০', title: 'তেজগাঁও ওয়্যারহাউজে কোয়ালিটি চেকিং ও প্যাকেজিং সম্পন্ন' },
          { time: 'আজ বিকাল ০৩:০০', title: 'এনবিআর মূসক-৬.৩ চালান তৈরি ও পাঠাও কুরিয়ার হাবে স্থানান্তর' },
          { time: 'প্রত্যাশিত', title: 'গ্রাহকের ঠিকানায় ডেলিভারি ও মূল্য সংগ্রহ' },
        ],
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <Navbar showSearch={false} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-emerald-700 flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>হোমে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">লাইভ পার্সেল ট্র্যাকিং</span>
        </div>

        {/* Search Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-700">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                অর্ডার ও ডেলিভারি ট্র্যাকিং
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                আপনার ১১ ডিজিটের মোবাইল নম্বর অথবা অর্ডার কোড (যেমন: ORD-2026-XXXX) দিয়ে পার্সেল ট্র্যাক করুন।
              </p>
            </div>
          </div>

          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="যেমন: 01711000000 অথবা ORD-2026-1024"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-60"
            >
              {loading ? 'অনুসন্ধান চলছে...' : 'ট্র্যাক করুন'}
            </button>
          </form>
        </div>

        {/* Tracking Result View */}
        {searched && trackingData && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-in fade-in">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-200">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">অর্ডার নম্বর:</span>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {trackingData.orderNumber}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Receipt className="w-3 h-3" />
                  <span>চালান: {trackingData.challanNumber}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">ডেলিভারি পার্টনার:</span>
                <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                  {trackingData.courier}
                </div>
                <div className="text-[11px] text-blue-700 font-medium">
                  {trackingData.estimatedDelivery}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">পরিশোধের অবস্থা:</span>
                <div className="font-bold text-slate-900 text-sm">
                  {trackingData.paymentStatus}
                </div>
                <div className="text-[11px] text-slate-600">
                  মোট প্রদেয়: <strong className="text-emerald-700">৳ {trackingData.totalAmount.toLocaleString('en-US')}</strong>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                পার্সেল ট্রানজিট অগ্রগতি (Delivery Progress)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>১. গৃহীত</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">অর্ডার ভেরিফাইড</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>২. প্রস্তুত</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">তেজগাঁও ওয়্যারহাউজ</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 border-2 border-blue-400 text-blue-900 space-y-1 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700">
                    <Truck className="w-4 h-4 animate-bounce" />
                    <span>৩. কুরিয়ারে ট্রানজিট</span>
                  </div>
                  <p className="text-[11px] text-blue-800">পাঠাও এক্সপ্রেস হাবে</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>৪. ডেলিভার্ড</span>
                  </div>
                  <p className="text-[11px]">প্রত্যাশিত আগামীকাল</p>
                </div>
              </div>
            </div>

            {/* Event Log & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  টাইমলাইন আপডেট
                </h4>
                <div className="space-y-3 text-xs">
                  {trackingData.events.map((ev: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-800">{ev.title}</div>
                        <div className="text-[11px] text-slate-400">{ev.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                  প্রাপকের ঠিকানা
                </h4>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{trackingData.destination}</span>
                </div>
                <div className="text-slate-500 pt-2 border-t border-slate-200">
                  যোগাযোগ: <strong className="text-slate-800 font-mono">{trackingData.customerMobile}</strong>
                </div>
                <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>চালান কপি প্যাকেজের ভেতরে সংযুক্ত আছে</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <CartDrawer onProceedToCheckout={() => {}} />
      <CustomerSupportChat />
    </div>
  );
}

