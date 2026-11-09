'use client';

import React, { useState, useEffect } from 'react';
import './ErpBannerManagerView.css';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Share2,
  MessageCircle,
  CheckCircle2,
  Save,
  Globe,
  Sliders,
  X,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { HERO_SLIDES, HeroSlideData } from '../HeroBanner';
import { SocialAndWhatsappSettings } from '../../types';

export const DEFAULT_SOCIAL_SETTINGS: SocialAndWhatsappSettings = {
  whatsappNumber: '+8801751195752',
  whatsappDefaultMessage: 'আসসালামু আলাইকুম! সান বার্ড কর্পোরেশনের মেডিকেল পণ্য সম্পর্কে বিস্তারিত জানতে চাই।',
  facebookUrl: 'https://facebook.com/sunbirdcorp',
  linkedinUrl: 'https://linkedin.com/company/sunbirdcorp',
  youtubeUrl: 'https://youtube.com/@sunbirdcorp',
  instagramUrl: 'https://instagram.com/sunbirdcorp',
  isWhatsappWidgetActive: true,
};

export function ErpBannerManagerView() {
  const { showToast } = useToast();

  // Banners state
  const [banners, setBanners] = useState<HeroSlideData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sbc_custom_banners');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return HERO_SLIDES;
  });

  // Social & WhatsApp settings
  const [socialSettings, setSocialSettings] = useState<SocialAndWhatsappSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sbc_social_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_SOCIAL_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<'BANNERS' | 'SOCIAL'>('BANNERS');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);

  // Banner form state
  const [label, setLabel] = useState('');
  const [heading, setHeading] = useState('');
  const [desc, setDesc] = useState('');
  const [primaryLabel, setPrimaryLabel] = useState('পণ্য দেখুন');
  const [primaryHref, setPrimaryHref] = useState('#products');
  const [secondaryLabel, setSecondaryLabel] = useState('অর্ডার ট্র্যাক করুন');
  const [secondaryHref, setSecondaryHref] = useState('/track');
  const [image, setImage] = useState('/images/products/icu-bed.svg');

  // Save banners to localStorage
  const saveBannersList = (updated: HeroSlideData[]) => {
    setBanners(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sbc_custom_banners', JSON.stringify(updated));
      window.dispatchEvent(new Event('sbc_banners_updated'));
    }
  };

  // Save social settings
  const handleSaveSocialSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('sbc_social_settings', JSON.stringify(socialSettings));
      window.dispatchEvent(new Event('sbc_social_updated'));
    }
    showToast('সোশ্যাল মিডিয়া ও হোয়াটসঅ্যাপ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  };

  // Open Edit Modal
  const handleOpenEdit = (slide: HeroSlideData) => {
    setEditingBannerId(slide.id);
    setLabel(slide.label);
    setHeading(slide.heading);
    setDesc(slide.description);
    setPrimaryLabel(slide.primaryCta.label);
    setPrimaryHref(slide.primaryCta.href);
    setSecondaryLabel(slide.secondaryCta.label);
    setSecondaryHref(slide.secondaryCta.href);
    setImage(slide.image);
    setIsEditModalOpen(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingBannerId(null);
    setLabel('নতুন অফার / মেডিকেল প্রযুক্তি');
    setHeading('আধুনিক ডায়াগনস্টিক ও ল্যাবরেটরি ইকুইপমেন্ট');
    setDesc('ডিজিডিএ অনুমোদিত কোয়ালিটি ও দেশব্যাপী ফ্রি ডেলিভারি নিশ্চয়তা।');
    setPrimaryLabel('অর্ডার করুন');
    setPrimaryHref('#products');
    setSecondaryLabel('অর্ডার ট্র্যাক করুন');
    setSecondaryHref('/track');
    setImage('/images/products/autoclave.svg');
    setIsEditModalOpen(true);
  };

  // Submit banner form
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBannerId !== null) {
      const updated = banners.map((b) => {
        if (b.id === editingBannerId) {
          return {
            ...b,
            label,
            heading,
            description: desc,
            primaryCta: { label: primaryLabel, href: primaryHref },
            secondaryCta: { label: secondaryLabel, href: secondaryHref },
            image,
          };
        }
        return b;
      });
      saveBannersList(updated);
      showToast('ব্যানার স্লাইড সফলভাবে আপডেট করা হয়েছে!', 'success');
    } else {
      const newSlide: HeroSlideData = {
        id: Date.now(),
        label,
        heading,
        description: desc,
        primaryCta: { label: primaryLabel, href: primaryHref },
        secondaryCta: { label: secondaryLabel, href: secondaryHref },
        image,
        alt: heading,
      };
      saveBannersList([...banners, newSlide]);
      showToast('নতুন ব্যানার স্লাইড সফলভাবে যুক্ত হয়েছে!', 'success');
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteBanner = (id: number) => {
    if (banners.length <= 1) {
      showToast('হোমপেজে কমপক্ষে ১টি সক্রিয় ব্যানার থাকতে হবে।', 'error');
      return;
    }
    if (confirm('আপনি কি নিশ্চিত যে এই ব্যানারটি মুছে ফেলতে চান?')) {
      const updated = banners.filter((b) => b.id !== id);
      saveBannersList(updated);
      showToast('ব্যানারটি মুছে ফেলা হয়েছে।', 'info');
    }
  };

  return (
    <div className="banner-manager-container space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-rose-400" />
            <span>ব্যানার ও সোশ্যাল মিডিয়া / হোয়াটসঅ্যাপ ম্যানেজার</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            হোমপেজের ক্যারোসেল ব্যানার ম্যানুয়ালি এডিট করুন এবং সোশ্যাল ও হোয়াটসঅ্যাপ লিংক সেট করুন
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'BANNERS' && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ব্যানার যোগ করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('BANNERS')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'BANNERS'
              ? 'bg-rose-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          হোমপেজ ক্যারোসেল ব্যানারসমূহ ({banners.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SOCIAL')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'SOCIAL'
              ? 'bg-rose-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          সোশ্যাল মিডিয়া ও হোয়াটসঅ্যাপ সেটিংস
        </button>
      </div>

      {/* Tab 1: Carousel Banners */}
      {activeTab === 'BANNERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((slide, idx) => (
            <div
              key={slide.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  স্লাইড #{idx + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(slide)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="এডিট করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(slide.id)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider">
                  {slide.label}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{slide.heading}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{slide.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-[#1e3932] text-white font-semibold">
                    {slide.primaryCta.label}
                  </span>
                  <span className="text-slate-500">→ {slide.primaryCta.href}</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">{slide.image}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Social Media & WhatsApp Settings */}
      {activeTab === 'SOCIAL' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <Share2 className="w-5 h-5 text-emerald-400" />
              <span>সোশ্যাল মিডিয়া পেজ ও হোয়াটসঅ্যাপ ইন্টিগ্রেশন</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              এখানে দেওয়া লিঙ্কগুলো সরাসরি ওয়েবসাইট ফুটার এবং লাইভ হোয়াটসঅ্যাপ ফ্লোটিং উইজেটে আপডেট হবে
            </p>
          </div>

          <form onSubmit={handleSaveSocialSettings} className="space-y-4 text-xs">
            {/* WhatsApp Config */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-white text-sm">হোয়াটসঅ্যাপ বিজনেস কনফিগারেশন</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialSettings.isWhatsappWidgetActive}
                    onChange={(e) =>
                      setSocialSettings({
                        ...socialSettings,
                        isWhatsappWidgetActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="font-semibold text-emerald-300">ফ্লোটিং উইজেট চালু রাখুন</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    হোয়াটসঅ্যাপ মোবাইল নাম্বার (কান্ট্রি কোড সহ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={socialSettings.whatsappNumber}
                    onChange={(e) =>
                      setSocialSettings({ ...socialSettings, whatsappNumber: e.target.value })
                    }
                    placeholder="+8801751195752"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    ডিফল্ট প্রারম্ভিক বার্তা (Pre-filled Message)
                  </label>
                  <input
                    type="text"
                    value={socialSettings.whatsappDefaultMessage}
                    onChange={(e) =>
                      setSocialSettings({
                        ...socialSettings,
                        whatsappDefaultMessage: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Social Pages Links */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">ফেসবুক পেজ লিঙ্ক (Facebook URL)</label>
                <input
                  type="url"
                  value={socialSettings.facebookUrl}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, facebookUrl: e.target.value })
                  }
                  placeholder="https://facebook.com/sunbirdcorp"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">লিঙ্কডইন পেজ লিঙ্ক (LinkedIn URL)</label>
                <input
                  type="url"
                  value={socialSettings.linkedinUrl}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, linkedinUrl: e.target.value })
                  }
                  placeholder="https://linkedin.com/company/sunbirdcorp"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ইউটিউব চ্যানেল (YouTube URL)</label>
                  <input
                    type="url"
                    value={socialSettings.youtubeUrl}
                    onChange={(e) =>
                      setSocialSettings({ ...socialSettings, youtubeUrl: e.target.value })
                    }
                    placeholder="https://youtube.com/@sunbirdcorp"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">ইনস্টাগ্রাম (Instagram URL)</label>
                  <input
                    type="url"
                    value={socialSettings.instagramUrl}
                    onChange={(e) =>
                      setSocialSettings({ ...socialSettings, instagramUrl: e.target.value })
                    }
                    placeholder="https://instagram.com/sunbirdcorp"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>সেটিংস সেভ করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit / Add Banner Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-rose-400" />
                <span>{editingBannerId ? 'ব্যানার স্লাইড এডিট' : 'নতুন ব্যানার স্লাইড তৈরি'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">ছোট ট্যাগ / লেবেল *</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="যেমন: আইসিইউ ও হসপিটাল কেয়ার"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ব্যানার হেডিং (Heading) *</label>
                <input
                  type="text"
                  required
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="যেমন: আধুনিক আইসিইউ ও পেশেন্ট কেয়ার বেড"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">বিবরণ (Description) *</label>
                <textarea
                  rows={2}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="আন্তর্জাতিক মানসম্মত মাল্টিফাংশনাল ইলেকট্রিক..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">প্রাইমারি বাটন টেক্সট</label>
                  <input
                    type="text"
                    value={primaryLabel}
                    onChange={(e) => setPrimaryLabel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">প্রাইমারি লিঙ্ক (Href)</label>
                  <input
                    type="text"
                    value={primaryHref}
                    onChange={(e) => setPrimaryHref(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">পণ্যের ছবি (SVG / Image Path)</label>
                <select
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="/images/products/icu-bed.svg">ICU Bed (/images/products/icu-bed.svg)</option>
                  <option value="/images/products/patient-monitor.svg">Patient Monitor (/images/products/patient-monitor.svg)</option>
                  <option value="/images/products/autoclave.svg">Autoclave Sterilizer (/images/products/autoclave.svg)</option>
                  <option value="/images/products/oxygen-concentrator.svg">Oxygen Concentrator (/images/products/oxygen-concentrator.svg)</option>
                  <option value="/images/products/wheelchair.svg">Wheelchair (/images/products/wheelchair.svg)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ErpBannerManagerView;

