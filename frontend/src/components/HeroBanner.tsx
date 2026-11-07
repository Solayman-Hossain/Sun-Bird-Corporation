'use client';

import React from 'react';
import { ShieldCheck, Truck, Receipt, Sparkles, Building2 } from 'lucide-react';

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-slate-50 to-white pt-8 pb-10 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Text */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Medical Equipment & Diagnostic Import Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              ইমপোর্টেড মেডিকেল ও ডায়াগনস্টিক পণ্য{' '}
              <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy">
                সরাসরি ওয়্যারহাউজ
              </span>{' '}
              থেকে
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              সান বার্ড কর্পোরেশনের সেন্ট্রাল ডিপো থেকে সরাসরি সংগ্রহ করুন আসল ক্যানুলা, বিপি মেশিন, 
              ইসিজি ক্যাবল, এনআইভি মাস্ক, গ্লুকোজ কিট ও থার্মোমিটার। প্রতিটি ক্রয়ে রয়েছে এনবিআর অনুমোদিত 
              <span className="font-semibold text-slate-800"> মূসক-৬.৩ ভ্যাট চালান</span> এবং দ্রুততম কুরিয়ার ডেলিভারি।
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#products"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-600/25 transition-all inline-flex items-center gap-2"
              >
                <span>পণ্য তালিকা দেখুন</span>
                <span>↓</span>
              </a>
              <a
                href="tel:01811000001"
                className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-sm rounded-xl transition-all inline-flex items-center gap-2 shadow-xs"
              >
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>পাইকারি / কর্পোরেট কোটেশন</span>
              </a>
            </div>
          </div>

          {/* Right Value Propositions Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">এনবিআর মূসক-৬.৩</h3>
              <p className="text-xs text-slate-500 mt-1">
                প্রত্যেক অর্ডারে স্বয়ংক্রিয় ভ্যাট ট্যাক্স ইনভয়েস ও ডাবল-এন্ট্রি হিসাব
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">সারা দেশে ডেলিভারি</h3>
              <p className="text-xs text-slate-500 mt-1">
                পাঠাও ও স্টেডফাস্ট কুরিয়ারের মাধ্যমে ৬৪ জেলায় ক্যাশ অন ডেলিভারি (COD)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">১০০% অথেনটিক পণ্য</h3>
              <p className="text-xs text-slate-500 mt-1">
                সরাসরি এলসি মারফত আমদানিকৃত এবং তেজগাঁও সেন্ট্রাল ডিপোতে পরীক্ষিত
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">ইআরপি সেন্ট্রাল সিঙ্ক</h3>
              <p className="text-xs text-slate-500 mt-1">
                স্টক, ব্যাচ এক্সপায়ারি এবং সেলস হিসাব মুহূর্তেই সেন্ট্রাল ইআরপিতে আপডেট
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

