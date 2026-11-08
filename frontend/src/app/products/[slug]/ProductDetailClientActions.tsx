'use client';

import React, { useState } from 'react';
import './ProductDetailClientActions.css';
import { ShoppingBag, Star, Plus, Minus, Check, Heart } from 'lucide-react';
import { Product } from '../../../types';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';

interface ProductDetailClientActionsProps {
  product: Product;
}

export default function ProductDetailClientActions({
  product,
}: ProductDetailClientActionsProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const isFavorited = isInWishlist(product.sku);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    setIsCartOpen(true);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* In Stock Indicator */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            In Stock — {product.stock || product.availableStock || 45} units available in Tejgaon Central Depot
          </span>
        </span>
      </div>

      {/* Stepper + Add To Cart + Wishlist */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-slate-300 bg-white p-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-bold text-sm text-slate-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 px-6 py-3.5 rounded-full bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-[#1e3932]/25 inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4 text-[#e6b980]" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-[#e6b980]" />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
            isFavorited
              ? 'bg-rose-50 border-rose-300 text-rose-500'
              : 'border-slate-300 hover:bg-slate-50 text-slate-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Buy Now Full Width */}
      <button
        type="button"
        onClick={handleBuyNow}
        className="w-full px-6 py-3.5 rounded-full bg-[#c89348] hover:bg-[#b58238] active:scale-95 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#c89348]/25 inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Buy Now (Instant Checkout)</span>
      </button>
    </div>
  );
}

