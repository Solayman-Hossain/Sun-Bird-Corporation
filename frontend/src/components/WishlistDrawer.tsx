'use client';

import React from 'react';
import './WishlistDrawer.css';
import {
  X,
  Trash2,
  Heart,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Check,
  Package,
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export function WishlistDrawer() {
  const {
    wishlistItems,
    isWishlistOpen,
    setIsWishlistOpen,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  const { addToCart, setIsCartOpen } = useCart();

  if (!isWishlistOpen) return null;

  const handleMoveToCart = (product: any) => {
    addToCart(product, 1);
    removeFromWishlist(product.sku);
  };

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((product) => {
      addToCart(product, 1);
    });
    clearWishlist();
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-[#faf8f5] to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Heart className="w-5 h-5 fill-rose-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  Saved Wishlist
                </h2>
                <p className="text-xs text-slate-500">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsWishlistOpen(false)}
              aria-label="Close wishlist drawer"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List or Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {wishlistItems.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-center mx-auto text-rose-400">
                  <Heart className="w-10 h-10 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Your Wishlist is Empty
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Save medical equipment and supplies you are interested in by clicking the heart icon on any product.
                  </p>
                </div>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3932] text-white text-xs font-semibold rounded-full hover:bg-[#162f29] transition-all shadow-md shadow-[#1e3932]/20 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Browse Products</span>
                </button>
              </div>
            ) : (
              wishlistItems.map((product) => {
                const price = product.price ?? product.retailPrice ?? 0;
                const mrp = product.mrp ?? 0;
                const displayName = product.nameEn || product.name || product.sku;
                const imageSrc =
                  product.gallery?.[0] ||
                  product.imageUrl ||
                  product.image ||
                  '/placeholder-medical.jpg';

                return (
                  <div
                    key={product.sku}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#1e3932]/30 hover:shadow-xs transition-all flex gap-3"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl bg-[#faf8f5] border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
                      <img
                        src={imageSrc}
                        alt={displayName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Info & Actions */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {displayName}
                          </h4>
                          <button
                            onClick={() => removeFromWishlist(product.sku)}
                            aria-label={`Remove ${displayName} from wishlist`}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1 cursor-pointer"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>SKU: {product.sku}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">In Stock</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <div className="text-sm font-bold text-[#1e3932]">
                            ৳{price.toLocaleString('en-US')}
                          </div>
                          {mrp > price && (
                            <div className="text-[10px] text-slate-400 line-through">
                              ৳{mrp.toLocaleString('en-US')}
                            </div>
                          )}
                        </div>

                        {/* Move to Cart Button */}
                        <button
                          type="button"
                          onClick={() => handleMoveToCart(product)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#e6b980]" />
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {wishlistItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-[#faf8f5]/90 space-y-3">
              <button
                type="button"
                onClick={handleMoveAllToCart}
                className="w-full py-3.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#1e3932]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#e6b980]" />
                <span>Move All to Cart ({wishlistItems.length})</span>
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Items are saved to your browser</span>
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Clear Wishlist
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
