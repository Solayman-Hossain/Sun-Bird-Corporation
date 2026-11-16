'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './ErpOrganizationView.css';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  Landmark,
  FileSignature,
  Stamp,
  FileText,
  Sliders,
  History,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Phone,
  Mail,
  Globe,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { organizationService } from '../../services/organization.service';
import {
  Organization,
  OrgDashboardStats,
  OrganizationBankAccount,
  OrganizationSignatory,
  OrganizationStamp,
  OrgActivityLog,
  OrganizationType,
} from '../../types';

export type OrgSubmodule =
  | 'dashboard'
  | 'list'
  | 'add'
  | 'profile'
  | 'branding'
  | 'banks'
  | 'signatures'
  | 'stamps'
  | 'documents'
  | 'settings'
  | 'financials'
  | 'logs';

interface ErpOrganizationViewProps {
  initialSubmodule?: OrgSubmodule;
}

export function ErpOrganizationView({
  initialSubmodule = 'dashboard',
}: ErpOrganizationViewProps) {
  const { showToast } = useToast();

  const [activeSubmodule, setActiveSubmodule] = useState<OrgSubmodule>(initialSubmodule);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrgDashboardStats | null>(null);
  const [logs, setLogs] = useState<OrgActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals & Inline Form States
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isAddSigModalOpen, setIsAddSigModalOpen] = useState(false);
  const [isAddStampModalOpen, setIsAddStampModalOpen] = useState(false);

  // New Organization Form State
  const [newOrgForm, setNewOrgForm] = useState({
    organizationCode: '',
    legalName: '',
    displayName: '',
    organizationType: 'PRIVATE_LIMITED' as OrganizationType,
    registrationNumber: '',
    tradeLicenseNumber: '',
    tinNumber: '',
    binNumber: '',
    vatRegistrationNumber: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    address: '',
    city: 'Dhaka',
    district: 'Dhaka',
    postalCode: '1212',
    country: 'Bangladesh',
    financialYearStart: '07-01',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    isDefault: false,
  });

  // Profile Edit State
  const [profileForm, setProfileForm] = useState<Partial<Organization>>({});

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState({
    logoUrl: '',
    altLogoUrl: '',
    faviconUrl: '',
    letterheadBgUrl: '',
    primaryColor: '#1e3932',
    accentColor: '#c89348',
    documentHeader: '',
    documentFooter: '',
    padPrintDefault: false,
  });

  // Bank Form State
  const [bankForm, setBankForm] = useState<Omit<OrganizationBankAccount, 'bankId'>>({
    bankName: '',
    branchName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    accountType: 'CURRENT',
    mfsProvider: 'NONE',
    currency: 'BDT',
    paymentInstructions: '',
    isActive: true,
    isDefault: false,
  });

  // Signatory Form State
  const [sigForm, setSigForm] = useState<Omit<OrganizationSignatory, 'signatoryId'>>({
    personName: '',
    designation: '',
    signatureImageUrl: '',
    isActive: true,
    applicableDocuments: ['QUOTATION', 'INVOICE', 'CHALLAN'],
  });

  // Stamp Form State
  const [stampForm, setStampForm] = useState<Omit<OrganizationStamp, 'stampId'>>({
    stampName: '',
    stampType: 'OFFICIAL',
    stampImageUrl: '',
    isActive: true,
  });

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, orgsData] = await Promise.all([
        organizationService.getDashboardStats().catch(() => null),
        organizationService.getOrganizations({ search: searchQuery, status: statusFilter }).catch(() => []),
      ]);

      setStats(statsData);
      setOrganizations(orgsData);

      if (orgsData && orgsData.length > 0) {
        // Keep currently selected or pick default or first
        setSelectedOrg((prev) => {
          if (prev) {
            const found = orgsData.find((o) => o._id === prev._id);
            if (found) return found;
          }
          const def = orgsData.find((o) => o.isDefault);
          return def || orgsData[0];
        });
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to load organization data', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync profile & branding forms when selectedOrg changes
  useEffect(() => {
    if (selectedOrg) {
      setProfileForm({ ...selectedOrg });
      setBrandingForm({
        logoUrl: selectedOrg.branding?.logoUrl || selectedOrg.logo || '',
        altLogoUrl: selectedOrg.branding?.altLogoUrl || '',
        faviconUrl: selectedOrg.branding?.faviconUrl || '',
        letterheadBgUrl: selectedOrg.branding?.letterheadBgUrl || '',
        primaryColor: selectedOrg.branding?.primaryColor || '#1e3932',
        accentColor: selectedOrg.branding?.accentColor || '#c89348',
        documentHeader: selectedOrg.branding?.documentHeader || '',
        documentFooter: selectedOrg.branding?.documentFooter || '',
        padPrintDefault: selectedOrg.branding?.padPrintDefault || false,
      });

      // Load logs for selected org
      organizationService
        .getActivityLogs(selectedOrg._id)
        .then(setLogs)
        .catch(() => setLogs([]));
    }
  }, [selectedOrg]);

  // Handle Create Organization
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgForm.organizationCode || !newOrgForm.legalName || !newOrgForm.displayName) {
      showToast('Organization code, legal name and display name are required', 'warning');
      return;
    }

    try {
      const created = await organizationService.createOrganization(newOrgForm);
      showToast(`Organization '${created.displayName}' created successfully!`, 'success');
      setNewOrgForm({
        organizationCode: '',
        legalName: '',
        displayName: '',
        organizationType: 'PRIVATE_LIMITED',
        registrationNumber: '',
        tradeLicenseNumber: '',
        tinNumber: '',
        binNumber: '',
        vatRegistrationNumber: '',
        email: '',
        phone: '',
        alternatePhone: '',
        website: '',
        address: '',
        city: 'Dhaka',
        district: 'Dhaka',
        postalCode: '1212',
        country: 'Bangladesh',
        financialYearStart: '07-01',
        currency: 'BDT',
        timezone: 'Asia/Dhaka',
        isDefault: false,
      });
      await loadData();
      setSelectedOrg(created);
      setActiveSubmodule('profile');
    } catch (err: any) {
      showToast(err?.message || 'Failed to create organization', 'error');
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      const updated = await organizationService.updateOrganization(selectedOrg._id, profileForm);
      showToast('Organization profile updated successfully!', 'success');
      setSelectedOrg(updated);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile', 'error');
    }
  };

  // Handle Set Default
  const handleSetDefault = async (orgId: string) => {
    try {
      const updated = await organizationService.setDefault(orgId);
      showToast(`'${updated.displayName}' is now the default organization!`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to set default organization', 'error');
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (org: Organization) => {
    try {
      const newStatus = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = await organizationService.setStatus(org._id, newStatus);
      showToast(`Status of '${updated.displayName}' changed to ${newStatus}`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to change status', 'error');
    }
  };

  // Handle Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      const updatedBranding = await organizationService.updateBranding(selectedOrg._id, brandingForm);
      showToast('Branding settings updated successfully!', 'success');
      setSelectedOrg((prev) => (prev ? { ...prev, branding: updatedBranding } : null));
    } catch (err: any) {
      showToast(err?.message || 'Failed to update branding', 'error');
    }
  };

  // Handle Add Bank Account
  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    if (!bankForm.bankName || !bankForm.accountNumber) {
      showToast('Bank name and account number are required', 'warning');
      return;
    }

    try {
      const updatedBanks = await organizationService.addBankAccount(selectedOrg._id, bankForm);
      showToast('Bank account added successfully!', 'success');
      setSelectedOrg((prev) => (prev ? { ...prev, bankAccounts: updatedBanks } : null));
      setIsAddBankModalOpen(false);
      setBankForm({
        bankName: '',
        branchName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        swiftCode: '',
        accountType: 'CURRENT',
        mfsProvider: 'NONE',
        currency: 'BDT',
        paymentInstructions: '',
        isActive: true,
        isDefault: false,
      });
    } catch (err: any) {
      showToast(err?.message || 'Failed to add bank account', 'error');
    }
  };

  // Handle Delete Bank Account
  const handleDeleteBank = async (bankId: string) => {
    if (!selectedOrg) return;
    if (!confirm('Are you sure you want to remove this bank account?')) return;

    try {
      const updatedBanks = await organizationService.deleteBankAccount(selectedOrg._id, bankId);
      showToast('Bank account removed', 'info');
      setSelectedOrg((prev) => (prev ? { ...prev, bankAccounts: updatedBanks } : null));
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove bank account', 'error');
    }
  };

  // Handle Add Signatory
  const handleAddSig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    if (!sigForm.personName || !sigForm.designation) {
      showToast('Person name and designation are required', 'warning');
      return;
    }

    try {
      const updatedSigs = await organizationService.addSignatory(selectedOrg._id, {
        ...sigForm,
        signatureImageUrl:
          sigForm.signatureImageUrl ||
          `https://placehold.co/200x80/png?text=${encodeURIComponent(sigForm.personName)}`,
      });
      showToast('Authorized signatory added!', 'success');
      setSelectedOrg((prev) => (prev ? { ...prev, signatories: updatedSigs } : null));
      setIsAddSigModalOpen(false);
      setSigForm({
        personName: '',
        designation: '',
        signatureImageUrl: '',
        isActive: true,
        applicableDocuments: ['QUOTATION', 'INVOICE', 'CHALLAN'],
      });
    } catch (err: any) {
      showToast(err?.message || 'Failed to add signatory', 'error');
    }
  };

  // Handle Delete Signatory
  const handleDeleteSig = async (sigId: string) => {
    if (!selectedOrg) return;
    if (!confirm('Are you sure you want to remove this signatory?')) return;

    try {
      const updatedSigs = await organizationService.deleteSignatory(selectedOrg._id, sigId);
      showToast('Signatory removed', 'info');
      setSelectedOrg((prev) => (prev ? { ...prev, signatories: updatedSigs } : null));
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove signatory', 'error');
    }
  };

  // Handle Add Stamp
  const handleAddStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    if (!stampForm.stampName) {
      showToast('Stamp name is required', 'warning');
      return;
    }

    try {
      const updatedStamps = await organizationService.addStamp(selectedOrg._id, {
        ...stampForm,
        stampImageUrl:
          stampForm.stampImageUrl ||
          `https://placehold.co/120x120/png?text=${encodeURIComponent(stampForm.stampName)}`,
      });
      showToast('Official stamp added!', 'success');
      setSelectedOrg((prev) => (prev ? { ...prev, stamps: updatedStamps } : null));
      setIsAddStampModalOpen(false);
      setStampForm({
        stampName: '',
        stampType: 'OFFICIAL',
        stampImageUrl: '',
        isActive: true,
      });
    } catch (err: any) {
      showToast(err?.message || 'Failed to add stamp', 'error');
    }
  };

  // Handle Delete Stamp
  const handleDeleteStamp = async (stampId: string) => {
    if (!selectedOrg) return;
    if (!confirm('Are you sure you want to remove this stamp?')) return;

    try {
      const updatedStamps = await organizationService.deleteStamp(selectedOrg._id, stampId);
      showToast('Stamp removed', 'info');
      setSelectedOrg((prev) => (prev ? { ...prev, stamps: updatedStamps } : null));
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove stamp', 'error');
    }
  };

  // Handle Save Document Config
  const handleSaveDocConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      const updatedConfig = await organizationService.updateDocumentConfig(
        selectedOrg._id,
        selectedOrg.documentConfig || {}
      );
      showToast('Document configuration saved!', 'success');
      setSelectedOrg((prev) => (prev ? { ...prev, documentConfig: updatedConfig } : null));
    } catch (err: any) {
      showToast(err?.message || 'Failed to save document config', 'error');
    }
  };

  // Handle Save Financial Settings
  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      const updatedFinancials = await organizationService.updateFinancialSettings(
        selectedOrg._id,
        selectedOrg.financialSettings || {}
      );
      showToast('Financial settings updated!', 'success');
      setSelectedOrg((prev) => (prev ? { ...prev, financialSettings: updatedFinancials } : null));
    } catch (err: any) {
      showToast(err?.message || 'Failed to save financial settings', 'error');
    }
  };

  const submodulesList: Array<{ id: OrgSubmodule; label: string; icon: any }> = [
    { id: 'dashboard', label: '1. Dashboard', icon: TrendingUp },
    { id: 'list', label: '2. Organization List', icon: Building2 },
    { id: 'add', label: '3. Add Organization', icon: Plus },
    { id: 'profile', label: '4. Profile & Legal', icon: FileText },
    { id: 'branding', label: '5. Logo & Branding', icon: ImageIcon },
    { id: 'banks', label: '6. Bank Accounts', icon: Landmark },
    { id: 'signatures', label: '7. Signatures', icon: FileSignature },
    { id: 'stamps', label: '8. Official Stamps', icon: Stamp },
    { id: 'documents', label: '9. Doc Settings', icon: FileText },
    { id: 'settings', label: '10. Org Settings', icon: Sliders },
    { id: 'financials', label: '11. Financials & VAT', icon: DollarSign },
    { id: 'logs', label: '12. Activity Logs', icon: History },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header & Active Company Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e3932] text-[#e6b980] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 font-serif">
                প্রতিষ্ঠানের ব্যবস্থাপনা (Organization Management)
              </h2>
              <p className="text-xs text-slate-500">
                কেন্দ্রীয় মাল্টি-অর্গানাইজেশন ও কোম্পানি প্রোফাইল প্রশাসন ব্যবস্থা।
              </p>
            </div>
          </div>
        </div>

        {/* Selected Org Pill & Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">সক্রিয় প্রতিষ্ঠান:</span>
            <select
              value={selectedOrg?._id || ''}
              onChange={(e) => {
                const found = organizations.find((o) => o._id === e.target.value);
                if (found) setSelectedOrg(found);
              }}
              className="font-bold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer text-xs"
            >
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.displayName} ({org.organizationCode}){org.isDefault ? ' ★ ডিফল্ট' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="তথ্য রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Submodule Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {submodulesList.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubmodule === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubmodule(tab.id)}
              className={`erp-org-tab-btn ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 1: ORGANIZATION DASHBOARD
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'dashboard' && stats && (
        <div className="space-y-6">
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="erp-org-card space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">মোট প্রতিষ্ঠান</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-extrabold text-2xl font-mono text-slate-900">
                {stats.totalOrganizations} টি
              </div>
              <span className="text-[11px] text-slate-500">নিবন্ধিত কোম্পানি গ্রুপ</span>
            </div>

            <div className="erp-org-card space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">সক্রিয় কোম্পানি</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-extrabold text-2xl font-mono text-emerald-700">
                {stats.activeOrganizations} টি
              </div>
              <span className="text-[11px] text-emerald-600">বর্তমানে অপারেশনাল</span>
            </div>

            <div className="erp-org-card space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">নিষ্ক্রিয় প্রতিষ্ঠান</span>
                <AlertCircle className="w-4 h-4 text-slate-400" />
              </div>
              <div className="font-extrabold text-2xl font-mono text-slate-600">
                {stats.inactiveOrganizations} টি
              </div>
              <span className="text-[11px] text-slate-500">স্থগিত কোম্পানি</span>
            </div>

            <div className="erp-org-card space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">ডিফল্ট প্রতিষ্ঠান</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="font-bold text-sm truncate text-slate-900 pt-1">
                {stats.defaultOrganization?.displayName || 'Sun Bird Corporation'}
              </div>
              <span className="text-[11px] font-mono text-amber-700">
                {stats.defaultOrganization?.organizationCode || 'SBC-01'}
              </span>
            </div>

            <div className="erp-org-card space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">গ্রুপ মোট বিক্রয়</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-extrabold text-2xl font-mono text-slate-900">
                ৳{stats.financialMetrics.totalSales.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700">অনুমোদিত বিক্রয় রেকর্ড</span>
            </div>
          </div>

          {/* Secondary Financial Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="erp-org-card">
              <span className="text-xs font-bold text-slate-500 block">মোট ক্রয় (Purchases)</span>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">
                ৳{stats.financialMetrics.totalPurchases.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">লোকাল ও আমদানি এল/সি ক্রয়ের হিসাব</p>
            </div>

            <div className="erp-org-card">
              <span className="text-xs font-bold text-slate-500 block">ইনভেন্টরি মূল্যায়ন (Stock)</span>
              <div className="text-xl font-bold font-mono text-[#1e3932] mt-1">
                ৳{stats.financialMetrics.inventoryValuation.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">ওয়্যারহাউজ ব্যাচ FEFO মূল্যায়ন</p>
            </div>

            <div className="erp-org-card">
              <span className="text-xs font-bold text-slate-500 block">বকেয়া পাওনা (Receivables)</span>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1">
                ৳{stats.financialMetrics.totalReceivables.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">গ্রাহক ও হাসপাতাল বকেয়া চালানের যোগফল</p>
            </div>

            <div className="erp-org-card">
              <span className="text-xs font-bold text-slate-500 block">বকেয়া দেনা (Payables)</span>
              <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                ৳{stats.financialMetrics.totalPayables.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">সরবরাহকারী বিল ও পেমেন্ট দেনা</p>
            </div>
          </div>

          {/* Organization-wise Financial Breakdown Table */}
          <div className="erp-org-card p-0 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  প্রতিষ্ঠান ভিত্তিক আর্থিক পরিসংখ্যান (Organization Breakdown)
                </h3>
                <p className="text-xs text-slate-500">
                  প্রত্যেক প্রতিষ্ঠানের বিক্রয়, ক্রয়, ইনভেন্টরি ও পাওনা-দেনার লাইভ পরিসংখ্যান।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">কোড ও নাম</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">বিক্রয় (Sales)</th>
                    <th className="p-3 text-right">ক্রয় (Purchase)</th>
                    <th className="p-3 text-right">ইনভেন্টরি</th>
                    <th className="p-3 text-right">বকেয়া পাওনা</th>
                    <th className="p-3 text-right">বকেয়া দেনা</th>
                    <th className="p-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {stats.organizationBreakdown.map((row) => (
                    <tr key={row.organizationId} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <div className="font-sans font-bold text-slate-900 flex items-center gap-2">
                          <span>{row.displayName}</span>
                          {row.isDefault && (
                            <span className="erp-org-badge-default font-mono">★ ডিফল্ট</span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {row.organizationCode}
                        </span>
                      </td>
                      <td className="p-3">
                        {row.status === 'ACTIVE' ? (
                          <span className="erp-org-badge-active">সক্রিয়</span>
                        ) : (
                          <span className="erp-org-badge-inactive">নিষ্ক্রিয়</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-emerald-700 font-bold">
                        ৳{row.sales.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        ৳{row.purchases.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        ৳{row.inventory.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right text-amber-700 font-bold">
                        ৳{row.receivables.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right text-rose-700 font-bold">
                        ৳{row.payables.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            const found = organizations.find((o) => o._id === row.organizationId);
                            if (found) {
                              setSelectedOrg(found);
                              setActiveSubmodule('profile');
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          প্রোফাইল দেখুন
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 2: ORGANIZATION LIST
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="কোড, নাম বা BIN খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#1e3932]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 cursor-pointer"
              >
                <option value="">সকল স্ট্যাটাস</option>
                <option value="ACTIVE">সক্রিয় (Active)</option>
                <option value="INACTIVE">নিষ্ক্রিয় (Inactive)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubmodule('add')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্রতিষ্ঠান যোগ করুন</span>
            </button>
          </div>

          <div className="erp-org-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">কোড ও নাম</th>
                    <th className="p-3">ধরন (Type)</th>
                    <th className="p-3">BIN ও TIN</th>
                    <th className="p-3">যোগাযোগ</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {organizations.map((org) => (
                    <tr key={org._id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#1e3932] font-bold flex items-center justify-center shrink-0">
                            {org.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{org.displayName}</span>
                              {org.isDefault && (
                                <span className="erp-org-badge-default">★ ডিফল্ট</span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">
                              {org.organizationCode} • {org.legalName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {org.organizationType}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>BIN: <strong>{org.binNumber || 'N/A'}</strong></div>
                        <div className="text-slate-500">TIN: {org.tinNumber || 'N/A'}</div>
                      </td>
                      <td className="p-3 text-[11px]">
                        <div>{org.phone}</div>
                        <div className="text-slate-500">{org.email}</div>
                      </td>
                      <td className="p-3">
                        {org.status === 'ACTIVE' ? (
                          <span className="erp-org-badge-active">সক্রিয়</span>
                        ) : (
                          <span className="erp-org-badge-inactive">নিষ্ক্রিয়</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!org.isDefault && org.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(org._id)}
                              className="px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer"
                              title="ডিফল্ট কোম্পানি হিসেবে সেট করুন"
                            >
                              ★ ডিফল্ট করুন
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrg(org);
                              setActiveSubmodule('profile');
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="সম্পাদনা করুন"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!org.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(org)}
                              className={`p-1.5 rounded-lg cursor-pointer text-xs font-semibold ${
                                org.status === 'ACTIVE'
                                  ? 'text-rose-600 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={org.status === 'ACTIVE' ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                            >
                              {org.status === 'ACTIVE' ? 'স্থগিত' : 'সক্রিয়'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 3: ADD ORGANIZATION
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'add' && (
        <div className="erp-org-card max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              নতুন প্রতিষ্ঠান নিবন্ধন ফরম (Register New Organization)
            </h3>
            <p className="text-xs text-slate-500">
              সিস্টেমে নতুন কোম্পানি বা শাখা প্রতিষ্ঠান অন্তর্ভুক্ত করুন।
            </p>
          </div>

          <form onSubmit={handleCreateOrg} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  কোম্পানি কোড (Unique Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBC-02"
                  value={newOrgForm.organizationCode}
                  onChange={(e) =>
                    setNewOrgForm({ ...newOrgForm, organizationCode: e.target.value.toUpperCase() })
                  }
                  className="w-full p-2.5 font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ডিসপ্লে নাম (Display Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sun Bird Diagnostic Care"
                  value={newOrgForm.displayName}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, displayName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  লিগ্যাল নাম (Legal / Registered Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sun Bird Diagnostic Care Ltd."
                  value={newOrgForm.legalName}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, legalName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রতিষ্ঠানের ধরন</label>
                <select
                  value={newOrgForm.organizationType}
                  onChange={(e) =>
                    setNewOrgForm({
                      ...newOrgForm,
                      organizationType: e.target.value as OrganizationType,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
                >
                  <option value="PRIVATE_LIMITED">Private Limited</option>
                  <option value="PROPRIETORSHIP">Proprietorship</option>
                  <option value="PARTNERSHIP">Partnership</option>
                  <option value="PUBLIC_LIMITED">Public Limited</option>
                  <option value="GOVERNMENT">Government / Autonomous</option>
                  <option value="NGO">NGO / Non-Profit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ট্রেড লাইসেন্স নম্বর</label>
                <input
                  type="text"
                  placeholder="TRAD/DNCC/..."
                  value={newOrgForm.tradeLicenseNumber}
                  onChange={(e) =>
                    setNewOrgForm({ ...newOrgForm, tradeLicenseNumber: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">TIN নম্বর</label>
                <input
                  type="text"
                  placeholder="12-digit TIN"
                  value={newOrgForm.tinNumber}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, tinNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">BIN / VAT নম্বর</label>
                <input
                  type="text"
                  placeholder="002391029-0101"
                  value={newOrgForm.binNumber}
                  onChange={(e) =>
                    setNewOrgForm({
                      ...newOrgForm,
                      binNumber: e.target.value,
                      vatRegistrationNumber: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ইমেইল ঠিকানা *</label>
                <input
                  type="email"
                  required
                  placeholder="info@company.com"
                  value={newOrgForm.email}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ফোন নম্বর *</label>
                <input
                  type="text"
                  required
                  placeholder="+880 17..."
                  value={newOrgForm.phone}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ওয়েবসাইট</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newOrgForm.website}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, website: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">অফিসের ঠিকানা *</label>
              <textarea
                required
                rows={2}
                placeholder="House, Road, Block, Area..."
                value={newOrgForm.address}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">শহর (City)</label>
                <input
                  type="text"
                  value={newOrgForm.city}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, city: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">জেলা (District)</label>
                <input
                  type="text"
                  value={newOrgForm.district}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, district: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">পোস্ট কোড</label>
                <input
                  type="text"
                  value={newOrgForm.postalCode}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, postalCode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">দেশ (Country)</label>
                <input
                  type="text"
                  value={newOrgForm.country}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, country: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDefaultCheck"
                checked={newOrgForm.isDefault}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, isDefault: e.target.checked })}
                className="w-4 h-4 text-[#1e3932] rounded cursor-pointer"
              />
              <label htmlFor="isDefaultCheck" className="font-semibold text-slate-800 cursor-pointer">
                এই প্রতিষ্ঠানকে সিস্টেমের ডিফল্ট কোম্পানি হিসেবে নির্ধারণ করুন
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveSubmodule('list')}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer shadow-sm"
              >
                প্রতিষ্ঠান সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 4: ORGANIZATION PROFILE & LEGAL
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'profile' && selectedOrg && (
        <div className="erp-org-card max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {selectedOrg.displayName} — প্রোফাইল ও লিগ্যাল তথ্য
              </h3>
              <p className="text-xs text-slate-500">
                কোড: <strong>{selectedOrg.organizationCode}</strong> • স্ট্যাটাস:{' '}
                {selectedOrg.status}
              </p>
            </div>
            {selectedOrg.isDefault && (
              <span className="erp-org-badge-default font-mono">★ প্রধান কোম্পানি (Default)</span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">কোম্পানি কোড</label>
                <input
                  type="text"
                  value={profileForm.organizationCode || ''}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      organizationCode: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full p-2.5 font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ডিসপ্লে নাম</label>
                <input
                  type="text"
                  value={profileForm.displayName || ''}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, displayName: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">লিগ্যাল নাম</label>
                <input
                  type="text"
                  value={profileForm.legalName || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, legalName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ট্রেড লাইসেন্স নম্বর</label>
                <input
                  type="text"
                  value={profileForm.tradeLicenseNumber || ''}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, tradeLicenseNumber: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">TIN নম্বর</label>
                <input
                  type="text"
                  value={profileForm.tinNumber || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, tinNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">BIN / VAT নম্বর</label>
                <input
                  type="text"
                  value={profileForm.binNumber || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, binNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ইমেইল</label>
                <input
                  type="email"
                  value={profileForm.email || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ফোন নম্বর</label>
                <input
                  type="text"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ওয়েবসাইট</label>
                <input
                  type="text"
                  value={profileForm.website || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ঠিকানা</label>
              <textarea
                rows={2}
                value={profileForm.address || ''}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2 font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
              >
                প্রোফাইল আপডেট করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 5: LOGO & BRANDING
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'branding' && selectedOrg && (
        <div className="erp-org-card max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {selectedOrg.displayName} — লোগো ও ব্র্যান্ডিং ব্যবস্থাপনা
            </h3>
            <p className="text-xs text-slate-500">
              ডকুমেন্ট হেডার, ফুটার, অফিসিয়াল সিল ও প্যাড প্রিন্টিং ব্র্যান্ডিং সেট করুন।
            </p>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-6 text-xs">
            {/* Image Previews & URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="font-bold text-slate-800 block">প্রধান লোগো (Main Logo)</label>
                {brandingForm.logoUrl ? (
                  <div className="h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandingForm.logoUrl}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setBrandingForm({ ...brandingForm, logoUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="লোগো মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    কোনো লোগো আপলোড করা হয়নি
                  </div>
                )}
                <input
                  type="text"
                  placeholder="লোগোর ইমেজ URL প্রবেশ করান"
                  value={brandingForm.logoUrl}
                  onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="font-bold text-slate-800 block">লেটারহেড ব্যাকগ্রাউন্ড (Pad BG)</label>
                {brandingForm.letterheadBgUrl ? (
                  <div className="h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandingForm.letterheadBgUrl}
                      alt="Letterhead"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setBrandingForm({ ...brandingForm, letterheadBgUrl: '' })}
                      className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    লেটারহেড ব্যাকগ্রাউন্ড খালি
                  </div>
                )}
                <input
                  type="text"
                  placeholder="লেটারহেড ব্যাকগ্রাউন্ড URL"
                  value={brandingForm.letterheadBgUrl}
                  onChange={(e) =>
                    setBrandingForm({ ...brandingForm, letterheadBgUrl: e.target.value })
                  }
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Color Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  প্রাথমিক ব্র্যান্ড রঙ (Primary Color)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.primaryColor}
                    onChange={(e) =>
                      setBrandingForm({ ...brandingForm, primaryColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-xl border-0 p-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingForm.primaryColor}
                    onChange={(e) =>
                      setBrandingForm({ ...brandingForm, primaryColor: e.target.value })
                    }
                    className="w-32 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  অ্যাকসেন্ট রঙ (Accent Gold)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.accentColor}
                    onChange={(e) =>
                      setBrandingForm({ ...brandingForm, accentColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-xl border-0 p-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingForm.accentColor}
                    onChange={(e) =>
                      setBrandingForm({ ...brandingForm, accentColor: e.target.value })
                    }
                    className="w-32 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Header & Footer */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">ডকুমেন্ট হেডার টেক্সট</label>
              <textarea
                rows={2}
                placeholder="কোম্পানির নাম ও সাব-হেডিং..."
                value={brandingForm.documentHeader}
                onChange={(e) =>
                  setBrandingForm({ ...brandingForm, documentHeader: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ডকুমেন্ট ফুটার ও লিগ্যাল নোট</label>
              <textarea
                rows={2}
                placeholder="রেজিস্টার্ড অফিসের ঠিকানা ও সাপোর্ট হটলাইন..."
                value={brandingForm.documentFooter}
                onChange={(e) =>
                  setBrandingForm({ ...brandingForm, documentFooter: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="padPrintCheck"
                checked={brandingForm.padPrintDefault}
                onChange={(e) =>
                  setBrandingForm({ ...brandingForm, padPrintDefault: e.target.checked })
                }
                className="w-4 h-4 text-[#1e3932] rounded cursor-pointer"
              />
              <label htmlFor="padPrintCheck" className="font-semibold text-slate-800 cursor-pointer">
                ডিফল্টভাবে অফিশিয়াল প্যাড প্রিন্ট মোড চালু রাখুন (হেডার/ফুটার লুকাতে)
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2 font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
              >
                ব্র্যান্ডিং সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 6: BANK INFORMATION
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'banks' && selectedOrg && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {selectedOrg.displayName} — ব্যাংক ও MFS হিসাব
              </h3>
              <p className="text-xs text-slate-500">
                ইনভয়েস ও কোটেশনে প্রদর্শনের জন্য ব্যাংক বা বিকাশ/নগদ মার্চেন্ট একাউন্ট যুক্ত করুন।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddBankModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ব্যাংক একাউন্ট যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedOrg.bankAccounts && selectedOrg.bankAccounts.length > 0 ? (
              selectedOrg.bankAccounts.map((b) => (
                <div key={b.bankId} className="erp-org-card space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{b.bankName}</span>
                        {b.isDefault && (
                          <span className="erp-org-badge-default">★ ডিফল্ট ব্যাংক</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{b.branchName} ব্রাঞ্চ</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBank(b.bankId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div>হিসাব নাম: <strong>{b.accountName}</strong></div>
                    <div>হিসাব নং: <strong className="text-[#1e3932]">{b.accountNumber}</strong></div>
                    {b.routingNumber && <div>রাউটিং নং: {b.routingNumber}</div>}
                    {b.swiftCode && <div>সুইফট কোড: {b.swiftCode}</div>}
                    <div className="text-[11px] text-slate-500 pt-1">
                      ধরন: {b.accountType} {b.mfsProvider !== 'NONE' ? `(${b.mfsProvider})` : ''} • কারেন্সি: {b.currency}
                    </div>
                  </div>

                  {b.paymentInstructions && (
                    <p className="text-[11px] text-slate-500 italic">
                      নির্দেশনা: {b.paymentInstructions}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 erp-org-card text-center py-8 text-slate-400 text-xs">
                কোনো ব্যাংক অ্যাকাউন্ট যুক্ত করা হয়নি।
              </div>
            )}
          </div>

          {/* Add Bank Modal */}
          {isAddBankModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-sm text-slate-900 font-serif">
                    নতুন ব্যাংক / MFS একাউন্ট যোগ করুন
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddBankModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddBank} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ব্যাংক নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. City Bank Ltd."
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ব্রাঞ্চ নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Banani Branch"
                        value={bankForm.branchName}
                        onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">হিসাব নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sun Bird Corporation"
                        value={bankForm.accountName}
                        onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">হিসাব নম্বর *</label>
                      <input
                        type="text"
                        required
                        placeholder="A/C Number"
                        value={bankForm.accountNumber}
                        onChange={(e) =>
                          setBankForm({ ...bankForm, accountNumber: e.target.value })
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">রাউটিং নম্বর</label>
                      <input
                        type="text"
                        placeholder="Routing No"
                        value={bankForm.routingNumber}
                        onChange={(e) =>
                          setBankForm({ ...bankForm, routingNumber: e.target.value })
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">সুইফট কোড</label>
                      <input
                        type="text"
                        placeholder="SWIFT"
                        value={bankForm.swiftCode}
                        onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">হিসাবের ধরন</label>
                      <select
                        value={bankForm.accountType}
                        onChange={(e) =>
                          setBankForm({ ...bankForm, accountType: e.target.value as any })
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                      >
                        <option value="CURRENT">Current A/C</option>
                        <option value="SAVINGS">Savings A/C</option>
                        <option value="MFS">MFS (Mobile)</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="defaultBankCheck"
                      checked={bankForm.isDefault}
                      onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                      className="w-4 h-4 text-[#1e3932] rounded cursor-pointer"
                    />
                    <label htmlFor="defaultBankCheck" className="font-semibold text-slate-800">
                      ডিফল্ট পেমেন্ট একাউন্ট হিসেবে সেট করুন
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddBankModalOpen(false)}
                      className="px-4 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
                    >
                      যুক্ত করুন
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 7: SIGNATURE MANAGEMENT
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'signatures' && selectedOrg && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {selectedOrg.displayName} — অনুমোদিত স্বাক্ষরকারী (Signatories)
              </h3>
              <p className="text-xs text-slate-500">
                কোটেশন, চালান, ইনভয়েস ও মানি রিসিটের ডিজিটাল অফিসিয়াল সিগনেচার।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddSigModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>স্বাক্ষরকারী যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedOrg.signatories && selectedOrg.signatories.length > 0 ? (
              selectedOrg.signatories.map((s) => (
                <div key={s.signatoryId} className="erp-org-card space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{s.personName}</h4>
                      <p className="text-xs text-slate-500">{s.designation}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSig(s.signatoryId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.signatureImageUrl}
                      alt={s.personName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {s.applicableDocuments?.map((doc) => (
                      <span
                        key={doc}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 erp-org-card text-center py-8 text-slate-400 text-xs">
                কোনো স্বাক্ষরকারী যুক্ত করা হয়নি।
              </div>
            )}
          </div>

          {/* Add Sig Modal */}
          {isAddSigModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-sm text-slate-900 font-serif">
                    নতুন অনুমোদিত স্বাক্ষরকারী
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddSigModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddSig} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">স্বাক্ষরকারীর নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Md. Saiful Islam"
                      value={sigForm.personName}
                      onChange={(e) => setSigForm({ ...sigForm, personName: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">পদবী (Designation) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sr. Marketing Officer"
                      value={sigForm.designation}
                      onChange={(e) => setSigForm({ ...sigForm, designation: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">স্বাক্ষর ছবির URL</label>
                    <input
                      type="text"
                      placeholder="https://... (বা খালি রাখুন)"
                      value={sigForm.signatureImageUrl}
                      onChange={(e) =>
                        setSigForm({ ...sigForm, signatureImageUrl: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddSigModalOpen(false)}
                      className="px-4 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 8: STAMP MANAGEMENT
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'stamps' && selectedOrg && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                {selectedOrg.displayName} — অফিসিয়াল সিল ও স্ট্যাম্প (Stamps)
              </h3>
              <p className="text-xs text-slate-500">
                ডকুমেন্টে ব্যবহারের জন্য অফিসিয়াল রাবার সিল ও অনুমোদন স্ট্যাম্প।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddStampModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সিল যুক্ত করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {selectedOrg.stamps && selectedOrg.stamps.length > 0 ? (
              selectedOrg.stamps.map((s) => (
                <div key={s.stampId} className="erp-org-card text-center space-y-3 relative group">
                  <button
                    type="button"
                    onClick={() => handleDeleteStamp(s.stampId)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-24 h-24 mx-auto bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.stampImageUrl}
                      alt={s.stampName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{s.stampName}</h4>
                    <span className="text-[10px] uppercase font-mono text-slate-500">
                      {s.stampType}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 erp-org-card text-center py-8 text-slate-400 text-xs">
                কোনো সিল বা স্ট্যাম্প যুক্ত করা হয়নি।
              </div>
            )}
          </div>

          {/* Add Stamp Modal */}
          {isAddStampModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-sm text-slate-900 font-serif">
                    নতুন অফিসিয়াল সিল / স্ট্যাম্প
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddStampModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddStamp} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">সিলের নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Official Seal / PAID Stamp"
                      value={stampForm.stampName}
                      onChange={(e) => setStampForm({ ...stampForm, stampName: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">সিলের ধরন</label>
                    <select
                      value={stampForm.stampType}
                      onChange={(e) =>
                        setStampForm({ ...stampForm, stampType: e.target.value as any })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="OFFICIAL">Official Corporate Seal</option>
                      <option value="APPROVAL">Approval Seal</option>
                      <option value="PAID">Paid Stamp</option>
                      <option value="RECEIVED">Received Stamp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">সিলের ইমেজ URL</label>
                    <input
                      type="text"
                      placeholder="https://... (বা খালি রাখুন)"
                      value={stampForm.stampImageUrl}
                      onChange={(e) => setStampForm({ ...stampForm, stampImageUrl: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddStampModalOpen(false)}
                      className="px-4 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
                    >
                      সংরক্ষণ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 9: DOCUMENT CONFIGURATION
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'documents' && selectedOrg && (
        <div className="erp-org-card max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {selectedOrg.displayName} — ডকুমেন্ট প্রিফিক্স ও কনফিগারেশন
            </h3>
            <p className="text-xs text-slate-500">
              ইনভয়েস, কোটেশন, চালান ও রিসিট নম্বরের প্রিফিক্স এবং প্রিন্ট রুলস নির্ধারণ করুন।
            </p>
          </div>

          <form onSubmit={handleSaveDocConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">কোটেশন প্রিফিক্স</label>
                <input
                  type="text"
                  value={selectedOrg.documentConfig?.quotationPrefix || 'QT-'}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      documentConfig: {
                        ...selectedOrg.documentConfig,
                        quotationPrefix: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 font-mono bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ইনভয়েস প্রিফিক্স</label>
                <input
                  type="text"
                  value={selectedOrg.documentConfig?.invoicePrefix || 'INV-'}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      documentConfig: {
                        ...selectedOrg.documentConfig,
                        invoicePrefix: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 font-mono bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">চালান প্রিফিক্স</label>
                <input
                  type="text"
                  value={selectedOrg.documentConfig?.challanPrefix || 'DC-'}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      documentConfig: {
                        ...selectedOrg.documentConfig,
                        challanPrefix: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 font-mono bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrg.documentConfig?.showStampOnInvoice ?? true}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      documentConfig: {
                        ...selectedOrg.documentConfig,
                        showStampOnInvoice: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-[#1e3932] rounded"
                />
                <span className="font-semibold text-slate-800">
                  ইনভয়েসে অফিসিয়াল সিল প্রদর্শন করুন
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrg.documentConfig?.showSignatureOnQuotation ?? true}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      documentConfig: {
                        ...selectedOrg.documentConfig,
                        showSignatureOnQuotation: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-[#1e3932] rounded"
                />
                <span className="font-semibold text-slate-800">
                  কোটেশনে অনুমোদিত স্বাক্ষর প্রদর্শন করুন
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrg.documentConfig?.showBankDetailsOnInvoice ?? true}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      documentConfig: {
                        ...selectedOrg.documentConfig,
                        showBankDetailsOnInvoice: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-[#1e3932] rounded"
                />
                <span className="font-semibold text-slate-800">
                  ইনভয়েসের নিচে পেমেন্ট ব্যাংক ডিটেইলস সংযুক্ত করুন
                </span>
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2 font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
              >
                ডকুমেন্ট সেটিংস সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 10 & 11: SETTINGS & FINANCIALS
         ───────────────────────────────────────────────────────────── */}
      {(activeSubmodule === 'settings' || activeSubmodule === 'financials') && selectedOrg && (
        <div className="erp-org-card max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {selectedOrg.displayName} — আর্থিক ও অ্যাকাউন্টিং সেটিংস (Financial Settings)
            </h3>
            <p className="text-xs text-slate-500">
              ভ্যাট হার, ইনভেন্টরি কস্টিং মেথড এবং অ্যাকাউন্টিং পলিসি সেট করুন।
            </p>
          </div>

          <form onSubmit={handleSaveFinancials} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">স্ট্যান্ডার্ড ভ্যাট (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedOrg.financialSettings?.vatPercent ?? 15}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      financialSettings: {
                        ...selectedOrg.financialSettings,
                        vatPercent: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2.5 font-mono bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ইনভেন্টরি কস্টিং মেথড</label>
                <select
                  value={selectedOrg.financialSettings?.defaultCostingMethod || 'FEFO'}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      financialSettings: {
                        ...selectedOrg.financialSettings,
                        defaultCostingMethod: e.target.value as any,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="FEFO">FEFO (First Expired First Out)</option>
                  <option value="FIFO">FIFO (First In First Out)</option>
                  <option value="WEIGHTED_AVERAGE">Weighted Average Cost</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">কারেন্সি</label>
                <input
                  type="text"
                  value={selectedOrg.currency || 'BDT'}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrg.financialSettings?.enableFefo ?? true}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      financialSettings: {
                        ...selectedOrg.financialSettings,
                        enableFefo: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-[#1e3932] rounded"
                />
                <span className="font-semibold text-slate-800">
                  স্বয়ংক্রিয় FEFO মেয়াদ ভিত্তিক স্টক ডিক্রিমেন্ট চালু রাখুন
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOrg.financialSettings?.allowNegativeStock ?? false}
                  onChange={(e) =>
                    setSelectedOrg({
                      ...selectedOrg,
                      financialSettings: {
                        ...selectedOrg.financialSettings,
                        allowNegativeStock: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-[#1e3932] rounded"
                />
                <span className="font-semibold text-slate-800">
                  নেগেটিভ স্টক অনুমোদন করুন (Negative Stock Prevention)
                </span>
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2 font-bold text-[#e6b980] bg-[#1e3932] hover:bg-[#162f29] rounded-xl cursor-pointer"
              >
                আর্থিক সেটিংস সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUBMODULE 12: ACTIVITY LOGS
         ───────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'logs' && selectedOrg && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              {selectedOrg.displayName} — অ্যাক্টিভিটি ও অডিট ট্রেইল (Activity Logs)
            </h3>
            <p className="text-xs text-slate-500">
              এই প্রতিষ্ঠানের সকল প্রশাসনিক ও আর্থিক পরিবর্তনের অপরিবর্তনীয় অডিট লগ।
            </p>
          </div>

          <div className="erp-org-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">সময়</th>
                    <th className="p-3">অ্যাকশন</th>
                    <th className="p-3">ব্যবহারকারী রোল</th>
                    <th className="p-3">বিবরণ / নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/80">
                        <td className="p-3 text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-[#1e3932]">{log.action}</td>
                        <td className="p-3 text-slate-600 font-sans">{log.actorRole}</td>
                        <td className="p-3 text-slate-800 font-sans">{log.notes || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 font-sans">
                        কোনো অডিট রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

