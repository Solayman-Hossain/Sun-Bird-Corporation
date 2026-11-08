'use client';

import React from 'react';
import Link from 'next/link';
import './SplitPromoBanners.css';
import { ArrowRight, Building2, Stethoscope, ShieldCheck } from 'lucide-react';

interface SplitPromoBannersProps {
  onSelectCategory?: (category: string) => void;
}

export function SplitPromoBanners({ onSelectCategory }: SplitPromoBannersProps) {
  return (
    <section className="my-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banner 1: Institutional Hospital Supply */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]/50 border border-[#c8e6c9] p-8 sm:p-10 flex flex-col justify-between group shadow-xs">
          {/* Subtle Graphic Watermark */}
          <div className="absolute -right-6 -bottom-6 w-48 h-48 opacity-15 pointer-events-none text-emerald-800">
            <Building2 className="w-full h-full" />
          </div>

          <div className="space-y-4 max-w-md relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-200/80 text-emerald-900 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Institutional B2B Supply</span>
            </span>

            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif leading-tight">
              Equip Your Hospital & Clinic
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Bulk supply of 5-function ICU beds, patient monitors, autoclave sterilizers, and diagnostic tools with NBR Mushak-6.3 tax challan and official biomedical warranty.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <a
              href="tel:+8801711000000"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-medium text-xs sm:text-sm rounded-full shadow-md shadow-[#1e3932]/20 transition-all group-hover:gap-3 cursor-pointer"
            >
              <span>Request Institutional Quote</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Banner 2: Home Health Diagnostics */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#fbe9e7] to-[#ffccbc]/50 border border-[#ffccbc] p-8 sm:p-10 flex flex-col justify-between group shadow-xs">
          {/* Subtle Graphic Watermark */}
          <div className="absolute -right-6 -bottom-6 w-48 h-48 opacity-15 pointer-events-none text-rose-800">
            <Stethoscope className="w-full h-full" />
          </div>

          <div className="space-y-4 max-w-md relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-200/80 text-rose-900 text-[11px] font-bold uppercase tracking-wider">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Personal Diagnostics</span>
            </span>

            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif leading-tight">
              Precision Diagnostics at Home
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Certified digital blood pressure monitors, glucose meters, pulse oximeters, and compressor nebulizers for accurate family wellness and home care.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <button
              onClick={() => onSelectCategory?.('Home Diagnostics')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-medium text-xs sm:text-sm rounded-full shadow-md shadow-[#1e3932]/20 transition-all group-hover:gap-3 cursor-pointer"
            >
              <span>Shop Home Care</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

