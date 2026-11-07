'use client';

import React, { useState } from 'react';
import { ShoppingBag, Eye, Check, Package } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Top Header / Badges */}
      <div className="p-4 pb-1 flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 tracking-wide">
          {product.brand || 'Sun Bird Imported'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            HS: {product.hsCode}
          </span>
        </div>
      </div>

      {/* Visual Product Image / Illustration */}
      <div className="px-4 py-3 flex items-center justify-center bg-gradient-to-b from-slate-50/50 to-white relative min-h-[170px]">
        {product.imageUrl ? (
          <div className="w-full h-38 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img
              src={product.imageUrl}
              alt={product.nameEn}
              className="max-h-full max-w-full object-contain drop-shadow-xs"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform duration-200">
            <Package className="w-10 h-10" />
          </div>
        )}

        {product.inStock && (
          <span className="absolute bottom-1 left-3 text-[11px] font-medium text-emerald-700 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-2xs border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            স্টক: {product.availableStock} {product.baseUom}
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {product.category}
          </div>
          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
            {product.nameEn}
          </h3>
          {product.nameBn && (
            <p className="text-xs text-slate-500 line-clamp-1 font-bangla">
              {product.nameBn}
            </p>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">খুচরা মূল্য</div>
            <div className="text-lg font-extrabold text-slate-900">
              ৳ {product.retailPrice.toLocaleString('en-US')}
              <span className="text-xs font-normal text-slate-500 ml-1">
                / {product.baseUom}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              title="বিস্তারিত দেখুন"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleAdd}
              className={`px-3 py-2 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                justAdded
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>যুক্ত হয়েছে</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>কিনুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
