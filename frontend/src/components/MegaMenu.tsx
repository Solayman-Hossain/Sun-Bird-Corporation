'use client';

import React from 'react';
import Link from 'next/link';
import './MegaMenu.css';
import {
  Activity,
  HeartPulse,
  Stethoscope,
  Wind,
  Bed,
  Sparkles,
  PhoneCall,
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  Download,
} from 'lucide-react';

export interface MegaCategoryColumn {
  title: string;
  categoryKey: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { name: string; sku?: string; tag?: string }[];
}

export const MEGA_MENU_COLUMNS: MegaCategoryColumn[] = [
  {
    title: 'হোম ডায়াগনস্টিকস ও প্রাইমারি কেয়ার',
    categoryKey: 'Home Diagnostics',
    icon: Stethoscope,
    items: [
      { name: 'ডিজিটাল ব্লাড প্রেসার মনিটর (BP)', tag: 'Best Seller' },
      { name: 'ব্লাড গ্লুকোজ মিটার ও স্ট্রিপস' },
      { name: 'আল্ট্রাসনিক মেশ নেবুলাইজার', tag: 'DGDA Approved' },
      { name: 'ইনফ্রারেড ফোরহেড থার্মোমিটার' },
      { name: 'ফিঙ্গারটিপ পালস অক্সিমিটার' },
    ],
  },
  {
    title: 'সার্জিক্যাল ও ডিসপোজেবল কনজিউমেবলস',
    categoryKey: 'Surgical Consumables',
    icon: Activity,
    items: [
      { name: 'আইভি ক্যানুলা (18G, 20G, 22G, 24G)', tag: 'Hospital Bulk' },
      { name: 'ডিসপোজেবল স্টেরাইল সিরিঞ্জ (3ml, 5ml, 10ml)' },
      { name: 'সিলিকন ফোলিস ক্যাথেটার ও ইউরিন ব্যাগ' },
      { name: 'সার্জিক্যাল ল্যাটেক্স গ্লাভস (পাউডার ফ্রি)' },
      { name: 'ইনফিউশন ও ব্লাড ট্রান্সফিউশন সেট' },
    ],
  },
  {
    title: 'আইসিইউ মনিটরিং ও হাসপাতাল ইকুইপমেন্ট',
    categoryKey: 'Monitoring',
    icon: HeartPulse,
    items: [
      { name: 'মাল্টি-প্যারামিটার পেশেন্ট মনিটর (12.1")', tag: '2 Yrs Warranty' },
      { name: '১২-চ্যানেল ডিজিটাল ইসিজি মেশিন' },
      { name: 'মাইক্রো সিরিঞ্জ ইনফিউশন পাম্প' },
      { name: 'ইলেকট্রিক ৫-ফাংশন আইসিইউ বেড' },
      { name: 'মেডিকেল অক্সিজেন কনসেন্ট্রেটর (5L & 10L)', tag: 'Medical Grade' },
    ],
  },
];

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: string) => void;
}

export function MegaMenu({ isOpen, onClose, onSelectCategory }: MegaMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-white border-b border-[#eae5df] shadow-2xl z-40 transition-all duration-200 animate-in fade-in slide-in-from-top-2"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Columns 1 to 3: Category Lists */}
          {MEGA_MENU_COLUMNS.map((col) => {
            const IconComponent = col.icon;
            return (
              <div key={col.categoryKey} className="space-y-4">
                {/* Column Header */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory?.(col.categoryKey);
                    onClose();
                  }}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1e3932]/10 text-[#1e3932] flex items-center justify-center group-hover:bg-[#1e3932] group-hover:text-white transition-colors">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#1e3932] transition-colors font-serif">
                    {col.title}
                  </h4>
                </button>

                {/* Sub items */}
                <ul className="space-y-2 text-xs text-slate-600 pl-1">
                  {col.items.map((item, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCategory?.(col.categoryKey);
                          onClose();
                        }}
                        className="w-full text-left py-1 hover:text-[#1e3932] flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <span className="group-hover:translate-x-1 transition-transform">
                          {item.name}
                        </span>
                        {item.tag && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                              item.tag.includes('Warranty')
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : item.tag.includes('DGDA')
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.tag}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Direct category link */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory?.(col.categoryKey);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1e3932] hover:text-[#162f29] pt-1 cursor-pointer group"
                >
                  <span>সব পণ্য দেখুন</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}

          {/* Column 4: Institutional & B2B Procurement Card */}
          <div className="bg-gradient-to-br from-[#1e3932] to-[#162f29] text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#c89348]/20 border border-[#c89348]/40 text-[#e6b980] text-[10px] font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>DGDA & NBR Certified Importer</span>
              </div>

              <h4 className="text-base font-bold font-serif leading-snug">
                হাসপাতাল ও ক্লিনিক্যাল প্রকিউরমেন্ট কোটেশন
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                সরাসরি আমদানিকারক মূল্য, মূসক-৬.৩ কর চালানপত্র এবং প্রাতিষ্ঠানিক ওয়ারেন্টি সুবিধায় বাল্ক অর্ডার করুন।
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 relative z-10">
              <a
                href="tel:+8801711000000"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#c89348] hover:bg-[#b5833c] text-slate-950 font-bold text-xs transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>+880 1711-000000</span>
              </a>

              <Link
                href="/track"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-center text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                <FileCheck2 className="w-3 h-3" />
                <span>অর্ডার ও ডেলিভারি স্ট্যাটাস ট্র্যাক করুন</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

