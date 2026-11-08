'use client';

import React from 'react';
import './CartDrawer.css';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onProceedToCheckout?: () => void;
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
    freeShippingProgress,
  } = useCart();

  if (!isCartOpen) return null;

  const totalItemsCount = items.reduce((s, i) => s + i.quantity, 0);
  const remainingForFreeShipping = Math.max(0, 5000 - subtotal);
  const hasFreeShipping = subtotal >= 5000;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-[#faf8f5] to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#1e3932]/10 flex items-center justify-center text-[#1e3932]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  Your Shopping Cart
                </h2>
                <p className="text-xs text-slate-500">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              aria-label="Close cart drawer"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Meter */}
          <div className="px-5 py-3.5 bg-gradient-to-b from-[#f8f6f2] to-white border-b border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Truck className="w-4 h-4 text-[#1e3932]" />
                {hasFreeShipping ? (
                  <span className="font-bold text-[#1e3932] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    You unlocked FREE Delivery across Bangladesh!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-[#1e3932]">৳{remainingForFreeShipping.toLocaleString('en-US')}</strong> more for FREE Shipping!
                  </span>
                )}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {freeShippingProgress}%
              </span>
            </div>

            {/* Progress bar line */}
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  hasFreeShipping
                    ? 'bg-gradient-to-r from-emerald-500 to-[#1e3932]'
                    : 'bg-gradient-to-r from-[#c89348] to-[#1e3932]'
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>৳0</span>
              <span className="font-semibold text-slate-600">Threshold: ৳5,000</span>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-[#faf8f5] border border-[#eae5df] flex items-center justify-center mx-auto text-[#1e3932]">
                  <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Your cart is currently empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Explore our certified hospital equipment, diagnostic devices, and clinical supplies.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3932] text-white text-xs font-semibold rounded-full hover:bg-[#162f29] transition-all shadow-md shadow-[#1e3932]/20 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Explore Products</span>
                </button>
              </div>
            ) : (
              items.map((item) => {
                const price = item.product.price ?? item.product.retailPrice ?? 0;
                const mrp = item.product.mrp ?? 0;
                const itemTotal = price * item.quantity;
                const displayName = item.product.nameEn || item.product.name || item.product.sku;
                const imageSrc =
                  item.product.gallery?.[0] ||
                  item.product.imageUrl ||
                  item.product.image ||
                  '/placeholder-medical.jpg';

                return (
                  <div
                    key={item.product.sku}
                    className="p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-[#1e3932]/30 hover:shadow-xs transition-all flex gap-3"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-[#faf8f5] border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                      <img
                        src={imageSrc}
                        alt={displayName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Info & Quantity */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-[#1e3932]">
                            {displayName}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.sku)}
                            aria-label={`Remove ${displayName} from cart`}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>SKU: {item.product.sku}</span>
                          {item.product.brand && (
                            <>
                              <span>•</span>
                              <span>{item.product.brand}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.sku, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-200 active:bg-slate-300 cursor-pointer transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.sku, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-200 active:bg-slate-300 cursor-pointer transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#1e3932]">
                            ৳{itemTotal.toLocaleString('en-US')}
                          </div>
                          {mrp > price && (
                            <div className="text-[10px] text-slate-400 line-through">
                              ৳{(mrp * item.quantity).toLocaleString('en-US')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Summary Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-[#faf8f5]/90 space-y-3.5">
              {/* Delivery District Selector */}
              <div className="p-2.5 rounded-xl bg-white border border-[#eae5df] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Truck className="w-4 h-4 text-[#1e3932] shrink-0" />
                  <span>ডেলিভারি এলাকা:</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setShippingDistrict('Dhaka')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      shippingDistrict === 'Dhaka'
                        ? 'bg-[#1e3932] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ঢাকা (৳৬০)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingDistrict('Gazipur')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      shippingDistrict === 'Gazipur' || shippingDistrict === 'Narayanganj' || shippingDistrict === 'Savar'
                        ? 'bg-[#1e3932] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    উপশহর (৳১০০)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingDistrict('Chittagong')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      shippingDistrict !== 'Dhaka' && shippingDistrict !== 'Gazipur' && shippingDistrict !== 'Narayanganj' && shippingDistrict !== 'Savar'
                        ? 'bg-[#1e3932] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    অন্যান্য (৳১৫০)
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>পণ্য সাবটোটাল:</span>
                  <span className="font-semibold text-slate-800">
                    ৳{subtotal.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <span>এনবিআর মূসক-৬.৩ ভ্যাট (১৫%):</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 font-medium">
                      অন্তর্ভুক্ত
                    </span>
                  </span>
                  <span className="font-semibold text-[#1e3932]">
                    + ৳{vatAmount.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>কুরিয়ার ডেলিভারি চার্জ:</span>
                  <span className="font-semibold text-slate-800">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">ফ্রি (৳০)</span>
                    ) : (
                      `৳${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>সর্বমোট প্রদেয় (Grand Total):</span>
                  <span className="text-[#1e3932] text-lg font-serif">
                    ৳{grandTotal.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout?.();
                }}
                className="w-full py-3.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#1e3932]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>অর্ডার সম্পন্ন করতে এগিয়ে যান</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>DGDA অনুমোদিত মালামাল ও নিশ্চিত ওয়ারেন্টি</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
