'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './ProductModal.css';
import {
  X,
  ShieldCheck,
  ShoppingBag,
  Star,
  Check,
  Plus,
  Minus,
  Award,
  Truck,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductReviews } from './ProductReviews';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onProceedToCheckout?: () => void;
}

export function ProductModal({
  product,
  onClose,
  onProceedToCheckout,
}: ProductModalProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');
  const [justAdded, setJustAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sync selected image
  useEffect(() => {
    if (product) {
      setSelectedImage(product.image || product.imageUrl || '/images/products/cannula.svg');
      setQuantity(1);
      setActiveTab('specs');
    }
  }, [product]);

  if (!product) return null;

  const currentPrice = product.price ?? product.retailPrice ?? 0;
  const originalMrp = product.mrp ?? Math.round(currentPrice * 1.2);
  const savings = originalMrp > currentPrice ? originalMrp - currentPrice : 0;
  const discountPct = originalMrp > currentPrice ? Math.round((savings / originalMrp) * 100) : 0;

  const isFavorited = isInWishlist(product.sku);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onClose();
    if (onProceedToCheckout) {
      onProceedToCheckout();
    } else {
      setIsCartOpen(true);
    }
  };

  // Gallery array
  const gallery = product.gallery && product.gallery.length > 0
    ? product.gallery
    : [selectedImage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#eae5df] overflow-hidden z-10 max-h-[92vh] flex flex-col my-auto">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#eae5df] flex items-center justify-between bg-[#faf8f5]">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#1e3932]/10 text-[#1e3932] text-xs font-semibold">
              {product.category}
            </span>
            <span className="font-mono text-xs text-slate-500 font-medium">
              SKU: {product.sku}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/products/${product.sku}`}
              onClick={onClose}
              className="text-xs text-[#1e3932] font-semibold hover:underline flex items-center gap-1 hidden sm:flex mr-2"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Image Gallery & Badges */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl bg-[#f8f6f2] border border-[#eae5df] p-6 flex items-center justify-center overflow-hidden">
                {product.dgdaRegistration && (
                  <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-[#1e3932] border border-[#eae5df] shadow-2xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>DGDA Registered</span>
                  </span>
                )}

                {discountPct > 0 && (
                  <span className="absolute top-3 right-3 z-10 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-2xs">
                    Save {discountPct}%
                  </span>
                )}

                <img
                  src={selectedImage}
                  alt={product.name || product.nameEn}
                  className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Multi-angle thumbnail row */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 rounded-xl border p-1 bg-white cursor-pointer transition-all ${
                        selectedImage === img
                          ? 'border-[#1e3932] ring-2 ring-[#1e3932]/20'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt="Thumbnail"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Warranty Assurance Card */}
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-[#1e3932]">
                  <RotateCcw className="w-4 h-4 text-[#c89348]" />
                  <span>Official Warranty & RMA Service</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {product.warrantyPeriod || '1-3 Years Biomedical Warranty'} with 30-day hassle-free replacement. Direct technical support from our Tejgaon service lab.
                </p>
              </div>
            </div>

            {/* Right Column: Details, Pricing, & Actions */}
            <div className="space-y-6">
              {/* Titles */}
              <div className="space-y-1.5">
                {(product.banglaName || product.nameBn) && (
                  <p className="text-xs text-[#1e3932] font-semibold font-bangla">
                    {product.banglaName || product.nameBn}
                  </p>
                )}
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif leading-tight">
                  {product.name || product.nameEn}
                </h1>

                {/* Rating Strip */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <div className="flex items-center text-[#c89348]">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-4 h-4 fill-[#c89348] text-[#c89348]"
                      />
                    ))}
                  </div>
                  <span className="font-bold text-slate-800">
                    {(product.rating ?? product.averageRating ?? 4.8).toFixed(1)}
                  </span>
                  <span className="text-slate-400">
                    ({product.reviewCount ?? product.ratingCount ?? 115} Reviews)
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-1.5">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a]">
                    ৳{currentPrice.toLocaleString('en-US')}
                  </span>
                  {originalMrp > currentPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      ৳{originalMrp.toLocaleString('en-US')}
                    </span>
                  )}
                  {savings > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Save ৳{savings.toLocaleString('en-US')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Inclusive of statutory 15% NBR VAT • Official Mushak-6.3 Tax Challan Provided
                </p>
              </div>

              {/* Stock Status Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    In Stock — {product.stock || product.availableStock || 45} units available in Tejgaon Central Depot
                  </span>
                </span>
              </div>

              {/* Quantity Stepper & Buttons */}
              <div className="space-y-3 pt-2">
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
                    aria-label="Wishlist"
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                      isFavorited
                        ? 'bg-rose-50 border-rose-300 text-rose-500'
                        : 'border-slate-300 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${isFavorited ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full px-6 py-3.5 rounded-full bg-[#c89348] hover:bg-[#b58238] active:scale-95 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#c89348]/25 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Buy Now (Instant Checkout)</span>
                </button>
              </div>

              {/* Delivery & Assurance Strip */}
              <div className="pt-2 border-t border-[#eae5df] grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#1e3932]" />
                  <span>12–24h Dhaka / 48h BD</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#1e3932]" />
                  <span>Original Certified Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Switcher: Specifications vs Clinical Reviews */}
          <div className="pt-6 border-t border-[#eae5df]">
            <div className="flex items-center gap-6 border-b border-[#eae5df] mb-6">
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'specs'
                    ? 'border-[#1e3932] text-[#1e3932]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Technical Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-[#1e3932] text-[#1e3932]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Clinical Reviews ({product.reviewCount ?? product.ratingCount ?? 115})
              </button>
            </div>

            {/* Tab 1: Technical Specifications Table */}
            {activeTab === 'specs' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#eae5df] overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <tbody className="divide-y divide-[#eae5df]">
                      <tr className="bg-[#faf8f5]">
                        <th className="py-2.5 px-4 font-semibold text-slate-700 w-1/3">
                          Device Model / SKU
                        </th>
                        <td className="py-2.5 px-4 font-mono text-slate-900 font-medium">
                          {product.sku}
                        </td>
                      </tr>
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-slate-700">
                          Country of Origin
                        </th>
                        <td className="py-2.5 px-4 text-slate-900">
                          {product.countryOfOrigin || 'Imported'}
                        </td>
                      </tr>
                      <tr className="bg-[#faf8f5]">
                        <th className="py-2.5 px-4 font-semibold text-slate-700">
                          DGDA Registration
                        </th>
                        <td className="py-2.5 px-4 font-mono text-emerald-800 font-semibold">
                          {product.dgdaRegistration || 'DAR-MD-8921-2024'}
                        </td>
                      </tr>
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-slate-700">
                          Warranty Period
                        </th>
                        <td className="py-2.5 px-4 text-slate-900">
                          {product.warrantyPeriod || '1 Year Official Warranty'}
                        </td>
                      </tr>
                      {product.specifications &&
                        Object.entries(product.specifications).map(([key, val], idx) => (
                          <tr key={key} className={idx % 2 === 0 ? 'bg-[#faf8f5]' : ''}>
                            <th className="py-2.5 px-4 font-semibold text-slate-700">
                              {key}
                            </th>
                            <td className="py-2.5 px-4 text-slate-900">
                              {val}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {product.seoContent?.descriptionEn && (
                  <div className="p-4 rounded-2xl bg-white border border-[#eae5df] text-xs text-slate-600 leading-relaxed">
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Overview</h4>
                    <p>{product.seoContent.descriptionEn}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Reviews Component */}
            {activeTab === 'reviews' && (
              <ProductReviews
                productId={product._id}
                productSku={product.sku}
                initialRating={product.rating ?? product.averageRating}
                initialReviewCount={product.reviewCount ?? product.ratingCount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
