'use client';

import React, { useState } from 'react';
import './Layout.css';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { CartDrawer } from './CartDrawer';
import { WishlistDrawer } from './WishlistDrawer';
import { CustomerSupportChat } from './CustomerSupportChat';
import { Product } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  showAnnouncement?: boolean;
  showSearch?: boolean;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSearch?: (q: string) => void;
  onSelectProduct?: (product: Product) => void;
  onProceedToCheckout?: () => void;
}

export function Layout({
  children,
  showAnnouncement = true,
  showSearch = true,
  activeCategory = 'All',
  onSelectCategory,
  onSearch,
  onSelectProduct,
  onProceedToCheckout,
}: LayoutProps) {
  return (
    <div className="storefront-layout-root">
      {/* 1. Top Compliance & Free Shipping Announcement */}
      {showAnnouncement && <AnnouncementBar />}

      {/* 2. Unified Master Header with Search & Mega Menu */}
      <Header
        showSearch={showSearch}
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
        onSearch={onSearch}
        onSelectProduct={onSelectProduct}
      />

      {/* 3. Main Page Canvas */}
      <main className="storefront-layout-main">
        {children}
      </main>

      {/* 4. Comprehensive Medical Compliance Footer */}
      <Footer />

      {/* 5. Mobile Safe Bottom Spacer */}
      <div className="storefront-layout-bottom-spacer" />

      {/* 6. Mobile Bottom Dock Navigation */}
      <MobileBottomNav />

      {/* 7. Global Slide-Over Drawers & Support Helpdesk */}
      <CartDrawer onProceedToCheckout={onProceedToCheckout} />
      <WishlistDrawer />
      <CustomerSupportChat />
    </div>
  );
}

export default Layout;

