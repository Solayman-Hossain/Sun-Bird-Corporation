'use client';

import React from 'react';
import Link from 'next/link';
import './OrderSuccessModal.css';
import {
  CheckCircle2,
  Printer,
  Truck,
  ArrowRight,
  ShieldCheck,
  FileText,
  Building2,
  X,
  ExternalLink,
} from 'lucide-react';
import { OrderConfirmation } from '../types';

interface OrderSuccessModalProps {
  order: OrderConfirmation | null;
  onClose: () => void;
}

export function OrderSuccessModal({ order, onClose }: OrderSuccessModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const invoiceTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      {/* Print-only CSS rules to print the clean Mushak-6.3 document cleanly */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-mushak-challan,
          #printable-mushak-challan * {
            visibility: visible;
          }
          #printable-mushak-challan {
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
        {/* Top Action Header */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-[#faf8f5] to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Order Confirmed Successfully!
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Order: #{order.orderNumber} • Mushak-6.3: {order.challanNumber || 'CH-2026-AUTO'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close confirmation modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Status Alert (Screen only) */}
          <div className="no-print p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>ডেলিভারি ট্র্যাকিং কোড: <strong className="font-mono text-emerald-950">{order.trackingCode || 'ST-BD-982143'}</strong></span>
              </div>
              <p className="text-xs text-emerald-800">
                আনুমানিক ডেলিভারি সময়: <strong>{order.estimatedDelivery || '12–24 Hours'}</strong> ({order.district || 'Dhaka'})
              </p>
            </div>
            <Link
              href={`/track?id=${order.trackingCode || order.orderNumber}`}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shrink-0"
            >
              <span>লাইভ ট্র্যাক করুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Printable NBR Mushak-6.3 Challan Document */}
          <div
            id="printable-mushak-challan"
            className="border-2 border-slate-800 p-5 sm:p-7 rounded-xl bg-white text-slate-900 font-sans space-y-4"
          >
            {/* Government & NBR Official Header */}
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

            {/* Seller & Buyer 2-Column Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              {/* Registered Seller Details */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Building2 className="w-4 h-4 text-[#1e3932]" />
                  <span>সরবরাহকারীর বিবরণ (Seller)</span>
                </div>
                <p className="font-bold text-slate-950">সান বার্ড কর্পোরেশন (Sun Bird Corporation)</p>
                <p className="font-mono">
                  <strong>BIN:</strong> 002391029-0101
                </p>
                <p>
                  <strong>ঠিকানা:</strong> হাউস #১৪, রোড #০৭, ব্লক #সি, বনানী / তেজগাঁও শিল্প এলাকা, ঢাকা-১২১৩
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>DGDA লাইসেন্স:</strong> DGDA-IMP-2024-8841
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>হটলাইন:</strong> +880 1800 000000
                </p>
              </div>

              {/* Buyer / Customer Details */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <FileText className="w-4 h-4 text-[#1e3932]" />
                  <span>ক্রেতার বিবরণ (Buyer)</span>
                </div>
                <p className="font-bold text-slate-950">{order.customerName}</p>
                <p className="font-mono">
                  <strong>মোবাইল:</strong> {order.customerMobile}
                </p>
                {order.customerEmail && (
                  <p>
                    <strong>ইমেইল:</strong> {order.customerEmail}
                  </p>
                )}
                <p>
                  <strong>ঠিকানা:</strong> {order.deliveryAddress || 'Dhaka, Bangladesh'}
                </p>
                <p className="font-mono">
                  <strong>ক্রেতার BIN/TIN:</strong> {order.buyerBin || 'প্রযোজ্য নয় (ব্যক্তিগত ভোক্তা)'}
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  <strong>চালান ইস্যুর তারিখ ও সময়:</strong> {invoiceDate}, {invoiceTime}
                </p>
              </div>
            </div>

            {/* Challan Meta Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono">
              <span><strong>চালান নং:</strong> {order.challanNumber || `CH-${order.orderNumber}`}</span>
              <span><strong>অর্ডার রেফারেন্স:</strong> #{order.orderNumber}</span>
              <span><strong>পেমেন্ট মাধ্যম:</strong> {order.paymentMethod}</span>
              <span><strong>গন্তব্য জেলা:</strong> {order.district || 'Dhaka'}</span>
            </div>

            {/* Itemized Tax Invoice Table */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 text-center">ক্র. নং</th>
                    <th className="p-2 border-r border-slate-300">পণ্য ও স্পেসিফিকেশন</th>
                    <th className="p-2 border-r border-slate-300 text-center">HS কোড</th>
                    <th className="p-2 border-r border-slate-300 text-center">একক</th>
                    <th className="p-2 border-r border-slate-300 text-center">পরিমাণ</th>
                    <th className="p-2 border-r border-slate-300 text-right">একক মূল্য (৳)</th>
                    <th className="p-2 border-r border-slate-300 text-right">মোট মূল্য (৳)</th>
                    <th className="p-2 border-r border-slate-300 text-right">ভ্যাট ১৫% (৳)</th>
                    <th className="p-2 text-right">সর্বমোট (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const itemTotal = item.totalPrice || item.unitPrice * item.quantity;
                      const vat = item.vatAmount || Math.round(itemTotal * 0.15);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center font-mono">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-medium">
                            <div>{item.productName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              SKU: {item.sku}
                            </div>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-[11px]">
                            {item.hsCode || '9018.90.00'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center uppercase font-mono text-[11px]">
                            {item.uom || 'PCS'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">
                            {item.quantity}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">
                            {item.unitPrice.toLocaleString('en-US')}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold">
                            {itemTotal.toLocaleString('en-US')}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono text-[#1e3932]">
                            {vat.toLocaleString('en-US')}
                          </td>
                          <td className="p-2 text-right font-mono font-bold">
                            {(itemTotal + vat).toLocaleString('en-US')}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-slate-500">
                        আইটেম বিবরণ পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
              <div className="text-xs text-slate-600 max-w-sm space-y-1">
                <p>• এই চালানটি মূল্য সংযোজন কর ও সম্পূরক শুল্ক আইন, ২০১২ এর অধীনে নিবন্ধিত ও কম্পিউটার জেনারেটেড।</p>
                <p>• চালান সংক্রান্ত যেকোনো তথ্যের জন্য সান বার্ড কাস্টমার সাপোর্ট বা ট্যাক্স হেল্পডেস্কে যোগাযোগ করুন।</p>
              </div>

              <div className="w-full sm:w-72 space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-300 font-mono">
                <div className="flex justify-between">
                  <span>পণ্য সাবটোটাল:</span>
                  <span className="font-bold">
                    ৳{(order.subtotal || Math.round(order.totalAmount / 1.15)).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between text-[#1e3932]">
                  <span>মোট ভ্যাট (১৫%):</span>
                  <span className="font-bold">
                    + ৳{(order.vatAmount || Math.round((order.subtotal || order.totalAmount) * 0.15)).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-bold">
                    {order.shippingFee === 0 || !order.shippingFee ? '৳০ (Free)' : `৳${order.shippingFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-400 flex justify-between text-sm font-extrabold text-slate-950">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-[#1e3932] text-base">
                    ৳{order.totalAmount.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-dashed border-slate-400 pt-2">
                <p className="font-semibold text-slate-700">গ্রহণকারীর স্বাক্ষর ও তারিখ</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Received in good order & condition</p>
              </div>
              <div className="border-t border-dashed border-slate-400 pt-2">
                <p className="font-bold text-[#1e3932]">সান বার্ড কর্পোরেশন এর পক্ষে</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  কর্তৃপক্ষ কর্তৃক অনুমোদিত ডিজিটাল স্বাক্ষর
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Screen only) */}
        <div className="no-print p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#1e3932]" />
            <span>মূসক-৬.৩ চালান প্রিন্ট করুন (Print Challan)</span>
          </button>

          <Link
            href={`/track?id=${order.trackingCode || order.orderNumber}`}
            className="flex-1 py-3 bg-[#c89348] hover:bg-[#b07f3c] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#c89348]/20"
          >
            <Truck className="w-4 h-4" />
            <span>অর্ডার লাইভ ট্র্যাক করুন</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[#1e3932] hover:bg-[#162f29] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#1e3932]/25"
          >
            <span>আরও কেনাকাটা করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
