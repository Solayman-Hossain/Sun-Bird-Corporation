'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, PhoneCall, Lock, Search, HeartPulse, Truck, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onSearch?: (q: string) => void;
  showSearch?: boolean;
  onOpenErp?: () => void;
}

export function Navbar({ onSearch, showSearch = true, onOpenErp }: NavbarProps) {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Statutory & Hotline Notification Bar */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-[11px] sm:text-xs">
              NBR Mushak-6.3 Statutory VAT Compliant • Genuine Imported Medical & Diagnostic Consumables
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a
              href="tel:01811000001"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
              <span>Hotline: 01811-000001</span>
            </a>
            <span className="text-emerald-800">|</span>
            <Link
              href="/track"
              className="flex items-center gap-1 text-emerald-300 hover:text-white font-medium"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>অর্ডার ট্র্যাকিং</span>
            </Link>
            <span className="text-emerald-800">|</span>
            <Link
              href="/erp"
              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>ERP Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">
                SUN BIRD
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold tracking-wide uppercase">
                Healthcare
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Enterprise Medical Equipment & Diagnostics
            </p>
          </div>
        </Link>

        {/* Search Bar */}
        {showSearch && onSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Cannula, BP Machine, ECG Lead, Glucose, Masks..."
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Right Navigation & Cart */}
        <div className="flex items-center gap-3">
          <Link
            href="/track"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg border border-slate-200 font-medium transition-colors"
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>অর্ডার ট্র্যাক</span>
          </Link>

          <Link
            href="/account"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg border border-slate-200 font-medium transition-colors"
          >
            <User className="w-4 h-4 text-slate-600" />
            <span>একাউন্ট</span>
          </Link>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg font-medium text-sm transition-all shadow-sm shadow-emerald-600/30 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">কার্ট</span>
            {totalItems > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1 bg-amber-400 text-slate-900 font-bold text-xs rounded-full">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
