'use client';

import React from 'react';
import './CategoryFilter.css';
import {
  Stethoscope,
  Activity,
  Wind,
  Bed,
  Flame,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CategoryFilterProps {
  categories?: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  productCounts?: Record<string, number>;
}

interface CategoryPillConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  bgTint: string;
  hoverTint: string;
  iconColor: string;
}

const CATEGORY_PILLS: CategoryPillConfig[] = [
  {
    id: 'All',
    label: 'All Equipment',
    icon: <Layers className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />,
    bgTint: 'bg-slate-100',
    hoverTint: 'hover:bg-slate-200',
    iconColor: 'text-slate-700',
  },
  {
    id: 'Home Diagnostics',
    label: 'Home Diagnostics',
    icon: <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />,
    bgTint: 'bg-cyan-50',
    hoverTint: 'hover:bg-cyan-100',
    iconColor: 'text-cyan-700',
  },
  {
    id: 'Surgical Consumables',
    label: 'Consumables & IV',
    icon: <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />,
    bgTint: 'bg-rose-50',
    hoverTint: 'hover:bg-rose-100',
    iconColor: 'text-rose-700',
  },
  {
    id: 'Monitoring',
    label: 'Patient Monitoring',
    icon: <Activity className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />,
    bgTint: 'bg-emerald-50',
    hoverTint: 'hover:bg-emerald-100',
    iconColor: 'text-emerald-700',
  },
  {
    id: 'Respiratory',
    label: 'Respiratory Care',
    icon: <Wind className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />,
    bgTint: 'bg-sky-50',
    hoverTint: 'hover:bg-sky-100',
    iconColor: 'text-sky-700',
  },
  {
    id: 'Hospital Furniture',
    label: 'Hospital Furniture',
    icon: <Bed className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />,
    bgTint: 'bg-amber-50',
    hoverTint: 'hover:bg-amber-100',
    iconColor: 'text-amber-800',
  },
  {
    id: 'Sterilization',
    label: 'Sterilization & Lab',
    icon: <Flame className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14" />,
    bgTint: 'bg-purple-50',
    hoverTint: 'hover:bg-purple-100',
    iconColor: 'text-purple-700',
  },
];

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  productCounts = {},
}: CategoryFilterProps) {
  return (
    <section className="category-filter-section">
      {/* Edge-to-Edge Responsive Pill Strip, evenly spaced across full container */}
      <div className="category-filter-strip">
        {CATEGORY_PILLS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = productCounts[cat.id];

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="category-pill-btn group focus:outline-none"
              title={cat.label}
            >
              {/* Circular Icon Container - Generously Sized */}
              <div
                className={`category-circular-pill ${cat.bgTint} ${cat.hoverTint} ${
                  isSelected ? 'active ring-4 ring-[#1e3932]' : ''
                }`}
              >
                <div
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isSelected ? 'text-[#1e3932]' : cat.iconColor
                  }`}
                >
                  {cat.icon}
                </div>

                {/* Item Count Pill Badge */}
                {typeof count === 'number' && (
                  <span
                    className={`category-count-badge ${
                      isSelected
                        ? 'bg-[#1e3932] text-white ring-2 ring-white'
                        : 'bg-white text-slate-800 border border-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>

              {/* Label Underneath - Clear, bold and readable */}
              <span
                className={`category-pill-label ${
                  isSelected
                    ? 'text-[#1e3932]'
                    : 'text-slate-800 group-hover:text-slate-950'
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
