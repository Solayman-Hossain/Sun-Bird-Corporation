'use client';

import React, { useState } from 'react';
import './NewsletterSection.css';
import { Mail, CheckCircle2, Sparkles, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid healthcare email address', 'error');
      return;
    }

    setIsSubscribed(true);
    showToast('Thank you for subscribing to Sun Bird Healthcare Updates!', 'success');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 my-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#f5ede4] via-[#faf6f0] to-[#f4ebe1] border border-[#eae5df] p-8 md:p-12 shadow-xs">
        {/* Subtle Botanical / Heart Watermark */}
        <div className="absolute right-4 -bottom-10 opacity-10 pointer-events-none text-[#1e3932]">
          <Sparkles className="w-64 h-64" />
        </div>

        <div className="max-w-2xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#eae5df] text-[#1e3932] text-xs font-semibold shadow-2xs">
            <Mail className="w-3.5 h-3.5 text-[#c89348]" />
            <span>Healthcare Community & Tenders</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight font-serif">
            Join Our Healthcare Network
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Be the first to receive updates on new imported medical supplies, institutional tenders, and seasonal discounts directly in your inbox.
          </p>

          {isSubscribed ? (
            <div className="p-4 rounded-2xl bg-white border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>You are successfully subscribed with {email}!</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your hospital or clinic email..."
                required
                className="w-full sm:flex-1 px-4 py-3 rounded-full bg-white border border-[#eae5df] text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1e3932] focus:ring-2 focus:ring-[#1e3932]/10 transition-all shadow-2xs"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-medium text-xs sm:text-sm transition-all shadow-md shadow-[#1e3932]/25 inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Subscribe</span>
                <Send className="w-3.5 h-3.5 text-[#e6b980]" />
              </button>
            </form>
          )}

          <p className="text-[11px] text-slate-400">
            We respect your privacy. No spam. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}

