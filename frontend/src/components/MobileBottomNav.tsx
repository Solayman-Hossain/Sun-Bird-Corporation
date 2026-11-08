'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './MobileBottomNav.css';
import { Home, Layers, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  onOpenCategories?: () => void;
}

export function MobileBottomNav({ onOpenCategories }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlistCount, setIsWishlistOpen } = useWishlist();
  const { isAuthenticated, user } = useAuth();

  const isHome = pathname === '/';
  const isAccount = pathname === '/account';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#eae5df] lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 active:scale-95 ${
            isHome ? 'text-[#1e3932] font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {isHome && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1e3932]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">হোম</span>
        </Link>

        {/* 2. Categories / Mega Menu Trigger */}
        <button
          type="button"
          onClick={onOpenCategories}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <Layers className="w-5 h-5 stroke-2" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">ক্যাটাগরি</span>
        </button>

        {/* 3. Wishlist */}
        <button
          type="button"
          onClick={() => setIsWishlistOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 transition-all duration-150 active:scale-95 relative cursor-pointer"
        >
          <div className="relative">
            <Heart className="w-5 h-5 stroke-2" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#c89348] text-slate-950 font-bold text-[9px] flex items-center justify-center shadow-xs">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">উইশলিস্ট</span>
        </button>

        {/* 4. Cart (Highlight with Brand Color Pill on active items) */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-800 transition-all duration-150 active:scale-95 relative cursor-pointer"
        >
          <div className="relative">
            <div className={`p-1 rounded-lg ${totalItems > 0 ? 'bg-[#1e3932]/10 text-[#1e3932]' : ''}`}>
              <ShoppingBag className="w-5 h-5 stroke-2 text-[#1e3932]" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#1e3932] text-white font-bold text-[9px] flex items-center justify-center shadow-xs animate-in zoom-in-50">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium text-[#1e3932]">কার্ট</span>
        </button>

        {/* 5. Account */}
        <Link
          href="/account"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 active:scale-95 ${
            isAccount ? 'text-[#1e3932] font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 ${isAccount ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {isAuthenticated && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[50px]">
            {isAuthenticated && user?.name ? user.name.split(' ')[0] : 'অ্যাকাউন্ট'}
          </span>
        </Link>
      </div>
    </nav>
  );
}

export default MobileBottomNav;

