'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, ShoppingBag, Package, Check, Star, MessageSquare, Send, User } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { submitProductReview } from '../lib/api';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenRma?: (orderId?: string) => void;
}

export function ProductModal({ product, onClose, onOpenRma }: ProductModalProps) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Review submission state
  const [reviews, setReviews] = useState([
    {
      id: 'rev-1',
      reviewerName: 'ডাঃ তৌহিদুর রহমান (চেম্বার প্র্যাকটিস)',
      rating: 5,
      date: '২ দিন আগে',
      text: 'অরিজিনাল ইমপোর্টেড প্রোডাক্ট। ক্লিনিক্যাল এক্যুরেসি অত্যন্ত ভালো এবং প্যাকেট সিল্ড পেয়েছি।',
      verified: true,
    },
    {
      id: 'rev-2',
      reviewerName: 'ফারহান আহমেদ (হোম ইউজার)',
      rating: 5,
      date: '১ সপ্তাহ আগে',
      text: 'পাঠাও কুরিয়ারের মাধ্যমে ২৪ ঘণ্টার মধ্যেই অক্ষত অবস্থায় ডেলিভারি পেয়েছি। ভ্যাট চালান সাথে ছিল।',
      verified: true,
    },
  ]);

  const [newRating, setNewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerPhone, setReviewerPhone] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewText) return;

    setSubmittingReview(true);
    await submitProductReview({
      productId: product._id,
      reviewerName,
      reviewerPhone: reviewerPhone || '01700000000',
      rating: newRating,
      reviewText,
    });
    setSubmittingReview(false);

    setReviews([
      {
        id: `rev-${Date.now()}`,
        reviewerName,
        rating: newRating,
        date: 'এইমাত্র',
        text: reviewText,
        verified: true,
      },
      ...reviews,
    ]);

    setReviewSuccess(true);
    setReviewText('');
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
              {product.category}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              SKU: {product.sku}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              NBR HS: {product.hsCode}
            </span>
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold ml-auto">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.averageRating || 5.0} ★</span>
              <span className="text-[11px] text-amber-700 font-normal">({reviews.length} রিভিউ)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Image Preview */}
            <div className="w-full sm:w-1/3 h-44 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center shrink-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.nameEn}
                  className="max-h-full max-w-full object-contain drop-shadow-md"
                />
              ) : (
                <Package className="w-16 h-16 text-emerald-600" />
              )}
            </div>

            {/* Title & Specs */}
            <div className="flex-1 space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {product.nameEn}
              </h2>
              {product.nameBn && (
                <p className="text-sm font-medium text-emerald-700">
                  {product.nameBn}
                </p>
              )}
              <div className="text-xs text-slate-500">
                ব্র্যান্ড: <strong className="text-slate-700">{product.brand || 'Sun Bird Imported'}</strong>
              </div>
            </div>
          </div>

          {/* Pricing & Stock Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">খুচরা মূল্য (Retail MRP)</div>
              <div className="text-2xl font-extrabold text-slate-900">
                ৳ {product.retailPrice.toLocaleString('en-US')}{' '}
                <span className="text-sm font-normal text-slate-500">
                  / {product.baseUom}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>সেন্ট্রাল ডিপো স্টক: {product.availableStock || 250} {product.baseUom}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                ১৫% ভ্যাট প্রযোজ্য (মূসক-৬.৩ চালান অন্তর্ভুক্ত)
              </div>
            </div>
          </div>

          {/* Tab Navigation: Details vs Reviews */}
          <div className="flex border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2.5 px-4 cursor-pointer transition-colors border-b-2 ${
                activeTab === 'details'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              পণ্যের বিবরণ ও স্পেসিফিকেশন
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-2.5 px-4 cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'reviews'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>কাস্টমার রিভিউ ({reviews.length})</span>
            </button>
          </div>

          {/* Tab Content: Details */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.seoContent?.descriptionEn ||
                    'উচ্চমানের ক্লিনিক্যাল ও ডায়াগনস্টিক গ্রেড মেডিকেল পণ্য, যা হাসপাতাল এবং ব্যক্তিগত ব্যবহারের জন্য সম্পূর্ণ নিরাপদ।'}
                </p>
                {product.seoContent?.descriptionBn && (
                  <p className="text-sm text-slate-700 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    {product.seoContent.descriptionBn}
                  </p>
                )}
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">বেস ইউনিট (UOM):</span>
                  <span className="font-semibold text-slate-800">{product.baseUom}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">ক্যাটাগরি:</span>
                  <span className="font-semibold text-slate-800">{product.category}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block">ওয়ারেন্টি পলিসি:</span>
                  <span className="font-semibold text-emerald-700">
                    {product.category === 'Home Diagnostics' ? '১-৩ বছর রিপ্লেসমেন্ট' : 'অরিজিনাল ইমপোর্ট সিল্ড'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Customer Reviews & Ratings (Prompt 18) */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {/* Existing Reviews List */}
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {reviews.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.reviewerName}</span>
                        {r.verified && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-normal">
                            ভেরিফায়েড ক্রেতা
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-600 leading-normal">{r.text}</p>
                  </div>
                ))}
              </div>

              {/* Submit Review Form */}
              <form onSubmit={handleReviewSubmit} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800">আপনার রিভিউ ও রেটিং দিন</h5>
                  {/* Interactive Star Selection */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-bold text-amber-700 ml-1">{newRating} স্টার</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="আপনার নাম বা ক্লিনিক"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                    value={reviewerPhone}
                    onChange={(e) => setReviewerPhone(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <textarea
                  required
                  rows={2}
                  placeholder="পণ্যটির গুণগত মান সম্পর্কে আপনার মতামত লিখুন..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />

                {reviewSuccess && (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>ধন্যবাদ! আপনার রিভিউ সফলভাবে যুক্ত হয়েছে।</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>{submittingReview ? 'জমা হচ্ছে...' : 'রিভিউ সাবমিট করুন'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">পরিমাণ:</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-semibold text-slate-800">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                added
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/30'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>কার্টে যোগ হয়েছে</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>কার্টে যোগ করুন (৳ {(product.retailPrice * qty).toLocaleString('en-US')})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
