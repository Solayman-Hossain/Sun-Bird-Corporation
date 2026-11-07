'use client';

import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export function CartDrawer({ onProceedToCheckout }: CartDrawerProps) {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    vatAmount,
    shippingFee,
    grandTotal,
    shippingDistrict,
    setShippingDistrict,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                শপিং কার্ট ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-slate-600 font-medium">আপনার কার্ট খালি আছে</p>
                <p className="text-xs text-slate-400">
                  স্টোরফ্রন্ট থেকে আপনার প্রয়োজনীয় পণ্য কার্টে যোগ করুন।
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  পণ্য ব্রাউজ করুন
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.sku}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                        {item.product.nameEn}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.sku)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      SKU: {item.product.sku} | {item.product.brand}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.sku, item.quantity - 1)
                          }
                          className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3 py-0.5 text-xs font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.sku, item.quantity + 1)
                          }
                          className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-sm font-bold text-slate-900">
                        ৳ {(item.product.retailPrice * item.quantity).toLocaleString('en-US')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Delivery & Summary Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50/80 space-y-3.5">
              {/* Delivery District Toggle */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>ডেলিভারি এলাকা:</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShippingDistrict('Dhaka')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      shippingDistrict === 'Dhaka'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ঢাকার ভিতরে (৳৬০)
                  </button>
                  <button
                    onClick={() => setShippingDistrict('Outside Dhaka')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      shippingDistrict !== 'Dhaka'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ঢাকার বাইরে (৳১২০)
                  </button>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>পণ্য সাবটোটাল:</span>
                  <span className="font-semibold text-slate-800">
                    ৳ {subtotal.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>এনবিআর মূসক-৬.৩ ভ্যাট (১৫%):</span>
                  <span className="font-semibold text-emerald-700">
                    + ৳ {vatAmount.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>কুরিয়ার ডেলিভারি চার্জ:</span>
                  <span className="font-semibold text-slate-800">
                    {shippingFee === 0 ? 'ফ্রি' : `৳ ${shippingFee}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>সর্বমোট প্রদেয় (Grand Total):</span>
                  <span className="text-emerald-700 text-base">
                    ৳ {grandTotal.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>অর্ডার সম্পন্ন করতে এগিয়ে যান</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ক্যাশ অন ডেলিভারি (COD) বা অনলাইন পেমেন্ট প্রযোজ্য</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

