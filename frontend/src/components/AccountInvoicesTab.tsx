'use client';

import React, { useState, useMemo } from 'react';
import './AccountInvoicesTab.css';
import {
  FileText,
  Printer,
  Download,
  Eye,
  Search,
  Calendar,
  Building2,
  ShieldCheck,
  Receipt,
  X,
  ExternalLink,
} from 'lucide-react';
import { Challan } from '../types';

interface InvoiceRecord {
  id: string;
  orderNumber: string;
  mushakSerial: string;
  date: string;
  year: string;
  month: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  buyerBin?: string;
  itemsCount: number;
  subtotal: number;
  vatAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  status: 'PAID' | 'COD_SETTLED';
  items: {
    sku: string;
    name: string;
    uom: string;
    hsCode: string;
    quantity: number;
    unitPrice: number;
    vatAmount: number;
    total: number;
  }[];
}

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'INV-2026-9021',
    orderNumber: 'SBC-ORD-2026-9021',
    mushakSerial: 'CH-2026-9021',
    date: '০৩ নভেম্বর ২০২৬',
    year: '2026',
    month: '11',
    customerName: 'ডাঃ মো: রফিকুল ইসলাম',
    customerPhone: '01711-000000',
    customerAddress: 'প্লট ১২, রোড ৪, ব্লক ডি, ধানমন্ডি, ঢাকা-১২০৫',
    buyerBin: '001293847-0101',
    itemsCount: 4,
    subtotal: 15450,
    vatAmount: 2318,
    shippingFee: 0,
    totalAmount: 17768,
    paymentMethod: 'ONLINE_SSLCOMMERZ',
    status: 'PAID',
    items: [
      {
        sku: 'SBC-NEB-01',
        name: 'Professional Compressor Nebulizer System',
        uom: 'SET',
        hsCode: '9018.90.00',
        quantity: 2,
        unitPrice: 3850,
        vatAmount: 1155,
        total: 7700,
      },
      {
        sku: 'SBC-CAN-20G',
        name: 'Sterile IV Cannula 20G with Injection Port',
        uom: 'BOX',
        hsCode: '9018.39.00',
        quantity: 5,
        unitPrice: 1550,
        vatAmount: 1163,
        total: 7750,
      },
    ],
  },
  {
    id: 'INV-2026-8720',
    orderNumber: 'SBC-ORD-2026-8720',
    mushakSerial: 'CH-2026-8720',
    date: '২৮ অক্টোবর ২০২৬',
    year: '2026',
    month: '10',
    customerName: 'ডাঃ মো: রফিকুল ইসলাম',
    customerPhone: '01711-000000',
    customerAddress: 'প্লট ১২, রোড ৪, ব্লক ডি, ধানমন্ডি, ঢাকা-১২০৫',
    buyerBin: '001293847-0101',
    itemsCount: 2,
    subtotal: 6608,
    vatAmount: 992,
    shippingFee: 60,
    totalAmount: 7660,
    paymentMethod: 'COD',
    status: 'COD_SETTLED',
    items: [
      {
        sku: 'SBC-BPM-DIG',
        name: 'Digital Upper Arm Blood Pressure Monitor',
        uom: 'PCS',
        hsCode: '9018.90.00',
        quantity: 2,
        unitPrice: 2850,
        vatAmount: 855,
        total: 5700,
      },
      {
        sku: 'SBC-THM-IR1',
        name: 'Non-Contact Infrared Forehead Thermometer',
        uom: 'PCS',
        hsCode: '9025.19.00',
        quantity: 1,
        unitPrice: 908,
        vatAmount: 137,
        total: 908,
      },
    ],
  },
  {
    id: 'INV-2026-8104',
    orderNumber: 'SBC-ORD-2026-8104',
    mushakSerial: 'CH-2026-8104',
    date: '১৫ অক্টোবর ২০২৬',
    year: '2026',
    month: '10',
    customerName: 'ডাঃ মো: রফিকুল ইসলাম',
    customerPhone: '01711-000000',
    customerAddress: 'প্লট ১২, রোড ৪, ব্লক ডি, ধানমন্ডি, ঢাকা-১২০৫',
    buyerBin: '001293847-0101',
    itemsCount: 1,
    subtotal: 3304,
    vatAmount: 496,
    shippingFee: 60,
    totalAmount: 3860,
    paymentMethod: 'COD',
    status: 'COD_SETTLED',
    items: [
      {
        sku: 'SBC-OXI-50D',
        name: 'Fingertip Pulse Oximeter with OLED Display',
        uom: 'PCS',
        hsCode: '9018.19.00',
        quantity: 2,
        unitPrice: 1652,
        vatAmount: 496,
        total: 3304,
      },
    ],
  },
];

export function AccountInvoicesTab() {
  const [invoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchYear = selectedYear === 'ALL' || inv.year === selectedYear;
      const matchMonth = selectedMonth === 'ALL' || inv.month === selectedMonth;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.mushakSerial.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q);

      return matchYear && matchMonth && matchSearch;
    });
  }, [invoices, selectedYear, selectedMonth, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="চালান নম্বর অথবা অর্ডার কোড খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-[#faf8f5] border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e3932]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1e3932]"
          >
            <option value="ALL">সকল বছর (All Years)</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1e3932]"
          >
            <option value="ALL">সকল মাস (All Months)</option>
            <option value="11">নভেম্বর</option>
            <option value="10">অক্টোবর</option>
            <option value="09">সেপ্টেম্বর</option>
            <option value="08">আগস্ট</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#1e3932]" />
            <h3 className="font-bold text-slate-900 text-sm">
              জাতীয় রাজস্ব বোর্ড (NBR) মূসক-৬.৩ কর চালান তালিকা
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {filteredInvoices.length}টি চালান সংরক্ষিত
          </span>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs">কোন কর চালান পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf8f5] text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">চালান নং (Mushak-6.3)</th>
                  <th className="p-3.5">অর্ডার কোড</th>
                  <th className="p-3.5">তারিখ</th>
                  <th className="p-3.5 text-center">আইটেম</th>
                  <th className="p-3.5 text-right">১৫% ভ্যাট</th>
                  <th className="p-3.5 text-right">সর্বমোট (BDT)</th>
                  <th className="p-3.5 text-center">স্ট্যাটাস</th>
                  <th className="p-3.5 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#1e3932]">
                      {inv.mushakSerial}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {inv.orderNumber}
                    </td>
                    <td className="p-3.5 text-slate-600">{inv.date}</td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {inv.itemsCount}
                    </td>
                    <td className="p-3.5 text-right font-mono text-[#1e3932] font-semibold">
                      ৳{inv.vatAmount.toLocaleString('en-US')}
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-slate-900">
                      ৳{inv.totalAmount.toLocaleString('en-US')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        পরিশোধিত
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewInvoice(inv)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#1e3932] hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="চালান দেখুন"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ভিউ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setViewInvoice(inv);
                            setTimeout(() => window.print(), 300);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="PDF / প্রিন্ট চালান"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mushak-6.3 Printable Modal Preview */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #account-mushak-print,
              #account-mushak-print * {
                visibility: visible;
              }
              #account-mushak-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
            {/* Header */}
            <div className="no-print p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-[#faf8f5] to-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#1e3932]" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  কর চালানপত্র (মূসক-৬.৩) প্রিভিউ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div
                id="account-mushak-print"
                className="border-2 border-slate-800 p-5 sm:p-7 rounded-xl bg-white text-slate-900 space-y-4"
              >
                {/* Government & NBR Header */}
                <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার | জাতীয় রাজস্ব বোর্ড
                  </p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 font-serif">
                    কর চালানপত্র (মূসক-৬.৩)
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    [মূল্য সংযোজন কর ও সম্পূরক শুল্ক বিধিমালা, ২০১৬ এর বিধি ৪০ এর উপ-বিধি (১) এর দফা (গ) দ্রষ্টব্য]
                  </p>
                </div>

                {/* Seller & Buyer Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      সরবরাহকারীর বিবরণ (Seller)
                    </p>
                    <p className="font-bold text-slate-950">সান বার্ড কর্পোরেশন (Sun Bird Corporation)</p>
                    <p className="font-mono"><strong>BIN:</strong> 002391029-0101</p>
                    <p><strong>ঠিকানা:</strong> হাউস #১৪, রোড #০৭, ব্লক #সি, বনানী / তেজগাঁও শিল্প এলাকা, ঢাকা-১২১৩</p>
                    <p className="text-[11px] text-slate-600"><strong>DGDA লাইসেন্স:</strong> DGDA-IMP-2024-8841</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <p className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      ক্রেতার বিবরণ (Buyer)
                    </p>
                    <p className="font-bold text-slate-950">{viewInvoice.customerName}</p>
                    <p className="font-mono"><strong>মোবাইল:</strong> {viewInvoice.customerPhone}</p>
                    <p><strong>ঠিকানা:</strong> {viewInvoice.customerAddress}</p>
                    <p className="font-mono"><strong>ক্রেতার BIN:</strong> {viewInvoice.buyerBin || 'প্রযোজ্য নয়'}</p>
                  </div>
                </div>

                {/* Invoice Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono">
                  <span><strong>চালান নং:</strong> {viewInvoice.mushakSerial}</span>
                  <span><strong>অর্ডার নং:</strong> #{viewInvoice.orderNumber}</span>
                  <span><strong>তারিখ:</strong> {viewInvoice.date}</span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                        <th className="p-2 border-r border-slate-300 text-center">ক্র. নং</th>
                        <th className="p-2 border-r border-slate-300">পণ্যের বিবরণ</th>
                        <th className="p-2 border-r border-slate-300 text-center">HS কোড</th>
                        <th className="p-2 border-r border-slate-300 text-center">পরিমাণ</th>
                        <th className="p-2 border-r border-slate-300 text-right">একক মূল্য</th>
                        <th className="p-2 border-r border-slate-300 text-right">ভ্যাট ১৫%</th>
                        <th className="p-2 text-right">মোট (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {viewInvoice.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-medium">
                            {it.name}
                            <span className="block text-[10px] text-slate-500 font-mono">SKU: {it.sku}</span>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono">{it.hsCode}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{it.quantity} {it.uom}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">৳{it.unitPrice.toLocaleString('en-US')}</td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-[#1e3932]">৳{it.vatAmount.toLocaleString('en-US')}</td>
                          <td className="p-2 text-right font-mono font-bold">৳{(it.total + it.vatAmount).toLocaleString('en-US')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financials */}
                <div className="flex justify-end pt-2">
                  <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span>সাবটোটাল:</span>
                      <strong>৳{viewInvoice.subtotal.toLocaleString('en-US')}</strong>
                    </div>
                    <div className="flex justify-between text-[#1e3932]">
                      <span>১৫% ভ্যাট:</span>
                      <strong>+ ৳{viewInvoice.vatAmount.toLocaleString('en-US')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>ডেলিভারি চার্জ:</span>
                      <strong>{viewInvoice.shippingFee === 0 ? 'ফ্রি' : `৳${viewInvoice.shippingFee}`}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-400 flex justify-between font-extrabold text-sm text-slate-950">
                      <span>সর্বমোট পরিশোধিত:</span>
                      <strong className="text-[#1e3932]">৳{viewInvoice.totalAmount.toLocaleString('en-US')}</strong>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="border-t border-dashed border-slate-400 pt-2">
                    <p className="font-semibold text-slate-700">গ্রহণকারীর স্বাক্ষর</p>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-2">
                    <p className="font-bold text-[#1e3932]">সান বার্ড কর্পোরেশন (ডিজিটাল প্রত্যয়ন)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="no-print p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 bg-[#1e3932] hover:bg-[#162f29] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#1e3932]/25"
              >
                <Printer className="w-4 h-4 text-[#e6b980]" />
                <span>চালান প্রিন্ট / PDF ডাউনলোড করুন</span>
              </button>
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

