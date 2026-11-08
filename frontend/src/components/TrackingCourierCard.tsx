'use client';

import React, { useState } from 'react';
import './TrackingCourierCard.css';
import {
  Truck,
  Phone,
  User,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Navigation,
  Clock,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

interface RiderInfo {
  name: string;
  phone: string;
  vehicle: string;
  riderId: string;
  hubLocation: string;
}

interface TrackingCourierCardProps {
  courierPartner: 'Pathao' | 'Steadfast' | 'Internal' | string;
  consignmentId: string;
  status: 'PLACED' | 'PACKED' | 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  destinationDistrict: string;
  destinationAddress: string;
  rider?: RiderInfo | null;
  estimatedTime?: string;
}

export function TrackingCourierCard({
  courierPartner = 'Pathao',
  consignmentId = 'PATH-984210',
  status = 'OUT_FOR_DELIVERY',
  destinationDistrict = 'Dhaka',
  destinationAddress = 'House #14, Road #07, Dhanmondi, Dhaka',
  rider,
  estimatedTime = 'Today, 2:00 PM – 5:00 PM',
}: TrackingCourierCardProps) {
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Default fallback rider if in transit or out for delivery
  const activeRider: RiderInfo = rider || {
    name: 'মো: তারেক হাসান (Rider #842)',
    phone: '+880 1712-345678',
    vehicle: 'Motorcycle (Hero Glamour 125cc)',
    riderId: 'RID-842-DHK',
    hubLocation: 'Tejgaon Central Depot Hub',
  };

  const isOutForDelivery = status === 'OUT_FOR_DELIVERY';
  const isDelivered = status === 'DELIVERED';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-5">
      {/* Top Courier Partner Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#faf8f5] to-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1e3932]/10 text-[#1e3932] flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {courierPartner === 'Pathao'
                  ? 'পাঠাও এক্সপ্রেস লজিস্টিকস (Pathao Courier)'
                  : courierPartner === 'Steadfast'
                  ? 'স্টেডফাস্ট কুরিয়ার সার্ভিস (Steadfast Express)'
                  : 'সান বার্ড ডেডিকেটেড মেডিকেল ফ্লিট (Internal Logistics)'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Verified API
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Consignment ID: <strong>{consignmentId}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
              isDelivered
                ? 'bg-emerald-100 text-emerald-800'
                : isOutForDelivery
                ? 'bg-amber-100 text-amber-900 animate-pulse'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDelivered
                  ? 'bg-emerald-600'
                  : isOutForDelivery
                  ? 'bg-amber-600'
                  : 'bg-blue-600'
              }`}
            />
            <span>
              {isDelivered
                ? 'ডেলিভারি সম্পন্ন'
                : isOutForDelivery
                ? 'ডেলিভারির জন্য বের হয়েছে'
                : 'ট্রানজিটে রয়েছে'}
            </span>
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 pt-0 space-y-6">
        {/* Stylized SVG Map Transit Route */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#1e3932] p-5 text-white overflow-hidden shadow-inner">
          {/* Subtle Map Grid lines in SVG */}
          <svg
            className="absolute inset-0 w-full h-full opacity-15"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid-pattern"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Origin */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Navigation className="w-5 h-5 rotate-45" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  ডিসপ্যাচ হাব (Origin)
                </span>
                <p className="text-xs font-bold text-white">
                  সান বার্ড সেন্ট্রাল ওয়্যারহাউজ
                </p>
                <p className="text-[11px] text-slate-300">
                  তেজগাঁও আই/এ, ঢাকা-১২০৮
                </p>
              </div>
            </div>

            {/* Route Vector Line */}
            <div className="hidden md:flex flex-1 items-center justify-center px-4">
              <div className="w-full relative flex items-center">
                <div className="w-full h-0.5 bg-dashed border-b-2 border-emerald-400/40" />
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1e3932] px-2.5 py-1 rounded-full border border-emerald-400/50 text-[10px] font-mono text-emerald-300 flex items-center gap-1 shadow-md">
                  <Truck className="w-3.5 h-3.5 animate-pulse" />
                  <span>GPS Tracked</span>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                  গন্তব্য ঠিকানা (Destination)
                </span>
                <p className="text-xs font-bold text-white">
                  {destinationDistrict} District
                </p>
                <p className="text-[11px] text-slate-300 line-clamp-1 max-w-[200px]">
                  {destinationAddress}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>প্রত্যাশিত সময়: <strong className="text-white">{estimatedTime}</strong></span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              Cold-Chain Temperature: 4°C – 8°C Verified
            </span>
          </div>
        </div>

        {/* Assigned Rider Information Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  {activeRider.name}
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded">
                  অ্যাসাইনড রাইডার
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                যানবাহন: {activeRider.vehicle} • আইডি: {activeRider.riderId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${activeRider.phone}`}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>রাইডারকে কল দিন</span>
            </a>

            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>লজিস্টিকস সহায়তা</span>
            </button>
          </div>
        </div>
      </div>

      {/* Support Escalation Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#1e3932]" />
                <span>সান বার্ড সেন্ট্রাল লজিস্টিকস হেল্পডেস্ক</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ডেলিভারি সংক্রান্ত জরুরি প্রশ্ন বা বিলম্ব রিপোর্ট করতে আমাদের ডেডিকেটেড ডিসপ্যাচ অফিসারদের সাথে সরাসরি কথা বলুন:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span>লজিস্টিকস হটলাইন (24/7):</span>
                <strong className="font-mono text-[#1e3932]">+880 1800 000000</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span>তেজগাঁও হাব কন্ট্রোল রুম:</span>
                <strong className="font-mono text-slate-800">+880 2 9845120</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 bg-[#1e3932] hover:bg-[#162f29] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

