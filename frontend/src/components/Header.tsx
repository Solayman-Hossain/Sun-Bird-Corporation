'use client';

import React, { useState, useEffect } from 'react';
import './Header.css';
import { Navbar } from './Navbar';
import { CategoryNav } from './CategoryNav';
import { Product } from '../types';

interface HeaderProps {
  onSearch?: (q: string) => void;
  showSearch?: boolean;
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export function Header({
  onSearch,
  showSearch = true,
  activeCategory = 'All',
  onSelectCategory,
  onSelectProduct,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`header-master-wrapper ${isScrolled ? 'scrolled' : ''}`}>
      {/* Primary Brand & Search Bar */}
      <Navbar
        onSearch={onSearch}
        showSearch={showSearch}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onSelectProduct={onSelectProduct}
      />

      {/* Secondary Sticky Category Menu & Mega Menu */}
      <CategoryNav
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
}

export default Header;

