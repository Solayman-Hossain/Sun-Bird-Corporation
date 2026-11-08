'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './Navbar.css';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  HeartPulse,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../lib/initialProducts';

interface NavbarProps {
  onSearch?: (q: string) => void;
  showSearch?: boolean;
  onOpenMobileMenu?: () => void;
  onSelectProduct?: (product: Product) => void;
}

export function Navbar({
  onSearch,
  showSearch = true,
  onOpenMobileMenu,
  onSelectProduct,
}: NavbarProps) {
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlistCount, setIsWishlistOpen } = useWishlist();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      onSearch?.('');
      return;
    }

    const timer = setTimeout(() => {
      onSearch?.(query);
      const q = query.toLowerCase().trim();
      const matches = INITIAL_PRODUCTS.filter(
        (p) =>
          p.nameEn.toLowerCase().includes(q) ||
          (p.nameBn && p.nameBn.includes(q)) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      ).slice(0, 5);

      setSearchResults(matches);
      setIsSearchOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Click outside to close search popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#eae5df] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation"
          className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1e3932] to-[#2d5248] flex items-center justify-center text-white shadow-md shadow-[#1e3932]/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 text-[#e6b980] animate-pulse" />
          </div>
          <div className="hidden xs:block">
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif">
                SUN BIRD
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1e3932]/10 text-[#1e3932] font-semibold tracking-wider uppercase">
                Healthcare
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight">
              Hospital Equipment & Diagnostics
            </p>
          </div>
        </Link>

        {/* Center Live Search Bar with Popover */}
        {showSearch && (
          <div ref={searchRef} className="flex-1 max-w-xl relative">
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setIsSearchOpen(true);
                }}
                placeholder="Search for products, brands, cannula, nebulizers..."
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-[#faf8f5] border border-[#eae5df] rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1e3932] focus:ring-2 focus:ring-[#1e3932]/10 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Results Popover */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#eae5df] overflow-hidden z-50 divide-y divide-slate-100 animate-in fade-in-50 slide-in-from-top-2">
                <div className="px-4 py-2 bg-[#faf8f5] text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  Quick Matching Products ({searchResults.length})
                </div>
                {searchResults.map((product) => (
                  <div
                    key={product.sku}
                    onClick={() => {
                      setIsSearchOpen(false);
                      onSelectProduct?.(product);
                    }}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-[#faf8f5] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={product.imageUrl || '/placeholder-medical.jpg'}
                          alt={product.nameEn}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                          {product.nameEn}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {product.category} • SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs sm:text-sm font-bold text-[#1e3932]">
                        ৳{product.retailPrice.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-medium">In Stock</span>
                    </div>
                  </div>
                ))}
                <Link
                  href="/#products"
                  onClick={() => setIsSearchOpen(false)}
                  className="block px-4 py-2.5 text-center text-xs font-semibold text-[#1e3932] hover:bg-slate-50 transition-colors"
                >
                  View all results →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Right Action Icons (Account, Wishlist, Cart) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Account Button */}
          <Link
            href="/account"
            className="flex items-center gap-1.5 text-slate-700 hover:text-[#1e3932] p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Customer Account"
          >
            <User className="w-5 h-5" />
            <span className="hidden md:inline text-xs sm:text-sm font-medium">Account</span>
          </Link>

          {/* Wishlist Button with Badge */}
          <button
            type="button"
            onClick={() => setIsWishlistOpen(true)}
            className="relative flex items-center gap-1.5 text-slate-700 hover:text-[#1e3932] p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Saved Medical Equipment"
            aria-label="View saved wishlist"
          >
            <Heart className="w-5 h-5" />
            <span className="hidden md:inline text-xs sm:text-sm font-medium">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:top-1 sm:right-auto sm:static flex items-center justify-center min-w-4 h-4 sm:min-w-5 sm:h-5 px-1 bg-[#c89348] text-white font-bold text-[10px] sm:text-xs rounded-full">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button with Dark Green Pill Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white rounded-full font-medium text-xs sm:text-sm transition-all shadow-sm shadow-[#1e3932]/30 cursor-pointer"
            aria-label="View shopping cart"
          >
            <ShoppingBag className="w-4 h-4 text-[#e6b980]" />
            <span className="hidden sm:inline">Cart</span>
            <span className="flex items-center justify-center min-w-5 h-5 px-1.5 bg-[#e6b980] text-slate-900 font-bold text-xs rounded-full">
              {totalItems}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
