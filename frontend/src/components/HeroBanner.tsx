'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './HeroBanner.css';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export interface HeroSlideData {
  id: number;
  label: string;
  heading: string;
  description: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  image: string;
  alt: string;
}

export const HERO_SLIDES: HeroSlideData[] = [
  {
    id: 1,
    label: 'আইসিইউ ও হসপিটাল কেয়ার',
    heading: 'আধুনিক আইসিইউ ও পেশেন্ট কেয়ার বেড',
    description: 'আন্তর্জাতিক মানসম্মত মাল্টিফাংশনাল ইলেকট্রিক ও ম্যানুয়াল হসপিটাল বেড — সান বার্ড কর্পোরেশনের ডিজিডিএ অনুমোদিত নিশ্চয়তা।',
    primaryCta: {
      label: 'পণ্য দেখুন',
      href: '#products',
    },
    secondaryCta: {
      label: 'অর্ডার ট্র্যাক করুন',
      href: '/track',
    },
    image: '/images/products/icu-bed.svg',
    alt: 'আইসিইউ হসপিটাল বেড - সান বার্ড কর্পোরেশন',
  },
  {
    id: 2,
    label: 'ডায়াগনস্টিক ও মনিটরিং',
    heading: 'মাল্টিপ্যারা পেশেন্ট মনিটর ও ডায়াগনস্টিক ডিভাইস',
    description: 'নির্ভুল পালস, ইসিজি ও রক্তচাপ পরিমাপে হাসপাতালের আইসিইউ এবং সিসিইউ-এর জন্য বিশ্বস্ত ক্লিনিক্যাল মনিটরিং ব্যবস্থা।',
    primaryCta: {
      label: 'পণ্য দেখুন',
      href: '#products',
    },
    secondaryCta: {
      label: 'অর্ডার ট্র্যাক করুন',
      href: '/track',
    },
    image: '/images/products/patient-monitor.svg',
    alt: 'মাল্টিপ্যারা পেশেন্ট মনিটর - সান বার্ড কর্পোরেশন',
  },
  {
    id: 3,
    label: 'জীবাণুমুক্তকরণ ও ওটি ইকুইপমেন্ট',
    heading: 'হাই-প্রেসার মেডিকেল অটোক্লেভ স্টেরিলাইজার',
    description: 'অপারেশন থিয়েটার ও ডেন্টাল ক্লিনিকের জন্য সর্বোচ্চ তাপ ও চাপে ১০০% নিরাপদ ব্যাকটেরিয়ামুক্ত নির্বীজন সমাধান।',
    primaryCta: {
      label: 'দাম জানুন',
      href: '#products',
    },
    secondaryCta: {
      label: 'অর্ডার ট্র্যাক করুন',
      href: '/track',
    },
    image: '/images/products/autoclave.svg',
    alt: 'মেডিকেল অটোক্লেভ স্টেরিলাইজার মেশিন',
  },
  {
    id: 4,
    label: 'রেসপিরেটরি ও জরুরি অক্সিজেন',
    heading: 'মেডিকেল গ্রেড অক্সিজেন কনসেনট্রেটর',
    description: 'হাসপাতাল ও হোম কেয়ারের জন্য ২৪ ঘণ্টা নিরবচ্ছিন্ন ৯৩%±৩% উচ্চ বিশুদ্ধতার জরুরি অক্সিজেন সাপোর্ট সিস্টেম।',
    primaryCta: {
      label: 'অর্ডার করুন',
      href: '#products',
    },
    secondaryCta: {
      label: 'অর্ডার ট্র্যাক করুন',
      href: '/track',
    },
    image: '/images/products/oxygen-concentrator.svg',
    alt: 'মেডিকেল অক্সিজেন কনসেনট্রেটর মেশিন',
  },
  {
    id: 5,
    label: 'ওয়ারেন্টি ও আফটার সেলস সার্ভিস',
    heading: 'বায়োমেডিকেল ওয়ারেন্টি ও আরএমএ সাপোর্ট',
    description: 'সান বার্ড কর্পোরেশনের সার্বক্ষণিক বিশেষজ্ঞ বায়োমেডিকেল ইঞ্জিনিয়ার টিম, জেনুইন স্পেয়ার পার্টস ও ফাস্ট ট্র্যাক রিপ্লেসমেন্ট।',
    primaryCta: {
      label: 'ওয়ারেন্টি ক্লেইম',
      href: '/rma',
    },
    secondaryCta: {
      label: 'অর্ডার ট্র্যাক করুন',
      href: '/track',
    },
    image: '/images/products/wheelchair.svg',
    alt: 'বায়োমেডিকেল সার্ভিস ও আরএমএ সাপোর্ট',
  },
];

export function HeroBanner() {
  const [slides, setSlides] = useState<HeroSlideData[]>(HERO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Sync custom banners from storage
  useEffect(() => {
    const loadCustomBanners = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sbc_custom_banners');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSlides(parsed);
              return;
            }
          } catch {
            // fallback
          }
        }
        setSlides(HERO_SLIDES);
      }
    };

    loadCustomBanners();
    window.addEventListener('sbc_banners_updated', loadCustomBanners);
    return () => window.removeEventListener('sbc_banners_updated', loadCustomBanners);
  }, []);

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const carouselRef = useRef<HTMLElement | null>(null);

  // Next and Previous navigation handlers
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  // Listen to document visibility to pause autoplay in inactive tabs
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-play timer every 5 seconds
  useEffect(() => {
    if (isHovered || isTabHidden || prefersReducedMotion) {
      return;
    }

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered, isTabHidden, prefersReducedMotion, nextSlide]);

  // Touch Swipe Handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) {
      return;
    }

    const diff = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45; // px

    if (diff > minSwipeDistance) {
      // Swiped Left -> Next Slide
      nextSlide();
    } else if (diff < -minSwipeDistance) {
      // Swiped Right -> Previous Slide
      prevSlide();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation when carousel is focused
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  return (
    <div className="hero-section-wrapper">
      <section
        ref={carouselRef}
        className="hero"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured products"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
      >
        {/* Previous Arrow Button */}
        <button
          type="button"
          onClick={prevSlide}
          className="hero-arrow hero-arrow-prev"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next Arrow Button */}
        <button
          type="button"
          onClick={nextSlide}
          className="hero-arrow hero-arrow-next"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Slide Track */}
        <div className="hero-carousel-container">
          {slides.map((slide, index) => {
            const isActive = index === currentIndex;

            return (
              <div
                key={slide.id}
                className={`hero-slide ${isActive ? 'active' : ''}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${slides.length}`}
                aria-hidden={!isActive}
              >
                <div className="hero-slide-grid">
                  {/* Left Column: Text & CTAs */}
                  <div className="hero-text-col">
                    <div className="hero-badge">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{slide.label}</span>
                    </div>

                    <h2 className="hero-heading">{slide.heading}</h2>

                    <p className="hero-description">{slide.description}</p>

                    <div className="hero-actions">
                      <Link href={slide.primaryCta.href} className="hero-btn">
                        <span>{slide.primaryCta.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <Link href={slide.secondaryCta.href} className="hero-btn-secondary">
                        <Truck className="w-4 h-4" />
                        <span>{slide.secondaryCta.label}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Visual Product Showcase */}
                  <div className="hero-image-col">
                    <div className="hero-image-card">
                      <Image
                        src={slide.image}
                        alt={slide.alt}
                        width={360}
                        height={240}
                        priority={index === 0}
                        className="hero-product-img"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Dot Indicators */}
        <div className="hero-dots-container">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={`hero-dot ${index === currentIndex ? 'active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
