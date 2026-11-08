'use client';

import React from 'react';
import Link from 'next/link';
import './Footer.css';
import {
  HeartPulse,
  PhoneCall,
  Mail,
  MapPin,
  ShieldCheck,
  Award,
  Truck,
  ExternalLink,
} from 'lucide-react';

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.75 1.75-1.75 1.76.78 1.76 1.75-.79 1.76-1.76 1.76m1.39 9.74v-8.37H5.07v8.37h2.78z" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19C2 8.77 2 12 2 12s0 3.23.42 4.81a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.23 22 12 22 12s0-3.23-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#162f29] text-slate-300 text-xs mt-auto border-t border-[#23423a]">
      {/* Upper Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1e3932] to-[#2d5248] flex items-center justify-center text-white shadow-md border border-emerald-500/30">
                <HeartPulse className="w-5 h-5 text-[#e6b980]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight font-serif">
                SUN BIRD CORP
              </span>
            </Link>

            <p className="text-[#e6b980] font-medium text-xs leading-relaxed">
              Precision Healthcare. A Healthier Nation.
            </p>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Direct importer and licensed distributor of DGDA-approved hospital equipment, surgical consumables, and home diagnostic medical devices across Bangladesh.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1f3f37] hover:bg-[#2c574c] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1f3f37] hover:bg-[#2c574c] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1f3f37] hover:bg-[#2c574c] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-[#1f3f37] hover:bg-[#2c574c] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Shop Categories */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wide">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Home Diagnostics
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Surgical Consumables & IV
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Patient Monitors & ECG
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Respiratory & Oxygen Care
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Hospital Beds & Stretchers
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition-colors">
                  Autoclaves & Sterilization
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Logistics */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wide">
              Customer Care & Logistics
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/track" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#e6b980]" />
                  <span>Track Your Order</span>
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Customer Portal & Invoices
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  Warranty & RMA Policy
                </Link>
              </li>
              <li>
                <Link href="/#shipping" className="hover:text-white transition-colors">
                  64 Districts Shipping Guide
                </Link>
              </li>
              <li>
                <Link href="/#vat" className="hover:text-white transition-colors">
                  NBR Mushak-6.3 Guidelines
                </Link>
              </li>
              <li>
                <Link href="/erp" className="hover:text-amber-300 transition-colors">
                  Staff ERP Operations
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Company & Compliance */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm tracking-wide">
              Company & Compliance
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">
                  About Sun Bird Corporation
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>DGDA Import License No. 4910</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#e6b980] shrink-0" />
                <span>NBR BIN: 002391029-0101</span>
              </li>
              <li>
                <Link href="/#institutional" className="hover:text-white transition-colors">
                  Institutional Tenders & L/C
                </Link>
              </li>
              <li>
                <Link href="/#careers" className="hover:text-white transition-colors">
                  Careers at Sun Bird
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-white transition-colors">
                  Contact Biomedical Dept.
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Hotline & Mobile Access */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm tracking-wide">
              24/7 Biomedical Support
            </h4>

            <div className="p-3.5 rounded-xl bg-[#1f3f37] border border-[#2d5248] space-y-2">
              <a
                href="tel:+8801711000000"
                className="flex items-center gap-2 text-[#e6b980] font-bold hover:underline"
              >
                <PhoneCall className="w-4 h-4 shrink-0" />
                <span>+880 1711-000000</span>
              </a>
              <a
                href="mailto:support@sunbirdcorp.com"
                className="flex items-center gap-2 text-slate-300 hover:text-white text-[11px]"
              >
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>support@sunbirdcorp.com</span>
              </a>
              <div className="flex items-start gap-2 text-slate-400 text-[11px] pt-1 border-t border-[#2d5248]">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>12/A Motijheel C/A, Dhaka-1000, Bangladesh</span>
              </div>
            </div>

            {/* App Store / Google Play Placeholder Badges */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-400">Download Our App</p>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700/80 flex items-center gap-2 text-[10px] text-slate-300">
                  <span>Google Play</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700/80 flex items-center gap-2 text-[10px] text-slate-300">
                  <span>App Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Legal */}
      <div className="border-t border-[#23423a] bg-[#122722] py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © 2026 Sun Bird Corporation. All rights reserved. NBR Mushak-6.3 Compliant.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/#privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/#terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/#cookies" className="hover:text-white transition-colors">
              Cookie Settings
            </Link>
            <span>•</span>
            <span className="text-emerald-400">DGDA Registered Importer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
