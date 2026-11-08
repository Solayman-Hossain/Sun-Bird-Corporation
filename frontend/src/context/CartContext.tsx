'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  totalItemCount: number;
  totalItems: number; // backward-compatibility alias
  subtotal: number;
  vatAmount: number;
  selectedDistrict: string;
  shippingDistrict: string; // backward-compatibility alias
  shippingCost: number;
  shippingFee: number; // backward-compatibility alias
  grandTotal: number;
  freeShippingProgress: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  setDistrict: (district: string) => void;
  setShippingDistrict: (district: string) => void; // backward-compatibility alias
}

const DHAKA_SUBURBS = ['Gazipur', 'Narayanganj', 'Savar', 'Keraniganj', 'Munshiganj', 'Narsingdi'];
const FREE_SHIPPING_THRESHOLD = 5000;

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('Dhaka');
  const [isHydrated, setIsHydrated] = useState(false);
  const { showToast } = useToast();

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved =
        localStorage.getItem('sunbird_cart_items') ||
        localStorage.getItem('sunbird_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
      const savedDistrict = localStorage.getItem('sunbird_shipping_district');
      if (savedDistrict) {
        setSelectedDistrict(savedDistrict);
      }
    } catch {
      // storage access fallback
    }
    setIsHydrated(true);
  }, []);

  // Synchronize state changes to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('sunbird_cart_items', JSON.stringify(items));
      } catch {
        // ignore
      }
    }
  }, [items, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('sunbird_shipping_district', selectedDistrict);
      } catch {
        // ignore
      }
    }
  }, [selectedDistrict, isHydrated]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.sku === product.sku);
      if (existing) {
        return prev.map((i) =>
          i.product.sku === product.sku
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity }];
    });

    const displayName = product.name || product.nameEn || product.sku;
    showToast(`Added ${quantity}x "${displayName}" to cart!`, 'success');
    setIsCartOpen(true);
  };

  const removeFromCart = (sku: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product.sku === sku);
      if (item) {
        const name = item.product.name || item.product.nameEn || sku;
        showToast(`Removed "${name}" from cart`, 'info');
      }
      return prev.filter((i) => i.product.sku !== sku);
    });
  };

  const updateQuantity = (sku: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(sku);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.sku === sku ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const setDistrict = (district: string) => {
    setSelectedDistrict(district);
  };

  // Calculations
  const totalItemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const price = i.product.price ?? i.product.retailPrice ?? 0;
        return sum + price * i.quantity;
      }, 0),
    [items]
  );

  // Exact 15% NBR Standard Statutory VAT
  const vatAmount = useMemo(() => Math.round(subtotal * 0.15), [subtotal]);

  // District-based shipping calculation
  const shippingCost = useMemo(() => {
    if (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) {
      return 0; // Free delivery
    }
    if (selectedDistrict === 'Dhaka') {
      return 60; // Dhaka City Inside
    }
    if (DHAKA_SUBURBS.includes(selectedDistrict)) {
      return 100; // Dhaka Suburbs
    }
    return 150; // Outside Dhaka (All 64 districts)
  }, [subtotal, selectedDistrict]);

  const grandTotal = useMemo(
    () => subtotal + vatAmount + shippingCost,
    [subtotal, vatAmount, shippingCost]
  );

  const freeShippingProgress = useMemo(() => {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 100;
    return Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  }, [subtotal]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItemCount,
        totalItems: totalItemCount,
        subtotal,
        vatAmount,
        selectedDistrict,
        shippingDistrict: selectedDistrict,
        shippingCost,
        shippingFee: shippingCost,
        grandTotal,
        freeShippingProgress,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setDistrict,
        setShippingDistrict: setDistrict,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
