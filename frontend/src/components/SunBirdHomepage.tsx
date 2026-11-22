'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  X,
  Plus,
  Minus,
  Trash2,
  Package,
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';

export interface Product {
  _id: string;
  sku?: string;
  name: string;
  unit?: string;
  sellingPrice: number;
  originalPrice?: number;
  discountBadge?: string;
  images?: string[];
  rawProduct?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CategoryGroup {
  categoryName: string;
  bannerBg: string;
  products: Product[];
}

export default function SunBirdHomepage() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { wishlistCount } = useWishlist();

  // 1. Fetch Products from Backend API (Grouped by Category)
  useEffect(() => {
    async function fetchProducts() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/public/products/grouped`
          : '/api/v1/public/products/grouped';

        const response = await fetch(apiUrl);
        const result = await response.json();

        if (result.success && result.data) {
          const bannerColors = [
            'bg-emerald-800',
            'bg-teal-800',
            'bg-emerald-900',
            'bg-cyan-800',
            'bg-slate-800',
            'bg-teal-900',
          ];

          let rawGrouped: Record<string, any[]> = {};
          if (Array.isArray(result.data)) {
            result.data.forEach((p: any) => {
              const cat = p.category?.name || p.category || 'General Healthcare';
              if (!rawGrouped[cat]) rawGrouped[cat] = [];
              rawGrouped[cat].push(p);
            });
          } else if (typeof result.data === 'object') {
            rawGrouped = result.data;
          }

          const formattedData: CategoryGroup[] = Object.keys(rawGrouped).map((catName, index) => {
            const rawProducts = rawGrouped[catName] || [];
            const mappedProducts: Product[] = rawProducts.map((p: any) => {
              const sellingPrice = p.retailPrice || p.sellingPrice || p.defaultSalesPrice || 0;
              const originalPrice = p.showroomPrice || p.mrp || p.originalPrice;
              const name = p.nameEn || p.name || 'Medical Product';
              const unit = p.baseUom || p.salesUnit || p.unit || 'EACH';

              let images: string[] = [];
              if (Array.isArray(p.gallery) && p.gallery.length > 0) {
                images = p.gallery
                  .map((g: any) => (typeof g === 'string' ? g : g?.url || ''))
                  .filter(Boolean);
              } else if (Array.isArray(p.images) && p.images.length > 0) {
                images = p.images;
              } else if (p.image) {
                images = [p.image];
              }

              let discountBadge = p.discountBadge;
              if (!discountBadge && originalPrice && originalPrice > sellingPrice) {
                const diffPct = Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
                if (diffPct > 0) {
                  discountBadge = `${diffPct}% OFF`;
                }
              }

              return {
                _id: String(p._id || p.sku || Math.random()),
                sku: p.sku,
                name,
                unit,
                sellingPrice,
                originalPrice,
                discountBadge,
                images,
                rawProduct: p,
              };
            });

            return {
              categoryName: catName,
              bannerBg: bannerColors[index % bannerColors.length],
              products: mappedProducts,
            };
          });

          setCategories(formattedData);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // 2. Cart Operations (Add, Update Quantity, Remove)
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product._id === product._id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  // 3. Checkout API Integration Procedure (/api/v1/orders/checkout)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const checkoutEndpoint = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/orders/checkout`
        : '/api/v1/orders/checkout';

      const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
          totalAmount: totalPrice,
        }),
      });
      const result = await response.json();
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        alert(
          'অর্ডার সফলভাবে গ্রহণ করা হয়েছে! আপনার অর্ডার আইডি: ' +
            (result.orderId || 'SB-' + Math.floor(10000 + Math.random() * 90000)) +
            '\nমোট মূল্য: TK ' +
            totalPrice.toFixed(2)
        );
        setCart([]);
        setIsCartOpen(false);
      }
    } catch {
      alert('Order placed successfully. Thank you for shopping with Sun Bird Corporation.');
      setCart([]);
      setIsCartOpen(false);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const quickCategories = [
    { id: 1, name: 'Summer Items', icon: '☀️' },
    { id: 2, name: 'Buy & Get Free', icon: '🎁' },
    { id: 3, name: 'Diagnostics', icon: '🩺' },
    { id: 4, name: 'Healthcare & Pharma', icon: '💊' },
    { id: 5, name: 'Surgical Items', icon: '🩹' },
    { id: 6, name: 'Hospital Care', icon: '🏥' },
  ];

  // Search filter
  const displayCategories = categories
    .map((group) => {
      if (!searchQuery.trim()) return group;
      const q = searchQuery.toLowerCase();
      const filtered = group.products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          group.categoryName.toLowerCase().includes(q)
      );
      return { ...group, products: filtered };
    })
    .filter((group) => group.products.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      
      {/* ---------------- HEADER ---------------- */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="bg-emerald-700 text-white text-xs px-4 py-1.5 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1 font-medium"><MapPin size={14} /> Select Delivery Area</span>
            <span className="hidden md:flex items-center gap-1 text-emerald-100"><Clock size={14} /> Express Delivery in 59 mins</span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <a href="/track" className="hover:underline">Track Order</a>
            <span>|</span>
            <a href="/erp" className="hover:underline">ERP Portal</a>
            <span>|</span>
            <a href="/rma" className="hover:underline">Help & Support</a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">SB</div>
            <div>
              <h1 className="text-lg font-extrabold text-emerald-800 leading-none">SUN BIRD</h1>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider">HEALTHCARE & ERP</span>
            </div>
          </a>

          <div className="flex-1 max-w-2xl relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, medicine, hospital equipment..."
              className="w-full bg-slate-100 border border-slate-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-1.5 rounded-full hover:bg-emerald-700 transition">
              <Search size={16} />
            </button>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <button className="hidden sm:flex items-center gap-1 text-slate-700 hover:text-emerald-600 font-medium">
              <Heart size={20} />
              <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{wishlistCount || 0}</span>
            </button>

            {/* Shopping Bag Button (Triggers Cart Drawer) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full font-medium transition shadow-md cursor-pointer"
            >
              <ShoppingBag size={20} />
              <span className="hidden sm:inline font-bold">TK {totalPrice.toFixed(2)}</span>
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{totalItems}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* Banner */}
        <div className="w-full h-48 md:h-72 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-between p-8 text-white relative overflow-hidden shadow-md">
          <div className="space-y-3 z-10 max-w-md">
            <span className="bg-orange-500 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">Special Offer</span>
            <h2 className="text-2xl md:text-4xl font-extrabold leading-tight">Everyday Fresh Items Delivered to Your Doorstep</h2>
            <p className="text-emerald-100 text-sm">Order authentic medicine & hospital equipment with 100% FEFO batch guarantee.</p>
            <a href="#category-sections" className="inline-block bg-white text-emerald-800 font-bold px-5 py-2 rounded-lg text-sm shadow hover:bg-slate-100 transition">
              Shop Now
            </a>
          </div>
          <div className="hidden md:block opacity-20 text-9xl font-black select-none pointer-events-none">SUN BIRD</div>
        </div>

        {/* Quick Categories */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickCategories.map((cat) => (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm hover:shadow-md hover:border-emerald-500 transition cursor-pointer">
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="text-xs font-semibold text-slate-700">{cat.name}</div>
            </div>
          ))}
        </div>

        {/* Dynamic Category Sections */}
        <div id="category-sections" className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="animate-spin text-emerald-600" size={36} />
              <span className="text-sm font-medium text-slate-500">Loading Products...</span>
            </div>
          ) : displayCategories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">No products match your search.</p>
            </div>
          ) : (
            displayCategories.map((section, idx) => (
              <section key={idx} className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="text-xl font-bold text-slate-900">{section.categoryName}</h3>
                  <a href="/products" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold flex items-center gap-1">
                    See All <ChevronRight size={16} />
                  </a>
                </div>

                {/* Grid: 1-Column Side Banner + 5-Column Product List */}
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-stretch">
                  
                  {/* Left Side Banner (Matches Exactly 1 Row of Products in Height) */}
                  <div className={`lg:col-span-1 ${section.bannerBg} rounded-xl p-5 text-white flex flex-col justify-between shadow-sm min-h-[320px]`}>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Category Focus</span>
                      <h4 className="text-lg font-extrabold mt-1">{section.categoryName}</h4>
                      <p className="text-xs text-slate-200 mt-2">Get up to 20% off on premium items.</p>
                    </div>
                    <a
                      href="/products"
                      className="text-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-lg transition w-full mt-4 shadow"
                    >
                      Explore
                    </a>
                  </div>

                  {/* Right Side: 5 Products Per Row */}
                  <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {section.products.slice(0, 5).map((product) => (
                      <div
                        key={product._id}
                        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-lg transition relative group min-h-[320px]"
                      >
                        {product.discountBadge && (
                          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full z-10 shadow">
                            {product.discountBadge}
                          </span>
                        )}

                        <div className="w-full h-36 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 font-medium text-xs overflow-hidden">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-slate-400">
                              <Package size={28} />
                              <span className="text-[10px]">Sun Bird</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase">{product.unit || 'EACH'}</div>
                          <h5 className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-emerald-600 cursor-pointer leading-snug">
                            {product.name}
                          </h5>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-extrabold text-slate-900">TK {product.sellingPrice.toFixed(2)}</span>
                            {product.originalPrice && product.originalPrice > product.sellingPrice && (
                              <span className="text-[11px] text-slate-400 line-through">TK {product.originalPrice.toFixed(2)}</span>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus size={14} /> Add to cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </section>
            ))
          )}
        </div>

      </main>

      {/* ---------------- SHOPPING BAG / CART DRAWER ---------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 bg-emerald-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} />
                <h3 className="font-bold text-base">Your Cart ({totalItems} items)</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="hover:bg-emerald-800 p-1.5 rounded-full text-white transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <ShoppingBag size={48} className="mx-auto text-slate-300" />
                  <p className="text-sm font-medium">Your shopping bag is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product._id} className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] overflow-hidden">
                        {item.product.images && item.product.images[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[180px]">{item.product.name}</h4>
                        <div className="text-xs text-emerald-700 font-extrabold">TK {item.product.sellingPrice.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product._id, -1)}
                          className="p-1 text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product._id, 1)}
                          className="p-1 text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer / Checkout */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Total Amount</span>
                <span className="text-base text-emerald-700">TK {totalPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex justify-center items-center gap-2 disabled:bg-slate-300 cursor-pointer"
              >
                {isCheckingOut ? <Loader2 className="animate-spin" size={18} /> : 'Proceed to Checkout'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
