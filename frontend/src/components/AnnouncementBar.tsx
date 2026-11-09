'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './AnnouncementBar.css';
import { Truck, ShieldCheck, Gift, PhoneCall, X } from 'lucide-react';

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('sunbird_announcement_dismissed');
      if (dismissed === 'true') {
        setIsVisible(false);
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('sunbird_announcement_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-[#1e3932] text-white text-xs font-medium border-b border-[#2d5248] relative z-50">
      <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between gap-4">
        {/* Left message: Free Shipping */}
        <div className="flex items-center gap-2 text-slate-100">
          <Truck className="w-3.5 h-3.5 text-[#e6b980] shrink-0" />
          <span className="truncate">
            Free shipping on orders over <strong className="text-[#e6b980] font-semibold">৳5,000</strong> across 64 districts
          </span>
        </div>

        {/* Center message: DGDA Certification & Warranty (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-2 text-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>100% DGDA Approved & 1–3 Years Official Warranty</span>
        </div>

        {/* Right message: Corporate & Hotline */}
        <div className="flex items-center gap-4 text-slate-200 text-[11px] sm:text-xs">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <Gift className="w-3.5 h-3.5 text-[#e6b980] shrink-0" />
            <span>Corporate Quotation & NBR Mushak-6.3</span>
          </div>

          <span className="hidden sm:inline text-emerald-700">|</span>

          <a
            href="tel:+8801711000000"
            className="flex items-center gap-1.5 text-[#e6b980] hover:text-white transition-colors font-medium"
            title="Call Sun Bird Corporation 24/7 Hotline"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#e6b980]" />
            <span className="whitespace-nowrap">Hotline: +880 1711-000000</span>
          </a>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="text-slate-400 hover:text-white transition-colors p-1 rounded -mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

