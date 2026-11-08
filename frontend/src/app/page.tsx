'use client';

import React, { useState, useEffect, useMemo } from 'react';
import './home.css';
import { Navbar } from '../components/Navbar';
import { CategoryNav } from '../components/CategoryNav';
import { HeroBanner } from '../components/HeroBanner';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductCard } from '../components/ProductCard';
import { ProductSection } from '../components/ProductSection';
import { SplitPromoBanners } from '../components/SplitPromoBanners';
import { TrustStrip } from '../components/TrustStrip';
import { NewsletterSection } from '../components/NewsletterSection';
import { ProductModal } from '../components/ProductModal';
import { CartDrawer } from '../components/CartDrawer';
import { WishlistDrawer } from '../components/WishlistDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { ErpPortalModal } from '../components/ErpPortalModal';
import { RmaClaimModal } from '../components/RmaClaimModal';
import { CustomerSupportChat } from '../components/CustomerSupportChat';
import { Footer } from '../components/Footer';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Product, OrderConfirmation } from '../types';
import { getPublicProducts } from '../lib/api';
import { INITIAL_PRODUCTS } from '../lib/initialProducts';
import { HeartPulse } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);
  const [isErpOpen, setIsErpOpen] = useState(false);
  const [isRmaOpen, setIsRmaOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        (p.name && p.name.toLowerCase().includes(q)) ||
        p.nameEn.toLowerCase().includes(q) ||
        (p.nameBn && p.nameBn.includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Curated product sections for the storefront home
  const featuredProducts = useMemo(() => {
    const list = products.filter((p) => p.isFeatured);
    return list.length > 0 ? list.slice(0, 4) : products.slice(0, 4);
  }, [products]);

  const newArrivals = useMemo(() => {
    const list = products.filter((p) => p.isNewArrival);
    return list.length > 0 ? list.slice(0, 4) : products.slice(4, 8);
  }, [products]);

  const bestSellers = useMemo(() => {
    const list = products.filter((p) => p.isBestSeller);
    return list.length > 0 ? list.slice(0, 4) : products.slice(8, 12);
  }, [products]);

  const isBrowsingAll = selectedCategory === 'All' && !searchQuery.trim();

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col font-sans text-slate-800">
      {/* Navbar & Sticky Category Bar */}
      <Navbar
        onSearch={setSearchQuery}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <CategoryNav
        activeCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      {/* Hero Section */}
      <HeroBanner />

      {/* Circular Category Pills Carousel */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          productCounts={productCounts}
        />
      </div>

      {/* Main Storefront Product Section */}
      <main id="products" className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-10">
        {!isBrowsingAll ? (
          /* Filtered Search / Category Catalog View */
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-[#eae5df] pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                  {selectedCategory === 'All' ? 'Search Results' : selectedCategory}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredProducts.length} certified medical items
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-[#1e3932] hover:underline cursor-pointer"
              >
                Clear all filters ✕
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#eae5df] space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <HeartPulse className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No medical devices found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No products matched your search or category filter. Try searching for &quot;BP&quot;, &quot;Cannula&quot;, or &quot;Nebulizer&quot;.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-5 py-2.5 bg-[#1e3932] text-white text-xs font-semibold rounded-full hover:bg-[#162f29] transition-colors cursor-pointer"
                >
                  View All Equipment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.sku}
                    product={product}
                    onQuickView={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Default Rich Homepage Layout Matching Design Reference */
          <>
            {/* 1. Featured Products (4-Column Grid) */}
            <ProductSection
              id="featured"
              title="Featured Products"
              subtitle="Hospital-grade diagnostic devices and consumables tested for accuracy"
              products={featuredProducts}
              onQuickView={setSelectedProduct}
              viewAllHref="#products"
            />

            {/* 2. Split Promotional Dual Banners */}
            <SplitPromoBanners onSelectCategory={setSelectedCategory} />

            {/* 3. New Arrivals (4-Column Grid) */}
            <ProductSection
              id="new-arrivals"
              title="New Arrivals"
              subtitle="Recently cleared DGDA shipments and modern clinical releases"
              products={newArrivals}
              onQuickView={setSelectedProduct}
              viewAllHref="#products"
            />

            {/* 4. Best Sellers (4-Column Grid) */}
            <ProductSection
              id="best-sellers"
              title="Best Sellers"
              subtitle="Most trusted medical equipment by doctors, clinics and families"
              products={bestSellers}
              onQuickView={setSelectedProduct}
              viewAllHref="#products"
            />
          </>
        )}
      </main>

      {/* "Why Shop With Us?" Trust & Guarantee Value Strip */}
      <TrustStrip />

      {/* Join Our Healthcare Network / Newsletter */}
      <NewsletterSection />

      {/* Modals & Overlays */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <WishlistDrawer />

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

      {/* Comprehensive Medical Compliance Footer */}
      <Footer />

      {/* Mobile Spacer to prevent overlap with bottom navigation */}
      <div className="h-16 lg:hidden" />

      {/* Modern Fixed Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenCategories={() => setIsMobileMenuOpen(true)} />
    </div>
  );
}
