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
  Bot,
  Sparkles,
} from 'lucide-react';
import { ErpOrdersView } from '../../components/erp/ErpOrdersView';
import { ErpInventoryView } from '../../components/erp/ErpInventoryView';
import { ErpInventoryManagementView } from '../../components/erp/ErpInventoryManagementView';
import { ErpAccountingView } from '../../components/erp/ErpAccountingView';
import { ErpSupportView } from '../../components/erp/ErpSupportView';
import { ErpDocumentManagementView } from '../../components/erp/ErpDocumentManagementView';
import { ErpProductEntryView } from '../../components/erp/ErpProductEntryView';
import { ErpHrmView } from '../../components/erp/ErpHrmView';
import { ErpMarketingView } from '../../components/erp/ErpMarketingView';
import { ErpImportTrackerView } from '../../components/erp/ErpImportTrackerView';
import { ErpSupportDeskView } from '../../components/erp/ErpSupportDeskView';
import { ErpExecutiveMisView } from '../../components/erp/ErpExecutiveMisView';
import { ErpAiCentralView } from '../../components/erp/ErpAiCentralView';
import { ErpOrganizationView, OrgSubmodule } from '../../components/erp/ErpOrganizationView';
import { ErpUserManagementView, UserSubmodule } from '../../components/erp/ErpUserManagementView';
import { ErpApprovalAuditView, ApprovalSubmodule } from '../../components/erp/ErpApprovalAuditView';
import { ErpProductCatalogView } from '../../components/erp/ErpProductCatalogView';
import { ErpPurchaseView } from '../../components/erp/ErpPurchaseView';
import { ProductCatalogSubmodule, PurchaseSubmodule, InventorySubmodule, OrderSubmodule, HrmSubmodule, MarketingSubmodule, ImportSubmodule, SupportSubmodule, MisSubmodule, AiSubmodule } from '../../types';
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
  | 'support'
  | 'ai';

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
  const [orderSubmodule, setOrderSubmodule] = useState<OrderSubmodule>('order-dashboard');
  const [isOrderMenuExpanded, setIsOrderMenuExpanded] = useState<boolean>(true);
  const [hrmSubmodule, setHrmSubmodule] = useState<HrmSubmodule>('hr-dashboard');
  const [isHrmMenuExpanded, setIsHrmMenuExpanded] = useState<boolean>(true);
  const [marketingSubmodule, setMarketingSubmodule] = useState<MarketingSubmodule>('marketing-dashboard');
  const [isMarketingMenuExpanded, setIsMarketingMenuExpanded] = useState<boolean>(true);
  const [importSubmodule, setImportSubmodule] = useState<ImportSubmodule>('import-dashboard');
  const [isImportMenuExpanded, setIsImportMenuExpanded] = useState<boolean>(true);
  const [supportSubmodule, setSupportSubmodule] = useState<SupportSubmodule>('support-dashboard');
  const [isSupportMenuExpanded, setIsSupportMenuExpanded] = useState<boolean>(true);
  const [misSubmodule, setMisSubmodule] = useState<MisSubmodule>('executive-dashboard');
  const [isMisMenuExpanded, setIsMisMenuExpanded] = useState<boolean>(true);
  const [aiSubmodule, setAiSubmodule] = useState<AiSubmodule>('ai-dashboard');
  const [isAiMenuExpanded, setIsAiMenuExpanded] = useState<boolean>(true);

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
            {/* 1. Overview & Advanced MIS — Upgraded Module 14 (58 Submodules) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'overview') setActiveTab('overview');
                  setIsMisMenuExpanded(!isMisMenuExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title="Overview & Advanced MIS"
              >
                <div className="flex items-center gap-3 truncate">
                  <TrendingUp
                    className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-[#e6b980]' : 'text-slate-400'}`}
                  />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">01. Overview & MIS</span>
                      <span className="text-[10px] opacity-75 font-normal block">এক্সিকিউটিভ ড্যাশবোর্ড ও বিআই</span>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  isMisMenuExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  )
                )}
              </button>

              {/* 58 Submodules Accordion for Overview & Advanced MIS */}
              {isSidebarOpen && isMisMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5 max-h-60 overflow-y-auto">
                  {[
                    // Executive Overview (1-6)
                    { id: 'executive-dashboard' as MisSubmodule, label: '01. Executive Dashboard' },
                    { id: 'business-overview' as MisSubmodule, label: '02. Business Overview' },
                    { id: 'org-wise-dashboard' as MisSubmodule, label: '03. Org-wise Dashboard' },
                    { id: 'dept-wise-dashboard' as MisSubmodule, label: '04. Dept-wise Dashboard' },
                    { id: 'management-summary' as MisSubmodule, label: '05. Management Summary' },
                    { id: 'daily-business-digest' as MisSubmodule, label: '06. Daily Business Digest' },
                    // Sales & Revenue Intelligence (7-14)
                    { id: 'sales-performance-overview' as MisSubmodule, label: '07. Sales Performance' },
                    { id: 'revenue-analytics' as MisSubmodule, label: '08. Revenue Analytics' },
                    { id: 'product-sales-analytics' as MisSubmodule, label: '09. Product Sales BI' },
                    { id: 'customer-sales-intelligence' as MisSubmodule, label: '10. Customer Intelligence' },
                    { id: 'regional-sales-analytics' as MisSubmodule, label: '11. Regional Sales BI' },
                    { id: 'channel-wise-sales' as MisSubmodule, label: '12. Channel-wise Sales' },
                    { id: 'sales-team-performance' as MisSubmodule, label: '13. Sales Team Performance' },
                    { id: 'sales-target-vs-achievement' as MisSubmodule, label: '14. Target vs Achievement' },
                    // Financial Intelligence (15-24)
                    { id: 'financial-health-dashboard' as MisSubmodule, label: '15. Financial Health' },
                    { id: 'profit-loss-analysis' as MisSubmodule, label: '16. Profit & Loss (P&L)' },
                    { id: 'cash-flow-intelligence' as MisSubmodule, label: '17. Cash Flow BI' },
                    { id: 'balance-sheet-overview' as MisSubmodule, label: '18. Balance Sheet' },
                    { id: 'accounts-receivable-aging' as MisSubmodule, label: '19. AR Aging Intelligence' },
                    { id: 'accounts-payable-intelligence' as MisSubmodule, label: '20. AP Intelligence' },
                    { id: 'expense-analysis' as MisSubmodule, label: '21. Expense Analysis' },
                    { id: 'tax-vat-overview' as MisSubmodule, label: '22. Tax & VAT Overview' },
                    { id: 'working-capital-tracker' as MisSubmodule, label: '23. Working Capital' },
                    { id: 'financial-ratio-analysis' as MisSubmodule, label: '24. Financial Ratios' },
                    // Inventory & Procurement Intelligence (25-33)
                    { id: 'inventory-overview' as MisSubmodule, label: '25. Inventory Overview' },
                    { id: 'stock-valuation-report' as MisSubmodule, label: '26. Stock Valuation' },
                    { id: 'slow-moving-dead-stock' as MisSubmodule, label: '27. Slow/Dead Stock' },
                    { id: 'fast-moving-products' as MisSubmodule, label: '28. Fast Moving SKUs' },
                    { id: 'stock-reorder-alerts' as MisSubmodule, label: '29. Stock Reorder Alerts' },
                    { id: 'procurement-spend-analysis' as MisSubmodule, label: '30. Procurement Spend' },
                    { id: 'supplier-performance-scorecard' as MisSubmodule, label: '31. Supplier Scorecard' },
                    { id: 'purchase-order-status-tracker' as MisSubmodule, label: '32. PO Status Tracker' },
                    { id: 'landed-cost-summary' as MisSubmodule, label: '33. Landed Cost Summary' },
                    // E-commerce & Marketing Intelligence (34-40)
                    { id: 'ecommerce-sales-overview' as MisSubmodule, label: '34. E-commerce BI' },
                    { id: 'traffic-conversion-analytics' as MisSubmodule, label: '35. Traffic & Conversion' },
                    { id: 'cart-abandonment-tracker' as MisSubmodule, label: '36. Cart Abandonment' },
                    { id: 'digital-marketing-roi' as MisSubmodule, label: '37. Marketing ROI' },
                    { id: 'campaign-performance' as MisSubmodule, label: '38. Campaign Performance' },
                    { id: 'coupon-discount-usage' as MisSubmodule, label: '39. Coupon & Discounts' },
                    { id: 'customer-acquisition-cost' as MisSubmodule, label: '40. CAC Analytics' },
                    // Import & Operational Intelligence (41-47)
                    { id: 'import-overview-tracker' as MisSubmodule, label: '41. Import BI Tracker' },
                    { id: 'lc-status-summary' as MisSubmodule, label: '42. LC Status Summary' },
                    { id: 'shipment-delay-tracker' as MisSubmodule, label: '43. Shipment Delay Alert' },
                    { id: 'port-demurrage-risk' as MisSubmodule, label: '44. Demurrage Risk' },
                    { id: 'order-fulfillment-cycle-time' as MisSubmodule, label: '45. Fulfillment Cycle' },
                    { id: 'delivery-fleet-performance' as MisSubmodule, label: '46. Fleet Performance' },
                    { id: 'support-service-sla-tracker' as MisSubmodule, label: '47. Support SLA Tracker' },
                    // Advanced Business Intelligence (48-58)
                    { id: 'ai-business-analyst' as MisSubmodule, label: '48. AI Business Analyst' },
                    { id: 'ai-forecasting-center' as MisSubmodule, label: '49. AI Forecasting Center' },
                    { id: 'predictive-revenue-model' as MisSubmodule, label: '50. Predictive Revenue' },
                    { id: 'inventory-demand-forecast' as MisSubmodule, label: '51. Inventory Forecast' },
                    { id: 'anomaly-risk-detector' as MisSubmodule, label: '52. Anomaly & Risk Radar' },
                    { id: 'executive-decision-support' as MisSubmodule, label: '53. Decision Support' },
                    { id: 'custom-report-builder' as MisSubmodule, label: '54. Custom Report Builder' },
                    { id: 'scheduled-management-reports' as MisSubmodule, label: '55. Scheduled Reports' },
                    { id: 'comparative-business-trends' as MisSubmodule, label: '56. Comparative Trends' },
                    { id: 'data-quality-audit-tracker' as MisSubmodule, label: '57. Data Quality Audit' },
                    { id: 'executive-settings-kpi-targets' as MisSubmodule, label: '58. KPI Target Settings' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'overview' && misSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('overview');
                          setMisSubmodule(sub.id);
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

            {/* 7. Expandable Order Processing Section (Module 09) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'orders') setActiveTab('orders');
                  setIsOrderMenuExpanded(!isOrderMenuExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title="Order Processing & E-commerce"
              >
                <div className="flex items-center gap-3 truncate">
                  <Package
                    className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-[#e6b980]' : 'text-slate-400'}`}
                  />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">Order Processing</span>
                      <span className="text-[10px] opacity-75 font-normal block">অর্ডার ও কুরিয়ার হাব</span>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isOrderMenuExpanded ? 'rotate-180 text-[#e6b980]' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {/* 23 Submodules Accordion for Order Processing */}
              {isSidebarOpen && isOrderMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5 max-h-72 overflow-y-auto no-scrollbar">
                  {[
                    { id: 'order-dashboard' as OrderSubmodule, label: '1. Order Dashboard' },
                    { id: 'online-orders' as OrderSubmodule, label: '2. Online Orders' },
                    { id: 'sales-orders' as OrderSubmodule, label: '3. Sales Orders (B2B)' },
                    { id: 'order-details' as OrderSubmodule, label: '4. Order Details' },
                    { id: 'payment-verification' as OrderSubmodule, label: '5. Payment Verification' },
                    { id: 'order-approval' as OrderSubmodule, label: '6. Order Approval' },
                    { id: 'order-reservation' as OrderSubmodule, label: '7. Order Reservation' },
                    { id: 'stock-availability' as OrderSubmodule, label: '8. Stock Availability' },
                    { id: 'order-picking' as OrderSubmodule, label: '9. Order Picking' },
                    { id: 'order-packing' as OrderSubmodule, label: '10. Order Packing' },
                    { id: 'packing-list' as OrderSubmodule, label: '11. Packing List' },
                    { id: 'dispatch-management' as OrderSubmodule, label: '12. Dispatch Management' },
                    { id: 'delivery-management' as OrderSubmodule, label: '13. Delivery Management' },
                    { id: 'delivery-tracking' as OrderSubmodule, label: '14. Delivery Tracking' },
                    { id: 'partial-delivery' as OrderSubmodule, label: '15. Partial Delivery' },
                    { id: 'order-cancellation' as OrderSubmodule, label: '16. Order Cancellation' },
                    { id: 'sales-return' as OrderSubmodule, label: '17. Sales Return Integration' },
                    { id: 'order-timeline' as OrderSubmodule, label: '18. Order Timeline' },
                    { id: 'order-documents' as OrderSubmodule, label: '19. Order Documents' },
                    { id: 'customer-history' as OrderSubmodule, label: '20. Customer Order History' },
                    { id: 'order-reports' as OrderSubmodule, label: '21. Order Reports' },
                    { id: 'order-activity-logs' as OrderSubmodule, label: '22. Order Activity Logs' },
                    { id: 'order-settings' as OrderSubmodule, label: '23. Order Settings' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'orders' && orderSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('orders');
                          setOrderSubmodule(sub.id);
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

            {/* HRM & Payroll Module — Accordion (Module 10) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('hrm');
                  setIsHrmMenuExpanded(!isHrmMenuExpanded);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'hrm'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <User className={`w-4 h-4 shrink-0 ${activeTab === 'hrm' ? 'text-[#e6b980]' : 'text-slate-400'}`} />
                {isSidebarOpen && (
                  <>
                    <div className="text-left truncate flex-1">
                      <span className="block leading-tight">07. HR &amp; Payroll</span>
                      <span className="text-[10px] opacity-75 font-normal block">এইচ আর ও পে-রোল</span>
                    </div>
                    {isHrmMenuExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </>
                )}
              </button>
              {isHrmMenuExpanded && isSidebarOpen && activeTab === 'hrm' && (
                <div className="ml-3 mt-1 space-y-0.5 border-l border-slate-700/60 pl-3 max-h-96 overflow-y-auto">
                  {[
                    { id: 'hr-dashboard' as HrmSubmodule, label: '01. HR Dashboard' },
                    { id: 'employee-management' as HrmSubmodule, label: '02. Employee Management' },
                    { id: 'employee-directory' as HrmSubmodule, label: '03. Employee Directory' },
                    { id: 'employee-profile' as HrmSubmodule, label: '04. Employee Profile' },
                    { id: 'employee-onboarding' as HrmSubmodule, label: '05. Employee Onboarding' },
                    { id: 'employee-offboarding' as HrmSubmodule, label: '06. Employee Offboarding' },
                    { id: 'departments' as HrmSubmodule, label: '07. Departments' },
                    { id: 'designations' as HrmSubmodule, label: '08. Designations' },
                    { id: 'job-grades' as HrmSubmodule, label: '09. Job Grades' },
                    { id: 'employment-types' as HrmSubmodule, label: '10. Employment Types' },
                    { id: 'employee-documents' as HrmSubmodule, label: '11. Employee Documents' },
                    { id: 'employee-id-card' as HrmSubmodule, label: '12. Employee ID Card' },
                    { id: 'employee-contacts' as HrmSubmodule, label: '13. Employee Contacts' },
                    { id: 'emergency-contacts' as HrmSubmodule, label: '14. Emergency Contacts' },
                    { id: 'org-chart' as HrmSubmodule, label: '15. Organization Chart' },
                    { id: 'attendance-management' as HrmSubmodule, label: '16. Attendance Management' },
                    { id: 'attendance-dashboard' as HrmSubmodule, label: '17. Attendance Dashboard' },
                    { id: 'attendance-entry' as HrmSubmodule, label: '18. Attendance Entry' },
                    { id: 'attendance-import' as HrmSubmodule, label: '19. Attendance Import' },
                    { id: 'attendance-correction' as HrmSubmodule, label: '20. Attendance Correction' },
                    { id: 'shift-management' as HrmSubmodule, label: '21. Shift Management' },
                    { id: 'shift-assignment' as HrmSubmodule, label: '22. Shift Assignment' },
                    { id: 'roster-management' as HrmSubmodule, label: '23. Roster Management' },
                    { id: 'holiday-management' as HrmSubmodule, label: '24. Holiday Management' },
                    { id: 'leave-management' as HrmSubmodule, label: '25. Leave Management' },
                    { id: 'leave-requests' as HrmSubmodule, label: '26. Leave Requests' },
                    { id: 'leave-approval' as HrmSubmodule, label: '27. Leave Approval' },
                    { id: 'leave-types' as HrmSubmodule, label: '28. Leave Types' },
                    { id: 'leave-balance' as HrmSubmodule, label: '29. Leave Balance' },
                    { id: 'leave-calendar' as HrmSubmodule, label: '30. Leave Calendar' },
                    { id: 'overtime-management' as HrmSubmodule, label: '31. Overtime Management' },
                    { id: 'late-early-leave' as HrmSubmodule, label: '32. Late & Early Leave' },
                    { id: 'payroll-management' as HrmSubmodule, label: '33. Payroll Management' },
                    { id: 'payroll-dashboard' as HrmSubmodule, label: '34. Payroll Dashboard' },
                    { id: 'salary-structure' as HrmSubmodule, label: '35. Salary Structure' },
                    { id: 'salary-components' as HrmSubmodule, label: '36. Salary Components' },
                    { id: 'salary-assignment' as HrmSubmodule, label: '37. Salary Assignment' },
                    { id: 'payroll-processing' as HrmSubmodule, label: '38. Payroll Processing' },
                    { id: 'payroll-review' as HrmSubmodule, label: '39. Payroll Review' },
                    { id: 'payroll-approval' as HrmSubmodule, label: '40. Payroll Approval' },
                    { id: 'salary-payment' as HrmSubmodule, label: '41. Salary Payment' },
                    { id: 'payslip' as HrmSubmodule, label: '42. Payslip' },
                    { id: 'payroll-history' as HrmSubmodule, label: '43. Payroll History' },
                    { id: 'employee-loan' as HrmSubmodule, label: '44. Employee Loan' },
                    { id: 'employee-advance' as HrmSubmodule, label: '45. Employee Advance' },
                    { id: 'loan-repayment' as HrmSubmodule, label: '46. Loan Repayment' },
                    { id: 'expense-reimbursement' as HrmSubmodule, label: '47. Expense Reimbursement' },
                    { id: 'performance-management' as HrmSubmodule, label: '48. Performance Management' },
                    { id: 'training-development' as HrmSubmodule, label: '49. Training & Development' },
                    { id: 'hr-reports' as HrmSubmodule, label: '50. HR Reports' },
                    { id: 'hr-audit-logs' as HrmSubmodule, label: '51. HR Audit Logs' },
                    { id: 'hr-settings' as HrmSubmodule, label: '52. HR Settings' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'hrm' && hrmSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('hrm');
                          setHrmSubmodule(sub.id);
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

            {/* Banners, Social Media & Marketing Module — Accordion (Module 11) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('banners');
                  setIsMarketingMenuExpanded(!isMarketingMenuExpanded);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'banners'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <Menu className={`w-4 h-4 shrink-0 ${activeTab === 'banners' ? 'text-[#e6b980]' : 'text-slate-400'}`} />
                {isSidebarOpen && (
                  <>
                    <div className="text-left truncate flex-1">
                      <span className="block leading-tight">08. Banners &amp; Social</span>
                      <span className="text-[10px] opacity-75 font-normal block">ব্যানার ও সোশ্যাল মিডিয়া</span>
                    </div>
                    {isMarketingMenuExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </>
                )}
              </button>

              {/* 31 Submodules Accordion for Marketing */}
              {isSidebarOpen && isMarketingMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5 max-h-60 overflow-y-auto">
                  {[
                    { id: 'marketing-dashboard' as MarketingSubmodule, label: '1. Marketing Dashboard' },
                    { id: 'website-banners' as MarketingSubmodule, label: '2. Website Banners' },
                    { id: 'homepage-sliders' as MarketingSubmodule, label: '3. Homepage Sliders' },
                    { id: 'promotional-campaigns' as MarketingSubmodule, label: '4. Promotional Campaigns' },
                    { id: 'product-promotions' as MarketingSubmodule, label: '5. Product Promotions' },
                    { id: 'category-promotions' as MarketingSubmodule, label: '6. Category Promotions' },
                    { id: 'brand-promotions' as MarketingSubmodule, label: '7. Brand Promotions' },
                    { id: 'landing-pages' as MarketingSubmodule, label: '8. Landing Pages' },
                    { id: 'website-content' as MarketingSubmodule, label: '9. Website Content' },
                    { id: 'homepage-sections' as MarketingSubmodule, label: '10. Homepage Sections' },
                    { id: 'promotional-popups' as MarketingSubmodule, label: '11. Promotional Popups' },
                    { id: 'announcement-bar' as MarketingSubmodule, label: '12. Announcement Bar' },
                    { id: 'navigation-menu' as MarketingSubmodule, label: '13. Navigation Menu Management' },
                    { id: 'social-media-management' as MarketingSubmodule, label: '14. Social Media Management' },
                    { id: 'social-accounts' as MarketingSubmodule, label: '15. Social Media Accounts' },
                    { id: 'social-content' as MarketingSubmodule, label: '16. Social Media Content' },
                    { id: 'social-calendar' as MarketingSubmodule, label: '17. Social Media Calendar' },
                    { id: 'content-planner' as MarketingSubmodule, label: '18. Content Planner' },
                    { id: 'marketing-calendar' as MarketingSubmodule, label: '19. Marketing Calendar' },
                    { id: 'campaign-scheduler' as MarketingSubmodule, label: '20. Campaign Scheduler' },
                    { id: 'seo-management' as MarketingSubmodule, label: '21. SEO Management' },
                    { id: 'media-gallery' as MarketingSubmodule, label: '22. Media Gallery' },
                    { id: 'content-templates' as MarketingSubmodule, label: '23. Content Templates' },
                    { id: 'content-approval' as MarketingSubmodule, label: '24. Content Approval' },
                    { id: 'scheduled-publishing' as MarketingSubmodule, label: '25. Scheduled Publishing' },
                    { id: 'published-content' as MarketingSubmodule, label: '26. Published Content' },
                    { id: 'campaign-analytics' as MarketingSubmodule, label: '27. Campaign Analytics' },
                    { id: 'social-analytics' as MarketingSubmodule, label: '28. Social Analytics' },
                    { id: 'marketing-reports' as MarketingSubmodule, label: '29. Marketing Reports' },
                    { id: 'marketing-settings' as MarketingSubmodule, label: '30. Marketing Settings' },
                    { id: 'marketing-activity-logs' as MarketingSubmodule, label: '31. Marketing Activity Logs' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'banners' && marketingSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('banners');
                          setMarketingSubmodule(sub.id);
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

            {/* Import / LC Tracker & AI Management — Accordion (Module 12) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('lc');
                  setIsImportMenuExpanded(!isImportMenuExpanded);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'lc'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <Ship className={`w-4 h-4 shrink-0 ${activeTab === 'lc' ? 'text-[#e6b980]' : 'text-slate-400'}`} />
                {isSidebarOpen && (
                  <>
                    <div className="text-left truncate flex-1">
                      <span className="block leading-tight">09. Import / LC Tracker</span>
                      <span className="text-[10px] opacity-75 font-normal block">আমদানি ও এল/সি ট্র্যাকার</span>
                    </div>
                    {isImportMenuExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </>
                )}
              </button>

              {/* 34 Submodules Accordion for Import */}
              {isSidebarOpen && isImportMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5 max-h-60 overflow-y-auto">
                  {[
                    { id: 'import-dashboard' as ImportSubmodule, label: '1. Import Dashboard' },
                    { id: 'import-purchase-requisition' as ImportSubmodule, label: '2. Import Requisition' },
                    { id: 'import-purchase-order' as ImportSubmodule, label: '3. Import Purchase Order' },
                    { id: 'proforma-invoice' as ImportSubmodule, label: '4. Proforma Invoice (PI)' },
                    { id: 'import-supplier-management' as ImportSubmodule, label: '5. Import Supplier' },
                    { id: 'lc-application-opening' as ImportSubmodule, label: '6. LC Application & Opening' },
                    { id: 'lc-amendment-management' as ImportSubmodule, label: '7. LC Amendment' },
                    { id: 'lc-register' as ImportSubmodule, label: '8. LC Register' },
                    { id: 'bank-financial-documents' as ImportSubmodule, label: '9. Bank & Financial Docs' },
                    { id: 'shipment-management' as ImportSubmodule, label: '10. Shipment Management' },
                    { id: 'shipment-tracking' as ImportSubmodule, label: '11. Shipment Tracking' },
                    { id: 'commercial-invoice' as ImportSubmodule, label: '12. Commercial Invoice' },
                    { id: 'packing-list' as ImportSubmodule, label: '13. Packing List' },
                    { id: 'bill-of-lading' as ImportSubmodule, label: '14. Bill of Lading (BL)' },
                    { id: 'airway-bill' as ImportSubmodule, label: '15. Airway Bill (AWB)' },
                    { id: 'certificate-of-origin' as ImportSubmodule, label: '16. Certificate of Origin' },
                    { id: 'insurance-documents' as ImportSubmodule, label: '17. Insurance Documents' },
                    { id: 'inspection-certificates' as ImportSubmodule, label: '18. Inspection Certificates' },
                    { id: 'customs-port-clearance' as ImportSubmodule, label: '19. Customs & Port Clearance' },
                    { id: 'bill-of-entry' as ImportSubmodule, label: '20. Bill of Entry' },
                    { id: 'duty-vat-tax-management' as ImportSubmodule, label: '21. Duty & VAT Management' },
                    { id: 'freight-logistics-expenses' as ImportSubmodule, label: '22. Freight Expenses' },
                    { id: 'import-payment-management' as ImportSubmodule, label: '23. Import Payments' },
                    { id: 'lc-margin-bank-charges' as ImportSubmodule, label: '24. LC Margin & Charges' },
                    { id: 'landed-cost-calculation' as ImportSubmodule, label: '25. Landed Cost Calculation' },
                    { id: 'import-goods-receive-grn' as ImportSubmodule, label: '26. Import GRN' },
                    { id: 'import-document-management' as ImportSubmodule, label: '27. Document Repository' },
                    { id: 'import-approval-center' as ImportSubmodule, label: '28. Import Approvals' },
                    { id: 'import-alerts-notifications' as ImportSubmodule, label: '29. Alerts & Notifications' },
                    { id: 'import-ai-assistant' as ImportSubmodule, label: '30. Import AI Assistant' },
                    { id: 'import-mis-analytics' as ImportSubmodule, label: '31. Import MIS' },
                    { id: 'import-reports' as ImportSubmodule, label: '32. Import Reports' },
                    { id: 'import-settings' as ImportSubmodule, label: '33. Import Settings' },
                    { id: 'import-activity-audit-logs' as ImportSubmodule, label: '34. Import Audit Logs' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'lc' && importSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('lc');
                          setImportSubmodule(sub.id);
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

            {/* RMA & Support Desk — Accordion (Module 13) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('support');
                  setIsSupportMenuExpanded(!isSupportMenuExpanded);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'support'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 shrink-0 ${activeTab === 'support' ? 'text-[#e6b980]' : 'text-slate-400'}`} />
                {isSidebarOpen && (
                  <>
                    <div className="text-left truncate flex-1">
                      <span className="block leading-tight">10. RMA &amp; Support Desk</span>
                      <span className="text-[10px] opacity-75 font-normal block">কাস্টমার সাপোর্ট ও ওয়ারেন্টি</span>
                    </div>
                    {isSupportMenuExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </>
                )}
              </button>

              {/* 43 Submodules Accordion for RMA & Support */}
              {isSidebarOpen && isSupportMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5 max-h-60 overflow-y-auto">
                  {[
                    // Customer Support (1-11)
                    { id: 'support-dashboard' as SupportSubmodule, label: '01. Support Dashboard' },
                    { id: 'customer-complaints' as SupportSubmodule, label: '02. Customer Complaints' },
                    { id: 'support-tickets' as SupportSubmodule, label: '03. Support Tickets' },
                    { id: 'live-customer-support' as SupportSubmodule, label: '04. Live Customer Support' },
                    { id: 'customer-messages' as SupportSubmodule, label: '05. Customer Messages' },
                    { id: 'communication-history' as SupportSubmodule, label: '06. Email & Comms History' },
                    { id: 'customer-call-logs' as SupportSubmodule, label: '07. Customer Call Logs' },
                    { id: 'support-categories' as SupportSubmodule, label: '08. Support Categories' },
                    { id: 'priority-sla-management' as SupportSubmodule, label: '09. Priority & SLA Mgmt' },
                    { id: 'support-assignment' as SupportSubmodule, label: '10. Support Assignment' },
                    { id: 'escalation-management' as SupportSubmodule, label: '11. Escalation Management' },
                    // RMA & Return Management (12-22)
                    { id: 'return-requests' as SupportSubmodule, label: '12. Return Requests' },
                    { id: 'return-approval' as SupportSubmodule, label: '13. Return Approval' },
                    { id: 'rma-register' as SupportSubmodule, label: '14. RMA Register' },
                    { id: 'return-inspection' as SupportSubmodule, label: '15. Return Inspection' },
                    { id: 'product-defect-management' as SupportSubmodule, label: '16. Defect Management' },
                    { id: 'replacement-management' as SupportSubmodule, label: '17. Replacement Mgmt' },
                    { id: 'refund-management' as SupportSubmodule, label: '18. Refund Management' },
                    { id: 'exchange-management' as SupportSubmodule, label: '19. Exchange Management' },
                    { id: 'return-shipping-pickup' as SupportSubmodule, label: '20. Return Shipping & Pickup' },
                    { id: 'return-tracking' as SupportSubmodule, label: '21. Return Tracking' },
                    { id: 'return-reports' as SupportSubmodule, label: '22. Return Reports' },
                    // Warranty & Service (23-32)
                    { id: 'warranty-registration' as SupportSubmodule, label: '23. Warranty Registration' },
                    { id: 'warranty-claims' as SupportSubmodule, label: '24. Warranty Claims' },
                    { id: 'warranty-verification' as SupportSubmodule, label: '25. Warranty Verification' },
                    { id: 'warranty-policy-management' as SupportSubmodule, label: '26. Warranty Policy Mgmt' },
                    { id: 'repair-service-center' as SupportSubmodule, label: '27. Repair & Service Center' },
                    { id: 'repair-job-cards' as SupportSubmodule, label: '28. Repair Job Cards' },
                    { id: 'spare-parts-management' as SupportSubmodule, label: '29. Spare Parts Management' },
                    { id: 'service-history' as SupportSubmodule, label: '30. Service History' },
                    { id: 'product-maintenance' as SupportSubmodule, label: '31. Product Maintenance' },
                    { id: 'warranty-expiry-alerts' as SupportSubmodule, label: '32. Warranty Expiry Alerts' },
                    // AI & Analytics (33-43)
                    { id: 'ai-support-assistant' as SupportSubmodule, label: '33. AI Support Assistant' },
                    { id: 'ai-complaint-analysis' as SupportSubmodule, label: '34. AI Complaint Analysis' },
                    { id: 'ai-warranty-assistant' as SupportSubmodule, label: '35. AI Warranty Assistant' },
                    { id: 'ai-return-eligibility' as SupportSubmodule, label: '36. AI Return Eligibility' },
                    { id: 'ai-sentiment-analysis' as SupportSubmodule, label: '37. AI Sentiment Analysis' },
                    { id: 'ai-response-generator' as SupportSubmodule, label: '38. AI Response Generator' },
                    { id: 'ai-support-analytics' as SupportSubmodule, label: '39. AI Support Analytics' },
                    { id: 'customer-satisfaction-reports' as SupportSubmodule, label: '40. CSAT Reports' },
                    { id: 'support-mis-analytics' as SupportSubmodule, label: '41. Support MIS & Analytics' },
                    { id: 'support-settings' as SupportSubmodule, label: '42. Support Settings' },
                    { id: 'support-activity-logs' as SupportSubmodule, label: '43. Support Activity Logs' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'support' && supportSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('support');
                          setSupportSubmodule(sub.id);
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

            {/* 11. AI Assistant & Central Intelligence System (Module 15) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'ai') setActiveTab('ai');
                  setIsAiMenuExpanded(!isAiMenuExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
                title="AI Assistant & Central Intelligence System"
              >
                <div className="flex items-center gap-3 truncate">
                  <Bot
                    className={`w-4 h-4 shrink-0 ${activeTab === 'ai' ? 'text-[#e6b980]' : 'text-slate-400'}`}
                  />
                  {isSidebarOpen && (
                    <div className="text-left truncate">
                      <span className="block leading-tight">11. AI Assistant</span>
                      <span className="text-[10px] opacity-75 font-normal block">সেন্ট্রাল এআই ইন্টেলিজেন্স</span>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  isAiMenuExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  )
                )}
              </button>

              {/* 21 Submodules Accordion for AI Assistant */}
              {isSidebarOpen && isAiMenuExpanded && (
                <div className="mt-1 ml-4 pl-2 border-l border-slate-800 space-y-0.5 max-h-60 overflow-y-auto">
                  {[
                    { id: 'ai-dashboard' as AiSubmodule, label: '01. AI Dashboard' },
                    { id: 'ai-chat-assistant' as AiSubmodule, label: '02. AI Chat Assistant' },
                    { id: 'ai-control-center' as AiSubmodule, label: '03. AI Control Center' },
                    { id: 'ai-provider-mgmt' as AiSubmodule, label: '04. AI Provider Management' },
                    { id: 'ai-model-mgmt' as AiSubmodule, label: '05. AI Model Management' },
                    { id: 'ai-feature-mgmt' as AiSubmodule, label: '06. AI Feature Management' },
                    { id: 'ai-prompt-library' as AiSubmodule, label: '07. Prompt & Template Library' },
                    { id: 'ai-doc-intelligence' as AiSubmodule, label: '08. Document Intelligence' },
                    { id: 'ai-ocr-extraction' as AiSubmodule, label: '09. OCR & Data Extraction' },
                    { id: 'ai-knowledge-base' as AiSubmodule, label: '10. AI Knowledge Base' },
                    { id: 'ai-business-analyst' as AiSubmodule, label: '11. AI Business Analyst' },
                    { id: 'ai-forecasting-center' as AiSubmodule, label: '12. AI Forecasting Center' },
                    { id: 'ai-risk-center' as AiSubmodule, label: '13. Risk & Anomaly Center' },
                    { id: 'ai-recommendation-center' as AiSubmodule, label: '14. Recommendation Center' },
                    { id: 'ai-workflow-assistant' as AiSubmodule, label: '15. AI Workflow Assistant' },
                    { id: 'ai-conversation-history' as AiSubmodule, label: '16. Conversation History' },
                    { id: 'ai-usage-analytics' as AiSubmodule, label: '17. Usage & Token Analytics' },
                    { id: 'ai-budget-mgmt' as AiSubmodule, label: '18. Cost & Budget Management' },
                    { id: 'ai-audit-logs' as AiSubmodule, label: '19. AI Audit Logs' },
                    { id: 'ai-security-privacy' as AiSubmodule, label: '20. Security & Privacy Settings' },
                    { id: 'ai-system-settings' as AiSubmodule, label: '21. AI System Settings' },
                  ].map((sub) => {
                    const isSubActive = activeTab === 'ai' && aiSubmodule === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('ai');
                          setAiSubmodule(sub.id);
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
              { id: 'inventory' as ErpTab, label: 'Inventory & FEFO', labelBn: 'ইনভেন্টরি ও FEFO মেয়াদ', icon: Boxes },
              { id: 'accounting' as ErpTab, label: 'Accounts & Partnership', labelBn: 'আয়-ব্যয় ও পার্টনারশিপ', icon: DollarSign },
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
          {/* TAB 1: Overview & Advanced MIS Intelligence (Module 14) */}
          {activeTab === 'overview' && (
            <ErpExecutiveMisView
              submodule={misSubmodule}
              onSelectSubmodule={setMisSubmodule}
            />
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

          {/* TAB: Document & Quotation Builder (Module 07) */}
          {activeTab === 'documents' && <ErpDocumentManagementView />}

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

          {/* TAB 2: Order Processing (Module 09) */}
          {activeTab === 'orders' && (
            <ErpOrdersView
              initialSubmodule={orderSubmodule}
              onSubmoduleChange={(sub) => setOrderSubmodule(sub)}
            />
          )}

          {/* TAB 3: Inventory & FEFO Management (Module 06) */}
          {activeTab === 'inventory' && <ErpInventoryManagementView currentSubmodule="inv-dashboard" />}

          {/* TAB 4: Double-Entry Accounting & Partnership */}
          {activeTab === 'accounting' && <ErpAccountingView />}

          {/* TAB: HRM & Payroll */}
          {activeTab === 'hrm' && (
            <ErpHrmView
              submodule={hrmSubmodule}
              onSelectSubmodule={(sub) => setHrmSubmodule(sub)}
            />
          )}

          {/* TAB: Banner, Social Media & Marketing Module */}
          {activeTab === 'banners' && (
            <ErpMarketingView
              submodule={marketingSubmodule}
              onSelectSubmodule={setMarketingSubmodule}
            />
          )}

          {/* TAB 5: Import / LC Tracker & AI Management System (Module 12) */}
          {activeTab === 'lc' && (
            <ErpImportTrackerView
              submodule={importSubmodule}
              onSelectSubmodule={setImportSubmodule}
            />
          )}

          {/* TAB 6: RMA, Warranty & Support Desk (Module 13) */}
          {activeTab === 'support' && (
            <ErpSupportDeskView
              submodule={supportSubmodule}
              onSelectSubmodule={setSupportSubmodule}
            />
          )}

          {/* TAB 7: AI Assistant & Central Intelligence System (Module 15) */}
          {activeTab === 'ai' && (
            <ErpAiCentralView
              submodule={aiSubmodule}
              onSelectSubmodule={setAiSubmodule}
            />
          )}
        </main>
      </div>
    </div>
  );
}
