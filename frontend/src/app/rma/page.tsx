'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './rma.css';
import { Navbar } from '../../components/Navbar';
import { CartDrawer } from '../../components/CartDrawer';
import { WishlistDrawer } from '../../components/WishlistDrawer';
import { CustomerSupportChat } from '../../components/CustomerSupportChat';
import { RmaClaimModal } from '../../components/RmaClaimModal';
import { RmaStatusCard } from '../../components/RmaStatusCard';
import { Footer } from '../../components/Footer';
import { MobileBottomNav } from '../../components/MobileBottomNav';
import {
  ShieldCheck,
  Wrench,
  Truck,
  Building2,
  Clock,
  ArrowLeft,
  Plus,
  HelpCircle,
  FileText,
  CheckCircle2,
  Phone,
} from 'lucide-react';

export default function RmaWarrantyPortalPage() {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col font-sans text-slate-800">
      <Navbar showSearch={false} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-10 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#1e3932] flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>হোমে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">ওয়ারেন্টি ও RMA ক্লেইম পোর্টাল</span>
        </div>

        {/* Hero Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>১–৩ বছর অফিসিয়াল রিপ্লেসমেন্ট গ্যারান্টি</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              বায়োমেডিকেল ওয়ারেন্টি ও সার্ভিস পোর্টাল (RMA)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              সান বার্ড কর্পোরেশন থেকে ক্রয়কৃত সকল মেডিকেল ডিভাইস ও যন্ত্রাংশের প্রস্তুতকারক ত্রুটি বা ক্ষতির ক্ষেত্রে আমাদের ডেডিকেটেড বায়োমেডিকেল সার্ভিস টিম দ্রুত সমাধান ও রিপ্লেসমেন্ট নিশ্চিত করে।
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsClaimModalOpen(true)}
            className="px-6 py-3.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#1e3932]/25 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#e6b980]" />
            <span>নতুন ওয়ারেন্টি ক্লেইম দাখিল করুন</span>
          </button>
        </div>

        {/* 4 Value Pillars of RMA Service */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#1e3932]/10 text-[#1e3932] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs">২৪-৪৮ ঘণ্টা টার্নঅ্যারাউন্ড</h4>
            <p className="text-[11px] text-slate-500">
              অভিযোগ পাওয়ার পর সর্বোচ্চ ৪৮ ঘণ্টার মধ্যে ল্যাব ডায়াগনসিস রিপোর্ট প্রদান।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs">ফ্রি পিকআপ ও ড্রপ</h4>
            <p className="text-[11px] text-slate-500">
              ৬৪ জেলা থেকে আমাদের নিজস্ব কুরিয়ার সার্ভিসে ত্রুটিপূর্ণ ডিভাইস সংগ্রহ।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs">অরিজিনাল স্পেয়ার পার্টস</h4>
            <p className="text-[11px] text-slate-500">
              সরাসরি ইউরোপীয় ও তাইওয়ানিজ ফ্যাক্টরি থেকে আমদানিকৃত অনুমোদিত পার্টস।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-xs">২৪/৭ বায়োমেডিকেল সাপোর্ট</h4>
            <p className="text-[11px] text-slate-500">
              লাইভ চ্যাট বা হটলাইনে সিনিয়র বায়োমেডিকেল ইঞ্জিনিয়ারদের পরামর্শ।
            </p>
          </div>
        </div>

        {/* Live RMA Inspection Status Card (Prompt 32) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 font-serif">
              সক্রিয় RMA ক্লেইম স্ট্যাটাস ও ল্যাব রিপোর্ট
            </h2>
            <span className="text-xs text-slate-500">
              রিয়েল-টাইম ৫-ধাপ ট্র্যাকিং
            </span>
          </div>

          <RmaStatusCard showToggleSwitch={true} />
        </div>
      </main>

      <RmaClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />

      <CartDrawer onProceedToCheckout={() => {}} />
      <WishlistDrawer />
      <CustomerSupportChat />
      <Footer />
      <div className="h-16 lg:hidden" />
      <MobileBottomNav />
    </div>
  );
}

