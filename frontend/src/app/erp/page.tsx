'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './erp.css';
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
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  Users,
  KeyRound,
  ShoppingCart,
} from 'lucide-react';
import { ErpOrdersView } from '../../components/erp/ErpOrdersView';
import { ErpInventoryView } from '../../components/erp/ErpInventoryView';
import { ErpAccountingView } from '../../components/erp/ErpAccountingView';
import { ErpSupportView } from '../../components/erp/ErpSupportView';
import { ErpDocumentBuilderView } from '../../components/erp/ErpDocumentBuilderView';
import { ErpProductEntryView } from '../../components/erp/ErpProductEntryView';
import { ErpHrmView } from '../../components/erp/ErpHrmView';
import { ErpBannerManagerView } from '../../components/erp/ErpBannerManagerView';
import { ErpOrganizationView, OrgSubmodule } from '../../components/erp/ErpOrganizationView';
import { ErpUserManagementView, UserSubmodule } from '../../components/erp/ErpUserManagementView';
import { ErpApprovalAuditView, ApprovalSubmodule } from '../../components/erp/ErpApprovalAuditView';
import { ErpProductCatalogView } from '../../components/erp/ErpProductCatalogView';
import { ErpPurchaseView } from '../../components/erp/ErpPurchaseView';
import { ProductCatalogSubmodule, PurchaseSubmodule } from '../../types';
import { useToast } from '../../context/ToastContext';

export type ErpTab =
  | 'overview'
  | 'organization'
  | 'users'
  | 'approvals'
  | 'products'
  | 'purchase'
  | 'documents'
  | 'orders'
  | 'inventory'
  | 'accounting'
  | 'hrm'
  | 'banners'
  | 'lc'
  | 'support';

export interface ErpDashboardPageProps {
  initialTab?: ErpTab;
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

export default function ErpDashboardPage({ initialTab = 'overview' }: ErpDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<ErpTab>(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('Tejgaon Central Depot (Dhaka)');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orgSubmodule, setOrgSubmodule] = useState<OrgSubmodule>('dashboard');
  const [isOrgMenuExpanded, setIsOrgMenuExpanded] = useState<boolean>(true);
  const [userSubmodule, setUserSubmodule] = useState<UserSubmodule>('user-dashboard');
  const [isUserMenuExpanded, setIsUserMenuExpanded] = useState<boolean>(true);
  const [approvalSubmodule, setApprovalSubmodule] = useState<ApprovalSubmodule>('approval-dashboard');
  const [isApprovalMenuExpanded, setIsApprovalMenuExpanded] = useState<boolean>(true);
  const [productSubmodule, setProductSubmodule] = useState<ProductCatalogSubmodule>('product-dashboard');
  const [isProductMenuExpanded, setIsProductMenuExpanded] = useState<boolean>(true);
  const [purchaseSubmodule, setPurchaseSubmodule] = useState<PurchaseSubmodule>('purchase-dashboard');
  const [isPurchaseMenuExpanded, setIsPurchaseMenuExpanded] = useState<boolean>(true);

  const { showToast } = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('ইআরপি ডাটাবেজ ও স্টক সিঙ্ক সফল হয়েছে!', 'success');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Header Bar */}
      <header className="h-16 bg-slate-900 text-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-extrabold text-base sm:text-lg tracking-tight font-serif text-white group-hover:text-[#e6b980] transition-colors">
              SUN BIRD ERP
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e3932] text-[#e6b980] border border-[#e6b980]/30 font-bold">
              v2.4 Production
            </span>
          </Link>
        </div>

        {/* Center Branch Selector */}
        <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <Building2 className="w-3.5 h-3.5 text-[#e6b980]" />
          <span className="text-slate-400">শাখা / ডিপো:</span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            <option value="Tejgaon Central Depot (Dhaka)" className="bg-slate-900 text-white">
              Tejgaon Central Depot (Dhaka)
            </option>
            <option value="Chittagong Port Transit Hub" className="bg-slate-900 text-white">
              Chittagong Port Transit Hub
            </option>
            <option value="Sylhet Regional Medical Depot" className="bg-slate-900 text-white">
              Sylhet Regional Medical Depot
            </option>
          </select>
        </div>

        {/* Right Admin Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className={`p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
              isRefreshing ? 'animate-spin text-emerald-400' : ''
            }`}
            title="Refresh ERP Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-[#1e3932] text-[#e6b980] flex items-center justify-center font-bold text-xs border border-[#e6b980]/30">
              AD
            </div>
            <div className="hidden sm:block text-left text-xs">
              <span className="font-bold text-white block leading-tight">Admin Operations</span>
              <span className="text-[10px] text-emerald-400 font-mono">Tejgaon Central</span>
            </div>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors ml-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Admin Console</span>
          </Link>

          <Link
            href="/"
            className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-white ml-2 pl-2 border-l border-slate-800"
          >
            <span>স্টোরফ্রন্ট</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Dark Slate Sidebar */}
        <aside
          className={`bg-slate-900 text-slate-300 transition-all duration-300 shrink-0 border-r border-slate-800 flex flex-col justify-between ${
            isSidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          {/* Navigation Links */}
          <div className="p-3 space-y-1.5 overflow-y-auto no-scrollbar flex-1">
            {/* 1. Overview */}
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
              title="Overview & Metrics"
            >
              <TrendingUp
                className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-[#e6b980]' : 'text-slate-400'}`}
              />
              {isSidebarOpen && (
                <div className="text-left truncate">
                  <span className="block leading-tight">Overview & Metrics</span>
                  <span className="text-[10px] opacity-75 font-normal block">ড্যাশবোর্ড সারাংশ</span>
                </div>
              )}
            </button>

            {/* 2. Expandable Organization Management Section */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'organization') setActiveTab('organization');
                  setIsOrgMenuExpanded(!isOrgMenuExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'organization'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title="Organization Management"
              >
                <div className="flex items-center gap-3 truncate">
                  <Building2
                    className={`w-4 h-4 shrink-0 ${activeTab === 'organization' ? 'text-[#e6b980]' : 'text-slate-400'}`}
                  />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">Organization Management</span>
                      <span className="text-[10px] opacity-75 font-normal block">প্রতিষ্ঠানের ব্যবস্থাপনা</span>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isOrgMenuExpanded ? 'rotate-180 text-[#e6b980]' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {/* 12 Submodules Accordion */}
              {isSidebarOpen && isOrgMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                  {[
                    { id: 'dashboard' as OrgSubmodule, label: '1. Org Dashboard' },
                    { id: 'list' as OrgSubmodule, label: '2. Organization List' },
                    { id: 'add' as OrgSubmodule, label: '3. Add Organization' },
                    { id: 'profile' as OrgSubmodule, label: '4. Organization Profile' },
                    { id: 'branding' as OrgSubmodule, label: '5. Logo & Branding' },
                    { id: 'banks' as OrgSubmodule, label: '6. Bank Information' },
                    { id: 'signatures' as OrgSubmodule, label: '7. Signature Management' },
                    { id: 'stamps' as OrgSubmodule, label: '8. Stamp Management' },
                    { id: 'documents' as OrgSubmodule, label: '9. Document Configuration' },
                    { id: 'settings' as OrgSubmodule, label: '10. Organization Settings' },
                    { id: 'financials' as OrgSubmodule, label: '11. Financial Settings' },
                    { id: 'logs' as OrgSubmodule, label: '12. Activity Logs' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'organization' && orgSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('organization');
                          setOrgSubmodule(sub.id);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer truncate ${
                          isSubActive
                            ? 'text-[#e6b980] bg-slate-800 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Expandable User & Access Management Section */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'users') setActiveTab('users');
                  setIsUserMenuExpanded(!isUserMenuExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title="User & Access Management"
              >
                <div className="flex items-center gap-3 truncate">
                  <Users
                    className={`w-4 h-4 shrink-0 ${activeTab === 'users' ? 'text-[#e6b980]' : 'text-slate-400'}`}
                  />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">User & Access Control</span>
                      <span className="text-[10px] opacity-75 font-normal block">ব্যবহারকারী ও এক্সেস</span>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isUserMenuExpanded ? 'rotate-180 text-[#e6b980]' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {/* 12 Submodules Accordion for Users */}
              {isSidebarOpen && isUserMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                  {[
                    { id: 'user-dashboard' as UserSubmodule, label: '1. User Dashboard' },
                    { id: 'user-list' as UserSubmodule, label: '2. User List' },
                    { id: 'create-user' as UserSubmodule, label: '3. Create New User' },
                    { id: 'user-profile' as UserSubmodule, label: '4. User Profile' },
                    { id: 'role-management' as UserSubmodule, label: '5. Role Management' },
                    { id: 'permission-management' as UserSubmodule, label: '6. Permission Matrix' },
                    { id: 'organization-access' as UserSubmodule, label: '7. Org Access' },
                    { id: 'module-access-control' as UserSubmodule, label: '8. Module Access' },
                    { id: 'login-history' as UserSubmodule, label: '9. Login History' },
                    { id: 'active-sessions' as UserSubmodule, label: '10. Active Sessions' },
                    { id: 'user-activity-logs' as UserSubmodule, label: '11. User Activity Logs' },
                    { id: 'security-policies' as UserSubmodule, label: '12. Security Policies' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'users' && userSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('users');
                          setUserSubmodule(sub.id);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer truncate ${
                          isSubActive
                            ? 'text-[#e6b980] bg-slate-800 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Expandable Approval & Audit Management Section */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'approvals') setActiveTab('approvals');
                  setIsApprovalMenuExpanded(!isApprovalMenuExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'approvals'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title="Approval & Audit Management"
              >
                <div className="flex items-center gap-3 truncate">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${activeTab === 'approvals' ? 'text-[#e6b980]' : 'text-slate-400'}`}
                  />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">Approval & Audit</span>
                      <span className="text-[10px] opacity-75 font-normal block">অনুমোদন ও অডিট</span>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isApprovalMenuExpanded ? 'rotate-180 text-[#e6b980]' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {/* 15 Submodules Accordion for Approvals */}
              {isSidebarOpen && isApprovalMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                  {[
                    { id: 'approval-dashboard' as ApprovalSubmodule, label: '1. Approval Dashboard' },
                    { id: 'my-pending' as ApprovalSubmodule, label: '2. My Pending Approvals' },
                    { id: 'my-submitted' as ApprovalSubmodule, label: '3. My Submitted Requests' },
                    { id: 'all-requests' as ApprovalSubmodule, label: '4. All Approval Requests' },
                    { id: 'workflow-config' as ApprovalSubmodule, label: '5. Workflow Config' },
                    { id: 'approval-levels' as ApprovalSubmodule, label: '6. Approval Levels' },
                    { id: 'approval-matrix' as ApprovalSubmodule, label: '7. Approval Matrix' },
                    { id: 'delegation-management' as ApprovalSubmodule, label: '8. Delegation Management' },
                    { id: 'approval-history' as ApprovalSubmodule, label: '9. Approval History' },
                    { id: 'rejected-requests' as ApprovalSubmodule, label: '10. Rejected Requests' },
                    { id: 'cancelled-requests' as ApprovalSubmodule, label: '11. Cancelled Requests' },
                    { id: 'audit-trail' as ApprovalSubmodule, label: '12. Audit Trail' },
                    { id: 'audit-reports' as ApprovalSubmodule, label: '13. Audit Reports' },
                    { id: 'approval-notifications' as ApprovalSubmodule, label: '14. Notifications' },
                    { id: 'approval-settings' as ApprovalSubmodule, label: '15. Approval Settings' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'approvals' && approvalSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('approvals');
                          setApprovalSubmodule(sub.id);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer truncate ${
                          isSubActive
                            ? 'text-[#e6b980] bg-slate-800 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Expandable Product Entry & E-commerce Catalog Section (Module 04) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'products') setActiveTab('products');
                  setIsProductMenuExpanded(!isProductMenuExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title="Product Entry & Catalog"
              >
                <div className="flex items-center gap-3 truncate">
                  <Boxes
                    className={`w-4 h-4 shrink-0 ${activeTab === 'products' ? 'text-[#e6b980]' : 'text-slate-400'}`}
                  />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">Product Entry & Catalog</span>
                      <span className="text-[10px] opacity-75 font-normal block">প্রডাক্ট এন্ট্রি ও ক্যাটালগ</span>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isProductMenuExpanded ? 'rotate-180 text-[#e6b980]' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {/* 17 Submodules Accordion for Products */}
              {isSidebarOpen && isProductMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                  {[
                    { id: 'product-dashboard' as ProductCatalogSubmodule, label: '1. Product Dashboard' },
                    { id: 'erp-product-master' as ProductCatalogSubmodule, label: '2. ERP Product Master' },
                    { id: 'ecommerce-entry' as ProductCatalogSubmodule, label: '3. E-commerce Entry' },
                    { id: 'product-list' as ProductCatalogSubmodule, label: '4. Product List' },
                    { id: 'categories' as ProductCatalogSubmodule, label: '5. Product Categories' },
                    { id: 'brands' as ProductCatalogSubmodule, label: '6. Brand Management' },
                    { id: 'variants' as ProductCatalogSubmodule, label: '7. Product Variants' },
                    { id: 'attributes' as ProductCatalogSubmodule, label: '8. Product Attributes' },
                    { id: 'image-gallery' as ProductCatalogSubmodule, label: '9. Image Gallery' },
                    { id: 'pricing' as ProductCatalogSubmodule, label: '10. Product Pricing' },
                    { id: 'bulk-import' as ProductCatalogSubmodule, label: '11. Bulk Import' },
                    { id: 'product-export' as ProductCatalogSubmodule, label: '12. Product Export' },
                    { id: 'seo-management' as ProductCatalogSubmodule, label: '13. SEO Management' },
                    { id: 'website-publishing' as ProductCatalogSubmodule, label: '14. Website Publishing' },
                    { id: 'product-approval' as ProductCatalogSubmodule, label: '15. Product Approval' },
                    { id: 'activity-logs' as ProductCatalogSubmodule, label: '16. Activity Logs' },
                    { id: 'product-settings' as ProductCatalogSubmodule, label: '17. Product Settings' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'products' && productSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('products');
                          setProductSubmodule(sub.id);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer truncate ${
                          isSubActive
                            ? 'text-[#e6b980] bg-slate-800 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. Expandable Purchase & Supplier Management Section (Module 05) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'purchase') setActiveTab('purchase');
                  setIsPurchaseMenuExpanded(!isPurchaseMenuExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'purchase'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title="Purchase & Supplier Management"
              >
                <div className="flex items-center gap-3 truncate">
                  <ShoppingCart
                    className={`w-4 h-4 shrink-0 ${activeTab === 'purchase' ? 'text-[#e6b980]' : 'text-slate-400'}`}
                  />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">Purchase & Suppliers</span>
                      <span className="text-[10px] opacity-75 font-normal block">ক্রয় ও সরবরাহকারী</span>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isPurchaseMenuExpanded ? 'rotate-180 text-[#e6b980]' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {/* 18 Submodules Accordion for Purchase */}
              {isSidebarOpen && isPurchaseMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5">
                  {[
                    { id: 'purchase-dashboard' as PurchaseSubmodule, label: '1. Purchase Dashboard' },
                    { id: 'purchase-requisitions' as PurchaseSubmodule, label: '2. Requisitions (PR)' },
                    { id: 'requisition-approval' as PurchaseSubmodule, label: '3. PR Approval' },
                    { id: 'rfq-management' as PurchaseSubmodule, label: '4. RFQ Sourcing' },
                    { id: 'supplier-quotations' as PurchaseSubmodule, label: '5. Quotations' },
                    { id: 'comparative-statements' as PurchaseSubmodule, label: '6. CS Analysis' },
                    { id: 'purchase-orders' as PurchaseSubmodule, label: '7. Purchase Orders (PO)' },
                    { id: 'goods-receive-notes' as PurchaseSubmodule, label: '8. GRN Receiving' },
                    { id: 'quality-inspection' as PurchaseSubmodule, label: '9. Inspection & QC' },
                    { id: 'purchase-invoices' as PurchaseSubmodule, label: '10. Bills & Invoices' },
                    { id: 'supplier-payments' as PurchaseSubmodule, label: '11. Supplier Payments' },
                    { id: 'purchase-returns' as PurchaseSubmodule, label: '12. Purchase Returns' },
                    { id: 'supplier-directory' as PurchaseSubmodule, label: '13. Suppliers' },
                    { id: 'supplier-ledger' as PurchaseSubmodule, label: '14. Supplier Ledger' },
                    { id: 'payables-aging' as PurchaseSubmodule, label: '15. AP Aging' },
                    { id: 'import-lc-tracker' as PurchaseSubmodule, label: '16. Import LC' },
                    { id: 'purchase-reports' as PurchaseSubmodule, label: '17. Reports & Analytics' },
                    { id: 'purchase-settings' as PurchaseSubmodule, label: '18. Purchase Settings' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'purchase' && purchaseSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('purchase');
                          setPurchaseSubmodule(sub.id);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer truncate ${
                          isSubActive
                            ? 'text-[#e6b980] bg-slate-800 font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Standard ERP Modules */}
            {[
              { id: 'documents' as ErpTab, label: 'Invoice & Quotation', labelBn: 'ইনভয়েস ও কোটেশন বিল্ডার', icon: FileSpreadsheet },
              { id: 'orders' as ErpTab, label: 'Order Processing', labelBn: 'অর্ডার ও কুরিয়ার কিউ', icon: Package },
              { id: 'inventory' as ErpTab, label: 'Inventory & FEFO', labelBn: 'ইনভেন্টরি ও FEFO মেয়াদ', icon: Boxes },
              { id: 'accounting' as ErpTab, label: 'Accounts & Partnership', labelBn: 'আয়-ব্যয় ও পার্টনারশিপ', icon: DollarSign },
              { id: 'hrm' as ErpTab, label: 'HRM & Payroll', labelBn: 'এইচ আর ও পে-রোল', icon: User },
              { id: 'banners' as ErpTab, label: 'Banners & Social', labelBn: 'ব্যানার ও সোশ্যাল মিডিয়া', icon: Menu },
              { id: 'lc' as ErpTab, label: 'Import L/C Tracker', labelBn: 'আমদানি এল/সি ট্র্যাকার', icon: Ship },
              { id: 'support' as ErpTab, label: 'RMA & Support Desk', labelBn: 'RMA ওয়ারেন্টি ও ইনবক্স', icon: ShieldAlert },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#e6b980]' : 'text-slate-400'}`} />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">{item.label}</span>
                      <span className="text-[10px] opacity-75 font-normal block">{item.labelBn}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Compliance Box */}
          {isSidebarOpen && (
            <div className="p-4 m-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1 text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>NBR & DGDA Compliant</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                BIN: 002391029-0101<br />
                Tejgaon Central Depot Depot ID: 01
              </p>
            </div>
          )}
        </aside>

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* TAB 1: Overview & Metrics */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-serif">
                  অপারেশন্স ওভারভিউ ও মেকানিক্স (Operations Overview)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  সান বার্ড সেন্ট্রাল ওয়্যারহাউজ, কুরিয়ার ডিসপ্যাচ ও রেভিনিউ মেকানিক্স।
                </p>
              </div>

              {/* 4 Hero Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">মাসিক গ্রস রেভিনিউ</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="font-extrabold text-2xl font-mono text-slate-900">
                    ৳৪,৮৫,২৫০
                  </div>
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+১২.৮% গত মাসের তুলনায় বৃদ্ধি</span>
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">সক্রিয় কুরিয়ার শিপমেন্ট</span>
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="font-extrabold text-2xl font-mono text-slate-900">
                    ৪২টি পার্সেল
                  </div>
                  <span className="text-xs text-blue-700 font-semibold">
                    পাঠাও ও স্টেডফাস্ট লাইভ ট্রানজিট
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">তেজগাঁও ওয়্যারহাউজ ক্যাপাসিটি</span>
                    <Boxes className="w-4 h-4 text-[#1e3932]" />
                  </div>
                  <div className="font-extrabold text-2xl font-mono text-slate-900">
                    ৭৮.৪%
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    ২,৮৫০টি সার্টিফাইড ইউনিট সংরক্ষিত
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">RMA ওয়ারেন্টি ডিসপুট</span>
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="font-extrabold text-2xl font-mono text-slate-900">
                    ৩টি টিকেট
                  </div>
                  <span className="text-xs text-amber-800 font-semibold">
                    ১টি ল্যাব রিভিউতে অনুমোদিত
                  </span>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveTab('orders')}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#1e3932] shadow-xs cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">অর্ডার কিউ ও কুরিয়ার ডিসপ্যাচ</h4>
                      <p className="text-xs text-slate-500">প্যাকেজিং, চালান জেনারেশন ও পাঠাও হ্যান্ডওভার</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>

                <div
                  onClick={() => setActiveTab('inventory')}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#1e3932] shadow-xs cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">ইনভেন্টরি ও FEFO এক্সপায়ারি ট্র্যাকার</h4>
                      <p className="text-xs text-slate-500">মেয়াদ উত্তীর্ণের ঝুঁকি প্রতিরোধ ও স্টক অ্যাডজাস্টমেন্ট</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Organization Profile Management (Module 01) */}
          {activeTab === 'organization' && (
            <ErpOrganizationView initialSubmodule={orgSubmodule} />
          )}

          {/* TAB: User, Roles & Advanced Permission Management (Module 02) */}
          {activeTab === 'users' && (
            <ErpUserManagementView
              initialSubmodule={userSubmodule}
              onNavigateToSubmodule={(sub) => setUserSubmodule(sub)}
            />
          )}

          {/* TAB: Approval Workflow & Audit Management (Module 03) */}
          {activeTab === 'approvals' && (
            <ErpApprovalAuditView
              initialSubmodule={approvalSubmodule}
              onNavigateToSubmodule={(sub) => setApprovalSubmodule(sub)}
            />
          )}

          {/* TAB: Document & Quotation Builder */}
          {activeTab === 'documents' && <ErpDocumentBuilderView />}

          {/* TAB: Product Entry & E-commerce Catalog (Module 04) */}
          {activeTab === 'products' && (
            <ErpProductCatalogView
              initialSubmodule={productSubmodule}
              onNavigateToSubmodule={(sub) => setProductSubmodule(sub)}
            />
          )}

          {/* TAB: Purchase & Supplier Management (Module 05) */}
          {activeTab === 'purchase' && (
            <ErpPurchaseView
              currentSubmodule={purchaseSubmodule}
              onSubmoduleChange={(sub) => setPurchaseSubmodule(sub)}
            />
          )}

          {/* TAB 2: Order Processing (Prompt 35) */}
          {activeTab === 'orders' && <ErpOrdersView />}

          {/* TAB 3: Inventory & FEFO (Prompt 36) */}
          {activeTab === 'inventory' && <ErpInventoryView />}

          {/* TAB 4: Double-Entry Accounting & Partnership */}
          {activeTab === 'accounting' && <ErpAccountingView />}

          {/* TAB: HRM & Payroll */}
          {activeTab === 'hrm' && <ErpHrmView />}

          {/* TAB: Banner & Social Manager */}
          {activeTab === 'banners' && <ErpBannerManagerView />}

          {/* TAB 5: Import L/C Tracker */}
          {activeTab === 'lc' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">
                    আন্তর্জাতিক লেটার অব ক্রেডিট ও কাস্টমস ট্র্যাকার (Import L/C)
                  </h3>
                  <p className="text-xs text-slate-500">
                    বিদেশি মেডিকেল সরঞ্জাম প্রস্তুতকারকদের সাথে ব্যাংক এল/সি ও চট্টগ্রাম পোর্ট ক্লিয়ারেন্স।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {IMPORT_LC_DATA.map((lc) => (
                  <div
                    key={lc.lcNumber}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {lc.lcNumber}
                        </span>
                        <span className="text-slate-400 mx-2">•</span>
                        <span className="font-bold text-slate-700">{lc.bank}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 self-start sm:self-auto font-mono">
                        USD ${lc.valueUsd.toLocaleString('en-US')}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-800 text-sm">{lc.equipment}</div>
                      <div className="text-slate-500">সরবরাহকারী: <strong>{lc.beneficiary}</strong></div>
                      <div className="text-slate-600 font-mono text-[11px] pt-1">
                        ইটিএ / লজিস্টিকস: <strong>{lc.eta}</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono font-bold">
                        <span className="text-slate-500">ক্লিয়ারেন্স অগ্রগতি</span>
                        <span className="text-emerald-700">{lc.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#c89348] to-[#1e3932] rounded-full transition-all"
                          style={{ width: `${lc.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: RMA Warranty & Support Desk (Prompt 38) */}
          {activeTab === 'support' && <ErpSupportView />}
        </main>
      </div>
    </div>
  );
}
