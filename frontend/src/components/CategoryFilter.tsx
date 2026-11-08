'use client';

import React from 'react';
import './CategoryFilter.css';
import {
  Stethoscope,
  Activity,
  Wind,
  Bed,
  Flame,
  ShieldCheck,
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
    icon: <Layers className="w-7 h-7" />,
    bgTint: 'bg-slate-100',
    hoverTint: 'hover:bg-slate-200',
    iconColor: 'text-slate-700',
  },
  {
    id: 'Home Diagnostics',
    label: 'Home Diagnostics',
    icon: <Stethoscope className="w-7 h-7" />,
    bgTint: 'bg-cyan-50',
    hoverTint: 'hover:bg-cyan-100',
    iconColor: 'text-cyan-700',
  },
  {
    id: 'Surgical Consumables',
    label: 'Consumables & IV',
    icon: <Sparkles className="w-7 h-7" />,
    bgTint: 'bg-rose-50',
    hoverTint: 'hover:bg-rose-100',
    iconColor: 'text-rose-700',
  },
  {
    id: 'Monitoring',
    label: 'Patient Monitoring',
    icon: <Activity className="w-7 h-7" />,
    bgTint: 'bg-emerald-50',
    hoverTint: 'hover:bg-emerald-100',
    iconColor: 'text-emerald-700',
  },
  {
    id: 'Respiratory',
    label: 'Respiratory Care',
    icon: <Wind className="w-7 h-7" />,
    bgTint: 'bg-sky-50',
    hoverTint: 'hover:bg-sky-100',
    iconColor: 'text-sky-700',
  },
  {
    id: 'Hospital Furniture',
    label: 'Hospital Furniture',
    icon: <Bed className="w-7 h-7" />,
    bgTint: 'bg-amber-50',
    hoverTint: 'hover:bg-amber-100',
    iconColor: 'text-amber-800',
  },
  {
    id: 'Sterilization',
    label: 'Sterilization & Lab',
    icon: <Flame className="w-7 h-7" />,
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
    <section className="w-full py-4">
      {/* Scrollable Horizontal Pill Carousel */}
      <div className="flex items-center justify-start md:justify-center gap-4 sm:gap-6 overflow-x-auto pb-4 pt-2 px-2 scrollbar-none">
        {CATEGORY_PILLS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = productCounts[cat.id];

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center gap-2.5 shrink-0 group focus:outline-none cursor-pointer"
            >
              {/* Circular Icon Container */}
              <div
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                  cat.bgTint
                } ${cat.hoverTint} ${
                  isSelected
                    ? 'ring-3 ring-[#1e3932] shadow-md scale-105'
                    : 'border border-[#eae5df] hover:scale-105 hover:shadow-xs'
                }`}
              >
                <div
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isSelected ? 'text-[#1e3932]' : cat.iconColor
                  }`}
                >
                  {cat.icon}
                </div>

                {/* Optional Item Count Pill */}
                {typeof count === 'number' && (
                  <span
                    className={`absolute -bottom-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-[#1e3932] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>

              {/* Label Underneath */}
              <span
                className={`text-xs font-medium text-center whitespace-nowrap transition-colors max-w-[85px] leading-tight ${
                  isSelected
                    ? 'text-[#1e3932] font-bold'
                    : 'text-slate-700 group-hover:text-slate-950'
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
