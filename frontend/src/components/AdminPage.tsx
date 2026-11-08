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
import { useToast } from '../context/ToastContext';

type AdminTab = 'overview' | 'orders' | 'inventory' | 'accounting' | 'lc' | 'support' | 'users' | 'settings';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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
                <span>General Ledger (মূসক-৬.৩)</span>
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

          {activeTab === 'orders' && <ErpOrdersView />}
          {activeTab === 'inventory' && <ErpInventoryView />}
          {activeTab === 'accounting' && <ErpAccountingView />}
          {activeTab === 'support' && <ErpSupportView />}

          {activeTab === 'users' && (
            <div className="max-w-5xl mx-auto space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">ব্যবহারকারী ও রোল ম্যানেজমেন্ট (RBAC)</h2>
                  <p className="text-xs text-slate-400">হাসপাতাল অ্যাকাউন্ট ও স্টাফ পারমিশন নিয়ন্ত্রণ করুন</p>
                </div>
                <span className="admin-badge-online">Active Directory Sync</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 text-xs text-slate-300">
                <p><strong>Super Admin:</strong> admin@sunbirdcorp.com (Full Root Access)</p>
                <p className="mt-1"><strong>Hospital Managers:</strong> 500+ Verified Institutional Healthcare Accounts</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-5xl mx-auto space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-4">
                সিস্টেম ও ট্যাক্স সেটিংস
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-900 space-y-1">
                  <p className="text-slate-400 font-semibold">NBR মূসক-৬.৩ ভ্যাট হার</p>
                  <p className="text-base font-bold text-emerald-400">১৫.০০% (স্ট্যান্ডার্ড রেট)</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 space-y-1">
                  <p className="text-slate-400 font-semibold">DGDA রেজিস্টার্ড লাইসেন্স</p>
                  <p className="text-base font-bold text-white">DGDA-IMP-2024-8841 (Active)</p>
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

