'use client';

import React from 'react';
import './TrustStrip.css';
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Award,
  Users,
} from 'lucide-react';

interface TrustFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TRUST_FEATURES: TrustFeature[] = [
  {
    icon: <Truck className="w-5 h-5 text-[#1e3932]" />,
    title: 'Free Shipping',
    description: 'On orders over ৳5,000 across 64 districts',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-[#1e3932]" />,
    title: 'Secure Payments',
    description: '100% protected via SSLCOMMERZ & COD',
  },
  {
    icon: <RotateCcw className="w-5 h-5 text-[#1e3932]" />,
    title: 'Easy Warranty Claims',
    description: '1–3 Year official warranty & RMA portal',
  },
  {
    icon: <Award className="w-5 h-5 text-[#1e3932]" />,
    title: 'DGDA Certified',
    description: 'Imported equipment with NBR tax compliance',
  },
  {
    icon: <Users className="w-5 h-5 text-[#1e3932]" />,
    title: 'Trusted by Healthcare',
    description: 'Serving 500+ hospitals & diagnostic centers',
  },
];

export function TrustStrip() {
  return (
    <section className="py-12 border-t border-b border-[#eae5df] bg-white my-10">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] text-center mb-8 font-serif">
          Why Shop With Us?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {TRUST_FEATURES.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df]/70 hover:shadow-xs transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-white border border-[#eae5df] flex items-center justify-center mb-3 shadow-2xs">
                {item.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 leading-snug">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

