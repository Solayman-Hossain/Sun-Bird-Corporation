'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroBanner } from '../components/HeroBanner';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { ErpPortalModal } from '../components/ErpPortalModal';
import { RmaClaimModal } from '../components/RmaClaimModal';
import { CustomerSupportChat } from '../components/CustomerSupportChat';
import { Product, OrderConfirmation } from '../types';
import { getPublicProducts } from '../lib/api';
import { INITIAL_PRODUCTS } from '../lib/initialProducts';
import { ShieldCheck, PhoneCall, Mail, MapPin, HeartPulse, Building2, Layers } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);
  const [isErpOpen, setIsErpOpen] = useState(false);
  const [isRmaOpen, setIsRmaOpen] = useState(false);

  // Fetch live products from backend API
  useEffect(() => {
    async function loadProducts() {
      try {
        const liveProducts = await getPublicProducts();
        if (liveProducts && liveProducts.length > 0) {
          setProducts(liveProducts);
        }
      } catch (e) {
        console.warn('Using initial product catalogue fallback', e);
      }
    }
    loadProducts();
  }, []);

  // Compute categories & item counts
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.nameBn && p.nameBn.includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar */}
      <Navbar
        onSearch={setSearchQuery}
        onOpenErp={() => setIsErpOpen(true)}
      />

      {/* Hero Section */}
      <HeroBanner />

      {/* Main Storefront Product Section */}
      <main id="products" className="flex-1 max-w-7xl w-full mx-auto px-4 py-10 space-y-8">
        {/* Section Header & Category Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>আমদানিকৃত মেডিকেল সামগ্রী ও হোম ডায়াগনস্টিকস</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                পণ্য ক্যাটালগ ও বিক্রয়মূল্য (MRP)
              </h2>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              মোট প্রদর্শিত পণ্য: <span className="font-bold text-slate-900">{filteredProducts.length}</span> টি
            </div>
          </div>

          {/* Categories Pill Navigation */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            productCounts={productCounts}
          />
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <HeartPulse className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">কোনো পণ্য পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              আপনার অনুসন্ধানকৃত কি-ওয়ার্ড বা ক্যাটাগরির সাথে মিল রেখে কোনো পণ্য পাওয়া যায়নি।
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              সকল পণ্য দেখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.sku}
                product={product}
                onQuickView={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(order) => {
          setIsCheckoutOpen(false);
          setConfirmedOrder(order);
        }}
      />

      <OrderSuccessModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
      />

      <ErpPortalModal
        isOpen={isErpOpen}
        onClose={() => setIsErpOpen(false)}
      />

      <RmaClaimModal
        isOpen={isRmaOpen}
        onClose={() => setIsRmaOpen(false)}
      />

      {/* Floating 24/7 Customer Support Helpdesk Chat */}
      <CustomerSupportChat />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg font-serif">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span>SUN BIRD CORPORATION</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              বাংলাদেশ জাতীয় রাজস্ব বোর্ড (NBR) ও ড্রাগ অ্যাডমিনিস্ট্রেশন অনুমোদিত মেডিকেল, সার্জিক্যাল ও ডায়াগনস্টিক ইকুইপমেন্ট ইমপোর্ট ও ডিস্ট্রিবিউশন প্ল্যাটফর্ম।
            </p>
            <div className="text-[11px] text-emerald-400 font-mono">
              NBR BIN: 004819284-0101
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">সেন্ট্রাল ডিপো ও শাখা</h4>
            <p className="flex items-start gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>প্লট ১৪, শিল্প এলাকা, তেজগাঁও, ঢাকা-১২০৮ (সেন্ট্রাল ওয়্যারহাউজ)</span>
            </p>
            <p className="flex items-start gap-2 text-slate-400">
              <Building2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>বাড়ি ৪২, রোড ১১, ব্লক সি, বনানী, ঢাকা (শোরুম আউটলেট)</span>
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">গ্রাহক সেবা ও অর্ডার সহায়তা</h4>
            <p className="flex items-center gap-2 text-slate-400">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>হটলাইন: 01811-000001 (সকাল ৯টা - রাত ৯টা)</span>
            </p>
            <p className="flex items-center gap-2 text-slate-400">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>ইমেইল: sales@sunbirdcorp.com</span>
            </p>
            <p className="text-slate-400 mt-2">
              ক্যাশ অন ডেলিভারি এবং অনলাইন পেমেন্ট (SSLCOMMERZ) সমর্থিত।
            </p>
            <button
              onClick={() => setIsRmaOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
            >
              <span>🛡️ ওয়ারেন্টি ও রিটার্ন ক্লেইম (RMA Portal) →</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">অ্যাকাউন্টিং ও কমপ্লায়েন্স</h4>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>স্বয়ংক্রিয় মূসক-৬.৩ চালান</span>
              </div>
              <p className="text-[11px] text-slate-400">
                প্রতিটি সেলসের সাথে সাথে সিস্টেম স্বয়ংক্রিয়ভাবে জাবেদা ভাউচার (Journal Voucher) ও ট্যাক্স চালান তৈরি করে।
              </p>
            </div>
            <button
              onClick={() => setIsErpOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold cursor-pointer underline underline-offset-4"
            >
              কর্মকর্তা ও অ্যাডমিন লগইন →
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <div>
            © 2026 Sun Bird Corporation. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>NBR Mushak-6.3</span>
            <span>•</span>
            <span>Pathao & Steadfast Courier</span>
            <span>•</span>
            <span>SSLCOMMERZ Gateway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
