'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './CategoryNav.css';
import { usePathname } from 'next/navigation';
import {
  Lock,
  Truck,
  PhoneCall,
  X,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Stethoscope,
  Activity,
  Layers,
  Sparkles,
  Grid,
  Boxes,
} from 'lucide-react';
import { MegaMenu, MEGA_MENU_COLUMNS } from './MegaMenu';

interface CategoryNavProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const NAV_CATEGORIES = [
  { label: 'Home', href: '/', id: 'All' },
  { label: 'Shop', href: '/#products', id: 'Shop' },
  { label: 'New Arrivals', href: '/#new-arrivals', id: 'New' },
  { label: 'Best Sellers', href: '/#best-sellers', id: 'BestSellers' },
  { label: 'Home Diagnostics', href: '/#products', id: 'Home Diagnostics' },
  { label: 'Surgical Consumables', href: '/#products', id: 'Surgical Consumables' },
  { label: 'Patient Monitoring', href: '/#products', id: 'Monitoring' },
  { label: 'Respiratory Care', href: '/#products', id: 'Respiratory' },
  { label: 'Hospital Furniture', href: '/#products', id: 'Hospital Furniture' },
  { label: 'Deals & B2B', href: '/#b2b-deals', id: 'B2B' },
];

export function CategoryNav({
  activeCategory = 'All',
  onSelectCategory,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
}: CategoryNavProps) {
  const pathname = usePathname();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);

  return (
    <>
      {/* Secondary Sticky Bar for Desktop */}
      <nav className="hidden lg:block bg-white/95 backdrop-blur-md border-b border-[#eae5df] text-xs font-medium text-slate-700 sticky top-[61px] z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Mega Menu Toggle Button */}
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
            >
              <button
                type="button"
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className={`flex items-center gap-2 py-2.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
                  isMegaMenuOpen
                    ? 'bg-[#1e3932] text-white shadow-xs'
                    : 'bg-[#1e3932]/10 text-[#1e3932] hover:bg-[#1e3932]/15'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>সকল ক্যাটাগরি (Mega Menu)</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMegaMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Main Category Horizontal Links */}
            <div className="flex items-center gap-5 overflow-x-auto py-2.5 scrollbar-none">
              {NAV_CATEGORIES.map((cat) => {
                const isActive =
                  (pathname === '/' && activeCategory === cat.id) ||
                  (cat.id === 'All' && pathname === '/' && activeCategory === 'All');

                return (
                  <button
                    key={cat.label}
                    onClick={() => onSelectCategory?.(cat.id)}
                    className={`relative py-1 whitespace-nowrap transition-colors cursor-pointer group ${
                      isActive
                        ? 'text-[#1e3932] font-semibold'
                        : 'hover:text-[#1e3932]'
                    }`}
                  >
                    {cat.label}
                    <span
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e3932] transition-transform duration-200 rounded-full ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Utility Links (Track & ERP Portal) */}
          <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-slate-200 py-1.5">
            <Link
              href="/track"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                pathname === '/track'
                  ? 'bg-[#1e3932]/10 text-[#1e3932] font-semibold'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-[#1e3932]" />
              <span>Track Order</span>
            </Link>

            <Link
              href="/erp"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 font-semibold transition-all shadow-2xs"
            >
              <Boxes className="w-3 h-3 text-amber-700" />
              <span>ERP Portal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all shadow-2xs"
            >
              <ShieldCheck className="w-3 h-3 text-[#e6b980]" />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <MegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
          onSelectCategory={onSelectCategory}
        />
      </nav>

      {/* Mobile Drawer (Left Slide-Over with Mega Menu Accordions) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobileMenu}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Menu */}
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-4 bg-[#1e3932] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#e6b980]" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight">SUN BIRD CORP</h3>
                  <p className="text-[10px] text-slate-300">Hospital Equipment & Mega Catalog</p>
                </div>
              </div>
              <button
                onClick={onCloseMobileMenu}
                className="text-slate-300 hover:text-white p-1 rounded-md cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Links with Accordion */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                মেডিকেল ক্যাটাগরি ও সাব-ক্যাটাগরি
              </div>

              {/* Department Accordions */}
              {MEGA_MENU_COLUMNS.map((dept) => {
                const isExpanded = expandedMobileSection === dept.categoryKey;
                const IconComponent = dept.icon;

                return (
                  <div key={dept.categoryKey} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMobileSection(isExpanded ? null : dept.categoryKey)
                      }
                      className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-[#1e3932]" />
                        <span>{dept.title}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                        {dept.items.map((sub, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => {
                              onSelectCategory?.(dept.categoryKey);
                              onCloseMobileMenu?.();
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:text-[#1e3932] hover:bg-slate-50 rounded-lg flex items-center justify-between cursor-pointer"
                          >
                            <span>{sub.name}</span>
                            {sub.tag && (
                              <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-500">
                                {sub.tag}
                              </span>
                            )}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCategory?.(dept.categoryKey);
                            onCloseMobileMenu?.();
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-[#1e3932] hover:underline"
                        >
                          সম্পূর্ণ {dept.title} দেখুন →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <hr className="my-3 border-slate-100" />

              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                প্রধান মেনু ও লজিস্টিকস
              </div>

              {NAV_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => {
                    onSelectCategory?.(cat.id);
                    onCloseMobileMenu?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-[#1e3932]/10 text-[#1e3932] font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}

              <hr className="my-3 border-slate-100" />

              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                পোর্টাাল ও সার্ভিস
              </div>

              <Link
                href="/track"
                onClick={onCloseMobileMenu}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#1e3932]" />
                  <span>অর্ডার ট্র্যাকিং (Track Order)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/account"
                onClick={onCloseMobileMenu}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1e3932]" />
                  <span>কাস্টমার অ্যাকাউন্ট ও মূসক চালান</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/rma"
                onClick={onCloseMobileMenu}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#1e3932]" />
                  <span>আরএমএ ও ওয়ারেন্টি সার্ভিস</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/erp"
                onClick={onCloseMobileMenu}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 font-semibold text-xs"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-700" />
                  <span>এন্টারপ্রাইজ ইআরপি পোর্টাল</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </Link>

              <Link
                href="/admin"
                onClick={onCloseMobileMenu}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#e6b980]" />
                  <span>সুপার অ্যাডমিন কনসোল</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Drawer Footer Hotline */}
            <div className="p-4 bg-[#faf8f5] border-t border-[#eae5df] text-xs">
              <p className="text-slate-500 text-[11px] font-medium">বায়োমেডিকেল সাপোর্ট ২৪/৭ হটলাইন:</p>
              <a
                href="tel:+8801711000000"
                className="flex items-center gap-2 mt-1 font-bold text-[#1e3932] hover:underline"
              >
                <PhoneCall className="w-4 h-4 text-[#c89348]" />
                <span>+880 1711-000000</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
