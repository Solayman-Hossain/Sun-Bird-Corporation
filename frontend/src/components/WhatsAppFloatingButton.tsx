'use client';

import React, { useState, useEffect } from 'react';
import './WhatsAppFloatingButton.css';
import { MessageCircle, X } from 'lucide-react';
import { DEFAULT_SOCIAL_SETTINGS } from './erp/ErpBannerManagerView';
import { SocialAndWhatsappSettings } from '../types';

export function WhatsAppFloatingButton() {
  const [settings, setSettings] = useState<SocialAndWhatsappSettings>(DEFAULT_SOCIAL_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sbc_social_settings');
        if (saved) {
          try {
            setSettings(JSON.parse(saved));
          } catch {
            // ignore
          }
        }
      }
    };

    loadSettings();
    window.addEventListener('sbc_social_updated', loadSettings);
    return () => window.removeEventListener('sbc_social_updated', loadSettings);
  }, []);

  if (!settings.isWhatsappWidgetActive) {
    return null;
  }

  const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    settings.whatsappDefaultMessage
  )}`;

  return (
    <aside aria-label="WhatsApp Support" className="whatsapp-floating-root no-print fixed bottom-6 left-6 z-40 flex flex-col items-start font-sans">
      {isOpen && (
        <div className="mb-3 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-4 w-72 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">সান বার্ড কর্পোরেশন</p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  হোয়াটসঅ্যাপ হেল্পডেস্ক (অনলাইন)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            আসসালামু আলাইকুম! যেকোনো মেডিকেল পণ্য, দরপত্র বা জরুরি অর্ডারে সরাসরি আমাদের হোয়াটসঅ্যাপে নক দিন।
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/30 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপে চ্যাট শুরু করুন</span>
          </a>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-emerald-950/20 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer font-bold text-xs"
        aria-label="Open WhatsApp Chat"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-100" />
        </span>
        <MessageCircle className="w-4 h-4 text-white fill-white" />
        <span className="hidden sm:inline">হোয়াটসঅ্যাপে কথা বলুন</span>
      </button>
    </aside>
  );
}

export default WhatsAppFloatingButton;

