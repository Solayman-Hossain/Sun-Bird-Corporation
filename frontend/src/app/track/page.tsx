'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import './track.css';
import { Navbar } from '../../components/Navbar';
import { CartDrawer } from '../../components/CartDrawer';
import { WishlistDrawer } from '../../components/WishlistDrawer';
import { CustomerSupportChat } from '../../components/CustomerSupportChat';
import { TrackingCourierCard } from '../../components/TrackingCourierCard';
import { Footer } from '../../components/Footer';
import { MobileBottomNav } from '../../components/MobileBottomNav';
import {
  Search,
  Truck,
  CheckCircle2,
  Package,
  Clock,
  ShieldCheck,
  ArrowLeft,
  MapPin,
  Receipt,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
} from 'lucide-react';
import { apiClient } from '../../lib/api';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [query, setQuery] = useState(initialId);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any | null>(null);

  const executeSearch = async (searchTerm: string) => {
    const q = searchTerm.trim().toUpperCase();
    if (!q) return;

    setLoading(true);
    setSearched(true);

    try {
      // Attempt backend API call
      const res = await apiClient<{ success: boolean; data: any }>(`/tracking/${encodeURIComponent(q)}`);
      if (res && res.success && res.data) {
        setTrackingData(res.data);
        setLoading(false);
        return;
      }
    } catch {
      // Backend not running or demo tracking code; use rich fallback simulation
    }

    // Realistic simulation data matching Sun Bird Corporation ERP & Logistics
    setTimeout(() => {
      const orderNum = q.startsWith('SBC-ORD') || q.startsWith('ORD') ? q : `SBC-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const trackingCode = q.startsWith('ST-BD') || q.startsWith('PATH') || q.startsWith('SBC-TRK') ? q : `ST-BD-${Math.floor(100000 + Math.random() * 900000)}`;

      setTrackingData({
        orderNumber: orderNum,
        challanNumber: `CH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        trackingCode: trackingCode,
        customerName: 'ডাঃ আশরাফুল ইসলাম (সেন্ট্রাল ডায়াগনস্টিক)',
        customerMobile: q.startsWith('01') ? q : '01711-234567',
        destinationAddress: 'বাড়ি নং-১৪, রোড নং-০৭, ধানমন্ডি, ঢাকা-১২০৫',
        destinationDistrict: 'Dhaka',
        courier: 'Pathao',
        consignmentId: trackingCode,
        status: 'OUT_FOR_DELIVERY', // 'PLACED' | 'PACKED' | 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
        currentStep: 4, // 1 to 5
        estimatedDelivery: 'আজ বিকাল ৩:০০ টা থেকে ৬:০০ টার মধ্যে',
        paymentMethod: 'ক্যাশ অন ডেলিভারি (COD)',
        totalAmount: 4950,
        subtotal: 4250,
        vatAmount: 640,
        shippingFee: 60,
        items: [
          { sku: 'SBC-CAN-20G', name: 'IV Cannula 20G with Injection Port (Pink)', qty: 25, price: 1125 },
          { sku: 'SBC-BPM-DIG', name: 'Digital Upper Arm Blood Pressure Monitor', qty: 1, price: 2850 },
          { sku: 'SBC-THM-IR1', name: 'Non-Contact Infrared Forehead Thermometer', qty: 1, price: 975 },
        ],
        steps: [
          {
            stepNumber: 1,
            title: 'Order Placed & Verified',
            titleBn: 'অর্ডার নিশ্চিতকরণ ও ভেরিফিকেশন',
            location: 'সেন্ট্রাল ইআরপি সিস্টেম',
            timestamp: 'আজ সকাল ০৯:৩০',
            completed: true,
          },
          {
            stepNumber: 2,
            title: 'Packed & Dispatched from Warehouse',
            titleBn: 'প্যাকেজিং ও কোয়ালিটি ইন্সপেকশন',
            location: 'তেজগাঁও সেন্ট্রাল ওয়্যারহাউজ',
            timestamp: 'আজ সকাল ১১:৪৫',
            completed: true,
          },
          {
            stepNumber: 3,
            title: 'Handed over to Courier Hub',
            titleBn: 'কুরিয়ার পার্টনারে হস্তান্তর',
            location: 'পাঠাও লজিস্টিকস হাব (তেজগাঁও)',
            timestamp: 'আজ দুপুর ০১:১৫',
            completed: true,
          },
          {
            stepNumber: 4,
            title: 'Out for Delivery to Destination',
            titleBn: 'ডেলিভারি রাইডারের মাধ্যমে প্রেরিত',
            location: 'ধানমন্ডি ডিস্ট্রিবিউশন হাব',
            timestamp: 'আজ দুপুর ০২:৩০',
            completed: true,
            active: true,
          },
          {
            stepNumber: 5,
            title: 'Successfully Delivered & Inspected',
            titleBn: 'সফলভাবে মালামাল হস্তান্তর',
            location: 'গ্রাহকের ঠিকানা',
            timestamp: 'প্রত্যাশিত আজ বিকাল ০৫:০০',
            completed: false,
          },
        ],
      });
      setLoading(false);
    }, 500);
  };

  // Auto-search if `id` parameter is present
  useEffect(() => {
    if (initialId) {
      setQuery(initialId);
      executeSearch(initialId);
    }
  }, [initialId]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-[#1e3932] flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>হোমে ফিরে যান</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">লাইভ পার্সেল ট্র্যাকিং</span>
      </div>

      {/* Search Bar Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-3 text-[#1e3932]">
          <div className="w-12 h-12 rounded-2xl bg-[#1e3932]/10 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-[#1e3932]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
              অর্ডার ও ডেলিভারি ট্র্যাকিং (Live Shipment Tracking)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              আপনার ১১ ডিজিটের মোবাইল নম্বর অথবা ট্র্যাকিং কোড (যেমন: <span className="font-mono text-slate-700">ST-BD-982143</span> বা <span className="font-mono text-slate-700">SBC-ORD-2026-9021</span>) দিয়ে পার্সেল লাইভ ট্র্যাক করুন।
            </p>
          </div>
        </div>

        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="উদা: ST-BD-982143 অথবা 01711XXXXXX"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#faf8f5] border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1e3932]/20 focus:border-[#1e3932]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#1e3932]/20 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>অনুসন্ধান চলছে...</span>
            ) : (
              <>
                <span>ট্র্যাক করুন</span>
                <Truck className="w-4 h-4 text-[#e6b980]" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tracking Results View */}
      {searched && trackingData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Order Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-200">
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">অর্ডার রেফারেন্স:</span>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  #{trackingData.orderNumber}
                </div>
                <div className="text-[11px] text-[#1e3932] font-semibold flex items-center gap-1 font-mono">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>চালান: {trackingData.challanNumber}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">কুরিয়ার ও কনসাইনমেন্ট:</span>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                  {trackingData.courier} Logistics
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  কোড: {trackingData.trackingCode}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">প্রত্যাশিত ডেলিভারি:</span>
                <div className="font-bold text-emerald-700 text-xs sm:text-sm">
                  {trackingData.estimatedDelivery}
                </div>
                <div className="text-[10px] text-slate-500">
                  জেলা: {trackingData.destinationDistrict}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">পরিশোধের বিবরণ:</span>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                  {trackingData.paymentMethod}
                </div>
                <div className="text-[11px] text-slate-700 font-semibold">
                  সর্বমোট: <strong className="text-[#1e3932]">৳{trackingData.totalAmount.toLocaleString('en-US')}</strong>
                </div>
              </div>
            </div>

            {/* Stepper Visual Timeline (5 Steps) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#1e3932]" />
                  <span>পার্সেল ট্রানজিট লাইভ টাইমলাইন (5-Step Progress)</span>
                </h3>
                <span className="text-xs font-bold text-[#1e3932]">
                  Step {trackingData.currentStep} of 5
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {trackingData.steps.map((st: any) => {
                  const isCurrent = st.active || st.stepNumber === trackingData.currentStep;
                  const isPast = st.completed && !isCurrent;
                  return (
                    <div
                      key={st.stepNumber}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-[#1e3932]/5 border-2 border-[#1e3932] shadow-xs'
                          : isPast
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : isCurrent ? (
                          <Truck className="w-4 h-4 text-[#1e3932] animate-bounce shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center shrink-0">
                            {st.stepNumber}
                          </span>
                        )}
                        <span
                          className={`truncate ${
                            isCurrent
                              ? 'text-[#1e3932]'
                              : isPast
                              ? 'text-emerald-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {st.titleBn}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                        {st.location}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {st.timestamp}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination & Order Items Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Destination Address */}
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1e3932]" />
                  <span>প্রাপকের বিবরণ ও ডেলিভারি ঠিকানা</span>
                </h4>
                <div className="font-semibold text-slate-800">
                  {trackingData.customerName}
                </div>
                <div className="text-slate-600 leading-relaxed">
                  {trackingData.destinationAddress}
                </div>
                <div className="text-slate-500 pt-1 font-mono">
                  যোগাযোগ: <strong className="text-slate-800">{trackingData.customerMobile}</strong>
                </div>
                <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-1 border-t border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>এনবিআর মূসক-৬.৩ চালান কপি পার্সেলের সাথে সংযুক্ত</span>
                </div>
              </div>

              {/* Package Contents */}
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#1e3932]" />
                  <span>পার্সেলের মালামাল তালিকা</span>
                </h4>
                <div className="divide-y divide-slate-200 max-h-36 overflow-y-auto pr-1">
                  {trackingData.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-1.5 flex justify-between items-center text-[11px]">
                      <span className="truncate pr-2 text-slate-700">
                        {item.qty}x {item.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        ৳{item.price.toLocaleString('en-US')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-[#1e3932] font-mono">
                    ৳{trackingData.totalAmount.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt 27: Integrated Courier Partner & Rider Card */}
          <TrackingCourierCard
            courierPartner={trackingData.courier}
            consignmentId={trackingData.trackingCode}
            status={trackingData.status}
            destinationDistrict={trackingData.destinationDistrict}
            destinationAddress={trackingData.destinationAddress}
            estimatedTime={trackingData.estimatedDelivery}
          />
        </div>
      )}
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col font-sans text-slate-800">
      <Navbar showSearch={false} />

      <Suspense
        fallback={
          <div className="max-w-5xl w-full mx-auto px-4 py-20 text-center text-xs text-slate-500">
            লোডিং ট্র্যাকিং ডাটা...
          </div>
        }
      >
        <TrackOrderContent />
      </Suspense>

      <CartDrawer onProceedToCheckout={() => {}} />
      <WishlistDrawer />
      <CustomerSupportChat />
      <Footer />
      <div className="h-16 lg:hidden" />
      <MobileBottomNav />
    </div>
  );
}
