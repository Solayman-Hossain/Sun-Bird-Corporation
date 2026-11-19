'use client';

import React, { useState, useEffect, useTransition } from 'react';
import './ErpMarketingView.css';
import {
  Megaphone,
  Image as ImageIcon,
  Sliders,
  Calendar,
  Share2,
  FileText,
  Sparkles,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  Edit2,
  Trash2,
  Printer,
  Download,
  AlertCircle,
  TrendingUp,
  Globe,
  Settings,
  ShieldCheck,
  Check,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Layout,
  History,
  RotateCcw,
  Sparkle,
  Layers,
  ArrowRight,
  Wand2,
  Bot
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { MarketingSubmodule } from '../../types';
import {
  marketingService,
  WebsiteBannerData,
  MarketingCampaignData,
  MarketingPromotionData,
  WebsiteContentData,
  LandingPageData,
  SocialAccountData,
  SocialPostData
} from '../../services/marketing.service';

interface ErpMarketingViewProps {
  submodule?: MarketingSubmodule;
  onSelectSubmodule?: (submodule: MarketingSubmodule) => void;
}

export function ErpMarketingView({
  submodule = 'marketing-dashboard',
  onSelectSubmodule,
}: ErpMarketingViewProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const activeSubmodule: MarketingSubmodule = submodule || 'marketing-dashboard';
  const setSubmodule = (s: MarketingSubmodule) => {
    if (onSelectSubmodule) onSelectSubmodule(s);
  };

  // ── Global Loading & Search States ──
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Domain Data States ──
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [banners, setBanners] = useState<WebsiteBannerData[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaignData[]>([]);
  const [promotions, setPromotions] = useState<MarketingPromotionData[]>([]);
  const [contents, setContents] = useState<WebsiteContentData[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPageData[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountData[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPostData[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [marketingSettings, setMarketingSettings] = useState<any>(null);

  // ── Modals State ──
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showSocialPostModal, setShowSocialPostModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // ── Form States ──
  const [bannerForm, setBannerForm] = useState({
    name: '',
    bannerType: 'HERO_SLIDER',
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '/images/products/icu-bed.svg',
    buttonText: 'অর্ডার করুন',
    buttonLink: '#products',
    displayPosition: 'HOMEPAGE_HERO',
    displayOrder: 1,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    backgroundColor: '#1e3932',
    textColor: '#ffffff',
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    campaignType: 'FESTIVAL',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    budget: 50000,
    discountPercentage: 10,
    couponCode: 'EID2026',
    targetAudience: 'ALL',
  });

  const [contentForm, setContentForm] = useState({
    contentKey: 'ABOUT_US',
    title: 'আমাদের সম্পর্কে (About Sun Bird Corporation)',
    contentType: 'PAGE',
    body: 'সান বার্ড কর্পোরেশন বাংলাদেশে আন্তর্জাতিক মানের মেডিকেল, আইসিইউ ও হসপিটাল ইকুইপমেন্টের শীর্ষস্থানীয় সরবরাহকারী।',
    changeSummary: 'হালনাগাদ কনটেন্ট',
  });

  const [socialForm, setSocialForm] = useState({
    title: '',
    contentType: 'PRODUCT_SHOWCASE',
    primaryCaption: '',
    hashtags: '#SunBirdCorp #MedicalEquipment #Healthcare',
    platform: 'FACEBOOK',
    scheduledDate: new Date().toISOString().slice(0, 10),
  });

  const [aiForm, setAiForm] = useState({
    task: 'BANNER_COPY',
    productName: 'মাল্টিপ্যারা পেশেন্ট মনিটর',
    tone: 'PROFESSIONAL',
  });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // ── Load Initial Data ──
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [metricsRes, bannersRes, campaignsRes, accountsRes, settingsRes] = await Promise.allSettled([
        marketingService.getDashboardMetrics(),
        marketingService.getBanners(),
        marketingService.getCampaigns(),
        marketingService.getSocialAccounts(),
        marketingService.getSettings(),
      ]);

      if (metricsRes.status === 'fulfilled') setDashboardMetrics(metricsRes.value);
      if (bannersRes.status === 'fulfilled') setBanners(bannersRes.value.banners || []);
      if (campaignsRes.status === 'fulfilled') setCampaigns(campaignsRes.value.campaigns || []);
      if (accountsRes.status === 'fulfilled') setSocialAccounts(accountsRes.value || []);
      if (settingsRes.status === 'fulfilled') setMarketingSettings(settingsRes.value || null);
    } catch (err: any) {
      console.error('Error loading marketing initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // ── Submodule Specific Lazy Loading ──
  useEffect(() => {
    const fetchSubmoduleData = async () => {
      try {
        if (['promotional-campaigns', 'product-promotions', 'category-promotions', 'brand-promotions'].includes(activeSubmodule)) {
          const [c, p] = await Promise.all([marketingService.getCampaigns(), marketingService.getPromotions()]);
          setCampaigns(c.campaigns || []);
          setPromotions(p || []);
        } else if (['website-content', 'homepage-sections', 'landing-pages', 'navigation-menu'].includes(activeSubmodule)) {
          const [cnt, lp] = await Promise.all([marketingService.getAllContent(), marketingService.getLandingPages()]);
          setContents(cnt || []);
          setLandingPages(lp || []);
        } else if (['social-media-management', 'social-accounts', 'social-content', 'social-calendar'].includes(activeSubmodule)) {
          const [acc, posts] = await Promise.all([marketingService.getSocialAccounts(), marketingService.getSocialPosts()]);
          setSocialAccounts(acc || []);
          setSocialPosts(posts.posts || []);
        } else if (['marketing-calendar', 'campaign-scheduler', 'scheduled-publishing'].includes(activeSubmodule)) {
          const cal = await marketingService.getMarketingCalendar();
          setCalendarEvents(cal || []);
        } else if (activeSubmodule === 'marketing-activity-logs') {
          const logs = await marketingService.getAuditLogs();
          setAuditLogs(logs || []);
        }
      } catch (err) {
        console.error('Error fetching submodule data:', err);
      }
    };
    fetchSubmoduleData();
  }, [activeSubmodule]);

  // ── AI Helper: Quick In-Place Copy Generation ──
  const handleAiAutoFill = async (context: 'BANNER' | 'CAMPAIGN' | 'CONTENT' | 'SOCIAL') => {
    setAiLoading(true);
    try {
      if (context === 'BANNER') {
        const prod = bannerForm.name || 'আইসিইউ ও হসপিটাল বেড';
        const res = await marketingService.generateAiSuggestions({
          task: 'BANNER_COPY',
          productName: prod,
          tone: 'PROFESSIONAL',
          language: 'bn',
        });
        if (res.suggestions && res.suggestions.length > 0) {
          setBannerForm((prev) => ({
            ...prev,
            title: res.suggestions[0] || prev.title,
            subtitle: res.suggestions[1] || 'DGDA অনুমোদিত আন্তর্জাতিক মানসম্মত নিশ্চয়তা',
            buttonText: 'অর্ডার ও দাম জানুন',
          }));
          showToast('এআই দ্বারা ব্যানার টাইটেল ও সাবটাইটেল স্বয়ংক্রিয়ভাবে পূর্ণ হয়েছে!', 'success');
        }
      } else if (context === 'CAMPAIGN') {
        const res = await marketingService.generateAiSuggestions({
          task: 'CAMPAIGN_IDEAS',
          productName: campaignForm.name || 'মেডিকেল ডিভাইস',
          tone: 'FESTIVE',
          language: 'bn',
        });
        if (res.suggestions && res.suggestions.length > 0) {
          setCampaignForm((prev) => ({
            ...prev,
            description: res.suggestions[0] || prev.description,
            couponCode: 'MEDFEST26',
          }));
          showToast('এআই দ্বারা ক্যাম্পেইন আইডিয়া ও কুপন কোড তৈরি হয়েছে!', 'success');
        }
      } else if (context === 'CONTENT') {
        const res = await marketingService.generateAiSuggestions({
          task: 'CMS_CONTENT',
          productName: contentForm.title,
          tone: 'PROFESSIONAL',
          language: 'bn',
        });
        if (res.suggestions && res.suggestions.length > 0) {
          setContentForm((prev) => ({
            ...prev,
            body: res.suggestions.join('\n\n'),
          }));
          showToast('এআই দ্বারা কনটেন্ট অপ্টিমাইজড হয়েছে!', 'success');
        }
      } else if (context === 'SOCIAL') {
        const res = await marketingService.generateAiSuggestions({
          task: 'SOCIAL_CAPTION',
          productName: socialForm.title || 'পেশেন্ট মনিটর',
          tone: 'PROFESSIONAL',
          language: 'bn',
        });
        if (res.suggestions && res.suggestions.length > 0) {
          setSocialForm((prev) => ({
            ...prev,
            primaryCaption: res.suggestions[0],
            hashtags: '#SunBirdCorporation #MedicalEquipment #HealthcareBangladesh #ICUDevices',
          }));
          showToast('এআই সোশ্যাল ক্যাপশন ও হ্যাশট্যাগ তৈরি হয়েছে!', 'success');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'এআই তৈরিতে সমস্যা হয়েছে', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Handler: Create Banner ──
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const banner = await marketingService.createBanner(bannerForm);
      setBanners([banner, ...banners]);
      setShowBannerModal(false);
      showToast(`ব্যানার ${banner.bannerCode} সফলভাবে তৈরি হয়েছে!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'ব্যানার তৈরিতে সমস্যা হয়েছে', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Handler: Publish Banner ──
  const handlePublishBanner = async (id: string) => {
    try {
      const updated = await marketingService.publishBanner(id);
      setBanners(banners.map((b) => (b._id === updated._id ? updated : b)));
      showToast('ব্যানার সফলভাবে লাইভ প্রকাশ করা হয়েছে!', 'success');
    } catch (err: any) {
      showToast(err.message || 'পাবলিশ করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  // ── Handler: Create Campaign ──
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const campaign = await marketingService.createCampaign(campaignForm);
      setCampaigns([campaign, ...campaigns]);
      setShowCampaignModal(false);
      showToast(`ক্যাম্পেইন ${campaign.campaignCode} তৈরি হয়েছে!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'ক্যাম্পেইন তৈরিতে সমস্যা হয়েছে', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Handler: Submit Campaign For Approval ──
  const handleSubmitCampaign = async (id: string) => {
    try {
      const updated = await marketingService.submitCampaign(id);
      setCampaigns(campaigns.map((c) => (c._id === updated._id ? updated : c)));
      showToast('ক্যাম্পেইন অনুমোদনের জন্য জমা দেওয়া হয়েছে!', 'info');
    } catch (err: any) {
      showToast(err.message || 'সাবমিট করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  // ── Handler: Approve Campaign ──
  const handleApproveCampaign = async (id: string) => {
    try {
      const updated = await marketingService.approveCampaign(id, 'APPROVE');
      setCampaigns(campaigns.map((c) => (c._id === updated._id ? updated : c)));
      showToast('ক্যাম্পেইন সফলভাবে অনুমোদিত ও সক্রিয় হয়েছে!', 'success');
    } catch (err: any) {
      showToast(err.message || 'অনুমোদনে সমস্যা হয়েছে', 'error');
    }
  };

  // ── Handler: Run Scheduler ──
  const handleRunScheduler = async () => {
    setActionLoading(true);
    try {
      const res = await marketingService.runScheduler();
      showToast(res.message || 'শিডিউলার রিকনসিলিয়েশন সম্পন্ন হয়েছে', 'success');
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'শিডিউলার চালাতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Handler: Generate AI Copy Modal ──
  const handleGenerateAi = async () => {
    setAiLoading(true);
    try {
      const res = await marketingService.generateAiSuggestions(aiForm);
      setAiSuggestions(res.suggestions || []);
      showToast(`এআই কপি সাজেশন্স তৈরি হয়েছে (${res.generatedBy})`, 'info');
    } catch (err: any) {
      showToast(err.message || 'এআই কপি জেনারেট করতে সমস্যা হয়েছে', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Handler: Upsert CMS Content ──
  const handleUpsertContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const doc = await marketingService.upsertContent(contentForm);
      setContents([doc, ...contents.filter((c) => c._id !== doc._id)]);
      setShowContentModal(false);
      showToast(`কনটেন্ট ${doc.contentKey} ভার্সন ${doc.currentVersion} সংরক্ষিত হয়েছে!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'কনটেন্ট সংরক্ষণে ব্যর্থ হয়েছে', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Handler: Rollback CMS Content ──
  const handleRollbackContent = async (id: string, versionNumber: number) => {
    try {
      const doc = await marketingService.rollbackContent(id, versionNumber);
      setContents(contents.map((c) => (c._id === doc._id ? doc : c)));
      showToast(`কনটেন্ট পূর্ববর্তী ভার্সন ${versionNumber} এ সফলভাবে ফিরিয়ে নেওয়া হয়েছে`, 'success');
    } catch (err: any) {
      showToast(err.message || 'রোলব্যাক করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  // ── Handler: CSV Data Export ──
  const handleDownloadReport = () => {
    const headers = ['Type', 'Code/Title', 'Status', 'Start Date', 'End Date', 'Budget/Clicks'];
    const rows: any[] = [];

    campaigns.forEach((c) => {
      rows.push(['Campaign', c.name, c.status, c.startDate, c.endDate, `৳${c.budget}`]);
    });
    banners.forEach((b) => {
      rows.push(['Banner', b.title, b.status, b.startDate, b.endDate, `${b.clickCount || 0} clicks`]);
    });

    const csvContent = [headers, ...rows]
      .map((r) => r.map((cell: any) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Marketing_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('মার্কেটিং রিপোর্ট সফলভাবে ডাউনলোড হয়েছে', 'success');
  };

  return (
    <div className="marketing-view-container space-y-5 animate-in fade-in duration-200">
      {/* ── TOP HEADER / HUB BANNER ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1e3932] text-[#e6b980] uppercase tracking-wider">
              Module 11
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              ব্যানার, সোশ্যাল মিডিয়া, মার্কেটিং ও কনটেন্ট ম্যানেজমেন্ট
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              <Bot className="w-3.5 h-3.5" />
              AI Powered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ওয়েবসাইট ব্যানার, হোমপেজ স্লাইডার, প্রমোশনাল ক্যাম্পেইন, ল্যান্ডিং পেজ, সোশ্যাল মিডিয়া ও সার্বিক এআই কো-পাইলট
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Co-Pilot Hub</span>
          </button>

          <button
            type="button"
            onClick={handleRunScheduler}
            disabled={actionLoading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Run Scheduler</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBannerModal(true)}
            className="px-3 py-2 bg-[#1e3932] hover:bg-[#152823] text-[#e6b980] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন ব্যানার</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCampaignModal(true)}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>নতুন ক্যাম্পেইন</span>
          </button>
        </div>
      </div>

      {/* ── SUBMODULE QUICK FILTER BAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs scrollbar-thin">
        {[
          { id: 'marketing-dashboard' as MarketingSubmodule, label: 'মার্কেটিং ড্যাশবোর্ড' },
          { id: 'website-banners' as MarketingSubmodule, label: 'ওয়েবসাইট ব্যানার' },
          { id: 'homepage-sliders' as MarketingSubmodule, label: 'হোমপেজ স্লাইডার' },
          { id: 'promotional-campaigns' as MarketingSubmodule, label: 'ক্যাম্পেইন ও প্রমোশন' },
          { id: 'product-promotions' as MarketingSubmodule, label: 'প্রডাক্ট অফার' },
          { id: 'landing-pages' as MarketingSubmodule, label: 'ল্যান্ডিং পেজ' },
          { id: 'website-content' as MarketingSubmodule, label: 'CMS কনটেন্ট' },
          { id: 'promotional-popups' as MarketingSubmodule, label: 'পপআপ ও অ্যানাউন্সমেন্ট' },
          { id: 'social-media-management' as MarketingSubmodule, label: 'সোশ্যাল মিডিয়া' },
          { id: 'marketing-calendar' as MarketingSubmodule, label: 'মার্কেটিং ক্যালেন্ডার' },
          { id: 'campaign-analytics' as MarketingSubmodule, label: 'অ্যানালিটিক্স ও রিপোর্ট' },
          { id: 'marketing-settings' as MarketingSubmodule, label: 'সেটিংস ও অডিট লগ' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSubmodule(item.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeSubmodule === item.id
                ? 'bg-[#1e3932] text-[#e6b980] font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. SUBMODULE: MARKETING DASHBOARD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'marketing-dashboard' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              {
                label: 'মোট ক্যাম্পেইন',
                val: dashboardMetrics?.kpis?.totalCampaigns ?? campaigns.length,
                sub: `${dashboardMetrics?.kpis?.activeCampaigns ?? 1} সক্রিয়`,
                icon: Megaphone,
                color: 'text-indigo-600 bg-indigo-50',
              },
              {
                label: 'ওয়েবসাইট ব্যানার',
                val: dashboardMetrics?.kpis?.totalBanners ?? banners.length,
                sub: `${dashboardMetrics?.kpis?.activeBanners ?? 1} লাইভ প্রকাশিত`,
                icon: ImageIcon,
                color: 'text-emerald-600 bg-emerald-50',
              },
              {
                label: 'সোশ্যাল পোস্ট',
                val: dashboardMetrics?.kpis?.publishedSocialPosts ?? 1,
                sub: 'ফেসবুক ও লিংকডইন',
                icon: Share2,
                color: 'text-blue-600 bg-blue-50',
              },
              {
                label: 'মোট ইমপ্রেশন',
                val: (dashboardMetrics?.kpis?.totalImpressions || 15400).toLocaleString(),
                sub: 'ওয়েব ও সোশ্যাল রিচ',
                icon: TrendingUp,
                color: 'text-purple-600 bg-purple-50',
              },
              {
                label: 'ক্লিক ও এনগেজমেন্ট',
                val: (dashboardMetrics?.kpis?.totalClicks || 1240).toLocaleString(),
                sub: '৮.০৫% গড় সিটিআর',
                icon: ExternalLink,
                color: 'text-amber-600 bg-amber-50',
              },
              {
                label: 'মার্কেটিং বাজেট ব্যয়',
                val: `৳${(dashboardMetrics?.kpis?.totalSpend || 150000).toLocaleString()}`,
                sub: 'ROI: ৪.২x আরোপিত বিক্রয়',
                icon: ShieldCheck,
                color: 'text-rose-600 bg-rose-50',
              },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 marketing-card">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">{kpi.label}</span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-slate-900 font-mono">{kpi.val}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Banners Carousel Preview & AI Assist Box */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Banner Preview Card */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">লাইভ হোমপেজ ব্যানার প্রিভিউ</h3>
                  <p className="text-xs text-slate-400">ওয়েবসাইটে বর্তমানে গ্রাহকরা যা দেখতে পাচ্ছেন</p>
                </div>
                <button
                  onClick={() => setSubmodule('website-banners')}
                  className="text-xs text-[#1e3932] font-bold hover:underline flex items-center gap-1"
                >
                  <span>সব ব্যানার</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {banners.length > 0 ? (
                <div className="relative h-64 rounded-xl overflow-hidden bg-[#1e3932] p-6 text-white flex flex-col justify-between shadow-inner">
                  <div className="space-y-2 max-w-md z-10">
                    <span className="px-2 py-0.5 bg-[#e6b980] text-slate-950 font-bold rounded text-[10px] uppercase">
                      {banners[0].bannerType}
                    </span>
                    <h4 className="text-xl font-bold leading-tight">{banners[0].title}</h4>
                    <p className="text-xs text-slate-200 line-clamp-2">{banners[0].subtitle || banners[0].description}</p>
                    <button className="px-4 py-2 bg-[#e6b980] text-slate-950 rounded-lg text-xs font-bold hover:bg-[#d4a366] transition-all">
                      {banners[0].buttonText || 'পণ্য দেখুন'}
                    </button>
                  </div>
                  <div className="absolute right-4 bottom-4 w-48 h-48 opacity-80 pointer-events-none">
                    <img src={banners[0].imageUrl} alt="Banner" className="w-full h-full object-contain" />
                  </div>
                </div>
              ) : (
                <div className="h-48 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                  কোনো সক্রিয় ব্যানার নেই। নতুন ব্যানার যোগ করুন।
                </div>
              )}
            </div>

            {/* AI Assistant Quick Actions */}
            <div className="bg-gradient-to-br from-[#1e3932] to-[#12231f] text-white p-5 rounded-2xl shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#e6b980]" />
                <h3 className="font-bold text-sm text-[#e6b980]">AI কন্টেন্ট সহকারী (Gemini)</h3>
              </div>
              <p className="text-xs text-slate-300">
                এক ক্লিকে আকর্ষণীয় ব্যানার স্লোগান, প্রমোশনাল অফার, সোশ্যাল মিডিয়া ক্যাপশন ও এসইও মেটাডাটা তৈরি করুন।
              </p>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => {
                    setAiForm({ task: 'BANNER_COPY', productName: 'আইসিইউ পেশেন্ট কেয়ার বেড', tone: 'PROFESSIONAL' });
                    setShowAiModal(true);
                  }}
                  className="w-full p-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-between text-white font-medium transition-colors"
                >
                  <span>ব্যানার কপি জেনারেট করুন</span>
                  <Wand2 className="w-3.5 h-3.5 text-[#e6b980]" />
                </button>

                <button
                  onClick={() => {
                    setAiForm({ task: 'SOCIAL_CAPTION', productName: 'মেডিকেল অটোক্লেভ স্টেরিলাইজার', tone: 'CLINICAL' });
                    setShowAiModal(true);
                  }}
                  className="w-full p-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-between text-white font-medium transition-colors"
                >
                  <span>সোশ্যাল মিডিয়া ক্যাপশন লিখুন</span>
                  <Wand2 className="w-3.5 h-3.5 text-[#e6b980]" />
                </button>

                <button
                  onClick={() => {
                    setAiForm({ task: 'SEO_METADATA', productName: 'অক্সিজেন কনসেনট্রেটর', tone: 'PROFESSIONAL' });
                    setShowAiModal(true);
                  }}
                  className="w-full p-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-between text-white font-medium transition-colors"
                >
                  <span>এসইও মেটাডাটা ও কিওয়ার্ড</span>
                  <Wand2 className="w-3.5 h-3.5 text-[#e6b980]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. SUBMODULE: WEBSITE BANNERS & SLIDERS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['website-banners', 'homepage-sliders'].includes(activeSubmodule) && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="ব্যানার কোড বা শিরোনাম দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 w-64 focus:outline-none focus:border-[#1e3932]"
              />
            </div>
            <button
              onClick={() => setShowBannerModal(true)}
              className="px-3 py-1.5 bg-[#1e3932] text-[#e6b980] rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ব্যানার যুক্ত করুন</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ব্যানার ও কোড</th>
                  <th className="px-4 py-3">ধরন ও পজিশন</th>
                  <th className="px-4 py-3">মেয়াদকাল</th>
                  <th className="px-4 py-3 text-center">ক্রম (Order)</th>
                  <th className="px-4 py-3 text-center">ক্লিক / ভিউ</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      কোনো ব্যানার ডাটা পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  banners.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <img src={b.imageUrl} alt="" className="w-8 h-8 rounded object-cover bg-slate-100 border" />
                          <div>
                            <div>{b.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{b.bannerCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{b.bannerType}</div>
                        <div className="text-[10px] text-slate-400">{b.displayPosition}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        {b.startDate ? new Date(b.startDate).toLocaleDateString('bn-BD') : ''} –{' '}
                        {b.endDate ? new Date(b.endDate).toLocaleDateString('bn-BD') : ''}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {b.displayOrder}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {b.clickCount || 0} / {b.impressionCount || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {b.status !== 'PUBLISHED' ? (
                            <button
                              onClick={() => handlePublishBanner(b._id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              onClick={() => marketingService.unpublishBanner(b._id).then(loadInitialData)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-300"
                            >
                              Unpublish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. SUBMODULE: PROMOTIONAL CAMPAIGNS & PROMOTIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['promotional-campaigns', 'product-promotions', 'category-promotions', 'brand-promotions'].includes(
        activeSubmodule
      ) && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">ক্যাম্পেইন ও প্রমোশন তালিকা ({campaigns.length})</h3>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন ক্যাম্পেইন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <div key={c._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{c.campaignCode}</span>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{c.name}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{c.description || 'মেডিকেল ইকুইপমেন্ট প্রমোশন'}</p>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">বাজেট:</span>
                    <span className="font-bold font-mono text-slate-900">৳{c.budget.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ছাড়:</span>
                    <span className="font-bold text-rose-600">{c.discountPercentage || 0}% OFF</span>
                  </div>
                </div>

                {/* Workflow Buttons */}
                <div className="pt-2 flex items-center gap-1.5">
                  {c.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSubmitCampaign(c._id)}
                      className="w-full py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700"
                    >
                      Submit for Approval
                    </button>
                  )}
                  {c.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleApproveCampaign(c._id)}
                      className="w-full py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700"
                    >
                      Approve & Activate
                    </button>
                  )}
                  {c.status === 'ACTIVE' && (
                    <button
                      onClick={() => marketingService.updateCampaignStatus(c._id, 'PAUSED').then(loadInitialData)}
                      className="w-full py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-300"
                    >
                      Pause Campaign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. SUBMODULE: CMS WEBSITE CONTENT & LANDING PAGES */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['website-content', 'landing-pages', 'homepage-sections'].includes(activeSubmodule) && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">ওয়েবসাইট কনটেন্ট ও পলিসি পেজসমূহ</h3>
            <button
              onClick={() => setShowContentModal(true)}
              className="px-3 py-1.5 bg-[#1e3932] text-[#e6b980] rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন কনটেন্ট</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contents.map((doc) => (
              <div key={doc._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#1e3932] font-bold">[{doc.contentKey}]</span>
                    <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Version {doc.currentVersion}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-sans max-h-24 overflow-y-auto">
                  {doc.body}
                </div>

                {/* History & Rollback */}
                {doc.versions && doc.versions.length > 1 && (
                  <div className="text-[11px] space-y-1 pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-600 block flex items-center gap-1">
                      <History className="w-3.5 h-3.5" />
                      পূর্ববর্তী ভার্সন হিস্টোরি:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {doc.versions.slice(0, 3).map((v: any, vIdx: number) => (
                        <button
                          key={vIdx}
                          onClick={() => handleRollbackContent(doc._id, v.versionNumber)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border rounded text-[10px] font-mono flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-400" />
                          <span>v{v.versionNumber} রোলব্যাক</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. SUBMODULE: SOCIAL MEDIA MANAGEMENT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['social-media-management', 'social-accounts', 'social-content', 'social-calendar'].includes(
        activeSubmodule
      ) && (
        <div className="space-y-6">
          {/* Social Accounts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {socialAccounts.map((acc) => (
              <div key={acc._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    {acc.platform === 'FACEBOOK' ? <Share2 className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{acc.accountName}</h4>
                    <p className="text-[10px] text-slate-400">{acc.accountHandle || acc.platform}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  সংযুক্ত
                </span>
              </div>
            ))}
          </div>

          {/* Social Posts List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">সোশ্যাল মিডিয়া পোস্ট শিডিউল</h3>
              <button
                onClick={() => setShowSocialPostModal(true)}
                className="px-3 py-1.5 bg-[#1e3932] text-[#e6b980] rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন পোস্ট লিখুন</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {socialPosts.map((post) => (
                <div key={post._id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{post.postCode}</span>
                      <h5 className="font-bold text-slate-900 text-xs">{post.title}</h5>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{post.primaryCaption}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {post.publishStatus}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(post.scheduledDate).toLocaleDateString('bn-BD')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. SUBMODULE: MARKETING MASTER CALENDAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'marketing-calendar' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1e3932]" />
              <span>মার্কেটিং মাস্টার ক্যালেন্ডার ({new Date().getFullYear()})</span>
            </h3>
            <span className="text-xs text-slate-500">ক্যাম্পেইন ও সোশ্যাল পোস্টের সমন্বিত সূচি</span>
          </div>

          <div className="space-y-2">
            {calendarEvents.map((evt, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {new Date(evt.date).getDate()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{evt.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{evt.code} • {evt.details}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border text-slate-700">
                  {evt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. SUBMODULE: SETTINGS & AUDIT LOGS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['marketing-settings', 'marketing-activity-logs'].includes(activeSubmodule) && (
        <div className="space-y-6">
          {/* Settings Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">মার্কেটিং কনফিগারেশন</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">টাইমজোন</label>
                <input
                  type="text"
                  disabled
                  value={marketingSettings?.defaultTimeZone || 'Asia/Dhaka'}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">ডিফল্ট ওয়েবসাইট ইউআরএল</label>
                <input
                  type="text"
                  disabled
                  value={marketingSettings?.defaultWebsiteUrl || 'http://localhost:3000'}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Audit Logs Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">মার্কেটিং অডিট লগস (Audit Trail)</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{log.action}</span> on{' '}
                    <span className="font-mono text-indigo-700">{log.entity || log.targetCollection}</span>
                    <div className="text-[10px] text-slate-400">
                      {new Date(log.timestamp || log.createdAt).toLocaleString('bn-BD')}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {log.actor?.email || 'System'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD BANNER (WITH AI AUTO-FILL) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#1e3932]" />
                <h3 className="font-bold text-slate-900 text-sm">নতুন ব্যানার / স্লাইডার যোগ করুন</h3>
              </div>
              <button onClick={() => setShowBannerModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-3 text-xs">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block font-semibold text-slate-700 mb-1">পণ্য বা ব্যানারের নাম</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.name}
                    onChange={(e) => setBannerForm({ ...bannerForm, name: e.target.value })}
                    placeholder="উদাঃ আইসিইউ পেশেন্ট কেয়ার বেড"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAiAutoFill('BANNER')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiLoading ? 'তৈরি হচ্ছে...' : 'AI অটো-ফিল'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ব্যানার ধরন</label>
                  <select
                    value={bannerForm.bannerType}
                    onChange={(e) => setBannerForm({ ...bannerForm, bannerType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="HERO_SLIDER">Hero Slider (হোমপেজ স্লাইডার)</option>
                    <option value="PROMOTIONAL_SPLIT">Promotional Split Banner</option>
                    <option value="CATEGORY_BANNER">Category Banner</option>
                    <option value="ANNOUNCEMENT_BAR">Announcement Bar</option>
                    <option value="POPUP_WELCOME">Welcome Popup</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ডিসপ্লে পজিশন</label>
                  <input
                    type="text"
                    value={bannerForm.displayPosition}
                    onChange={(e) => setBannerForm({ ...bannerForm, displayPosition: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মূল শিরোনাম (Title)</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="উদাঃ সর্বাধুনিক মাল্টিফাংশনাল আইসিইউ পেশেন্ট কেয়ার বেড"
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">উপ-শিরোনাম / বিবরণ</label>
                <textarea
                  rows={2}
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="ডিজিডিএ অনুমোদিত আন্তর্জাতিক মানসম্মত মেডিকেল ফার্নিচার"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বাটন টেক্সট</label>
                  <input
                    type="text"
                    value={bannerForm.buttonText}
                    onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বাটন লিংক</label>
                  <input
                    type="text"
                    value={bannerForm.buttonLink}
                    onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#1e3932] text-[#e6b980] rounded-xl font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: ADD CAMPAIGN (WITH AI AUTO-FILL) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">নতুন প্রমোশনাল ক্যাম্পেইন তৈরি</h3>
              </div>
              <button onClick={() => setShowCampaignModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাম্পেইনের নাম</label>
                  <input
                    type="text"
                    required
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="উদাঃ ঈদ স্পেশাল মেডিকেল ইকুইপমেন্ট প্যাকেজ"
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAiAutoFill('CAMPAIGN')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI আইডিয়া</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ক্যাম্পেইন ধরন</label>
                  <select
                    value={campaignForm.campaignType}
                    onChange={(e) => setCampaignForm({ ...campaignForm, campaignType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="FESTIVAL">Festival (ঈদ/পূজা অফার)</option>
                    <option value="SEASONAL">Seasonal Campaign</option>
                    <option value="DISCOUNT">Discount Promotion</option>
                    <option value="PRODUCT_LAUNCH">Product Launch</option>
                    <option value="FLASH_SALE">Flash Sale</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বাজেট (BDT)</label>
                  <input
                    type="number"
                    value={campaignForm.budget}
                    onChange={(e) => setCampaignForm({ ...campaignForm, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="ক্যাম্পেইন অফারের বিস্তারিত"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ছাড়ের শতাংশ (%)</label>
                  <input
                    type="number"
                    value={campaignForm.discountPercentage}
                    onChange={(e) => setCampaignForm({ ...campaignForm, discountPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">কুপন কোড</label>
                  <input
                    type="text"
                    value={campaignForm.couponCode}
                    onChange={(e) => setCampaignForm({ ...campaignForm, couponCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  ক্যাম্পেইন তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: AI MARKETING CO-PILOT HUB */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Google Gemini AI Marketing Co-Pilot</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">কপি টাস্ক (Task)</label>
                  <select
                    value={aiForm.task}
                    onChange={(e) => setAiForm({ ...aiForm, task: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="BANNER_COPY">ব্যানার শিরোনাম ও স্লোগান</option>
                    <option value="CAMPAIGN_IDEAS">ক্যাম্পেইন আইডিয়া ও প্রমোশন</option>
                    <option value="SOCIAL_CAPTION">সোশ্যাল মিডিয়া পোস্ট ক্যাপশন</option>
                    <option value="HASHTAGS">ট্রেন্ডিং মেডিকেল হ্যাশট্যাগ</option>
                    <option value="SEO_METADATA">এসইও মেটা ডেসক্রিপশন</option>
                    <option value="LANDING_PAGE_COPY">ল্যান্ডিং পেজ হেডার ও কপি</option>
                    <option value="CMS_CONTENT">CMS পলিসি ও ওয়েবসাইট কপি</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">টোন (Tone)</label>
                  <select
                    value={aiForm.tone}
                    onChange={(e) => setAiForm({ ...aiForm, tone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="PROFESSIONAL">প্রফেশনাল ও ক্লিনিক্যাল</option>
                    <option value="FESTIVE">উৎসবমুখর ও আকর্ষণীয়</option>
                    <option value="URGENT_DISCOUNT">জরুরি মূল্যছাড়</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পণ্য বা সেবার নাম</label>
                <input
                  type="text"
                  value={aiForm.productName}
                  onChange={(e) => setAiForm({ ...aiForm, productName: e.target.value })}
                  placeholder="উদাঃ মাল্টিপ্যারা পেশেন্ট মনিটর"
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={aiLoading}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{aiLoading ? 'এআই জেনারেট করছে...' : 'সাজেশন্স তৈরি করুন'}</span>
              </button>

              {aiSuggestions.length > 0 && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-900 block text-[11px]">জেনারেটেড কপি সাজেশনসমূহ:</span>
                  <div className="space-y-1.5">
                    {aiSuggestions.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          navigator.clipboard.writeText(s);
                          showToast('কপি ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
                        }}
                        className="p-2 bg-white rounded-lg border border-amber-100 text-slate-800 text-xs hover:border-amber-400 cursor-pointer transition-colors"
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: ADD/EDIT CMS CONTENT (WITH AI AUTO-FILL) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showContentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">CMS ওয়েবসাইট কনটেন্ট এডিটর</h3>
              <button onClick={() => setShowContentModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpsertContent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">কনটেন্ট কী (Key)</label>
                  <input
                    type="text"
                    required
                    value={contentForm.contentKey}
                    onChange={(e) => setContentForm({ ...contentForm, contentKey: e.target.value.toUpperCase() })}
                    placeholder="ABOUT_US"
                    className="w-full px-3 py-2 border rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">কনটেন্ট ধরন</label>
                  <select
                    value={contentForm.contentType}
                    onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="PAGE">Page (পূর্ণ পেজ)</option>
                    <option value="POLICY">Policy (নীতিমালা)</option>
                    <option value="SECTION">Homepage Section</option>
                    <option value="FAQ">FAQ</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block font-semibold text-slate-700 mb-1">শিরোনাম (Title)</label>
                  <input
                    type="text"
                    required
                    value={contentForm.title}
                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAiAutoFill('CONTENT')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI লিখুন</span>
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">কনটেন্ট বডি (HTML / Text)</label>
                <textarea
                  rows={4}
                  required
                  value={contentForm.body}
                  onChange={(e) => setContentForm({ ...contentForm, body: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পরিবর্তনের বিবরণ (Change Summary)</label>
                <input
                  type="text"
                  value={contentForm.changeSummary}
                  onChange={(e) => setContentForm({ ...contentForm, changeSummary: e.target.value })}
                  placeholder="ভার্সন আপডেটের বিবরণ"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowContentModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#1e3932] text-[#e6b980] rounded-xl font-bold"
                >
                  সংরক্ষণ ও নতুন ভার্সন তৈরি
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: ADD SOCIAL POST (WITH AI AUTO-FILL) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showSocialPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">নতুন সোশ্যাল মিডিয়া পোস্ট</h3>
              </div>
              <button onClick={() => setShowSocialPostModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setActionLoading(true);
                try {
                  const post = await marketingService.createSocialPost({
                    title: socialForm.title,
                    contentType: socialForm.contentType,
                    primaryCaption: socialForm.primaryCaption,
                    hashtags: socialForm.hashtags.split(' '),
                    scheduledDate: socialForm.scheduledDate,
                    platformVariants: [
                      {
                        platform: socialForm.platform,
                        caption: socialForm.primaryCaption,
                        status: 'SCHEDULED',
                      },
                    ],
                  });
                  setSocialPosts([post, ...socialPosts]);
                  setShowSocialPostModal(false);
                  showToast('পোস্ট সফলভাবে শিডিউল হয়েছে!', 'success');
                } catch (err: any) {
                  showToast(err.message || 'পোস্ট তৈরিতে ব্যর্থ হয়েছে', 'error');
                } finally {
                  setActionLoading(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block font-semibold text-slate-700 mb-1">পোস্ট শিরোনাম</label>
                  <input
                    type="text"
                    required
                    value={socialForm.title}
                    onChange={(e) => setSocialForm({ ...socialForm, title: e.target.value })}
                    placeholder="উদাঃ আইসিইউ পেশেন্ট মনিটর আগমন"
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAiAutoFill('SOCIAL')}
                  disabled={aiLoading}
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI ক্যাপশন</span>
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ক্যাপশন</label>
                <textarea
                  rows={3}
                  required
                  value={socialForm.primaryCaption}
                  onChange={(e) => setSocialForm({ ...socialForm, primaryCaption: e.target.value })}
                  placeholder="সোশ্যাল মিডিয়া পোস্টের ক্যাপশন লিখুন"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">হ্যাশট্যাগস</label>
                <input
                  type="text"
                  value={socialForm.hashtags}
                  onChange={(e) => setSocialForm({ ...socialForm, hashtags: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSocialPostModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  শিডিউল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ErpMarketingView;
