'use client';

import React, { useState } from 'react';
import { ShoppingBag, Heart, Star, Check, ShieldCheck } from 'lucide-react';
import './ProductCard.css';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  const isFavorited = isInWishlist(product.sku);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const currentPrice = product.price ?? product.retailPrice ?? 0;
  const originalMrp = product.mrp ?? Math.round(currentPrice * 1.2);
  const discountPercent =
    originalMrp > currentPrice
      ? Math.round(((originalMrp - currentPrice) / originalMrp) * 100)
      : 0;

  const ratingVal = product.rating ?? product.averageRating ?? 4.8;
  const reviewTotal = product.reviewCount ?? product.ratingCount ?? 115;

  return (
    <div
      onClick={() => onQuickView?.(product)}
      className="group relative bg-white rounded-2xl border border-[#eae5df] hover:border-[#1e3932]/40 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative w-full aspect-square bg-[#f8f6f2] p-4 flex items-center justify-center overflow-hidden">
        {/* Top-Left Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          {product.dgdaRegistration && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[#1e3932] border border-[#eae5df] shadow-2xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>DGDA</span>
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
              Save {discountPercent}%
            </span>
          )}
        </div>

        {/* Top-Right Floating Wishlist Heart */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[#eae5df] shadow-2xs flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer ${
            isFavorited ? 'text-rose-500' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              isFavorited ? 'fill-rose-500 scale-110' : ''
            }`}
          />
        </button>

        {/* Product Image */}
        <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <img
            src={product.image || product.imageUrl || '/images/products/cannula.svg'}
            alt={product.name || product.nameEn}
            className="max-h-full max-w-full object-contain drop-shadow-xs"
            loading="lazy"
          />
        </div>

        {/* Bottom-Right Floating Quick Cart Bag Button */}
        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label="Quick add to cart"
          className={`absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer ${
            justAdded
              ? 'bg-emerald-600 text-white scale-110'
              : 'bg-[#1e3932] hover:bg-[#162f29] text-white hover:scale-110 active:scale-95'
          }`}
          title="Instant Add to Cart"
        >
          {justAdded ? (
            <Check className="w-4 h-4 text-white" />
          ) : (
            <ShoppingBag className="w-4 h-4 text-[#e6b980]" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          {/* Bengali Subtitle / Spec summary */}
          {(product.banglaName || product.nameBn) && (
            <p className="text-[11px] text-slate-500 line-clamp-1 font-bangla">
              {product.banglaName || product.nameBn}
            </p>
          )}

          {/* Product Title */}
          <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-[#1e3932] transition-colors">
            {product.name || product.nameEn}
          </h3>
        </div>

        {/* Pricing & Rating Strip */}
        <div className="pt-2 border-t border-[#eae5df]/60 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#1a1a1a]">
              ৳{currentPrice.toLocaleString('en-US')}
            </span>
            {originalMrp > currentPrice && (
              <span className="text-xs text-slate-400 line-through">
                ৳{originalMrp.toLocaleString('en-US')}
              </span>
            )}
          </div>

          {/* 5-Star Rating Strip */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="flex items-center text-[#c89348]">
              {[...Array(5)].map((_, idx) => (
                <Star
                  key={idx}
                  className="w-3.5 h-3.5 fill-[#c89348] text-[#c89348]"
                />
              ))}
            </div>
            <span className="font-medium text-slate-700 text-[11px]">
              {ratingVal.toFixed(1)}
            </span>
            <span className="text-slate-400 text-[11px]">
              ({reviewTotal})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
