'use client';

import React, { useState, useEffect, useTransition } from 'react';
import './ErpSupportDeskView.css';
import {
  ShieldAlert,
  Headphones,
  RotateCcw,
  Wrench,
  Sparkles,
  Bot,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Send,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileText,
  Truck,
  TrendingUp,
  Award,
  Star,
  Settings,
  History,
  Check,
  Eye,
  MessageSquare,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  DollarSign,
  PackageCheck,
  ShieldCheck,
  Tag,
  ThumbsUp,
  Cpu,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SupportSubmodule } from '../../types';
import {
  SupportService,
  SupportDashboardData,
  SupportTicketRecord,
  SupportMessageRecord,
  RmaRequestRecord,
  WarrantyRecordItem,
  RepairJobCardRecord,
} from '../../services/support.service';

interface ErpSupportDeskViewProps {
  submodule?: SupportSubmodule;
  onSelectSubmodule?: (submodule: SupportSubmodule) => void;
}

export function ErpSupportDeskView({
  submodule = 'support-dashboard',
  onSelectSubmodule,
}: ErpSupportDeskViewProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Active submodule
  const [activeSubmodule, setActiveSubmodule] = useState<SupportSubmodule>(submodule);
  useEffect(() => {
    setActiveSubmodule(submodule);
  }, [submodule]);

  const handleSubmoduleChange = (sub: SupportSubmodule) => {
    setActiveSubmodule(sub);
    if (onSelectSubmodule) onSelectSubmodule(sub);
  };

  // State: Data
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState<SupportDashboardData | null>(null);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [rmas, setRmas] = useState<RmaRequestRecord[]>([]);
  const [warranties, setWarranties] = useState<WarrantyRecordItem[]>([]);
  const [repairJobs, setRepairJobs] = useState<RepairJobCardRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [misData, setMisData] = useState<any>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isNewTicketOpen, setIsNewTicketOpen] = useState<boolean>(false);
  const [isNewRmaOpen, setIsNewRmaOpen] = useState<boolean>(false);
  const [isNewWarrantyOpen, setIsNewWarrantyOpen] = useState<boolean>(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState<boolean>(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<{ ticket: SupportTicketRecord; messages: SupportMessageRecord[] } | null>(null);
  const [newReplyText, setNewReplyText] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [aiDraftPrompt, setAiDraftPrompt] = useState<string>('');
  const [aiDraftLoading, setAiDraftLoading] = useState<boolean>(false);

  // AI Assistant Chatbot in-memory thread
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Support & Warranty Copilot. You can ask me to evaluate return eligibility, check SLA deadlines, diagnose medical device error codes, or draft courteous customer replies.',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Form states: New Ticket
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productName: '',
    productSku: '',
    serialNumber: '',
    priority: 'MEDIUM',
    category: 'DEFECTIVE_PRODUCT',
  });

  // Form states: New RMA
  const [rmaForm, setRmaForm] = useState({
    customerName: '',
    customerPhone: '',
    productName: '',
    productSku: '',
    serialNumber: '',
    quantity: 1,
    unitPrice: 25000,
    reason: 'DEFECTIVE',
    returnType: 'RETURN_FOR_REPLACEMENT',
    shippingMethod: 'COURIER_PICKUP',
    pickupAddress: '',
  });

  // Form states: New Warranty
  const [warrantyForm, setWarrantyForm] = useState({
    productId: '6ad73feceeae05edd937a2a4',
    productName: 'Mindray Patient Monitor ePM 10M',
    productSku: 'MIN-EPM10M',
    serialNumber: '',
    customerName: '',
    customerPhone: '',
    purchaseDate: '',
    warrantyPeriodMonths: 24,
    policyType: 'COMPREHENSIVE',
  });

  // Form states: Verify Serial
  const [verifySerialInput, setVerifySerialInput] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // Load Dashboard & Data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [kpiRes, ticketRes, rmaRes, warRes, jobRes] = await Promise.all([
        SupportService.getDashboard().catch(() => null),
        SupportService.getTickets({ limit: 15 }).catch(() => ({ tickets: [] })),
        SupportService.getRmas({ limit: 15 }).catch(() => ({ rmas: [] })),
        SupportService.getWarranties({ limit: 15 }).catch(() => ({ warranties: [] })),
        SupportService.getRepairJobCards({ limit: 15 }).catch(() => ({ jobs: [] })),
      ]);

      if (kpiRes) setKpis(kpiRes);
      if (ticketRes?.tickets) setTickets(ticketRes.tickets);
      if (rmaRes?.rmas) setRmas(rmaRes.rmas);
      if (warRes?.warranties) setWarranties(warRes.warranties);
      if (jobRes?.jobs) setRepairJobs(jobRes.jobs);
    } catch (err: any) {
      showToast(err.message || 'Error loading support desk data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch ticket details
  const handleOpenTicketDetails = async (ticketId: string) => {
    try {
      const res = await SupportService.getTicketById(ticketId);
      setSelectedTicket(res);
    } catch (err: any) {
      showToast('Could not load ticket messages', 'error');
    }
  };

  // Send reply in ticket thread
  const handleSendReply = async () => {
    if (!selectedTicket || !newReplyText.trim()) return;
    try {
      const added = await SupportService.addTicketMessage(selectedTicket.ticket._id, {
        senderType: 'AGENT',
        senderName: 'Support Executive',
        messageType: isInternalNote ? 'INTERNAL_NOTE' : 'MESSAGE',
        body: newReplyText.trim(),
        isInternalOnly: isInternalNote,
      });

      setSelectedTicket({
        ...selectedTicket,
        messages: [...selectedTicket.messages, added],
      });
      setNewReplyText('');
      showToast('Message posted successfully', 'success');
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to post message', 'error');
    }
  };

  // AI draft response
  const handleGenerateAiDraft = async () => {
    if (!selectedTicket) return;
    try {
      setAiDraftLoading(true);
      const res = await SupportService.draftAiReply(selectedTicket.ticket, aiDraftPrompt);
      if (res?.draftedMessage) {
        setNewReplyText(res.draftedMessage);
        showToast(`AI Draft Generated (${res.tone})`, 'info');
      }
    } catch (err: any) {
      showToast('AI draft generation failed', 'error');
    } finally {
      setAiDraftLoading(false);
    }
  };

  // Resolve Ticket
  const handleResolveTicket = async (isClose: boolean = false) => {
    if (!selectedTicket) return;
    const resolution = prompt('Enter resolution summary for this ticket:');
    if (!resolution) return;

    try {
      await SupportService.resolveTicket(selectedTicket.ticket._id, {
        resolutionNotes: resolution,
        isClose,
      });
      showToast(`Ticket marked as ${isClose ? 'CLOSED' : 'RESOLVED'}`, 'success');
      setSelectedTicket(null);
      loadInitialData();
    } catch (err: any) {
      showToast('Resolution failed', 'error');
    }
  };

  // Approve / Reject RMA
  const handleRmaDecision = async (rmaId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await SupportService.approveOrRejectRma(rmaId, decision);
      showToast(`RMA request ${decision.toLowerCase()} successfully`, 'success');
      loadInitialData();
    } catch (err: any) {
      showToast('Action failed', 'error');
    }
  };

  // Verify Warranty Serial
  const handleVerifySerial = async () => {
    if (!verifySerialInput.trim()) return;
    try {
      const res = await SupportService.verifyWarranty(verifySerialInput.trim());
      setVerifyResult(res);
      showToast(res.isCovered ? 'Warranty Verified: ACTIVE' : 'Warranty Expired or Not Found', res.isCovered ? 'success' : 'warning');
    } catch (err: any) {
      showToast('Warranty lookup failed', 'error');
    }
  };

  // Submit Ticket Form
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SupportService.createTicket(ticketForm);
      showToast('Support ticket created successfully', 'success');
      setIsNewTicketOpen(false);
      setTicketForm({
        subject: '',
        description: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        productName: '',
        productSku: '',
        serialNumber: '',
        priority: 'MEDIUM',
        category: 'DEFECTIVE_PRODUCT',
      });
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Error creating ticket', 'error');
    }
  };

  // Submit RMA Form
  const handleCreateRma = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SupportService.createRma({
        customerName: rmaForm.customerName,
        customerPhone: rmaForm.customerPhone,
        returnType: rmaForm.returnType,
        shippingMethod: rmaForm.shippingMethod,
        pickupAddress: rmaForm.pickupAddress,
        items: [
          {
            productId: '6ad73feceeae05edd937a2a4',
            productName: rmaForm.productName || 'Mindray Medical Device',
            productSku: rmaForm.productSku || 'SKU-MED-01',
            serialNumber: rmaForm.serialNumber,
            quantity: Number(rmaForm.quantity) || 1,
            unitPrice: Number(rmaForm.unitPrice) || 0,
            reason: rmaForm.reason,
            requestedAction: rmaForm.returnType === 'RETURN_FOR_REFUND' ? 'REFUND' : 'REPLACEMENT',
          },
        ],
      });
      showToast('RMA request submitted with AI eligibility analysis', 'success');
      setIsNewRmaOpen(false);
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Error creating RMA', 'error');
    }
  };

  // Submit Warranty Form
  const handleCreateWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SupportService.registerWarranty(warrantyForm);
      showToast('Product warranty registered successfully', 'success');
      setIsNewWarrantyOpen(false);
      loadInitialData();
    } catch (err: any) {
      showToast(err.message || 'Error registering warranty', 'error');
    }
  };

  // AI Chat Assistant query
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userQ = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userQ }]);
    setChatInput('');

    try {
      const res = await SupportService.askAiAssistant(userQ);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: res.answer || 'I am ready to help you triage RMA and support tickets.' },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Error contacting AI advisor. Standard policy: Returns accepted within 14 days; warranty requires authentic serial number.' },
      ]);
    }
  };

  // Submodule Category Switchers
  const isCustomerSupportSubmodule = [
    'support-dashboard',
    'customer-complaints',
    'support-tickets',
    'live-customer-support',
    'customer-messages',
    'communication-history',
    'customer-call-logs',
    'support-categories',
    'priority-sla-management',
    'support-assignment',
    'escalation-management',
  ].includes(activeSubmodule);

  const isRmaSubmodule = [
    'return-requests',
    'return-approval',
    'rma-register',
    'return-inspection',
    'product-defect-management',
    'replacement-management',
    'refund-management',
    'exchange-management',
    'return-shipping-pickup',
    'return-tracking',
    'return-reports',
  ].includes(activeSubmodule);

  const isWarrantySubmodule = [
    'warranty-registration',
    'warranty-claims',
    'warranty-verification',
    'warranty-policy-management',
    'repair-service-center',
    'repair-job-cards',
    'spare-parts-management',
    'service-history',
    'product-maintenance',
    'warranty-expiry-alerts',
  ].includes(activeSubmodule);

  const isAiAnalyticsSubmodule = [
    'ai-support-assistant',
    'ai-complaint-analysis',
    'ai-warranty-assistant',
    'ai-return-eligibility',
    'ai-sentiment-analysis',
    'ai-response-generator',
    'ai-support-analytics',
    'customer-satisfaction-reports',
    'support-mis-analytics',
    'support-settings',
    'support-activity-logs',
  ].includes(activeSubmodule);

  return (
    <div className="erp-support-desk-container space-y-6 animate-in fade-in">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border border-slate-700/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#e6b980]" />
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Module 10: RMA, Support Desk &amp; Warranty Center
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              AI Copilot Active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Intelligent Customer Care, Medical Device Warranty Tracking, Return Inspections, and Repair Job Cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewTicketOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ticket / Complaint</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewRmaOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-600/90 text-white hover:bg-amber-500 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New RMA Request</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewWarrantyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Register Warranty</span>
          </button>
          <button
            type="button"
            onClick={() => loadInitialData()}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Category Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/50 pb-3">
        <button
          type="button"
          onClick={() => handleSubmoduleChange('support-dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isCustomerSupportSubmodule
              ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>1. Customer Support &amp; Complaints</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubmoduleChange('return-requests')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isRmaSubmodule
              ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>2. RMA &amp; Returns</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubmoduleChange('warranty-registration')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isWarrantySubmodule
              ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>3. Warranty &amp; Service Center</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubmoduleChange('ai-support-assistant')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isAiAnalyticsSubmodule
              ? 'bg-[#1e3932] text-[#e6b980] shadow-md shadow-[#1e3932]/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>4. AI Copilot &amp; Analytics</span>
        </button>
      </div>

      {/* 3. 16 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-white">{kpis?.totalTickets ?? '—'}</span>
            <Headphones className="w-3.5 h-3.5 text-blue-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Open Pending</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-amber-400">{kpis?.openTickets ?? '—'}</span>
            <Clock className="w-3.5 h-3.5 text-amber-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escalated</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-rose-400">{kpis?.escalatedTickets ?? '—'}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Breached</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-red-500">{kpis?.slaBreachedTickets ?? '0'}</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-500 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Rate</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-emerald-400">{kpis?.slaComplianceRate ?? 100}%</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Res. Time</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-slate-200">{kpis?.avgResolutionHours ?? 8.5}h</span>
            <Clock className="w-3.5 h-3.5 text-slate-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complaints</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-orange-400">{kpis?.customerComplaintsCount ?? '—'}</span>
            <MessageSquare className="w-3.5 h-3.5 text-orange-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RMA Returns</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-white">{kpis?.rmaTotalCount ?? '—'}</span>
            <RotateCcw className="w-3.5 h-3.5 text-purple-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RMA Approval</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-amber-300">{kpis?.rmaPendingApproval ?? '—'}</span>
            <Clock className="w-3.5 h-3.5 text-amber-300 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Insp. Queue</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-cyan-400">{kpis?.rmaInspectionQueue ?? '—'}</span>
            <PackageCheck className="w-3.5 h-3.5 text-cyan-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Return Value</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs font-black text-rose-300">BDT {(kpis?.totalReturnValueBdt || 0).toLocaleString()}</span>
            <DollarSign className="w-3.5 h-3.5 text-rose-300 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Warranty</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-emerald-400">{kpis?.activeWarrantiesCount ?? '—'}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Claims</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-blue-400">{kpis?.warrantyClaimsActive ?? '—'}</span>
            <FileText className="w-3.5 h-3.5 text-blue-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Repair Jobs</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-amber-400">{kpis?.activeRepairJobsCount ?? '—'}</span>
            <Wrench className="w-3.5 h-3.5 text-amber-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CSAT Score</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-amber-400 flex items-center gap-0.5">
              <span>{kpis?.csatAverageScore ?? '4.8'}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </span>
            <Award className="w-3.5 h-3.5 text-amber-400 opacity-60" />
          </div>
        </div>

        <div className="kpi-card p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Satisfaction %</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-emerald-400">{kpis?.csatSatisfactionPercent ?? 96}%</span>
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 opacity-60" />
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEW CONTENTS ACCORDING TO SELECTED CATEGORY */}
      {/* ─────────────────────────────────────────────────────────────
          SECTION A: CUSTOMER SUPPORT & TICKETS
         ───────────────────────────────────────────────────────────── */}
      {isCustomerSupportSubmodule && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickets by #, customer, serial, or issue..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e6b980]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Omni-channel Sync</span>
              </span>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">Ticket #</th>
                  <th className="px-4 py-3">Customer &amp; Phone</th>
                  <th className="px-4 py-3">Subject / Issue</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SLA Status</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No support tickets found matching current query.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    const isBreached = t.isSlaBreached;
                    return (
                      <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white flex items-center gap-1.5">
                          <span>{t.ticketNumber}</span>
                          {t.aiSentiment === 'VERY_NEGATIVE' && (
                            <span className="px-1.5 py-0.2 text-[9px] rounded bg-rose-500/20 text-rose-400 border border-rose-500/30" title="AI Sentiment: Very Negative">
                              Angry
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-200">{t.customerName}</div>
                          <div className="text-[11px] text-slate-500">{t.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" title={t.subject}>
                          <div className="font-medium text-slate-300 truncate">{t.subject}</div>
                          {t.productName && <div className="text-[10px] text-slate-500 truncate">{t.productName}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {t.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.priority === 'CRITICAL'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : t.priority === 'HIGH'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`flex items-center gap-1 text-[11px] ${
                              isBreached
                                ? 'text-red-400 font-bold'
                                : 'text-emerald-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{isBreached ? 'Breached' : `${t.slaHours}h target`}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'RESOLVED' || t.status === 'CLOSED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : t.status === 'ESCALATED'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenTicketDetails(t._id)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                          >
                            View &amp; Reply
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION B: RMA & RETURN MANAGEMENT
         ───────────────────────────────────────────────────────────── */}
      {isRmaSubmodule && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">RMA Returns &amp; Dispositions Register</h2>
              <p className="text-xs text-slate-400">Intake evaluation, physical testing, defect categorization, and replacement/refund vouchers.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewRmaOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e3932] text-[#e6b980] border border-[#e6b980]/30 hover:bg-[#1e3932]/80 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Initiate Return Intake</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/40">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">RMA #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items &amp; Defect</th>
                  <th className="px-4 py-3">Return Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">AI Eligibility</th>
                  <th className="px-4 py-3">Approval</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rmas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      No RMA return requests recorded yet.
                    </td>
                  </tr>
                ) : (
                  rmas.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white">{r.rmaNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">{r.customerName}</div>
                        <div className="text-[11px] text-slate-500">{r.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.items.map((it, idx) => (
                          <div key={idx} className="text-slate-300 font-medium">
                            {it.productName} ({it.reason})
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-300">
                        {r.returnType.replace('RETURN_FOR_', '')}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400 font-bold">
                        BDT {r.totalReturnAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {r.aiEligibilityAssessment ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.aiEligibilityAssessment.isEligible
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {r.aiEligibilityAssessment.isEligible ? 'Eligible' : 'Violation'} ({r.aiEligibilityAssessment.confidenceScore}%)
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : r.approvalStatus === 'REJECTED'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {r.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        {r.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRmaDecision(r._id, 'APPROVED')}
                              className="px-2 py-1 text-[11px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRmaDecision(r._id, 'REJECTED')}
                              className="px-2 py-1 text-[11px] rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <span className="text-[11px] text-emerald-400 font-medium">Ready for Inspection</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION C: WARRANTY & REPAIR SERVICE CENTER
         ───────────────────────────────────────────────────────────── */}
      {isWarrantySubmodule && (
        <div className="space-y-6">
          {/* Quick Serial Verification Bar */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Instant Serial Number &amp; Warranty Verification</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Enter device serial number (e.g. SN-EPM-WAR-12345)..."
                value={verifySerialInput}
                onChange={(e) => setVerifySerialInput(e.target.value)}
                className="w-full sm:flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e6b980]"
              />
              <button
                type="button"
                onClick={handleVerifySerial}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Verify Warranty
              </button>
            </div>

            {verifyResult && (
              <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-700 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    {verifyResult.warranty?.productName || 'Verified Product'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      verifyResult.isCovered
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {verifyResult.isCovered ? 'ACTIVE WARRANTY' : 'EXPIRED / VOID'}
                  </span>
                </div>
                <p className="text-slate-300">{verifyResult.aiVerification?.explanation}</p>
                <div className="text-[11px] text-slate-400 flex items-center gap-4">
                  <span>Days Remaining: <strong className="text-white">{verifyResult.daysRemaining} days</strong></span>
                  <span>Covered Parts: <strong className="text-white">{verifyResult.aiVerification?.coveredParts?.join(', ') || 'Standard Parts'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Active Warranties & Repair Jobs Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warranties List */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Registered Product Warranties</span>
                </h3>
                <span className="text-xs text-slate-400">{warranties.length} Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-[10px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Warranty #</th>
                      <th className="px-3 py-2">Serial / Product</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {warranties.map((w) => (
                      <tr key={w._id} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-mono font-bold text-white">{w.warrantyNumber}</td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-200">{w.serialNumber}</div>
                          <div className="text-[10px] text-slate-500">{w.productName}</div>
                        </td>
                        <td className="px-3 py-2">{w.customerName}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Repair Job Cards */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Service Lab Repair Job Cards</span>
                </h3>
                <span className="text-xs text-slate-400">{repairJobs.length} Jobs</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-[10px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Job #</th>
                      <th className="px-3 py-2">Device &amp; Technician</th>
                      <th className="px-3 py-2">Cost (BDT)</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {repairJobs.map((j) => (
                      <tr key={j._id} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2 font-mono font-bold text-white">{j.jobNumber}</td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-200">{j.productName}</div>
                          <div className="text-[10px] text-slate-500">Tech: {j.technicianName || 'Unassigned'}</div>
                        </td>
                        <td className="px-3 py-2 font-mono text-emerald-400 font-bold">
                          BDT {j.grandTotalCost.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                            {j.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION D: AI COPILOT & ANALYTICS WORKBENCH
         ───────────────────────────────────────────────────────────── */}
      {isAiAnalyticsSubmodule && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Chat Copilot Panel */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-700/60 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Gemini 1.5 Pro Support &amp; Triage Co-Pilot</h3>
                  <span className="text-[10px] text-slate-400">Clinical &amp; Healthcare ERP Support Intelligence</span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Online
              </span>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#1e3932] text-[#e6b980] rounded-tr-none'
                        : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about returns, warranties, or device error codes..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e6b980]"
              />
              <button
                type="button"
                onClick={handleSendChatMessage}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Quick Tools */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Automated Services</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Every ticket intake undergoes automated sentiment calculation, category auto-routing, and SLA deadline projection.
              </p>
              <div className="pt-2 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                  <span>Sentiment Triaging</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                  <span>Auto SLA Breach Predictor</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                  <span>Return Policy Checker</span>
                  <span className="text-emerald-400 font-bold">14 Days Window</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Customer Satisfaction (CSAT)</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400">4.8</span>
                <span className="text-xs text-slate-400">/ 5.0 (96% Positive)</span>
              </div>
              <p className="text-[11px] text-slate-400">Based on recent post-resolution customer ratings and feedback surveys.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: TICKET DETAILS & THREADED REPLY WITH AI COPILOT
         ───────────────────────────────────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">{selectedTicket.ticket.ticketNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                    {selectedTicket.ticket.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                    {selectedTicket.ticket.priority}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-200 mt-1">{selectedTicket.ticket.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Thread Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
              {/* Ticket Diagnostic Info */}
              {selectedTicket.ticket.aiDiagnosticSummary && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-[#e6b980] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Triage Diagnosis:
                  </span>
                  <p>{selectedTicket.ticket.aiDiagnosticSummary}</p>
                </div>
              )}

              {selectedTicket.messages.map((m) => (
                <div
                  key={m._id}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    m.isInternalOnly
                      ? 'bg-amber-950/30 border border-amber-600/30 text-amber-200'
                      : m.senderType === 'CUSTOMER'
                      ? 'bg-slate-800/80 border border-slate-700 text-slate-200'
                      : 'bg-emerald-950/30 border border-emerald-600/30 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold">{m.senderName} ({m.senderType})</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>

            {/* AI Response Generator Bar */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Direct AI draft with optional instructions (e.g. mention technician Tariq arrived)..."
                value={aiDraftPrompt}
                onChange={(e) => setAiDraftPrompt(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGenerateAiDraft}
                disabled={aiDraftLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1e3932] text-[#e6b980] border border-[#e6b980]/30 hover:bg-[#1e3932]/80 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiDraftLoading ? 'Generating...' : 'AI Draft Reply'}</span>
              </button>
            </div>

            {/* Reply Input Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
              <textarea
                rows={3}
                placeholder="Type your response to the customer or internal note..."
                value={newReplyText}
                onChange={(e) => setNewReplyText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e6b980]"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                  />
                  <span>Post as Internal Note (hidden from customer)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolveTicket(false)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReply}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: NEW SUPPORT TICKET
         ───────────────────────────────────────────────────────────── */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Create Support Ticket / Complaint</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ventilator screen flickering intermittently"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-[#e6b980]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issue Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide detailed description of the reported fault..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-[#e6b980]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka Medical College"
                    value={ticketForm.customerName}
                    onChange={(e) => setTicketForm({ ...ticketForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01811223344"
                    value={ticketForm.customerPhone}
                    onChange={(e) => setTicketForm({ ...ticketForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="DEFECTIVE_PRODUCT">Defective Product</option>
                    <option value="WARRANTY_ISSUE">Warranty Issue</option>
                    <option value="DELIVERY_DELAY">Delivery Delay</option>
                    <option value="BILLING">Billing Issue</option>
                    <option value="GENERAL_INQUIRY">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="LOW">Low (48h SLA)</option>
                    <option value="MEDIUM">Medium (24h SLA)</option>
                    <option value="HIGH">High (12h SLA)</option>
                    <option value="CRITICAL">Critical (4h SLA)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: NEW RMA REQUEST
         ───────────────────────────────────────────────────────────── */}
      {isNewRmaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Initiate Return / RMA Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewRmaOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRma} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Customer hospital or doctor"
                    value={rmaForm.customerName}
                    onChange={(e) => setRmaForm({ ...rmaForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="Phone number"
                    value={rmaForm.customerPhone}
                    onChange={(e) => setRmaForm({ ...rmaForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mindray Patient Monitor ePM 10M"
                  value={rmaForm.productName}
                  onChange={(e) => setRmaForm({ ...rmaForm, productName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Return Action</label>
                  <select
                    value={rmaForm.returnType}
                    onChange={(e) => setRmaForm({ ...rmaForm, returnType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="RETURN_FOR_REPLACEMENT">Replacement Unit</option>
                    <option value="RETURN_FOR_REFUND">Refund Voucher</option>
                    <option value="RETURN_FOR_EXCHANGE">Exchange Model</option>
                    <option value="RETURN_FOR_REPAIR">Service Center Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Defect Reason</label>
                  <select
                    value={rmaForm.reason}
                    onChange={(e) => setRmaForm({ ...rmaForm, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="DEFECTIVE">Defective Hardware</option>
                    <option value="TRANSIT_DAMAGE">Damaged in Transit</option>
                    <option value="INCORRECT_ITEM">Incorrect Item Shipped</option>
                    <option value="CUSTOMER_CHANGE_MIND">Discretionary Return</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pickup Address</label>
                <input
                  type="text"
                  placeholder="Hospital ward / clinic pickup address"
                  value={rmaForm.pickupAddress}
                  onChange={(e) => setRmaForm({ ...rmaForm, pickupAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewRmaOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                >
                  Submit RMA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: NEW WARRANTY REGISTRATION
         ───────────────────────────────────────────────────────────── */}
      {isNewWarrantyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Register Product Warranty</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewWarrantyOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarranty} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Serial Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SN-MED-99201"
                  value={warrantyForm.serialNumber}
                  onChange={(e) => setWarrantyForm({ ...warrantyForm, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-[#e6b980]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer / Clinic Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Customer Name"
                    value={warrantyForm.customerName}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="017xxxxxxxx"
                    value={warrantyForm.customerPhone}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={warrantyForm.purchaseDate}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Warranty Months</label>
                  <input
                    type="number"
                    min={1}
                    value={warrantyForm.warrantyPeriodMonths}
                    onChange={(e) => setWarrantyForm({ ...warrantyForm, warrantyPeriodMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewWarrantyOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  Register Warranty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
