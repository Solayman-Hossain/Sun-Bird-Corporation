'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Product } from '../types';
import { useToast } from './ToastContext';

interface WishlistContextType {
  wishlistItems: Product[];
  wishlist: Product[]; // backward-compatibility alias
  wishlistCount: number;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (sku: string) => boolean;
  removeFromWishlist: (sku: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { showToast } = useToast();

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem('sunbird_wishlist_items') ||
        localStorage.getItem('sunbird_wishlist');
      if (saved) {
        setWishlistItems(JSON.parse(saved));
      }
    } catch {
      // storage access fallback
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(
          'sunbird_wishlist_items',
          JSON.stringify(wishlistItems)
        );
      } catch {
        // ignore
      }
    }
  }, [wishlistItems, isHydrated]);

  const isInWishlist = (sku: string) => {
    return wishlistItems.some((item) => item.sku === sku);
  };

  const toggleWishlist = (product: Product) => {
    const exists = isInWishlist(product.sku);
    const displayName = product.name || product.nameEn || product.sku;

    if (exists) {
      setWishlistItems((prev) => prev.filter((item) => item.sku !== product.sku));
      showToast(`Removed "${displayName}" from your Wishlist`, 'info');
    } else {
      setWishlistItems((prev) => [...prev, product]);
      showToast(`Saved "${displayName}" to your Wishlist!`, 'success');
    }
  };

  const removeFromWishlist = (sku: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.sku !== sku));
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    showToast('Wishlist cleared', 'info');
  };

  const wishlistCount = useMemo(() => wishlistItems.length, [wishlistItems]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlist: wishlistItems,
        wishlistCount,
        isWishlistOpen,
        setIsWishlistOpen,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
