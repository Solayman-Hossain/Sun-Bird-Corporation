'use client';

import React from 'react';
import './ErpPortalModal.css';
import { X, Lock, ShieldCheck, Database, FileSpreadsheet, Layers, Boxes, ArrowUpRight } from 'lucide-react';

interface ErpPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ErpPortalModal({ isOpen, onClose }: ErpPortalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                সান বার্ড কর্পোরেশন — ERP Admin & Accounting Console
              </h2>
              <p className="text-[11px] text-slate-400">
                Enterprise Cloud ERP • NBR Mushak-6.3 & General Ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1 text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>একীভূত সিস্টেম (Unified Modular Monolith):</span>
            </div>
            <p className="text-emerald-800">
              ইকমার্স স্টোরফ্রন্টে হওয়া প্রতিটি সেলস ট্রানজ্যাকশন সরাসরি এই ইআরপি কনসোলের 
              <strong> লেজার ভাউচার (Journal Entry)</strong> এবং <strong>সেন্ট্রাল ডিপো স্টক</strong>-এ 
              রিয়েল-টাইম অটোমেটিক সিঙ্ক হচ্ছে।
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-slate-500 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-blue-600" />
                <span>সেন্ট্রাল ওয়্যারহাউজ</span>
              </div>
              <div className="text-sm font-bold text-slate-900">তেজগাঁও ডিপো (WH-DAC)</div>
              <div className="text-[10px] text-emerald-600 font-medium">১০টি প্রাথমিক মেডিকেল SKU সক্রিয়</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-slate-500 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                <span>অ্যাকাউন্টিং স্ট্যান্ডার্ড</span>
              </div>
              <div className="text-sm font-bold text-slate-900">ডাবল-এন্ট্রি লেজার</div>
              <div className="text-[10px] text-purple-600 font-medium">৩৫টি চার্ট অব অ্যাকাউন্টস (1010-6510)</div>
            </div>
          </div>

          {/* ERP Core Modules Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ইআরপি কোর অপারেশন মডিউল:
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-800">ইমপোর্ট এলসি ও ল্যান্ডেড কস্ট ইঞ্জিন</div>
                    <div className="text-[11px] text-slate-500">আমদানি খরচ, কাস্টমস ডিউটি ও প্রকৃত ক্রয়মূল্য (COGS) নির্ধারণ</div>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  Phase 3
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold text-slate-800">ইনভেন্টরি ও FEFO ব্যাচ ট্র্যাকিং</div>
                    <div className="text-[11px] text-slate-500">মেয়াদোত্তীর্ণ ব্যাচ কন্ট্রোল ও মাল্টি-UOM (কার্টুন → পিস) কনভার্সন</div>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  Phase 2
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-bold text-slate-800">জেনারেল লেজার ও লাভ-ক্ষতি স্টেটমেন্ট</div>
                    <div className="text-[11px] text-slate-500">ব্যালেন্স শিট, ট্রায়াল ব্যালেন্স এবং মূসক-৬.৩ বিক্রয় বই</div>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  Phase 5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">সুপার অ্যাডমিন ও ডিরেক্টর একাউন্ট সুরক্ষিত</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

