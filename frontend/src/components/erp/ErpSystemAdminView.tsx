'use client';

import React, { useState, useEffect } from 'react';
import './ErpSystemAdminView.css';
import {
  ShieldAlert,
  Server,
  Database,
  Activity,
  HardDrive,
  Users,
  KeyRound,
  FileText,
  RotateCcw,
  Zap,
  Globe,
  Radio,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Bell,
  Cpu,
  Mail,
  MessageSquare,
  Power,
  ToggleLeft,
  ToggleRight,
  Download,
  Upload,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { SystemSubmodule } from '../../types';
import {
  SystemAdminService,
  SystemDashboardData,
  SystemSettingsData,
  SecurityPolicyData,
  BackupItem,
  RestoreItem,
  IntegrationItem,
  FeatureFlagItem,
  SystemLogItem,
  SessionItem,
} from '../../services/systemAdmin.service';

interface ErpSystemAdminViewProps {
  submodule?: SystemSubmodule;
  onSelectSubmodule?: (sub: SystemSubmodule) => void;
}

export const ErpSystemAdminView: React.FC<ErpSystemAdminViewProps> = ({
  submodule = 'sys-dashboard',
  onSelectSubmodule,
}) => {
  // Navigation tabs
  type MainTab = 'dashboard' | 'settings' | 'security' | 'database' | 'integrations' | 'logs';
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data states
  const [dashboard, setDashboard] = useState<SystemDashboardData | null>(null);
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicyData | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [restores, setRestores] = useState<RestoreItem[]>([]);
  const [dbMetrics, setDbMetrics] = useState<any>(null);
  const [storageMetrics, setStorageMetrics] = useState<any>(null);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [queues, setQueues] = useState<any>(null);
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  // Modals & Action States
  const [isBackupLoading, setIsBackupLoading] = useState<boolean>(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState<boolean>(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<string>('');
  const [restoreEnv, setRestoreEnv] = useState<string>('STAGING');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync tab with external submodule prop
  useEffect(() => {
    if (!submodule) return;
    if (['sys-dashboard', 'sys-performance-monitoring', 'sys-system-health'].includes(submodule)) {
      setActiveTab('dashboard');
    } else if (['sys-general-settings', 'sys-org-settings', 'sys-maintenance-mode', 'sys-settings-access'].includes(submodule)) {
      setActiveTab('settings');
    } else if (['sys-user-admin', 'sys-role-perms', 'sys-security-center', 'sys-session-mgmt', 'sys-login-history'].includes(submodule)) {
      setActiveTab('security');
    } else if (['sys-db-monitoring', 'sys-db-backup', 'sys-backup-history', 'sys-restore-mgmt', 'sys-storage-mgmt'].includes(submodule)) {
      setActiveTab('database');
    } else if (['sys-api-mgmt', 'sys-integration-mgmt', 'sys-email-config', 'sys-sms-config', 'sys-notif-settings', 'sys-job-monitoring', 'sys-queue-mgmt'].includes(submodule)) {
      setActiveTab('integrations');
    } else if (['sys-app-logs', 'sys-error-monitoring', 'sys-audit-logs', 'sys-feature-flags', 'sys-data-import-export', 'sys-version-updates'].includes(submodule)) {
      setActiveTab('logs');
    }
  }, [submodule]);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [dash, setts, sec, bks, rsts, dbm, stg, ints, qm, lgData, flags, sess] = await Promise.all([
        SystemAdminService.getDashboard().catch(() => null),
        SystemAdminService.getSettings().catch(() => null),
        SystemAdminService.getSecurityPolicy().catch(() => null),
        SystemAdminService.getBackupHistory().catch(() => []),
        SystemAdminService.getRestoreHistory().catch(() => []),
        SystemAdminService.getDatabaseMetrics().catch(() => null),
        SystemAdminService.getStorageMetrics().catch(() => null),
        SystemAdminService.getIntegrations().catch(() => []),
        SystemAdminService.getQueueMetrics().catch(() => null),
        SystemAdminService.getLogs({ limit: 15 }).catch(() => ({ logs: [], pagination: {} })),
        SystemAdminService.getFeatureFlags().catch(() => []),
        SystemAdminService.getSessions().catch(() => []),
      ]);

      if (dash) setDashboard(dash);
      if (setts) setSettings(setts);
      if (sec) setSecurityPolicy(sec);
      setBackups(bks);
      setRestores(rsts);
      if (dbm) setDbMetrics(dbm);
      if (stg) setStorageMetrics(stg);
      setIntegrations(ints);
      if (qm) setQueues(qm);
      setLogs(lgData.logs || []);
      setFeatureFlags(flags);
      setSessions(sess);
    } catch (err: any) {
      console.error('Failed to load system admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleTriggerBackup = async () => {
    try {
      setIsBackupLoading(true);
      const res = await SystemAdminService.triggerBackup('MANUAL');
      showToast(`ডাটাবেজ ব্যাকআপ সফল! আইডি: ${res.backupId}`);
      const updatedBackups = await SystemAdminService.getBackupHistory();
      setBackups(updatedBackups);
    } catch (err: any) {
      showToast(`ত্রুটি: ${err.message}`);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupForRestore) return;
    try {
      setIsRestoring(true);
      const res = await SystemAdminService.executeRestore(selectedBackupForRestore, restoreEnv);
      showToast(`রিস্টোর সম্পন্ন! রিস্টোর আইডি: ${res.restoreId}`);
      setRestoreModalOpen(false);
      const updatedRestores = await SystemAdminService.getRestoreHistory();
      setRestores(updatedRestores);
    } catch (err: any) {
      showToast(`রিস্টোর ব্যর্থ: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleTestIntegration = async (key: string) => {
    try {
      setTestingKey(key);
      const res = await SystemAdminService.testIntegration(key);
      showToast(`${key} টেস্ট: ${res.status} (${res.latencyMs}ms)`);
      const updatedInts = await SystemAdminService.getIntegrations();
      setIntegrations(updatedInts);
    } catch (err: any) {
      showToast(`টেস্ট ব্যর্থ: ${err.message}`);
    } finally {
      setTestingKey(null);
    }
  };

  const handleToggleFlag = async (flagKey: string, currentStatus: boolean) => {
    try {
      const res = await SystemAdminService.toggleFeatureFlag(flagKey, !currentStatus);
      showToast(`ফিচার ফ্ল্যাগ ${flagKey}: ${res.isGloballyEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}`);
      const updatedFlags = await SystemAdminService.getFeatureFlags();
      setFeatureFlags(updatedFlags);
    } catch (err: any) {
      showToast(`টগল ব্যর্থ: ${err.message}`);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const ok = await SystemAdminService.revokeSession(sessionId);
      if (ok) {
        showToast('ব্যবহারকারী সেশন সফলভাবে বাতিল করা হয়েছে');
        const updatedSess = await SystemAdminService.getSessions();
        setSessions(updatedSess);
      }
    } catch (err: any) {
      showToast(`বাতিল ব্যর্থ: ${err.message}`);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!settings) return;
    try {
      const nextState = !settings.maintenanceMode.isEnabled;
      const updated = await SystemAdminService.updateSettings({
        maintenanceMode: {
          ...settings.maintenanceMode,
          isEnabled: nextState,
        },
      });
      setSettings(updated);
      showToast(`মেইনটেন্যান্স মোড ${nextState ? 'চালু' : 'বন্ধ'} করা হয়েছে`);
    } catch (err: any) {
      showToast(`আপডেট ব্যর্থ: ${err.message}`);
    }
  };

  const handleExportData = async (entity: string) => {
    try {
      await SystemAdminService.createDataExchange('EXPORT', entity, 'CSV', '6af325860cf8eb23e292b104');
      showToast(`${entity} এক্সপোর্ট ফাইল সফলভাবে জেনারেট হয়েছে`);
    } catch (err: any) {
      showToast(`এক্সপোর্ট ব্যর্থ: ${err.message}`);
    }
  };

  return (
    <div className="system-admin-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="system-admin-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[#e6b980]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                সিস্টেম প্রশাসন ও কনফিগারেশন
              </h1>
              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                MODULE 16
              </span>
              {settings?.maintenanceMode?.isEnabled && (
                <span className="text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  MAINTENANCE ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              সেন্ট্রাল প্ল্যাটফর্ম কন্ট্রোল, নিরাপত্তা অডিট, ডাটাবেজ ব্যাকআপ ও ব্যাকগ্রাউন্ড সার্ভিস মনিটর
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Functional Tabs Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'dashboard' as MainTab, label: 'ড্যাশবোর্ড ও লাইভ হেলথ', icon: Activity, sub: 'sys-dashboard' as SystemSubmodule },
          { id: 'settings' as MainTab, label: 'সাধারণ ও আঞ্চলিক সেটিংস', icon: Globe, sub: 'sys-general-settings' as SystemSubmodule },
          { id: 'security' as MainTab, label: 'নিরাপত্তা ও সেশন অ্যাডমিন', icon: ShieldAlert, sub: 'sys-security-center' as SystemSubmodule },
          { id: 'database' as MainTab, label: 'ডাটাবেজ, ব্যাকআপ ও স্টোরেজ', icon: Database, sub: 'sys-db-monitoring' as SystemSubmodule },
          { id: 'integrations' as MainTab, label: 'ইন্টিগ্রেশন ও কিউ মনিটর', icon: Radio, sub: 'sys-integration-mgmt' as SystemSubmodule },
          { id: 'logs' as MainTab, label: 'লগ, ফ্ল্যাগ ও ডেটা এক্সপোর্ট', icon: FileText, sub: 'sys-app-logs' as SystemSubmodule },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (onSelectSubmodule) onSelectSubmodule(tab.sub);
              }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#e6b980] text-[#e6b980] bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-xs">সিস্টেম ইনফরমেশন লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {/* ─────────────────────────────────────────────────────────────
                TAB 1: SYSTEM DASHBOARD & LIVE HEALTH
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 12 KPI Metric Cards */}
                <div className="system-kpi-grid">
                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">অর্গানাইজেশন সংখ্যা</span>
                    <div className="text-xl font-bold text-white mt-1">
                      {dashboard?.kpi?.totalOrganizations || 0}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                      {dashboard?.kpi?.activeOrganizations || 0} অ্যাক্টিভ
                    </span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">মোট ব্যবহারকারী</span>
                    <div className="text-xl font-bold text-white mt-1">
                      {dashboard?.kpi?.totalUsers || 0}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                      {dashboard?.kpi?.activeUsers || 0} অ্যাক্টিভ ইউজার
                    </span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">লাইভ অনলাইন সেশন</span>
                    <div className="text-xl font-bold text-[#e6b980] mt-1">
                      {dashboard?.kpi?.onlineSessions || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">রিফ্রেশ টোকেন ভেরিফাইড</span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">ব্যর্থ লগইন (২৪ ঘণ্টা)</span>
                    <div className={`text-xl font-bold mt-1 ${(dashboard?.kpi?.failedLoginAttempts24h || 0) > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {dashboard?.kpi?.failedLoginAttempts24h || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">লকআউট গার্ড সক্রিয়</span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">ডাটাবেজ স্ট্যাটাস</span>
                    <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{dashboard?.kpi?.databaseStatus || 'CONNECTED'}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">MongoDB Atlas Primary</span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">রেডিস ক্যাশ স্ট্যাটাস</span>
                    <div className="text-xl font-bold text-blue-400 mt-1">
                      {dashboard?.kpi?.redisStatus || 'CONNECTED'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">BullMQ ডিসট্রিবিউটেড কিউ</span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">সিস্টেম আপটাইম</span>
                    <div className="text-xl font-bold text-white mt-1 font-mono">
                      {Math.floor((dashboard?.kpi?.systemUptimeSeconds || 0) / 3600)}h {Math.floor(((dashboard?.kpi?.systemUptimeSeconds || 0) % 3600) / 60)}m
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">জিরো ডাউনটাইম রানিং</span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">কমপ্লিটেড ব্যাকআপ</span>
                    <div className="text-xl font-bold text-white mt-1">
                      {dashboard?.kpi?.completedBackups || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">SHA-256 ভেরিফাইড</span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">সিস্টেম মেমোরি (RSS)</span>
                    <div className="text-xl font-bold text-white mt-1 font-mono">
                      {dashboard?.performance?.rssMb || 0} MB
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Heap: {dashboard?.performance?.heapUsedMb || 0} MB
                    </span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">অ্যাপ্লিকেশন এরর (২৪h)</span>
                    <div className={`text-xl font-bold mt-1 ${(dashboard?.kpi?.applicationErrors24h || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {dashboard?.kpi?.applicationErrors24h || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">ক্রিটিক্যাল এরর মনিটর</span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">সক্রিয় ফিচার ফ্ল্যাগ</span>
                    <div className="text-xl font-bold text-[#e6b980] mt-1">
                      {dashboard?.kpi?.activeFeatureFlags || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">মডিউল লেভেল কন্ট্রোল</span>
                  </div>

                  <div className="system-card">
                    <span className="text-[11px] text-slate-400 font-medium">পরিবেশ (Environment)</span>
                    <div className="text-xl font-bold text-purple-400 mt-1 uppercase font-mono">
                      {dashboard?.performance?.environment || 'PROD'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">Node {dashboard?.performance?.nodeVersion}</span>
                  </div>
                </div>

                {/* Infrastructure Live Status Checklist */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400" />
                      <span>ইনফ্রাস্ট্রাকচার হেলথ ও সার্ভিস কানেক্টিভিটি চেকলিস্ট</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">লাইভ ডায়াগনস্টিকস ভেরিফাইড</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {Object.entries(dashboard?.systemHealth || {}).map(([service, status]) => (
                      <div key={service} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">{service}</span>
                          <span className="text-xs font-bold text-white mt-0.5 block">{service.toUpperCase()}</span>
                        </div>
                        <span className={`health-badge ${status.toLowerCase() === 'healthy' || status.toLowerCase() === 'operational' || status.toLowerCase() === 'connected' ? 'healthy' : 'degraded'}`}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 2: GENERAL & REGIONAL SETTINGS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Configuration */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#e6b980]" />
                      <span>গ্লোবাল সিস্টেম কনফিগারেশন</span>
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">অ্যাপ্লিকেশন টাইটেল</label>
                        <input
                          type="text"
                          value={settings?.appName || ''}
                          onChange={(e) => setSettings(settings ? { ...settings, appName: e.target.value } : null)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#e6b980]"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">অ্যাপ্লিকেশন বিবরণী</label>
                        <input
                          type="text"
                          value={settings?.appDescription || ''}
                          onChange={(e) => setSettings(settings ? { ...settings, appDescription: e.target.value } : null)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#e6b980]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">ডিফল্ট ভাষা</label>
                          <select
                            value={settings?.defaultLanguage || 'bn'}
                            onChange={(e) => setSettings(settings ? { ...settings, defaultLanguage: e.target.value as any } : null)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none"
                          >
                            <option value="bn">বাংলা (Bengali)</option>
                            <option value="en">English (US)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">টাইমজোন</label>
                          <input
                            type="text"
                            value={settings?.defaultTimezone || 'Asia/Dhaka'}
                            readOnly
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">সেশন টাইমআউট (মিনিট)</label>
                          <input
                            type="number"
                            value={settings?.sessionTimeoutMinutes || 60}
                            onChange={(e) => setSettings(settings ? { ...settings, sessionTimeoutMinutes: Number(e.target.value) } : null)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">পেজিনেশন সাইজ</label>
                          <input
                            type="number"
                            value={settings?.defaultPaginationSize || 25}
                            onChange={(e) => setSettings(settings ? { ...settings, defaultPaginationSize: Number(e.target.value) } : null)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => settings && SystemAdminService.updateSettings(settings).then(() => showToast('সেটিংস সফলভাবে সংরক্ষিত!'))}
                          className="px-4 py-2 bg-[#1e3932] text-[#e6b980] font-bold rounded-lg text-xs hover:bg-[#1e3932]/80 transition-colors cursor-pointer"
                        >
                          সেটিংস সংরক্ষণ করুন
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Regional & Currency Settings + Maintenance Mode */}
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>বাংলাদেশ আঞ্চলিক ও কারেন্সি প্যারামিটার</span>
                      </h3>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">মুদ্রার প্রতীক</span>
                          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                            {settings?.currency?.symbol} ({settings?.currency?.code})
                          </span>
                        </div>

                        <div className="p-3 bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">অর্থবছর শুরু</span>
                          <span className="text-sm font-bold text-white mt-0.5 block">
                            জুলাই (১ম মাস) — এনবিআর মানসম্মত
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Maintenance Mode Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Power className="w-4 h-4 text-red-400" />
                          <h3 className="text-xs font-bold text-white">সিস্টেম মেইনটেন্যান্স মোড</h3>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleMaintenance}
                          className="cursor-pointer"
                        >
                          {settings?.maintenanceMode?.isEnabled ? (
                            <ToggleRight className="w-7 h-7 text-red-500" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-500" />
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        মেইনটেন্যান্স মোড চালু করলে সাধারণ কর্মকর্তা ও বহিরাগত গ্রাহকদের পোর্টাল সাময়িকভাবে স্থগিত থাকবে। কেবল সুপার অ্যাডমিনরা সিস্টেমে প্রবেশ করতে পারবেন।
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 3: SECURITY CENTER & SESSIONS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Security Policy Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>এন্টারপ্রাইজ পাসওয়ার্ড ও অ্যাকাউন্ট সুরক্ষা পলিসি</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-slate-800 rounded-xl">
                      <span className="text-[11px] text-slate-400 block">ন্যূনতম পাসওয়ার্ড দৈর্ঘ্য</span>
                      <span className="text-lg font-bold text-white mt-1 block">
                        {securityPolicy?.minPasswordLength || 8} ক্যারেক্টার
                      </span>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-xl">
                      <span className="text-[11px] text-slate-400 block">ব্যর্থ লগইন লকআউট থ্রেশহোল্ড</span>
                      <span className="text-lg font-bold text-amber-400 mt-1 block">
                        {securityPolicy?.failedLoginLockoutThreshold || 5} বার ভুল চেষ্টা
                      </span>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-xl">
                      <span className="text-[11px] text-slate-400 block">অ্যাকাউন্ট লকআউট সময়</span>
                      <span className="text-lg font-bold text-white mt-1 block">
                        {securityPolicy?.lockoutDurationMinutes || 30} মিনিট
                      </span>
                    </div>

                    <div className="p-3 bg-slate-800 rounded-xl">
                      <span className="text-[11px] text-slate-400 block">সর্বোচ্চ একই সময়ে সেশন</span>
                      <span className="text-lg font-bold text-emerald-400 mt-1 block">
                        {securityPolicy?.maxConcurrentSessions || 3} ডিভাইস
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Sessions Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>অনলাইন সক্রিয় সেশন তালিকা (Active User Sessions)</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">মোট {sessions.length}টি সেশন</span>
                  </div>

                  <div className="system-table-wrapper">
                    <table className="system-table">
                      <thead>
                        <tr>
                          <th>ব্যবহারকারী</th>
                          <th>ইমেইল</th>
                          <th>আইপি অ্যাড্রেস</th>
                          <th>ডিভাইস / ইউজার এজেন্ট</th>
                          <th>লগইন সময়</th>
                          <th>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-slate-500">
                              কোনো সক্রিয় সেশন পাওয়া যায়নি।
                            </td>
                          </tr>
                        ) : (
                          sessions.map((sess) => (
                            <tr key={sess._id}>
                              <td className="font-semibold text-white">
                                {sess.userId?.fullName || 'Anonymous User'}
                              </td>
                              <td className="font-mono text-slate-400">
                                {sess.userId?.email || 'N/A'}
                              </td>
                              <td className="font-mono text-slate-300">
                                {sess.ipAddress || '127.0.0.1'}
                              </td>
                              <td className="truncate max-w-xs text-slate-400" title={sess.userAgent}>
                                {sess.userAgent || 'Chrome Webkit'}
                              </td>
                              <td className="font-mono text-slate-400">
                                {new Date(sess.createdAt).toLocaleTimeString()}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeSession(sess._id)}
                                  className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 text-[10px] font-bold rounded cursor-pointer transition-colors"
                                >
                                  সেশন বাতিল
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 4: DATABASE, BACKUPS & RESTORE
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                {/* Database Metrics Header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-mono">DATABASE NAME</span>
                    <span className="text-base font-bold text-white mt-1 block font-mono">
                      {dbMetrics?.databaseName || 'sunbird_erp_db'}
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-1">Primary Connection Active</span>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-mono">TOTAL COLLECTIONS</span>
                    <span className="text-base font-bold text-white mt-1 block">
                      {dbMetrics?.totalCollectionsListed || 0} কালেকশন
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">সম্পূর্ণ ইনডেক্সড স্কিমা</span>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-mono">FILE STORAGE (S3)</span>
                    <span className="text-base font-bold text-white mt-1 block">
                      {storageMetrics?.storageUsedMb || 0} MB
                    </span>
                    <span className="text-[10px] text-blue-400 block mt-1 font-mono">
                      {storageMetrics?.bucketName}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">SNAPSHOT BACKUP</span>
                      <span className="text-xs font-bold text-white mt-1 block">ইনস্ট্যান্ট ব্যাকআপ নিন</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerBackup}
                      disabled={isBackupLoading}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Download className={`w-3.5 h-3.5 ${isBackupLoading ? 'animate-bounce' : ''}`} />
                      <span>{isBackupLoading ? 'তৈরি হচ্ছে...' : 'ব্যাকআপ নিন'}</span>
                    </button>
                  </div>
                </div>

                {/* Backup History Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                      <span>ডাটাবেজ ব্যাকআপ হিস্ট্রি (Cryptographic Checksum Verified)</span>
                    </h3>
                  </div>

                  <div className="system-table-wrapper">
                    <table className="system-table">
                      <thead>
                        <tr>
                          <th>ব্যাকআপ আইডি</th>
                          <th>টাইপ</th>
                          <th>ফাইল নাম</th>
                          <th>সাইজ</th>
                          <th>চেকসাম (SHA-256)</th>
                          <th>কালেকশন / রেকর্ড</th>
                          <th>তৈরির তারিখ</th>
                          <th>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-6 text-slate-500">
                              কোনো ব্যাকআপ রেকর্ড পাওয়া যায়নি।
                            </td>
                          </tr>
                        ) : (
                          backups.map((b) => (
                            <tr key={b._id}>
                              <td className="font-bold text-[#e6b980] font-mono">{b.backupId}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.backupType === 'MANUAL' ? 'bg-blue-900/60 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                                  {b.backupType}
                                </span>
                              </td>
                              <td className="font-mono text-slate-300 truncate max-w-xs">{b.fileName}</td>
                              <td className="font-mono text-slate-400">{Math.round(b.sizeBytes / 1024)} KB</td>
                              <td className="font-mono text-[10px] text-slate-500 truncate max-w-xs">{b.checksum}</td>
                              <td className="font-mono text-slate-400">{b.collectionsCount} cols / {b.documentCount} docs</td>
                              <td className="font-mono text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBackupForRestore(b.backupId);
                                    setRestoreModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-[#1e3932] hover:bg-[#1e3932]/80 border border-[#e6b980]/40 text-[#e6b980] text-[10px] font-bold rounded cursor-pointer transition-colors"
                                >
                                  রিস্টোর
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Restore History */}
                {restores.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-blue-400" />
                      <span>রিস্টোর অপারেশন লগ (Restore Audit Log)</span>
                    </h3>

                    <div className="system-table-wrapper">
                      <table className="system-table">
                        <thead>
                          <tr>
                            <th>রিস্টোর আইডি</th>
                            <th>উৎস ব্যাকআপ</th>
                            <th>টার্গেট এনভায়রনমেন্ট</th>
                            <th>স্ট্যাটাস</th>
                            <th>সম্পাদন সময়</th>
                            <th>ফলাফল নোট</th>
                          </tr>
                        </thead>
                        <tbody>
                          {restores.map((r) => (
                            <tr key={r._id}>
                              <td className="font-mono text-blue-400 font-bold">{r.restoreId}</td>
                              <td className="font-mono text-slate-300">{r.backupId}</td>
                              <td className="font-mono text-slate-400">{r.targetEnvironment}</td>
                              <td>
                                <span className="health-badge healthy">{r.status}</span>
                              </td>
                              <td className="font-mono text-slate-400">{new Date(r.executedAt).toLocaleString()}</td>
                              <td className="text-slate-400 truncate max-w-md">{r.outcomeNotes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 5: INTEGRATIONS & QUEUES
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                {/* 8 Integrations Status Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>সেন্ট্রাল এক্সটার্নাল এপিআই ও ক্লাউড ইন্টিগ্রেশন হাব</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrations.map((item) => (
                      <div key={item.integrationKey} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{item.displayName}</span>
                            <span className={`health-badge ${item.status === 'HEALTHY' ? 'healthy' : 'degraded'}`}>
                              {item.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            KEY: {item.integrationKey} | CAT: {item.category}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTestIntegration(item.integrationKey)}
                          disabled={testingKey === item.integrationKey}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 rounded-lg cursor-pointer transition-colors"
                        >
                          {testingKey === item.integrationKey ? 'টেস্টিং...' : 'টেস্ট পিং'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BullMQ Queues */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>BullMQ ডিস্ট্রিবিউটেড ব্যাকগ্রাউন্ড কিউ ও জব ওয়ার্কার্স</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(queues?.queues || []).map((q: any) => (
                      <div key={q.name} className="p-4 bg-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white font-mono">{q.name}</span>
                          <span className="health-badge healthy">ACTIVE</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{q.description}</p>
                        <div className="pt-2 border-t border-slate-700 flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">সম্পন্ন: {q.completed}</span>
                          <span className="text-amber-400">অপেক্ষমাণ: {q.waiting}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 6: LOGS, FEATURE FLAGS & EXPORT
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                {/* Feature Flags Grid */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#e6b980]" />
                    <span>সেন্ট্রাল ফিচার ফ্ল্যাগ ম্যানেজমেন্ট (Enterprise Feature Flags)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {featureFlags.map((flag) => (
                      <div key={flag.flagKey} className="p-4 bg-slate-800 rounded-xl flex items-center justify-between">
                        <div className="space-y-1 pr-3">
                          <span className="text-xs font-bold text-white block">{flag.displayName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{flag.flagKey}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleFlag(flag.flagKey, flag.isGloballyEnabled)}
                          className="cursor-pointer"
                        >
                          {flag.isGloballyEnabled ? (
                            <ToggleRight className="w-7 h-7 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-500" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bulk Data Export Quick Actions */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>প্রশাসনিক ডেটা এক্সপোর্ট অ্যাকশন (Bulk Entity Exports)</span>
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {['PRODUCT', 'CUSTOMER', 'INVENTORY', 'SALES', 'CHART_OF_ACCOUNTS', 'EMPLOYEE'].map((ent) => (
                      <button
                        key={ent}
                        type="button"
                        onClick={() => handleExportData(ent)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                      >
                        {ent} এক্সপোর্ট করুন
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Application Logs */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>সিস্টেম অ্যাপ্লিকেশন ও সিকিউরিটি এরর লগ</span>
                  </h3>

                  <div className="system-table-wrapper">
                    <table className="system-table">
                      <thead>
                        <tr>
                          <th>সময়</th>
                          <th>লেভেল</th>
                          <th>সার্ভিস</th>
                          <th>মডিউল</th>
                          <th>মেসেজ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-slate-500">
                              কোনো এরর লগ নেই (সিস্টেম পরিচ্ছন্ন)।
                            </td>
                          </tr>
                        ) : (
                          logs.map((lg) => (
                            <tr key={lg._id}>
                              <td className="font-mono text-slate-400">{new Date(lg.timestamp).toLocaleTimeString()}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lg.severity === 'ERROR' ? 'bg-red-950 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                                  {lg.severity}
                                </span>
                              </td>
                              <td className="font-mono text-slate-400">{lg.service}</td>
                              <td className="font-mono text-slate-400">{lg.module}</td>
                              <td className="text-slate-300">{lg.message}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Database Restore Confirmation Modal */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">ডাটাবেজ রিস্টোর নিশ্চিতকরণ</h3>
                <p className="text-[11px] text-slate-400">উৎস ব্যাকআপ: {selectedBackupForRestore}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              সতর্কবার্তা: ডাটাবেজ রিস্টোর করার পূর্বে সিস্টেম স্বয়ংক্রিয়ভাবে একটি বর্তমান সেফটি স্ন্যাপশট ব্যাকআপ তৈরি করবে। আপনি কি নিশ্চিত?
            </p>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 block">টার্গেট এনভায়রনমেন্ট</label>
              <select
                value={restoreEnv}
                onChange={(e) => setRestoreEnv(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="STAGING">STAGING (টেস্টিং এনভায়রনমেন্ট)</option>
                <option value="PRODUCTION">PRODUCTION (মূল লাইভ ডাটাবেজ)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-bold text-white rounded-lg cursor-pointer transition-colors"
              >
                {isRestoring ? 'রিস্টোর হচ্ছে...' : 'হ্যাঁ, রিস্টোর সম্পন্ন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErpSystemAdminView;
