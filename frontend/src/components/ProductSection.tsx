'use client';

import React from 'react';
import Link from 'next/link';
import './ProductSection.css';
import { ArrowRight, PackageOpen } from 'lucide-react';
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
}

export function ProductSection({
  id,
  title,
  subtitle,
  products,
  onQuickView,
  viewAllHref = '#products',
  onResetFilters,
}: ProductSectionProps) {
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

      {/* 4-Column Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#eae5df] p-6 space-y-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.sku}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}
    </section>
  );
}

