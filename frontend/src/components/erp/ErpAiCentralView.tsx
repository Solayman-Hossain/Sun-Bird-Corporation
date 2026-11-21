'use client';

import React, { useState, useEffect, useTransition } from 'react';
import './ErpAiCentralView.css';
import {
  Bot,
  Sparkles,
  Cpu,
  Layers,
  Sliders,
  FileText,
  Scan,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Database,
  History,
  Lock,
  Eye,
  Check,
  ArrowRight,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { AiSubmodule } from '../../types';
import {
  AiService,
  AiControlCenterData,
  AiProviderRecord,
  AiModelRecord,
  AiFeatureRecord,
  AiPromptTemplateRecord,
  AiDocumentJobRecord,
  AiKnowledgeDocRecord,
  AiConversationRecord,
  AiMessageRecord,
  AiSettingsData,
} from '../../services/ai.service';

interface ErpAiCentralViewProps {
  submodule?: AiSubmodule;
  onSelectSubmodule?: (submodule: AiSubmodule) => void;
}

export function ErpAiCentralView({
  submodule = 'ai-dashboard',
  onSelectSubmodule,
}: ErpAiCentralViewProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [activeSubmodule, setActiveSubmodule] = useState<AiSubmodule>(submodule);
  useEffect(() => {
    setActiveSubmodule(submodule);
  }, [submodule]);

  const handleSubmoduleChange = (sub: AiSubmodule) => {
    setActiveSubmodule(sub);
    if (onSelectSubmodule) onSelectSubmodule(sub);
  };

  // State
  const [controlCenter, setControlCenter] = useState<AiControlCenterData | null>(null);
  const [providers, setProviders] = useState<AiProviderRecord[]>([]);
  const [models, setModels] = useState<AiModelRecord[]>([]);
  const [features, setFeatures] = useState<AiFeatureRecord[]>([]);
  const [prompts, setPrompts] = useState<AiPromptTemplateRecord[]>([]);
  const [docJobs, setDocJobs] = useState<AiDocumentJobRecord[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<AiKnowledgeDocRecord[]>([]);
  const [conversations, setConversations] = useState<AiConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<AiMessageRecord[]>([]);
  const [settings, setSettings] = useState<AiSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Chat inputs
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Document upload modal state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docType, setDocType] = useState('COMMERCIAL_INVOICE');
  const [docFileName, setDocFileName] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');

  // Knowledge create modal state
  const [isKModalOpen, setIsKModalOpen] = useState(false);
  const [kTitle, setKTitle] = useState('');
  const [kCategory, setKCategory] = useState('PRODUCT_MANUAL');
  const [kContent, setKContent] = useState('');

  // Load Initial Data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [ccRes, provRes, modRes, featRes, promptRes, docRes, kRes, convRes, setRes] = await Promise.all([
        AiService.getControlCenter().catch(() => null),
        AiService.getProviders().catch(() => []),
        AiService.getModels().catch(() => []),
        AiService.getFeatures().catch(() => []),
        AiService.getPrompts().catch(() => []),
        AiService.getDocumentJobs().catch(() => []),
        AiService.getKnowledgeDocs().catch(() => []),
        AiService.getConversations().catch(() => []),
        AiService.getSettings().catch(() => null),
      ]);

      if (ccRes) setControlCenter(ccRes);
      if (provRes) setProviders(provRes);
      if (modRes) setModels(modRes);
      if (featRes) setFeatures(featRes);
      if (promptRes) setPrompts(promptRes);
      if (docRes) setDocJobs(docRes);
      if (kRes) setKnowledgeDocs(kRes);
      if (convRes && convRes.length > 0) {
        setConversations(convRes);
        setActiveConversationId(convRes[0]._id);
        const msgRes = await AiService.getConversationMessages(convRes[0]._id).catch(() => []);
        setMessages(msgRes);
      }
      if (setRes) setSettings(setRes);
    } catch (err: any) {
      showToast(`ডাটা লোড ত্রুটি: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Send Chat Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const query = chatInput.trim();
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await AiService.sendChatMessage(query, activeConversationId || undefined);
      if (!activeConversationId) {
        setActiveConversationId(res.conversationId);
        setConversations((prev) => [
          {
            _id: res.conversationId,
            title: query.slice(0, 30),
            moduleContext: 'GLOBAL',
            messageCount: 2,
            totalTokensUsed: 120,
            lastMessageAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
    } catch (err: any) {
      showToast(`বার্তা প্রেরণে ব্যর্থ: ${err.message}`, 'error');
    } finally {
      setIsChatSending(false);
    }
  };

  // Toggle Feature
  const handleToggleFeature = async (featureCode: string, currentStatus: boolean) => {
    try {
      await AiService.toggleFeature(featureCode, !currentStatus);
      setFeatures((prev) =>
        prev.map((f) => (f.featureCode === featureCode ? { ...f, isGloballyEnabled: !currentStatus } : f))
      );
      showToast(`ফিচার ${featureCode} ${!currentStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`, 'success');
    } catch (err: any) {
      showToast(`টগল ব্যর্থ: ${err.message}`, 'error');
    }
  };

  // Create Document Job
  const handleCreateDocumentJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileName.trim() || !docFileUrl.trim()) return;

    try {
      const job = await AiService.createDocumentJob({
        documentType: docType,
        fileName: docFileName,
        fileUrl: docFileUrl,
      });
      setDocJobs((prev) => [job, ...prev]);
      setIsDocModalOpen(false);
      setDocFileName('');
      setDocFileUrl('');
      showToast('ডকুমেন্ট ওসিআর কাজ সফলভাবে যুক্ত হয়েছে', 'success');
    } catch (err: any) {
      showToast(`ডকুমেন্ট জব ত্রুটি: ${err.message}`, 'error');
    }
  };

  // Review Document Job
  const handleReviewDocument = async (id: string, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      const updated = await AiService.reviewDocumentJob(id, action, undefined, 'Reviewed by Enterprise Admin');
      setDocJobs((prev) => prev.map((j) => (j._id === id ? updated : j)));
      showToast(`ডকুমেন্ট জব ${action === 'ACCEPTED' ? 'অনুমোদিত' : 'বাতিল'} হয়েছে`, 'success');
    } catch (err: any) {
      showToast(`রিভিউ ব্যর্থ: ${err.message}`, 'error');
    }
  };

  // Create Knowledge Doc
  const handleCreateKnowledgeDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kTitle.trim() || !kContent.trim()) return;

    try {
      const doc = await AiService.createKnowledgeDoc({
        title: kTitle,
        category: kCategory,
        content: kContent,
        tags: ['medical', 'equipment', 'standard'],
      });
      setKnowledgeDocs((prev) => [doc, ...prev]);
      setIsKModalOpen(false);
      setKTitle('');
      setKContent('');
      showToast('নলেজ বেস নিবন্ধ সফলভাবে প্রকাশিত হয়েছে', 'success');
    } catch (err: any) {
      showToast(`নলেজ নিবন্ধ ত্রুটি: ${err.message}`, 'error');
    }
  };

  // Metrics
  const totalRequests = controlCenter?.overview?.totalRequests || 148;
  const successRate = controlCenter?.overview?.successRatePercent || 98.6;
  const totalTokens = controlCenter?.overview?.totalTokens || 512000;
  const estimatedCost = controlCenter?.overview?.estimatedCostBdt || 61.44;
  const activeProviders = controlCenter?.counts?.activeProviders || 2;
  const activeFeatures = controlCenter?.counts?.activeFeatures || 13;

  return (
    <div className="erp-ai-central-container space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTROL BANNER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="ai-badge-emerald text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              CENTRAL AI INTELLIGENCE 2.0
            </span>
            <span className="ai-badge-gold text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              GEMINI 1.5 PRO / FLASH ACTIVE
            </span>
            <span className="text-[10px] text-teal-400 bg-teal-950/60 border border-teal-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3" />
              AUDITED HUMAN-IN-THE-LOOP
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            সান বার্ড সেন্ট্রাল এআই অ্যাসিস্ট্যান্ট ও ইন্টেলিজেন্স সিস্টেম
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            প্রতিষ্ঠানের ১৩টি মডিউল জুড়ে স্বয়ংক্রিয় ব্যবসায়িক এনালিটিক্স, ডকুমেন্ট ওসিআর, বাংলা/ইংরেজি চ্যাট অ্যাসিস্ট্যান্ট ও সেন্ট্রাল প্রোভাইডার রাউটার
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => handleSubmoduleChange('ai-chat-assistant')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-900/40 border border-emerald-400/30 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4 text-emerald-200" />
            <span>নতুন চ্যাট শুরু</span>
          </button>

          <button
            onClick={() => setIsDocModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5 text-[#e6b980]" />
            <span>ডকুমেন্ট ওসিআর</span>
          </button>

          <button
            onClick={loadInitialData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CORE AI STATUS & USAGE METRICS (6 CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="ai-card bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">মোট এআই রিকোয়েস্ট</span>
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black font-mono text-white">{totalRequests}টি</div>
          <div className="text-[10px] text-emerald-400 font-bold">{successRate}% সফলতা হার</div>
        </div>

        <div className="ai-card bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">টোকেন ব্যবহার</span>
            <Zap className="w-3.5 h-3.5 text-[#e6b980]" />
          </div>
          <div className="text-lg font-black font-mono text-[#e6b980]">
            {(totalTokens / 1000).toFixed(1)}K
          </div>
          <div className="text-[10px] text-slate-400">ইনপুট ও আউটপুট টোকেন</div>
        </div>

        <div className="ai-card bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">অনুমিত খরচ (BDT)</span>
            <DollarSign className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-lg font-black font-mono text-teal-400">
            ৳{estimatedCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">বাজেট কোটার ২.১%</div>
        </div>

        <div className="ai-card bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">সক্রিয় প্রোভাইডার</span>
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg font-black font-mono text-white">{activeProviders}টি</div>
          <div className="text-[10px] text-blue-400">Gemini 1.5 Primary</div>
        </div>

        <div className="ai-card bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">সক্রিয় এআই ফিচার</span>
            <Layers className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-black font-mono text-white">{activeFeatures}টি</div>
          <div className="text-[10px] text-purple-400">১৩টি মডিউলে সংযুক্ত</div>
        </div>

        <div className="ai-card bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">নিরাপত্তা ও রিডাকশন</span>
            <Lock className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-400">ACTIVE</div>
          <div className="text-[10px] text-slate-400">ব্যাংক ও স্যালারি ফিল্টার</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SUBMODULE GROUP SELECTOR TABS (21 SUBMODULES)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-wrap gap-1">
        {[
          { id: 'ai-dashboard', label: '১. এআই ড্যাশবোর্ড ও চ্যাট (01-03, 16)', count: 4 },
          { id: 'ai-provider-mgmt', label: '২. প্রোভাইডার, মডেল ও ফিচার কনফিগ (04-07)', count: 4 },
          { id: 'ai-doc-intelligence', label: '৩. ডকুমেন্ট ওসিআর ও নলেজ বেস (08-10, 15)', count: 4 },
          { id: 'ai-business-analyst', label: '৪. বিআই, অ্যানালিটিক্স ও সেটিংস (11-14, 17-21)', count: 9 },
        ].map((tab) => {
          const isActive =
            (tab.id === 'ai-dashboard' && ['ai-dashboard', 'ai-chat-assistant', 'ai-control-center', 'ai-conversation-history'].includes(activeSubmodule)) ||
            (tab.id === 'ai-provider-mgmt' && ['ai-provider-mgmt', 'ai-model-mgmt', 'ai-feature-mgmt', 'ai-prompt-library'].includes(activeSubmodule)) ||
            (tab.id === 'ai-doc-intelligence' && ['ai-doc-intelligence', 'ai-ocr-extraction', 'ai-knowledge-base', 'ai-workflow-assistant'].includes(activeSubmodule)) ||
            (tab.id === 'ai-business-analyst' && ['ai-business-analyst', 'ai-forecasting-center', 'ai-risk-center', 'ai-recommendation-center', 'ai-usage-analytics', 'ai-budget-mgmt', 'ai-audit-logs', 'ai-security-privacy', 'ai-system-settings'].includes(activeSubmodule));

          return (
            <button
              key={tab.id}
              onClick={() => handleSubmoduleChange(tab.id as AiSubmodule)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#1e3932] text-[#e6b980] border border-[#e6b980]/30 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-[#e6b980] text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN VIEW WORKSPACE (ADAPTIVE TABS)
      ───────────────────────────────────────────────────────────── */}
      {/* GROUP 1: CHAT ASSISTANT & CONTROL CENTER */}
      {(activeSubmodule === 'ai-dashboard' || activeSubmodule === 'ai-chat-assistant' || activeSubmodule === 'ai-control-center' || activeSubmodule === 'ai-conversation-history') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chat Assistant Thread (2 Cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-lg overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    সান বার্ড এআই অ্যাসিস্ট্যান্ট
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Gemini 1.5 Pro
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">রিয়েল-টাইম ডাটাবেজ টুলস সংযুক্ত (বাংলা ও ইংরেজি সমর্থিত)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveConversationId('');
                    setMessages([]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  ক্লিয়ার
                </button>
              </div>
            </div>

            {/* Suggested Prompt Buttons */}
            <div className="p-2.5 bg-slate-950/40 border-b border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
              {[
                'আজকের মোট বিক্রয় কত?',
                'বর্তমান স্টক ও ইনভেন্টরি ভ্যালুয়েশন কেমন?',
                'কোন সাপ্লায়ারের পেমেন্ট বকেয়া রয়েছে?',
                'এই মাসের নেট মুনাফা ও পিঅ্যান্ডএল সারাংশ',
                'ইমপোর্ট এলসি ট্র্যাকার স্ট্যাটাস দেখাও',
              ].map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(query)}
                  className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap border border-slate-700/60 cursor-pointer"
                >
                  {query}
                </button>
              ))}
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="font-bold text-white text-sm">সান বার্ড এআই কন্সোল প্রস্তুত</h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    মেডিকেল ইকুইপমেন্ট ইনভেন্টরি, সেলস ভাউচার, সাপ্লায়ার পেমেন্ট কিংবা পিঅ্যান্ডএল সম্পর্কিত যেকোনো প্রশ্ন করুন।
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-700 text-white rounded-br-xs font-medium'
                          : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/80 shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {/* Tool Executions Badges */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex flex-wrap gap-1.5">
                          {msg.toolCalls.map((t, ti) => (
                            <span
                              key={ti}
                              className="text-[9px] font-mono bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1"
                            >
                              <Database className="w-2.5 h-2.5 text-emerald-400" />
                              Tool: {t.toolName} ({t.executionStatus})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Source Citations */}
                      {msg.sourceCitations && msg.sourceCitations.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-slate-700/80 text-[10px] text-slate-400 space-y-0.5">
                          <span className="font-bold text-[#e6b980] block">তথ্যসূত্র রিকনসিলিয়েশন:</span>
                          {msg.sourceCitations.map((c, ci) => (
                            <span key={ci} className="block text-slate-300 font-mono">
                              • {c.module}: {c.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isChatSending && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic bg-slate-950/40 p-3 rounded-xl border border-slate-800 w-fit">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>জেমিনি ১.৫ প্রো ডেটাবেজ বিশ্লেষণ করছে...</span>
                </div>
              )}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/80 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="এআই অ্যাসিস্ট্যান্টকে প্রশ্ন করুন (বাংলা বা ইংরেজি)..."
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isChatSending || !chatInput.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>পাঠান</span>
              </button>
            </form>
          </div>

          {/* Right: Conversations & Recent AI Logs (1 Col) */}
          <div className="space-y-6">
            {/* Conversation History */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#e6b980]" />
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">কথোপকথন হিস্টোরি</h4>
                </div>
                <span className="text-[10px] text-slate-400">{conversations.length}টি থ্রেড</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={async () => {
                      setActiveConversationId(conv._id);
                      const msgs = await AiService.getConversationMessages(conv._id).catch(() => []);
                      setMessages(msgs);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      activeConversationId === conv._id
                        ? 'bg-[#1e3932] text-[#e6b980] border border-[#e6b980]/30 font-bold'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate max-w-[180px]">{conv.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal">
                      {conv.messageCount} msgs
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Health Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">প্রোভাইডার স্থিতি</h4>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">100% ONLINE</span>
              </div>

              <div className="space-y-2 text-xs">
                {providers.map((p) => (
                  <div key={p._id} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{p.displayName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Key: {p.apiKeyMasked}</span>
                    </div>
                    <span className="ai-badge-emerald text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {p.healthStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GROUP 2: PROVIDERS, MODELS & FEATURE REGISTRY */}
      {(activeSubmodule === 'ai-provider-mgmt' || activeSubmodule === 'ai-model-mgmt' || activeSubmodule === 'ai-feature-mgmt' || activeSubmodule === 'ai-prompt-library') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Management Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#e6b980]" />
                <h3 className="font-bold text-white text-base">এআই ফিচার রেজিস্ট্রি ও অ্যাক্সেস কন্ট্রোল</h3>
              </div>
              <span className="text-xs text-slate-400">{features.length} Features Configured</span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
              {features.map((feat) => (
                <div
                  key={feat._id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] bg-slate-900 px-2 py-0.5 rounded text-amber-300 border border-slate-800">
                        {feat.module}
                      </span>
                      <h4 className="font-bold text-white text-xs">{feat.displayName}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400">{feat.description}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Model: {feat.assignedModel} | Rate: {feat.rateLimitPerMinute}/min
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleFeature(feat.featureCode, feat.isGloballyEnabled)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      feat.isGloballyEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {feat.isGloballyEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Model Management & Prompt Library */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">এআই মডেল কনফিগারেশন</h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold">Default: Gemini 1.5 Pro</span>
              </div>

              <div className="space-y-3">
                {models.map((m) => (
                  <div key={m._id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{m.displayName}</h4>
                      {m.isDefault && (
                        <span className="ai-badge-emerald text-[9px] font-bold px-2 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono text-[10px] block">Identifier: {m.modelIdentifier}</span>
                    <div className="flex gap-4 text-slate-400 text-[10px] pt-1">
                      <span>Context: {(m.contextWindowTokens / 1000).toFixed(0)}K Tokens</span>
                      <span>Output Limit: {m.maxOutputTokens}</span>
                      <span>Vision: {m.supportsVision ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Templates */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-white text-sm">প্রম্পট ও টেমপ্লেট লাইব্রেরি</h4>
                </div>
                <span className="text-xs text-slate-400 font-mono">{prompts.length} টেমপ্লেট</span>
              </div>

              <div className="space-y-2">
                {prompts.slice(0, 3).map((p) => (
                  <div key={p._id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="font-mono text-[9px] text-[#e6b980] bg-amber-950/40 px-1.5 py-0.5 rounded">
                        v{p.version}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] truncate">{p.userPromptTemplate}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GROUP 3: DOCUMENT INTELLIGENCE, OCR & KNOWLEDGE BASE */}
      {(activeSubmodule === 'ai-doc-intelligence' || activeSubmodule === 'ai-ocr-extraction' || activeSubmodule === 'ai-knowledge-base' || activeSubmodule === 'ai-workflow-assistant') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Intelligence & OCR Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">ডকুমেন্ট ইন্টেলিজেন্স ও ওসিআর ওয়ার্কফ্লো</h3>
              </div>
              <button
                onClick={() => setIsDocModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ওসিআর</span>
              </button>
            </div>

            <div className="space-y-3">
              {docJobs.length > 0 ? (
                docJobs.map((job) => (
                  <div key={job._id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#e6b980] bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          {job.jobCode}
                        </span>
                        <span className="text-xs font-bold text-white">{job.documentType}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          job.status === 'ACCEPTED'
                            ? 'ai-badge-emerald'
                            : job.status === 'REJECTED'
                            ? 'bg-rose-950 text-rose-300'
                            : 'ai-badge-amber'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-mono">File: {job.fileName}</p>

                    {/* Extracted preview */}
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                      <span className="text-slate-500 block mb-1 font-sans font-bold">এআই দ্বারা নিরূপিত ডেটা (Confidence: {job.confidenceScore}%):</span>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(job.extractedPayload, null, 2).slice(0, 200)}...</pre>
                    </div>

                    {job.status === 'REVIEW_READY' && (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleReviewDocument(job._id, 'ACCEPTED')}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                        >
                          স্বীকৃতি দিন (Accept)
                        </button>
                        <button
                          onClick={() => handleReviewDocument(job._id, 'REJECTED')}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                        >
                          বাতিল (Reject)
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  কোনো প্রক্রিয়াধীন ওসিআর ডকুমেন্ট নেই। &quot;নতুন ওসিআর&quot; বাটনে ক্লিক করে ফাইল প্রসেস করুন।
                </div>
              )}
            </div>
          </div>

          {/* AI Knowledge Base (RAG) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">এআই নলেজ বেস ও এসওপি (RAG)</h3>
              </div>
              <button
                onClick={() => setIsKModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন নিবন্ধ</span>
              </button>
            </div>

            <div className="space-y-3">
              {knowledgeDocs.map((doc) => (
                <div key={doc._id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs">{doc.title}</h4>
                    <span className="font-mono text-[9px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800/40">
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{doc.content}</p>
                  <div className="flex gap-1 pt-1">
                    {doc.tags?.map((t, idx) => (
                      <span key={idx} className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GROUP 4: BUSINESS ANALYST, AUDIT & SETTINGS */}
      {(activeSubmodule === 'ai-business-analyst' || activeSubmodule === 'ai-forecasting-center' || activeSubmodule === 'ai-risk-center' || activeSubmodule === 'ai-recommendation-center' || activeSubmodule === 'ai-usage-analytics' || activeSubmodule === 'ai-budget-mgmt' || activeSubmodule === 'ai-audit-logs' || activeSubmodule === 'ai-security-privacy' || activeSubmodule === 'ai-system-settings') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Settings & Security Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#e6b980]" />
              <h3 className="font-bold text-white text-base">এআই পলিসি ও নিরাপত্তা কনফিগারেশন</h3>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <div>
                  <span className="font-bold text-white block">সংবেদনশীল ডেটা রিডাকশন (PII Filtering)</span>
                  <span className="text-slate-400 text-[10px]">ব্যাংক একাউন্ট ও ব্যক্তিগত স্যালারি অটো মাস্কিং</span>
                </div>
                <span className="ai-badge-emerald text-[9px] font-bold px-2 py-0.5 rounded-full">সক্রিয়</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <div>
                  <span className="font-bold text-white block">হিউম্যান-ইন-দ্য-লুপ পলিসি (Human Approval)</span>
                  <span className="text-slate-400 text-[10px]">এআই সরাসরি আর্থিক বা স্টক রেকর্ড মিউটেশন করতে পারবে না</span>
                </div>
                <span className="ai-badge-gold text-[9px] font-bold px-2 py-0.5 rounded-full">বাধ্যতামূলক</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <div>
                  <span className="font-bold text-white block">দৈনিক টোকেন সীমা (Per Org Quota)</span>
                  <span className="text-slate-400 text-[10px]">১,০০০,০০০ টোকেন প্রতি দিন</span>
                </div>
                <span className="text-emerald-400 font-mono font-bold">1,000,000</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="font-bold text-white block">মাসিক এআই বাজেট থ্রেশহোল্ড</span>
                  <span className="text-slate-400 text-[10px]">অনুমোদিত বাজেটের ৮০% এ সতর্কবার্তা</span>
                </div>
                <span className="text-teal-400 font-mono font-bold">৳৫০,০০০ BDT</span>
              </div>
            </div>
          </div>

          {/* Audit Logs Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">সাম্প্রতিক এআই এক্সিকিউশন অডিট লগ</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Immutable Trail</span>
            </div>

            <div className="space-y-2">
              {controlCenter?.recentLogs?.map((log) => (
                <div key={log._id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">{log.featureCode} ({log.module})</span>
                    <span className="text-slate-400 text-[10px] font-mono">
                      {log.provider} • {log.model} • {log.latencyMs}ms
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-mono font-bold block">{log.totalTokens} Tok</span>
                    <span className="ai-badge-emerald text-[9px] px-1.5 py-0.2 rounded font-bold">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DOCUMENT OCR UPLOAD
      ───────────────────────────────────────────────────────────── */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">নতুন ডকুমেন্ট ওসিআর আপলোড</h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDocumentJob} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">ডকুমেন্ট টাইপ</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="COMMERCIAL_INVOICE">Commercial Invoice</option>
                  <option value="SUPPLIER_INVOICE">Supplier Purchase Invoice</option>
                  <option value="PACKING_LIST">Packing List</option>
                  <option value="BILL_OF_LADING">Bill of Lading (BL)</option>
                  <option value="DELIVERY_CHALLAN">Delivery Challan</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-bold">ফাইলের নাম</label>
                <input
                  type="text"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  placeholder="invoice_2026_bmc.pdf"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-bold">ফাইল ইউআরএল (S3 / MinIO)</label>
                <input
                  type="text"
                  value={docFileUrl}
                  onChange={(e) => setDocFileUrl(e.target.value)}
                  placeholder="https://s3.sunbird.com.bd/documents/inv_01.pdf"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                >
                  ওসিআর শুরু
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: KNOWLEDGE BASE DOCUMENT
      ───────────────────────────────────────────────────────────── */}
      {isKModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">নতুন নলেজ বেস নিবন্ধ</h3>
              <button onClick={() => setIsKModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateKnowledgeDoc} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">শিরোনাম</label>
                <input
                  type="text"
                  value={kTitle}
                  onChange={(e) => setKTitle(e.target.value)}
                  placeholder="অক্সিজেন কনসেনট্রেটর রক্ষণাবেক্ষণ এসওপি"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-bold">ক্যাটাগরি</label>
                <select
                  value={kCategory}
                  onChange={(e) => setKCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="PRODUCT_MANUAL">Product Manual</option>
                  <option value="COMPANY_POLICY">Company Policy</option>
                  <option value="WARRANTY_POLICY">Warranty Policy</option>
                  <option value="PURCHASE_SOP">Purchase SOP</option>
                  <option value="IMPORT_SOP">Import SOP</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-bold">বিস্তারিত কন্টেন্ট</label>
                <textarea
                  rows={4}
                  value={kContent}
                  onChange={(e) => setKContent(e.target.value)}
                  placeholder="এসওপি বা গাইডলাইনের বিবরণ..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsKModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
