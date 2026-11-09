'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import './ProductSection.css';
import { ArrowRight, PackageOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  products: Product[];
  onQuickView: (product: Product) => void;
  viewAllHref?: string;
  onResetFilters?: () => void;
  initialLimit?: number;
  step?: number;
  enableAutoScroll?: boolean;
}

export function ProductSection({
  id,
  title,
  subtitle,
  products,
  onQuickView,
  viewAllHref = '#products',
  onResetFilters,
  initialLimit = 5,
  step = 5,
  enableAutoScroll = true,
}: ProductSectionProps) {
  const [visibleCount, setVisibleCount] = useState<number>(initialLimit);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visibleCount when products change
  useEffect(() => {
    setVisibleCount(initialLimit);
  }, [products, initialLimit]);

  const loadNextBatch = useCallback(() => {
    if (isLoadingMore || visibleCount >= products.length) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + step, products.length));
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, visibleCount, products.length, step]);

  // Pure Infinite Scroll: Automatically loads next 5 products as user scrolls down
  useEffect(() => {
    if (!enableAutoScroll || visibleCount >= products.length) return;

    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadNextBatch();
        }
      },
      { threshold: 0.05, rootMargin: '250px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enableAutoScroll, visibleCount, products.length, isLoadingMore, loadNextBatch]);

  // Window scroll fallback for instant mouse wheel response
  useEffect(() => {
    if (!enableAutoScroll || visibleCount >= products.length) return;

    const handleWindowScroll = () => {
      const sentinel = bottomSentinelRef.current;
      if (!sentinel || isLoadingMore) return;

      const rect = sentinel.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 250) {
        loadNextBatch();
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [enableAutoScroll, visibleCount, products.length, isLoadingMore, loadNextBatch]);

  const displayedProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <section id={id} className="py-6 space-y-6">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4 border-b border-[#eae5df] pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight font-serif">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1e3932] hover:text-[#162f29] transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* 5-Column Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-white/90 rounded-2xl border border-[#eae5df] p-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <PackageOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No medical devices found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No equipment matches this filter at the moment.
          </p>
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="mt-2 px-4 py-2 bg-[#1e3932] text-white text-xs font-semibold rounded-full hover:bg-[#162f29] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Main 5-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 sm:gap-6">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.sku}
                product={product}
                onQuickView={onQuickView}
              />
            ))}
          </div>

          {/* Sentinel detector for automatic scroll detection */}
          {hasMore && (
            <div ref={bottomSentinelRef} className="py-4 flex flex-col items-center justify-center gap-2">
              {isLoadingMore ? (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 border border-[#eae5df] shadow-xs text-xs font-bold text-[#1e3932] animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-[#993556]" />
                  <span>স্ক্রল অনুযায়ী পরবর্তী ৫টি পণ্য লোড হচ্ছে...</span>
                </div>
              ) : (
                <div className="h-4 w-full" />
              )}
            </div>
          )}

          {/* All Products Displayed Badge */}
          {!hasMore && products.length > initialLimit && (
            <div className="text-center pt-2 pb-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold px-4 py-1.5 rounded-full bg-emerald-50/95 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>সকল {products.length}টি পণ্য সফলভাবে প্রদর্শিত হয়েছে</span>
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
