'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, CreditCard, Banknote, Loader2, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createCheckout } from '../lib/api';
import { OrderConfirmation } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: OrderConfirmation) => void;
}

const BD_DISTRICTS = [
  'Dhaka', 'Chittagong', 'Gazipur', 'Narayanganj', 'Sylhet', 'Rajshahi',
  'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Bogra', 'Jessore', 'Cox\'s Bazar'
];

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { items, subtotal, vatAmount, shippingFee, grandTotal, clearCart, shippingDistrict, setShippingDistrict } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE_SSLCOMMERZ'>('COD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!customerName.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
      return;
    }
    const cleanMobile = customerMobile.trim().replace(/[- ]/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanMobile)) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (যেমন: 01711XXXXXX)');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg('অনুগ্রহ করে পূর্ণ ডেলিভারি ঠিকানা লিখুন।');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerMobile: cleanMobile,
        customerEmail: customerEmail.trim() || undefined,
        deliveryAddress: deliveryAddress.trim(),
        district: shippingDistrict,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.product._id,
          sku: i.product.sku,
          productName: i.product.nameEn,
          quantity: i.quantity,
          unitPrice: i.product.retailPrice,
          uom: i.product.baseUom,
        })),
        shippingFee,
        notes: notes.trim() || undefined,
      };

      const res = await createCheckout(payload);

      if (res.success && res.data) {
        clearCart();
        onSuccess(res.data);
      } else {
        setErrorMsg(res.error || 'অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'নেটওয়ার্ক এরর। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900">
              চেকআউট ও ডেলিভারি তথ্য (Checkout)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ১. গ্রাহকের তথ্য
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    আপনার নাম / প্রতিষ্ঠানের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ড. রফিকুল ইসলাম / সেন্ট্রাল ডায়াগনস্টিক"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর (SMS ট্র্যাকিংয়ের জন্য) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01711000000"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ইমেইল ঠিকানা (ঐচ্ছিক)
                </label>
                <input
                  type="email"
                  placeholder="invoice@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ২. ডেলিভারি ঠিকানা ও জেলা
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    জেলা (District) *
                  </label>
                  <select
                    value={shippingDistrict}
                    onChange={(e) => setShippingDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 'Dhaka' ? '(ডেলিভারি ৳৬০)' : '(ডেলিভারি ৳১২০)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা/হাসপাতাল) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="যেমন: ফ্ল্যাট ৩বি, বাড়ি ১২, রোড ৪, ধানমন্ডি, ঢাকা"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                ৩. মূল্য পরিশোধ পদ্ধতি (Payment Method)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">
                      ক্যাশ অন ডেলিভারি (COD)
                    </div>
                    <div className="text-xs text-slate-500">
                      পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-emerald-600"
                  />
                </label>

                <label
                  onClick={() => setPaymentMethod('ONLINE_SSLCOMMERZ')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'ONLINE_SSLCOMMERZ'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-900">
                      অনলাইন পেমেন্ট (SSLCOMMERZ)
                    </div>
                    <div className="text-xs text-slate-500">
                      bKash, Nagad, Visa, Mastercard
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'ONLINE_SSLCOMMERZ'}
                    onChange={() => setPaymentMethod('ONLINE_SSLCOMMERZ')}
                    className="accent-emerald-600"
                  />
                </label>
              </div>
            </div>

            {/* Order Review Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 mb-2">অর্ডার সামারি ({items.length} আইটেম):</div>
              <div className="flex justify-between text-slate-600">
                <span>পণ্য মূল্য:</span>
                <span>৳ {subtotal.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>এনবিআর মূসক-৬.৩ ভ্যাট (১৫%):</span>
                <span>৳ {vatAmount.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ডেলিভারি চার্জ:</span>
                <span>{shippingFee === 0 ? 'ফ্রি' : `৳ ${shippingFee}`}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>সর্বমোট পরিশোধযোগ্য:</span>
                <span className="text-emerald-700 text-base">
                  ৳ {grandTotal.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>অর্ডারের পর অটোমেটিক মূসক-৬.৩ ও চালান তৈরি হবে</span>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>অর্ডার প্রসেস হচ্ছে...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>অর্ডার নিশ্চিত করুন (৳ {grandTotal.toLocaleString('en-US')})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

