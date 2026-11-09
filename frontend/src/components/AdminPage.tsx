'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './AdminPage.css';
import {
  Boxes,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Receipt,
  Package,
  AlertCircle,
  Building2,
  Lock,
  RefreshCw,
  MessageSquare,
  Send,
  User,
  Check,
  Headphones,
  MailCheck,
  Ship,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Users,
  Database,
  Key,
} from 'lucide-react';
import { ErpOrdersView } from './erp/ErpOrdersView';
import { ErpInventoryView } from './erp/ErpInventoryView';
import { ErpAccountingView } from './erp/ErpAccountingView';
import { ErpSupportView } from './erp/ErpSupportView';
import { ErpDocumentBuilderView } from './erp/ErpDocumentBuilderView';
import { ErpProductEntryView } from './erp/ErpProductEntryView';
import { ErpHrmView } from './erp/ErpHrmView';
import { ErpBannerManagerView } from './erp/ErpBannerManagerView';
import { useToast } from '../context/ToastContext';

export type AdminTab =
  | 'overview'
  | 'documents'
  | 'products'
  | 'orders'
  | 'inventory'
  | 'accounting'
  | 'hrm'
  | 'banners'
  | 'lc'
  | 'support'
  | 'users'
  | 'settings';

interface AdminPageProps {
  initialTab?: AdminTab;
}

const IMPORT_LC_DATA = [
  {
    lcNumber: 'LC-2026-CH-0941',
    bank: 'City Bank Ltd. (Banani Branch)',
    beneficiary: 'BMC Medical Co., Ltd. (Taiwan)',
    equipment: '10L Medical Oxygen Concentrators & Flowmeters (100 Units)',
    valueUsd: 48500,
    status: 'PORT_CUSTOMS_CLEARANCE',
    eta: '12 Nov 2026 (Chittagong Port)',
    progress: 75,
  },
  {
    lcNumber: 'LC-2026-DE-0782',
    bank: 'Standard Chartered Bank Bangladesh',
    beneficiary: 'B. Braun Medical AG (Germany)',
    equipment: 'IV Cannula 20G/22G Sterile Consumables (50,000 Pcs)',
    valueUsd: 32000,
    status: 'TRANSIT_ON_VESSEL',
    eta: '18 Nov 2026 (Vessel: MV Bengal Express)',
    progress: 45,
  },
  {
    lcNumber: 'LC-2026-JP-0615',
    bank: 'Eastern Bank PLC',
    beneficiary: 'Omron Healthcare Co. (Japan)',
    equipment: 'Digital Upper Arm BP Monitors & Cuffs (2,000 Units)',
    valueUsd: 74200,
    status: 'GOODS_RECEIVED_TEJGAON',
    eta: 'Cleared & Stocked in Depot',
    progress: 100,
  },
];

const ADMIN_USERS_DATA = [
  {
    id: 'USR-001',
    name: 'ডাঃ মোস্তাফিজুর রহমান',
    email: 'admin@sunbirdcorp.com',
    role: 'Super Admin',
    department: 'Executive Board',
    status: 'Active',
    lastLogin: '10 mins ago',
  },
  {
    id: 'USR-002',
    name: 'ইঞ্জিনিয়ার তারেক মাহমুদ',
    email: 'tarek.lab@sunbirdcorp.com',
    role: 'Biomedical Engineer',
    department: 'QC & Service Lab',
    status: 'Active',
    lastLogin: '1 hour ago',
  },
  {
    id: 'USR-003',
    name: 'ফারহানা আহমেদ',
    email: 'farhana.acc@sunbirdcorp.com',
    role: 'Chief Accountant',
    department: 'Finance & VAT (NBR)',
    status: 'Active',
    lastLogin: '2 hours ago',
  },
  {
    id: 'USR-004',
    name: 'কবির হোসেন',
    email: 'kabir.depot@sunbirdcorp.com',
    role: 'Warehouse Officer',
    department: 'Tejgaon Central Depot',
    status: 'Active',
    lastLogin: 'Yesterday',
  },
];

export function AdminPage({ initialTab = 'overview' }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showToast } = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('অ্যাডমিন কনসোল ও ডাটাবেজ সিঙ্ক সম্পন্ন হয়েছে!', 'success');
    }, 600);
  };

  return (
    <div className="admin-console-root">
      {/* Top Admin Bar */}
      <header className="h-16 bg-slate-950 text-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1e3932] to-[#2d5248] border border-emerald-500/40 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5 text-[#e6b980]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white font-serif">
                  SUN BIRD ADMIN
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                  v2.4 Enterprise
                </span>
              </div>
              <p className="text-[10px] text-slate-400">DGDA & NBR Super Admin Console</p>
            </div>
          </Link>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MongoDB Atlas: Connected (Tejgaon DC)</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#c89348]' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>

          <Link
            href="/erp"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ERP Portal</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1e3932] hover:bg-[#162f29] text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront</span>
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'w-64' : 'w-0 -translate-x-full'
          } bg-slate-950 border-r border-slate-800/80 transition-all duration-300 flex flex-col shrink-0 overflow-y-auto`}
        >
          <div className="p-4 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">
              অ্যাডমিন নেভিগেশন
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#e6b980]" />
                <span>Dashboard Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>ইনভয়েস ও কোটেশন বিল্ডার</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-bold">
                সমরিতা PDF
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-sky-400" />
                <span>প্রডাক্ট এন্ট্রি (ইকমার্স+ইআরপি)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Order Processing</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-bold">
                12 New
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-sky-400" />
                <span>FEFO Inventory & Stock</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('accounting')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'accounting'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>আয়-ব্যয় ও পার্টনারশিপ হিসাব</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hrm')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'hrm'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>এইচ আর ও পে-রোল (HRM)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'banners'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-rose-400" />
                <span>ব্যানার ও সোশ্যাল মিডিয়া</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lc')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'lc'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Ship className="w-4 h-4 text-cyan-400" />
                <span>Import L/C Tracker</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>RMA & Dispute Resolution</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-900/60 text-rose-300 font-bold">
                2 Pending
              </span>
            </button>

            <hr className="my-3 border-slate-800" />

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">
              সিস্টেম ও সিকিউরিটি
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>User Accounts & RBAC</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#1e3932] text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>DGDA & NBR Settings</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </aside>

        {/* Dynamic Admin Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900 text-slate-100">
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="admin-stat-card space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>আজকের মোট বিক্রয় (Gross Revenue)</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono text-white">৳৮,৯৪,৫০০</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+১২.৪% বৃদ্ধি (গত সপ্তাহের তুলনায়)</span>
                  </div>
                </div>

                <div className="admin-stat-card space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>প্রক্রিয়াধীন অর্ডার (Order Queue)</span>
                    <Package className="w-4 h-4 text-sky-400" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono text-white">৪৩ টি</h3>
                  <p className="text-[11px] text-slate-400">পাঠাও ও স্টেডফাস্ট পিকআপ শিডিউলড</p>
                </div>

                <div className="admin-stat-card space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>NBR মূসক-৬.৩ চালান (চলতি মাস)</span>
                    <Receipt className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono text-white">৳১,৩৪,১৭৫</h3>
                  <p className="text-[11px] text-amber-300/80 font-medium">১৫% সরকারি কর চালান জেনারেটেড</p>
                </div>

                <div className="admin-stat-card space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>সক্রিয় আরএমএ ও ওয়ারেন্টি ক্লেইম</span>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-bold font-mono text-white">২ টি</h3>
                  <p className="text-[11px] text-emerald-400">৯৮.৬% বায়োমেডিক্যাল সন্তুষ্টি রেট</p>
                </div>
              </div>

              {/* Quick Actions & System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#c89348]" />
                    <span>সেন্ট্রাল ওয়্যারহাউজ অপারেশনাল স্ট্যাটাস (তেজগাঁও)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <p className="text-xs text-slate-400">ওয়্যারহাউজ ধারণক্ষমতা</p>
                      <p className="text-lg font-bold text-emerald-400">৭৬.২% পূর্ণ</p>
                      <p className="text-[10px] text-slate-500">আইসিইউ ও সার্জিক্যাল জোন</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <p className="text-xs text-slate-400">FEFO এক্সপায়ারি অ্যালার্ট</p>
                      <p className="text-lg font-bold text-amber-400">৩টি ব্যাচ</p>
                      <p className="text-[10px] text-slate-500">৯০ দিনের মধ্যে মেয়াদোত্তীর্ণ</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <p className="text-xs text-slate-400">DGDA অডিট কমপ্লায়েন্স</p>
                      <p className="text-lg font-bold text-sky-400">১০০% ভেরিফাইড</p>
                      <p className="text-[10px] text-slate-500">লাইসেন্স: DGDA-IMP-2024-8841</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#e6b980]" />
                    <span>অ্যাডমিন অ্যাকশন শর্টকাট</span>
                  </h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span>নতুন অর্ডার প্রসেসিং শুরু করুন</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('inventory')}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span>স্টক ইন / চালান রিসিভ করুন</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('accounting')}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span>ম্যানুয়াল জার্নাল ভাউচার পোস্ট করুন</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && <ErpDocumentBuilderView />}
          {activeTab === 'products' && <ErpProductEntryView />}
          {activeTab === 'orders' && <ErpOrdersView />}
          {activeTab === 'inventory' && <ErpInventoryView />}
          {activeTab === 'accounting' && <ErpAccountingView />}
          {activeTab === 'hrm' && <ErpHrmView />}
          {activeTab === 'banners' && <ErpBannerManagerView />}
          {activeTab === 'support' && <ErpSupportView />}

          {/* Import L/C Tracker View */}
          {activeTab === 'lc' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Ship className="w-5 h-5 text-cyan-400" />
                    <span>আন্তর্জাতিক লেটার অফ ক্রেডিট (L/C) ও আমদানি ট্র্যাকার</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    ডিজিডিএ (DGDA) অনুমোদিত মেডিকেল ও ডায়াগনস্টিক পণ্য আমদানি কাস্টমস ক্লিয়ারেন্স
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
                    মোট সক্রিয় L/C: $১৫৪,৭০০ USD
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {IMPORT_LC_DATA.map((lc) => (
                  <div
                    key={lc.lcNumber}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400 text-sm">{lc.lcNumber}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                            {lc.bank}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 font-medium">{lc.equipment}</p>
                      </div>
                      <div className="text-right sm:shrink-0">
                        <span className="text-sm font-mono font-bold text-emerald-400">
                          ${lc.valueUsd.toLocaleString()} USD
                        </span>
                        <p className="text-[11px] text-slate-400 font-mono">ETA: {lc.eta}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">শিপমেন্ট ও কাস্টমস অগ্রগতি</span>
                        <span className="font-bold text-white font-mono">{lc.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${lc.progress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        বেনিফিশিয়ারি: <span className="text-slate-200">{lc.beneficiary}</span> | অবস্থা: <span className="text-amber-300 font-semibold">{lc.status}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>ব্যবহারকারী ও রোল ম্যানেজমেন্ট (RBAC)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">হাসপাতাল অ্যাকাউন্ট, বায়োমেডিক্যাল ইঞ্জিনিয়ার ও স্টাফ পারমিশন নিয়ন্ত্রণ করুন</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="admin-badge-online">Active Directory Sync</span>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">ইউজার আইডি</th>
                        <th className="px-5 py-3.5">নাম ও ইমেইল</th>
                        <th className="px-5 py-3.5">রোল (Role)</th>
                        <th className="px-5 py-3.5">বিভাগ</th>
                        <th className="px-5 py-3.5">স্ট্যাটাস</th>
                        <th className="px-5 py-3.5">সর্বশেষ লগইন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {ADMIN_USERS_DATA.map((usr) => (
                        <tr key={usr.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-5 py-4 font-mono text-slate-400">{usr.id}</td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">{usr.name}</p>
                            <p className="text-slate-400 text-[11px]">{usr.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {usr.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-300">{usr.department}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              {usr.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">{usr.lastLogin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-4 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-slate-400" />
                  <span>সিস্টেম, ট্যাক্স ও এপিআই সেটিংস</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 text-xs text-slate-300">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-semibold">NBR মূসক-৬.৩ ভ্যাট হার</p>
                    <p className="text-base font-bold text-emerald-400 font-mono">১৫.০০% (স্ট্যান্ডার্ড রেট)</p>
                    <p className="text-[10px] text-slate-500">স্বয়ংক্রিয় চালান ক্যালকুলেশন সক্রিয়</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-semibold">DGDA রেজিস্টার্ড লাইসেন্স</p>
                    <p className="text-base font-bold text-white font-mono">DGDA-IMP-2024-8841</p>
                    <p className="text-[10px] text-emerald-400">মেয়াদ: ২০২৮ পর্যন্ত বৈধ</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <p className="text-slate-400 font-semibold">NBR ব্যবসায় সনাক্তকরণ সংখ্যা (BIN)</p>
                    <p className="text-base font-bold text-amber-300 font-mono">002491823-0101</p>
                    <p className="text-[10px] text-slate-500">ঢাকা সেন্ট্রাল ভ্যাট কমিশনারেট</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-white">লজিস্টিক ও কুরিয়ার ইন্টিগ্রেশন</h4>
                    <div className="space-y-1.5 text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span>Pathao Merchant API:</span>
                        <span className="text-emerald-400 font-semibold font-mono">Connected</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span>Steadfast Courier API:</span>
                        <span className="text-emerald-400 font-semibold font-mono">Connected</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>SSLCommerz Payment Gateway:</span>
                        <span className="text-emerald-400 font-semibold font-mono">Live (Production)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-white">ক্লাউড ও ডাটাবেজ ব্যাকআপ</h4>
                    <div className="space-y-1.5 text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span>Primary Storage:</span>
                        <span className="text-white font-mono">MongoDB Atlas (Tejgaon DC)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span>Automated Backup:</span>
                        <span className="text-cyan-400 font-mono">Every 6 Hours</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Disaster Recovery:</span>
                        <span className="text-emerald-400 font-mono">Chittagong Secondary Node</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPage;

