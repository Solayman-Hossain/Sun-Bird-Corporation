'use client';

import React from 'react';
import Link from 'next/link';
import './HeroBanner.css';
import {
  ShieldCheck,
  Heart,
  Star,
  ArrowRight,
  Sparkles,
  Building2,
  Award,
  CheckCircle2,
} from 'lucide-react';

export function HeroBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 pt-6 pb-10">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#f5ede4] via-[#f7f1e9] to-[#faf5ee] rounded-3xl border border-[#eae5df] p-8 md:p-14 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overline Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xs border border-[#eae5df] text-[#1e3932] text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#c89348]" />
              <span className="tracking-wide">Precision Healthcare Everyday</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a1a] tracking-tight leading-[1.15] font-serif">
              Equipping Healers,{' '}
              <span className="text-[#1e3932] relative inline-block">
                Protecting Lives
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#e6b980]/30 -z-1 rounded-sm" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Directly imported DGDA-certified hospital equipment, diagnostic devices, and surgical consumables for clinics and homes across Bangladesh with NBR Mushak-6.3 tax compliance.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#products"
                className="px-6 py-3.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-medium text-sm rounded-full shadow-md shadow-[#1e3932]/25 transition-all inline-flex items-center gap-2 group cursor-pointer"
              >
                <span>Shop Equipment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="tel:+8801711000000"
                className="px-6 py-3.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 border border-[#eae5df] font-medium text-sm rounded-full transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#1e3932]" />
                <span>Institutional Tenders / B2B</span>
              </a>
            </div>

            {/* Trust Micro-Metrics */}
            <div className="pt-4 border-t border-[#eae5df]/70 flex flex-wrap items-center gap-6 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>100% DGDA Certified</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                </div>
                <span>Curated Medical Grade</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                </div>
                <span>Trusted by 500+ Hospitals</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column (Lifestyle Clinical Showcase) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Background Decorative Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#c89348]/20 to-emerald-500/10 rounded-3xl blur-2xl -z-1" />

            <div className="relative w-full max-w-md bg-white rounded-2xl p-6 border border-[#eae5df] shadow-lg overflow-hidden group">
              {/* Product Hero Mockup Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#faf8f5] p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                  <img
                    src="/images/products/bp-machine.svg"
                    alt="Digital BP Monitor"
                    className="w-24 h-24 object-contain group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[11px] font-semibold text-slate-800 mt-1">Digital BP Monitor</span>
                  <span className="text-[10px] text-emerald-700 font-bold">৳2,750</span>
                </div>

                <div className="bg-[#faf8f5] p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                  <img
                    src="/images/products/patient-monitor.svg"
                    alt="Patient Monitor"
                    className="w-24 h-24 object-contain group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[11px] font-semibold text-slate-800 mt-1">12" Patient Monitor</span>
                  <span className="text-[10px] text-emerald-700 font-bold">৳48,000</span>
                </div>
              </div>

              {/* Floating Quality Badge Overlay */}
              <div className="bg-[#1e3932] text-white p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#2d5248] flex items-center justify-center text-[#e6b980]">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">Certified Quality</div>
                    <div className="text-[10px] text-slate-300">Fast 24-48h Delivery across BD</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e6b980] text-slate-900">
                    NBR 15% VAT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
