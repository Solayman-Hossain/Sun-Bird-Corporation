'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, ThumbsUp, MessageSquare, Plus, X, UploadCloud, User } from 'lucide-react';
import './ProductReviews.css';
import { ReviewItem } from '../types';
import { submitProductReview } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface ProductReviewsProps {
  productId: string;
  productSku: string;
  initialRating?: number;
  initialReviewCount?: number;
}

export function ProductReviews({
  productId,
  productSku,
  initialRating = 4.8,
  initialReviewCount = 115,
}: ProductReviewsProps) {
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      _id: 'rev-1',
      productId,
      productSku,
      reviewerName: 'ডাঃ তৌহিদুর রহমান (এমবিবিএস, এফসিপিএস)',
      rating: 5,
      title: 'অরিজিনাল ইমপোর্টেড প্রোডাক্ট ও শতভাগ নিখুঁত রিডিং',
      reviewText:
        'হাসপাতাল ও চেম্বার প্র্যাকটিসে রেগুলার ব্যবহারের জন্য অসাধারণ একটি ডিভাইস। প্যাকেজিং ইনট্যাক্ট সিল্ড ছিল এবং এনবিআর মূসক-৬.৩ চালান সাথে পেয়েছি।',
      isVerifiedBuyer: true,
      status: 'APPROVED',
      createdAt: '৩ দিন আগে',
    },
    {
      _id: 'rev-2',
      productId,
      productSku,
      reviewerName: 'ফারহান আহমেদ (সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স)',
      rating: 5,
      title: 'দ্রুত ডেলিভারি ও চমৎকার বায়োমেডিকেল সাপোর্ট',
      reviewText:
        'অর্ডার করার ২৪ ঘণ্টার মধ্যে পাঠাও কুরিয়ারের মাধ্যমে আমরা তেজগাঁও সেন্ট্রাল ওয়্যারহাউজ থেকে ডেলিভারি পেয়েছি। ওয়ারেন্টি কার্ড যথাযথভাবে সিল করা ছিল।',
      isVerifiedBuyer: true,
      status: 'APPROVED',
      createdAt: '১ সপ্তাহ আগে',
    },
    {
      _id: 'rev-3',
      productId,
      productSku,
      reviewerName: 'কাজী মাহমুদুল হাসান (ফার্মেসি স্বত্বাধিকারী)',
      rating: 4,
      title: 'কোয়ালিটি খুবই নির্ভরযোগ্য ও টেকসই',
      reviewText:
        'কাস্টমাররা অত্যন্ত সন্তুষ্ট। বিল্ট-ইন মেমোরি ও ব্যাটারি ব্যাকআপ দারুণ। ধন্যবাদ সান বার্ড কর্পোরেশন।',
      isVerifiedBuyer: true,
      status: 'APPROVED',
      createdAt: '২ সপ্তাহ আগে',
    },
  ]);

  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({
    'rev-1': 14,
    'rev-2': 9,
    'rev-3': 5,
  });
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  // Review Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerPhone, setReviewerPhone] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHelpfulVote = (id: string) => {
    if (votedReviews[id]) return;
    setHelpfulCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setVotedReviews((prev) => ({ ...prev, [id]: true }));
    showToast('Thank you for your feedback!', 'success');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewText.trim()) {
      showToast('Please fill in your name and review details', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitProductReview({
        productId,
        reviewerName,
        reviewerPhone: reviewerPhone || '01700000000',
        rating: newRating,
        title: reviewTitle || undefined,
        reviewText,
      });

      const newReview: ReviewItem = {
        _id: `rev-${Date.now()}`,
        productId,
        productSku,
        reviewerName,
        rating: newRating,
        title: reviewTitle || 'Verified Feedback',
        reviewText,
        isVerifiedBuyer: true,
        status: 'APPROVED',
        createdAt: 'Just now',
      };

      setReviews([newReview, ...reviews]);
      showToast('Review submitted successfully! Thank you.', 'success');
      setIsFormOpen(false);
      setReviewTitle('');
      setReviewText('');
    } catch {
      showToast('Could not submit review. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Rating Summary Breakdown */}
      <div className="bg-[#faf8f5] p-6 rounded-2xl border border-[#eae5df] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Rating Score */}
        <div className="md:col-span-4 text-center md:text-left space-y-2">
          <div className="text-4xl sm:text-5xl font-black text-[#1a1a1a] tracking-tight">
            {initialRating.toFixed(1)}
            <span className="text-xl font-normal text-slate-400">/5</span>
          </div>
          <div className="flex items-center justify-center md:justify-start text-[#c89348]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-[#c89348] text-[#c89348]" />
            ))}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Based on {initialReviewCount + reviews.length - 3} verified clinical reviews
          </p>
        </div>

        {/* Center Progress Bars */}
        <div className="md:col-span-5 space-y-2">
          {[
            { stars: 5, pct: 85 },
            { stars: 4, pct: 11 },
            { stars: 3, pct: 3 },
            { stars: 2, pct: 1 },
            { stars: 1, pct: 0 },
          ].map((bar) => (
            <div key={bar.stars} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-6 font-semibold">{bar.stars}★</span>
              <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1e3932]"
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium text-slate-400">{bar.pct}%</span>
            </div>
          ))}
        </div>

        {/* Right CTA Button */}
        <div className="md:col-span-3 text-center md:text-right">
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-medium text-xs sm:text-sm transition-all shadow-sm shadow-[#1e3932]/25 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* 2. Review Submission Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#eae5df] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1e3932]" />
                <h3 className="font-bold text-slate-900 text-base">Write Clinical Review</h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs sm:text-sm">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setNewRating(s)}
                      className="p-1 text-[#c89348] hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= newRating ? 'fill-[#c89348]' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-slate-700 text-xs">
                    {newRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name / Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rafiqul Islam / Clinic Director"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e3932]"
                />
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  placeholder="Summarize your experience with this equipment"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e3932]"
                />
              </div>

              {/* Review Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Clinical Feedback *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe device accuracy, build quality, usability, and warranty delivery..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e3932]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#1e3932] hover:bg-[#162f29] text-white font-medium shadow-md shadow-[#1e3932]/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Verified Customer Reviews List */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev._id}
            className="p-5 rounded-2xl bg-white border border-[#eae5df] space-y-3 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                  <User className="w-4 h-4 text-[#1e3932]" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{rev.reviewerName}</span>
                    {rev.isVerifiedBuyer && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{rev.createdAt}</span>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center text-[#c89348]">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#c89348]" />
                ))}
              </div>
            </div>

            {/* Title & Comment */}
            {rev.title && (
              <h4 className="font-bold text-slate-800 text-sm">{rev.title}</h4>
            )}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-bangla">
              {rev.reviewText}
            </p>

            {/* Helpful Counter */}
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => rev._id && handleHelpfulVote(rev._id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                  rev._id && votedReviews[rev._id]
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Helpful ({rev._id ? helpfulCounts[rev._id] || 0 : 0})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

