import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import './product-detail.css';
import {
  ShieldCheck,
  Award,
  Truck,
  RotateCcw,
  Star,
  ChevronRight,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { INITIAL_PRODUCTS } from '../../../lib/initialProducts';
import { Product } from '../../../types';
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';
import { TrustStrip } from '../../../components/TrustStrip';
import { ProductReviews } from '../../../components/ProductReviews';
import { ProductCard } from '../../../components/ProductCard';
import { CartDrawer } from '../../../components/CartDrawer';
import { CustomerSupportChat } from '../../../components/CustomerSupportChat';
import { MobileBottomNav } from '../../../components/MobileBottomNav';
import ProductDetailClientActions from './ProductDetailClientActions';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-generate static routes for all initial products
export function generateStaticParams() {
  return INITIAL_PRODUCTS.map((product) => ({
    slug: product.sku,
  }));
}

// Generate Dynamic Metadata for SEO & Social Sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSku = decodeURIComponent(slug).toUpperCase();
  const product = INITIAL_PRODUCTS.find(
    (p) => p.sku.toUpperCase() === decodedSku || p._id === slug
  );

  if (!product) {
    return {
      title: 'Medical Equipment Not Found | Sun Bird Corporation',
      description: 'The requested medical device could not be located in our catalog.',
    };
  }

  const currentPrice = product.price ?? product.retailPrice ?? 0;
  const title = `${product.name || product.nameEn} Price in Bangladesh | Sun Bird Corp`;
  const description =
    product.seoContent?.descriptionEn ||
    `Buy authentic DGDA-registered ${product.name || product.nameEn} at ৳${currentPrice}. 100% NBR Mushak-6.3 tax compliant with fast 64 districts delivery.`;

  return {
    metadataBase: new URL('https://sunbirdcorp.com'),
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: product.image || product.imageUrl || '/images/products/cannula.svg',
          width: 800,
          height: 600,
          alt: product.name || product.nameEn,
        },
      ],
    },
    other: {
      'product:price:amount': currentPrice.toString(),
      'product:price:currency': 'BDT',
      'product:availability': product.inStock ? 'in stock' : 'out of stock',
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSku = decodeURIComponent(slug).toUpperCase();
  const product = INITIAL_PRODUCTS.find(
    (p) => p.sku.toUpperCase() === decodedSku || p._id === slug
  );

  if (!product) {
    notFound();
  }

  const currentPrice = product.price ?? product.retailPrice ?? 0;
  const originalMrp = product.mrp ?? Math.round(currentPrice * 1.2);
  const discountPct =
    originalMrp > currentPrice
      ? Math.round(((originalMrp - currentPrice) / originalMrp) * 100)
      : 0;

  // Related recommended items in same category
  const relatedProducts = INITIAL_PRODUCTS.filter(
    (p) => p.category === product.category && p.sku !== product.sku
  ).slice(0, 4);

  // Schema.org MedicalDevice & Product JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Product', 'MedicalDevice'],
    name: product.name || product.nameEn,
    image: product.image || product.imageUrl,
    description: product.seoContent?.descriptionEn || product.nameEn,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Sun Bird Corporation',
    },
    offers: {
      '@type': 'Offer',
      url: `https://sunbirdcorp.com/products/${product.sku}`,
      priceCurrency: 'BDT',
      price: currentPrice,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Sun Bird Corporation Ltd.',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (product.rating ?? product.averageRating ?? 4.8).toFixed(1),
      reviewCount: product.reviewCount ?? product.ratingCount ?? 115,
    },
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap"
        >
          <Link href="/" className="hover:text-[#1e3932] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/#products" className="hover:text-[#1e3932] transition-colors">
            Categories
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-700">{product.category}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1e3932] font-semibold truncate max-w-xs">
            {product.name || product.nameEn}
          </span>
        </nav>

        {/* Main Product Showcase Grid */}
        <div className="bg-white rounded-3xl border border-[#eae5df] p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Image Area */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square rounded-2xl bg-[#f8f6f2] border border-[#eae5df] p-8 flex items-center justify-center overflow-hidden">
              {product.dgdaRegistration && (
                <span className="absolute top-4 left-4 z-10 text-xs font-semibold px-3 py-1 rounded-full bg-white text-[#1e3932] border border-[#eae5df] shadow-2xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>DGDA Approved</span>
                </span>
              )}

              {discountPct > 0 && (
                <span className="absolute top-4 right-4 z-10 text-xs font-bold px-3 py-1 rounded-full bg-rose-600 text-white shadow-2xs">
                  Save {discountPct}%
                </span>
              )}

              <img
                src={product.image || product.imageUrl || '/images/products/cannula.svg'}
                alt={product.name || product.nameEn}
                className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Quick Assurance Trust Box */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#eae5df] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#1e3932] shrink-0" />
                <span className="text-slate-700">64 Districts Delivery</span>
              </div>
              <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#eae5df] flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#1e3932] shrink-0" />
                <span className="text-slate-700">{product.warrantyPeriod || 'Official Warranty'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Pricing, & Interactive Cart Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#1e3932]/10 text-[#1e3932] text-xs font-semibold">
                  {product.category}
                </span>
                <span className="font-mono text-xs text-slate-500 font-medium">
                  SKU: {product.sku}
                </span>
              </div>

              {(product.banglaName || product.nameBn) && (
                <p className="text-sm font-semibold text-[#1e3932] font-bangla">
                  {product.banglaName || product.nameBn}
                </p>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif leading-tight">
                {product.name || product.nameEn}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <div className="flex items-center text-[#c89348]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#c89348]" />
                  ))}
                </div>
                <span className="font-bold text-slate-800">
                  {(product.rating ?? product.averageRating ?? 4.8).toFixed(1)}
                </span>
                <span className="text-slate-400">
                  ({product.reviewCount ?? product.ratingCount ?? 115} Verified Reviews)
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-5 rounded-2xl bg-[#faf8f5] border border-[#eae5df] space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#1a1a1a]">
                  ৳{currentPrice.toLocaleString('en-US')}
                </span>
                {originalMrp > currentPrice && (
                  <span className="text-base text-slate-400 line-through">
                    ৳{originalMrp.toLocaleString('en-US')}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Save ৳{(originalMrp - currentPrice).toLocaleString('en-US')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Statutory 15% NBR VAT included. Official Mushak-6.3 Tax Challan issued on every order.
              </p>
            </div>

            {/* Client-Side Interactive Stepper & Buttons */}
            <ProductDetailClientActions product={product} />

            {/* Full Specifications Table */}
            <div className="pt-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Technical Specifications
              </h3>
              <div className="rounded-2xl border border-[#eae5df] overflow-hidden text-xs sm:text-sm">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[#eae5df]">
                    <tr className="bg-[#faf8f5]">
                      <th className="py-2.5 px-4 font-semibold text-slate-700 w-1/3">
                        Model / SKU
                      </th>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        {product.sku}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-slate-700">
                        DGDA Registration
                      </th>
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-800">
                        {product.dgdaRegistration || 'DAR-MD-8921-2024'}
                      </td>
                    </tr>
                    <tr className="bg-[#faf8f5]">
                      <th className="py-2.5 px-4 font-semibold text-slate-700">
                        Country of Origin
                      </th>
                      <td className="py-2.5 px-4 text-slate-900">
                        {product.countryOfOrigin || 'Imported'}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-2.5 px-4 font-semibold text-slate-700">
                        Warranty Period
                      </th>
                      <td className="py-2.5 px-4 text-slate-900">
                        {product.warrantyPeriod || '1 Year Official Warranty'}
                      </td>
                    </tr>
                    {product.specifications &&
                      Object.entries(product.specifications).map(([key, val], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-[#faf8f5]' : ''}>
                          <th className="py-2.5 px-4 font-semibold text-slate-700">
                            {key}
                          </th>
                          <td className="py-2.5 px-4 text-slate-900">
                            {val}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Reviews Section */}
        <section className="bg-white rounded-3xl border border-[#eae5df] p-6 sm:p-10 shadow-sm space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            Verified Clinical Feedback
          </h2>
          <ProductReviews
            productId={product._id}
            productSku={product.sku}
            initialRating={product.rating ?? product.averageRating}
            initialReviewCount={product.reviewCount ?? product.ratingCount}
          />
        </section>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
              Related Medical Equipment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <Link key={p.sku} href={`/products/${p.sku}`}>
                  <ProductCard product={p} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <TrustStrip />
      <Footer />
      <CartDrawer />
      <CustomerSupportChat />
      <div className="h-16 lg:hidden" />
      <MobileBottomNav />
    </div>
  );
}
