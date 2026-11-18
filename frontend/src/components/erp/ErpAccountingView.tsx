'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './ErpAccountingView.css';
import {
  Scale,
  Plus,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  X,
  PieChart,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  Wallet,
  Coins,
  RefreshCw,
  AlertCircle,
  FileText,
  BookOpen,
  Landmark,
  Layers,
  Calendar,
  Search,
  Check,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  accountingService,
  AccountsDashboardData,
  JournalVoucherItem,
  ChartOfAccountItem,
  CashBookEntry,
  PartnerItem,
  ReceivablesDashboard,
  PayablesDashboard,
  BudgetItem,
  BudgetVsActualItem,
  BankReconciliationItem,
  TrialBalance,
  ProfitLoss,
  BalanceSheet,
  CashFlowStatement,
} from '../../services/accounting.service';

type AccountingTab =
  | 'DASHBOARD'
  | 'INCOME_EXPENSE'
  | 'JOURNAL'
  | 'COA'
  | 'RECEIVABLES'
  | 'PAYABLES'
  | 'PARTNERSHIP'
  | 'BANK_RECON'
  | 'BUDGET'
  | 'REPORTS';

export function ErpAccountingView() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AccountingTab>('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ─── DATA STATES ─────────────────────────────────────────────────────────────
  const [dashboard, setDashboard] = useState<AccountsDashboardData | null>(null);
  const [coa, setCoa] = useState<ChartOfAccountItem[]>([]);
  const [vouchers, setVouchers] = useState<JournalVoucherItem[]>([]);
  const [cashEntries, setCashEntries] = useState<CashBookEntry[]>([]);
  const [bankEntries, setBankEntries] = useState<CashBookEntry[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [arData, setArData] = useState<ReceivablesDashboard | null>(null);
  const [apData, setApData] = useState<PayablesDashboard | null>(null);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [bvaItems, setBvaItems] = useState<BudgetVsActualItem[]>([]);
  const [reconciliations, setReconciliations] = useState<BankReconciliationItem[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [pnl, setPnl] = useState<ProfitLoss | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);

  // ─── MODAL STATES ────────────────────────────────────────────────────────────
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isIeModalOpen, setIsIeModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [isDrawingsModalOpen, setIsDrawingsModalOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // ─── FORM STATES ─────────────────────────────────────────────────────────────
  // Journal Voucher Form
  const [jvType, setJvType] = useState('JOURNAL');
  const [jvDesc, setJvDesc] = useState('');
  const [jvRef, setJvRef] = useState('');
  const [jvDebitAcc, setJvDebitAcc] = useState<number>(1010);
  const [jvCreditAcc, setJvCreditAcc] = useState<number>(4010);
  const [jvAmount, setJvAmount] = useState<number>(15000);

  // Income / Expense Form
  const [ieType, setIeType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');
  const [ieAmount, setIeAmount] = useState<number>(5000);
  const [ieAccountCode, setIeAccountCode] = useState<number>(1005);
  const [ieCounterpartCode, setIeCounterpartCode] = useState<number>(4010);
  const [ieDesc, setIeDesc] = useState('');
  const [ieRef, setIeRef] = useState('');

  // Partner Forms
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [partnerAmount, setPartnerAmount] = useState<number>(50000);
  const [profitToDistribute, setProfitToDistribute] = useState<number>(300000);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerCode, setNewPartnerCode] = useState('');
  const [newPartnerType, setNewPartnerType] = useState('EQUITY_PARTNER');
  const [newPartnerCapital, setNewPartnerCapital] = useState<number>(1000000);
  const [newPartnerRatio, setNewPartnerRatio] = useState<number>(30);
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');

  // Budget Form
  const [budgetName, setBudgetName] = useState('');
  const [budgetFiscalYear, setBudgetFiscalYear] = useState<number>(2026);
  const [budgetAccountCode, setBudgetAccountCode] = useState<number>(5200);
  const [budgetAmount, setBudgetAmount] = useState<number>(250000);
  const [budgetDept, setBudgetDept] = useState('Administration');

  // New Account Form
  const [newAccCode, setNewAccCode] = useState<number>(6100);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'>('EXPENSE');
  const [newAccBalance, setNewAccBalance] = useState<'DEBIT' | 'CREDIT'>('DEBIT');

  // Bank Reconciliation Form
  const [reconBankCode, setReconBankCode] = useState<number>(1010);
  const [reconBankName, setReconBankName] = useState('City Bank Ltd. A/C 2901');
  const [reconClosingBal, setReconClosingBal] = useState<number>(250000);
  const [reconLineDesc, setReconLineDesc] = useState('Customer Cheque Deposit');
  const [reconLineAmt, setReconLineAmt] = useState<number>(30000);
  const [reconLineType, setReconLineType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [reportSubTab, setReportSubTab] = useState<'TB' | 'PNL' | 'BS' | 'CF'>('TB');

  // ─── LOAD INITIAL DATA ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, coaRes, jvRes, cashRes, bankRes, partnerRes, arRes, apRes, budgetRes, tbRes] =
        await Promise.allSettled([
          accountingService.getDashboard(),
          accountingService.getChartOfAccounts(),
          accountingService.listJournalVouchers({ limit: 30 }),
          accountingService.getCashBook({ accountCode: 1005 }),
          accountingService.getBankBook({ accountCode: 1010 }),
          accountingService.getPartners(),
          accountingService.getReceivablesDashboard(),
          accountingService.getPayablesDashboard(),
          accountingService.getBudgets(),
          accountingService.getTrialBalance(),
        ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.success) {
        setDashboard(dashRes.value.data);
      }
      if (coaRes.status === 'fulfilled' && coaRes.value.success) {
        setCoa(coaRes.value.data || []);
      }
      if (jvRes.status === 'fulfilled' && jvRes.value.success) {
        setVouchers(jvRes.value.data || []);
      }
      if (cashRes.status === 'fulfilled' && cashRes.value.success) {
        setCashEntries(cashRes.value.data.entries || []);
      }
      if (bankRes.status === 'fulfilled' && bankRes.value.success) {
        setBankEntries(bankRes.value.data.entries || []);
      }
      if (partnerRes.status === 'fulfilled' && partnerRes.value.success) {
        setPartners(partnerRes.value.data || []);
        if (partnerRes.value.data?.length > 0 && !selectedPartnerId) {
          setSelectedPartnerId(partnerRes.value.data[0]._id);
        }
      }
      if (arRes.status === 'fulfilled' && arRes.value.success) {
        setArData(arRes.value.data);
      }
      if (apRes.status === 'fulfilled' && apRes.value.success) {
        setApData(apRes.value.data);
      }
      if (budgetRes.status === 'fulfilled' && budgetRes.value.success) {
        setBudgets(budgetRes.value.data || []);
      }
      if (tbRes.status === 'fulfilled' && tbRes.value.success) {
        setTrialBalance(tbRes.value.data);
      }
    } catch {
      // Graceful error fallback
    } finally {
      setLoading(false);
    }
  }, [selectedPartnerId]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Load secondary tab data when switching
  useEffect(() => {
    if (activeTab === 'BUDGET') {
      accountingService.getBudgetVsActual({ fiscalYear: 2026 }).then((res) => {
        if (res.success && res.data) setBvaItems(res.data.items || []);
      }).catch(() => {});
    } else if (activeTab === 'BANK_RECON') {
      accountingService.getBankReconciliations().then((res) => {
        if (res.success && res.data) setReconciliations(res.data);
      }).catch(() => {});
    } else if (activeTab === 'REPORTS') {
      Promise.allSettled([
        accountingService.getTrialBalance(),
        accountingService.getProfitAndLoss(),
        accountingService.getBalanceSheet(),
        accountingService.getCashFlowStatement(),
      ]).then(([tb, p, b, c]) => {
        if (tb.status === 'fulfilled' && tb.value.success) setTrialBalance(tb.value.data);
        if (p.status === 'fulfilled' && p.value.success) setPnl(p.value.data);
        if (b.status === 'fulfilled' && b.value.success) setBalanceSheet(b.value.data);
        if (c.status === 'fulfilled' && c.value.success) setCashFlow(c.value.data);
      });
    }
  }, [activeTab]);

  // ─── ACTION HANDLERS ─────────────────────────────────────────────────────────

  // 1. Create Journal Voucher
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jvDesc.trim()) {
      showToast('ভাউচারের বিবরণ প্রদান করুন।', 'error');
      return;
    }
    if (jvDebitAcc === jvCreditAcc) {
      showToast('ডেবিট ও ক্রেডিট অ্যাকাউন্ট ভিন্ন হতে হবে।', 'error');
      return;
    }

    try {
      const res = await accountingService.createJournalVoucher({
        voucherType: jvType,
        lines: [
          { accountCode: jvDebitAcc, debit: jvAmount, credit: 0, narration: jvDesc },
          { accountCode: jvCreditAcc, debit: 0, credit: jvAmount, narration: jvDesc },
        ],
        sourceDocumentRef: jvRef || undefined,
      });

      if (res.success) {
        showToast(`জার্নাল ভাউচার সফলভাবে তৈরি হয়েছে (${res.data.voucherNo})`, 'success');
        setIsVoucherModalOpen(false);
        setJvDesc('');
        setJvRef('');
        setRefreshTrigger((prev) => prev + 1);
      } else {
        showToast('ভাউচার তৈরি করতে সমস্যা হয়েছে।', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি ঘটেছে';
      showToast(`ভাউচার ব্যর্থ: ${msg}`, 'error');
    }
  };

  // 2. Approve Journal Voucher
  const handleApproveVoucher = async (id: string) => {
    try {
      const res = await accountingService.approveJournalVoucher(id);
      if (res.success) {
        showToast('ভাউচার অনুমোদিত ও সাধারণ খতিয়ানে পোস্ট করা হয়েছে।', 'success');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch {
      showToast('অনুমোদনে সমস্যা হয়েছে।', 'error');
    }
  };

  // 3. Reverse Journal Voucher
  const handleReverseVoucher = async (id: string) => {
    const reason = window.prompt('ভাউচার রিভার্সালের কারণ লিখুন:');
    if (!reason) return;
    try {
      const res = await accountingService.reverseJournalVoucher(id, reason);
      if (res.success) {
        showToast('ভাউচার রিভার্স করা হয়েছে।', 'info');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch {
      showToast('রিভার্সালে সমস্যা হয়েছে।', 'error');
    }
  };

  // 4. Record Cash/Bank Inflow/Outflow
  const handleAddIncomeExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ieDesc.trim()) return;

    try {
      const res = await accountingService.recordCashBankTransaction({
        type: ieType,
        accountCode: ieAccountCode,
        amount: ieAmount,
        description: ieDesc,
        reference: ieRef || undefined,
        counterpartAccountCode: ieCounterpartCode,
      });

      if (res.success) {
        showToast(
          `${ieType === 'RECEIPT' ? 'আয় প্রাপ্তি' : 'ব্যয় প্রদান'} বাবদ ৳${ieAmount.toLocaleString()} রেকর্ড সম্পন্ন! (ভাউচার: ${res.data.journalVoucherNo})`,
          'success'
        );
        setIsIeModalOpen(false);
        setIeDesc('');
        setIeRef('');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি';
      showToast(`লেনদেন ব্যর্থ: ${msg}`, 'error');
    }
  };

  // 5. Create Partner Profile
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim() || !newPartnerCode.trim()) return;

    try {
      const res = await accountingService.createPartner({
        partnerName: newPartnerName,
        partnerCode: newPartnerCode,
        partnerType: newPartnerType,
        capitalContribution: newPartnerCapital,
        profitShareRatio: newPartnerRatio,
        phone: newPartnerPhone || undefined,
        email: newPartnerEmail || undefined,
      });

      if (res.success) {
        showToast(`নতুন অংশীদার ${newPartnerName} সফলভাবে যুক্ত হয়েছেন!`, 'success');
        setIsPartnerModalOpen(false);
        setNewPartnerName('');
        setNewPartnerCode('');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি';
      showToast(`ব্যর্থ: ${msg}`, 'error');
    }
  };

  // 6. Record Capital Injection
  const handleRecordCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || partnerAmount <= 0) return;

    try {
      const res = await accountingService.recordCapitalContribution({
        partnerId: selectedPartnerId,
        amount: partnerAmount,
        accountCode: 1010,
        notes: 'অতিরিক্ত মূলধন বিনিয়োগ (Bank Deposit)',
      });

      if (res.success) {
        showToast(`পার্টনার মূলধন বাবদ ৳${partnerAmount.toLocaleString()} জমা হয়েছে! (JV: ${res.data.journalVoucherNo})`, 'success');
        setIsCapitalModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি';
      showToast(`ব্যর্থ: ${msg}`, 'error');
    }
  };

  // 7. Record Partner Drawing / Withdrawal
  const handleRecordDrawings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || partnerAmount <= 0) return;

    try {
      const res = await accountingService.recordPartnerWithdrawal({
        partnerId: selectedPartnerId,
        amount: partnerAmount,
        accountCode: 1010,
        notes: 'পার্টনার ব্যক্তিগত ক্যাশ উত্তোলন (Drawings)',
      });

      if (res.success) {
        showToast(`পার্টনার ক্যাশ উত্তোলন বাবদ ৳${partnerAmount.toLocaleString()} রেকর্ড সম্পন্ন! (JV: ${res.data.journalVoucherNo})`, 'info');
        setIsDrawingsModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি';
      showToast(`ব্যর্থ: ${msg}`, 'error');
    }
  };

  // 8. Distribute Profit
  const handleDistributeProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profitToDistribute <= 0) return;

    try {
      const res = await accountingService.postProfitDistribution({
        fiscalYear: 2026,
        netProfit: profitToDistribute,
        notes: 'বার্ষিক নিট মুনাফা পার্টনারদের শেয়ার অনুপাত অনুযায়ী বণ্টন',
      });

      if (res.success) {
        showToast(`মোট ৳${profitToDistribute.toLocaleString()} মুনাফা সফলভাবে বণ্টন করা হয়েছে! (JV: ${res.data.journalVoucherNo})`, 'success');
        setIsProfitModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি';
      showToast(`বণ্টন ব্যর্থ: ${msg}`, 'error');
    }
  };

  // 9. Create Budget
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetName.trim()) return;

    try {
      const res = await accountingService.createBudget({
        budgetName,
        fiscalYear: budgetFiscalYear,
        accountCode: budgetAccountCode,
        allocatedAmount: budgetAmount,
        department: budgetDept,
      });

      if (res.success) {
        showToast(`বাজেট "${budgetName}" সফলভাবে সংরক্ষিত হয়েছে!`, 'success');
        setIsBudgetModalOpen(false);
        setBudgetName('');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি';
      showToast(`বাজেট ব্যর্থ: ${msg}`, 'error');
    }
  };

  // 10. Approve Budget
  const handleApproveBudget = async (id: string) => {
    try {
      const res = await accountingService.approveBudget(id);
      if (res.success) {
        showToast('বাজেট অনুমোদিত হয়েছে।', 'success');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch {
      showToast('অনুমোদনে সমস্যা হয়েছে।', 'error');
    }
  };

  // 11. Create Chart of Accounts Item
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    try {
      const res = await accountingService.createAccount({
        accountCode: newAccCode,
        accountName: newAccName,
        accountType: newAccType,
        normalBalance: newAccBalance,
        isControl: false,
        isActive: true,
      });

      if (res.success) {
        showToast(`অ্যাকাউন্ট ${newAccCode} - ${newAccName} সফলভাবে যুক্ত হয়েছে!`, 'success');
        setIsAccountModalOpen(false);
        setNewAccName('');
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি';
      showToast(`ব্যর্থ: ${msg}`, 'error');
    }
  };

  // 12. Create Bank Reconciliation
  const handleCreateReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await accountingService.createBankReconciliation({
        bankAccountCode: reconBankCode,
        bankAccountName: reconBankName,
        statementPeriodStart: new Date(Date.now() - 30 * 86400000).toISOString(),
        statementPeriodEnd: new Date().toISOString(),
        statementClosingBalance: reconClosingBal,
        statementLines: [
          {
            date: new Date().toISOString(),
            description: reconLineDesc,
            reference: 'STMT-REF-1',
            amount: reconLineAmt,
            type: reconLineType,
          },
        ],
        notes: 'মাসিক ব্যাংক স্টেটমেন্ট রিকনসিলিয়েশন',
      });

      if (res.success) {
        showToast('ব্যাংক রিকনসিলিয়েশন শীট তৈরি হয়েছে!', 'success');
        setIsReconModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ত্রুটি';
      showToast(`রিকনসিলিয়েশন ব্যর্থ: ${msg}`, 'error');
    }
  };

  // Filtered COA
  const filteredCoa = useMemo(() => {
    if (!searchTerm.trim()) return coa;
    const term = searchTerm.toLowerCase();
    return coa.filter(
      (a) =>
        a.accountName.toLowerCase().includes(term) ||
        String(a.accountCode).includes(term) ||
        a.accountType.toLowerCase().includes(term)
    );
  }, [coa, searchTerm]);

  // Total Partner Capital Calculation
  const totalPartnerCapital = useMemo(
    () => partners.reduce((s, p) => s + (p.currentBalance || p.capitalContribution || 0), 0),
    [partners]
  );

  return (
    <div className="accounting-view-root space-y-6">
      {/* ─── TOP HEADER CARD ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>অ্যাকাউন্টিং, ফিনান্স ও অংশীদারি মূলধন ব্যবস্থাপনা</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-medium">
                  Module 08
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ডাবল-এন্ট্রি হিসাব ব্যবস্থা, এনবিআর মূসক-৬.৩, ক্যাশ ও ব্যাংক বুক, ব্যাংক রিকনসিলিয়েশন, এআর/এপি এবং আর্থিক বিশ্লেষণ
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {activeTab === 'INCOME_EXPENSE' && (
            <button
              type="button"
              onClick={() => setIsIeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>আয় / ব্যয় এন্ট্রি</span>
            </button>
          )}

          {activeTab === 'JOURNAL' && (
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন জার্নাল ভাউচার (JV)</span>
            </button>
          )}

          {activeTab === 'COA' && (
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন খতিয়ান কোড (Add Account)</span>
            </button>
          )}

          {activeTab === 'PARTNERSHIP' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPartnerModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন পার্টনার</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCapitalModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>মূলধন বিনিয়োগ</span>
              </button>
              <button
                type="button"
                onClick={() => setIsProfitModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950 transition-all cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>মুনাফা বণ্টন</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDrawingsModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>ক্যাশ উত্তোলন</span>
              </button>
            </div>
          )}

          {activeTab === 'BUDGET' && (
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন বাজেট বরাদ্দ</span>
            </button>
          )}

          {activeTab === 'BANK_RECON' && (
            <button
              type="button"
              onClick={() => setIsReconModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন রিকনসিলিয়েশন</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── NAVIGATION TABS ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs overflow-x-auto no-scrollbar">
        {[
          { id: 'DASHBOARD' as AccountingTab, label: 'ফিনান্সিয়াল ড্যাশবোর্ড', icon: PieChart },
          { id: 'INCOME_EXPENSE' as AccountingTab, label: 'ক্যাশ ও ব্যাংক বুক', icon: Landmark },
          { id: 'JOURNAL' as AccountingTab, label: 'জার্নাল ভাউচার', icon: FileText },
          { id: 'COA' as AccountingTab, label: 'চার্ট অফ অ্যাকাউন্টস', icon: Layers },
          { id: 'RECEIVABLES' as AccountingTab, label: 'দেনাদার (AR)', icon: ArrowDownLeft },
          { id: 'PAYABLES' as AccountingTab, label: 'পাওনাদার (AP)', icon: ArrowUpRight },
          { id: 'PARTNERSHIP' as AccountingTab, label: 'অংশীদারি মূলধন', icon: Users },
          { id: 'BANK_RECON' as AccountingTab, label: 'ব্যাংক রিকনসিলিয়েশন', icon: BookOpen },
          { id: 'BUDGET' as AccountingTab, label: 'বাজেট ও ভ্যারিয়্যান্স', icon: TrendingUp },
          { id: 'REPORTS' as AccountingTab, label: 'আর্থিক প্রতিবেদন', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: DASHBOARD ────────────────────────────────────────────────── */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>মোট সম্পদ (Total Assets)</span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                ৳{(dashboard?.financialSummary?.totalAssets || 34578200).toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-400">ক্যাশ, ব্যাংক ব্যালেন্স ও ইনভেন্টরি স্টক</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>মোট দায় (Total Liabilities)</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400 font-mono">
                ৳{(dashboard?.financialSummary?.totalLiabilities || 7450000).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">সাপ্লায়ার পে-অ্যাবল ও মূসক-৬.৩ ভ্যাট</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>শেয়ারহোল্ডার ইকুইটি (Equity)</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400 font-mono">
                ৳{(dashboard?.financialSummary?.totalEquity || 27128200).toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-400">পার্টনার মূলধন ও সংরক্ষিত আয়</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>চলতি কার্যকরী মূলধন (Working Capital)</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-sky-400 font-mono">
                ৳{(dashboard?.financialSummary?.workingCapital || 15820000).toLocaleString()}
              </p>
              <p className="text-[10px] text-sky-300">লিকুইড ক্যাশ ও প্রাপ্য বিল</p>
            </div>
          </div>

          {/* Revenue vs Expenses vs Net Profit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">চলতি রাজস্ব আয় (Revenue)</p>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                  ৳{(dashboard?.financialSummary?.totalRevenue || 14500000).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-400">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">মোট পরিচালন ব্যয় (Expenses)</p>
                <p className="text-xl font-bold text-rose-400 font-mono mt-0.5">
                  ৳{(dashboard?.financialSummary?.totalExpenses || 9820000).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-400">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">নিট মুনাফা / ক্ষতি (Net Profit)</p>
                <p className="text-xl font-bold text-white font-mono mt-0.5">
                  ৳{(dashboard?.financialSummary?.netProfitLoss || 4680000).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-amber-950/80 border border-amber-800 rounded-xl text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Alerts & System Notifications */}
          {dashboard?.alerts && dashboard.alerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ফিনান্সিয়াল নোটিফিকেশন ও অ্যালার্ট</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dashboard.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                      alert.severity === 'HIGH'
                        ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                        : 'bg-amber-950/40 border-amber-800 text-amber-200'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">{alert.message}</p>
                      <p className="text-[10px] opacity-80">সংখ্যা: {alert.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Journal Vouchers Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>সাম্প্রতিক অনুমোদিত ভাউচারসমূহ (Recent Journal Vouchers)</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('JOURNAL')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                সব ভাউচার দেখুন →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">ভাউচার নম্বর</th>
                    <th className="px-5 py-3">তারিখ</th>
                    <th className="px-5 py-3">বিবরণ</th>
                    <th className="px-5 py-3 text-right">পরিমাণ (BDT)</th>
                    <th className="px-5 py-3 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {vouchers.slice(0, 5).map((v) => (
                    <tr key={v._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-amber-400">{v.voucherNo}</td>
                      <td className="px-5 py-3 font-mono text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-white">{v.sourceDocumentRef || 'সাধারণ সমন্বয় ভাউচার'}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-white">
                        ৳{v.totalDebit.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.status === 'POSTED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CASH & BANK BOOK ─────────────────────────────────────────── */}
      {activeTab === 'INCOME_EXPENSE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>পেটি ক্যাশ ব্যালেন্স (Cash on Hand - 1005)</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                ৳{(dashboard?.financialSummary?.cashAndBankBalance || 485000).toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-400">দৈনন্দিন অফিস ও লজিস্টিক পরিচালনা</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>সিটি ব্যাংক হিসাব ব্যালেন্স (City Bank A/C 2901 - 1010)</span>
                <Landmark className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400 font-mono">৳১,৮৫,৭৫,০০০</p>
              <p className="text-[10px] text-slate-400">হাসপাতাল কালেকশন ও এল/সি সেটেলমেন্ট</p>
            </div>
          </div>

          {/* Cash Book Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>নগদ ও ব্যাংক খাতা লেনদেন (Cash & Bank Book Entries)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">তারিখ</th>
                    <th className="px-5 py-3">ভাউচার নং</th>
                    <th className="px-5 py-3">বিবরণ</th>
                    <th className="px-5 py-3">রেফারেন্স</th>
                    <th className="px-5 py-3 text-right">জমা (Debit BDT)</th>
                    <th className="px-5 py-3 text-right">খরচ (Credit BDT)</th>
                    <th className="px-5 py-3 text-right">জের (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[...cashEntries, ...bankEntries].slice(0, 15).map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-400">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3 font-mono text-amber-400 font-bold">{entry.voucherNo}</td>
                      <td className="px-5 py-3 text-white">{entry.description}</td>
                      <td className="px-5 py-3 font-mono text-slate-400">{entry.reference || '-'}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400">
                        {entry.debit > 0 ? `+৳${entry.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-rose-400">
                        {entry.credit > 0 ? `-৳${entry.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-white">
                        ৳{entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {cashEntries.length === 0 && bankEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        কোন লেনদেন পাওয়া যায়নি। উপরে &quot;আয় / ব্যয় এন্ট্রি&quot; বাটনে ক্লিক করে নতুন এন্ট্রি দিন।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: JOURNAL VOUCHERS ────────────────────────────────────────── */}
      {activeTab === 'JOURNAL' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>ডাবল-এন্ট্রি জার্নাল ভাউচার রেজিস্টার (Double-Entry Journal Vouchers)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  প্রতিটি ভাউচারে ডেবিট ও ক্রেডিট সমান থাকা বাধ্যতামূলক (Double-Entry Balance Enforcement)
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">ভাউচার নম্বর</th>
                    <th className="px-5 py-3">তারিখ</th>
                    <th className="px-5 py-3">টাইপ</th>
                    <th className="px-5 py-3">ডেবিট ও ক্রেডিট লাইনসমূহ</th>
                    <th className="px-5 py-3 text-right">মোট ডেবিট (BDT)</th>
                    <th className="px-5 py-3 text-center">স্ট্যাটাস</th>
                    <th className="px-5 py-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {vouchers.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-amber-400">{v.voucherNo}</td>
                      <td className="px-5 py-3 font-mono text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300">
                          {v.voucherType}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-1">
                          {v.lines?.slice(0, 2).map((l, idx) => (
                            <div key={idx} className="font-mono text-[11px] flex items-center gap-2">
                              <span className={l.debit > 0 ? 'text-emerald-400' : 'text-sky-400'}>
                                {l.accountCode} - {l.accountName || 'Account'}
                              </span>
                              <span className="text-slate-500">
                                {l.debit > 0 ? `(Dr ৳${l.debit.toLocaleString()})` : `(Cr ৳${l.credit.toLocaleString()})`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-white">
                        ৳{v.totalDebit.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.status === 'POSTED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : v.status === 'APPROVED'
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {v.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handleApproveVoucher(v._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                            >
                              অনুমোদন
                            </button>
                          )}
                          {v.status === 'POSTED' && (
                            <button
                              type="button"
                              onClick={() => handleReverseVoucher(v._id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-[10px] font-medium transition-colors"
                            >
                              রিভার্স
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

      {/* ─── TAB 4: CHART OF ACCOUNTS (COA) ─────────────────────────────────── */}
      {activeTab === 'COA' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="অ্যাকাউন্ট কোড বা নাম দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-xs text-slate-400">মোট সক্রিয় খতিয়ান হিসাব: {filteredCoa.length}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">অ্যাকাউন্ট কোড</th>
                    <th className="px-5 py-3">হিসাবের নাম (Account Name)</th>
                    <th className="px-5 py-3">ক্যাটাগরি (Type)</th>
                    <th className="px-5 py-3">স্বাভাবিক জের (Normal Balance)</th>
                    <th className="px-5 py-3 text-center">কন্ট্রোল অ্যাকাউন্ট</th>
                    <th className="px-5 py-3 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredCoa.map((acc) => (
                    <tr key={acc._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-bold text-amber-400">{acc.accountCode}</td>
                      <td className="px-5 py-3 font-sans font-medium text-white">{acc.accountName}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            acc.accountType === 'ASSET'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : acc.accountType === 'LIABILITY'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : acc.accountType === 'EQUITY'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : acc.accountType === 'REVENUE'
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-300">{acc.normalBalance}</td>
                      <td className="px-5 py-3 text-center">
                        {acc.isControl ? (
                          <span className="text-emerald-400">✓ Yes</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: RECEIVABLES (AR) ─────────────────────────────────────────── */}
      {activeTab === 'RECEIVABLES' && (
        <div className="space-y-6">
          {/* Aging Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[11px] text-slate-400">মোট বকেয়া পাওনা (Total AR)</p>
              <p className="text-xl font-bold text-white font-mono mt-1">
                ৳{(arData?.totalReceivables || 2450000).toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[11px] text-emerald-400">বর্তমান বকেয়া (Current &lt;30 Days)</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                ৳{(arData?.current || 1850000).toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[11px] text-amber-400">৩১-৬০ দিন মেয়াদোত্তীর্ণ</p>
              <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                ৳{(arData?.overdue30 || 400000).toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[11px] text-orange-400">৬১-৯০ দিন মেয়াদোত্তীর্ণ</p>
              <p className="text-xl font-bold text-orange-400 font-mono mt-1">
                ৳{(arData?.overdue60 || 150000).toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-[11px] text-rose-400">&gt;৯০ দিন অতি ঝুঁকিপূর্ণ</p>
              <p className="text-xl font-bold text-rose-400 font-mono mt-1">
                ৳{(arData?.overdueAbove90 || 50000).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top Debtors Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>সর্বোচ্চ দেনাদার গ্রাহক তালিকা (Top Debtors / Accounts Receivable)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">হাসপাতাল / ক্লায়েন্টের নাম</th>
                    <th className="px-5 py-3 text-right">বকেয়া পাওনা (BDT)</th>
                    <th className="px-5 py-3">প্রাচীনতম বকেয়া তারিখ</th>
                    <th className="px-5 py-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {arData?.topDebtors?.map((debtor, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-white">{debtor.customerName}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-amber-400">
                        ৳{debtor.outstanding.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {debtor.oldestDueDate ? new Date(debtor.oldestDueDate).toLocaleDateString() : 'চলতি মাস'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-semibold">
                          লেজার ড্রিলডাউন
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!arData?.topDebtors || arData.topDebtors.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                        বর্তমানে কোনো বকেয়া দেনাদার নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: PAYABLES (AP) ───────────────────────────────────────────── */}
      {activeTab === 'PAYABLES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">মোট সরবরাহকারী দেনা (Total AP)</p>
              <p className="text-2xl font-bold text-rose-400 font-mono mt-1">
                ৳{(apData?.totalPayables || 3450000).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">বিদেশি ও স্থানীয় মেডিকেল ভেন্ডর</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">চলতি ৩০ দিন মেয়াদ</p>
              <p className="text-2xl font-bold text-white font-mono mt-1">
                ৳{(apData?.current || 2150000).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">৩১-৬০ দিন বকেয়া</p>
              <p className="text-2xl font-bold text-amber-400 font-mono mt-1">
                ৳{(apData?.overdue30 || 900000).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-xs text-slate-400">&gt;৬০ দিন দীর্ঘমেয়াদী</p>
              <p className="text-2xl font-bold text-rose-400 font-mono mt-1">
                ৳{(apData?.overdue60 || 400000).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top Creditors Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>প্রধান সরবরাহকারী ও পাওনাদার তালিকা (Top Creditors)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">সরবরাহকারী প্রতিষ্ঠান</th>
                    <th className="px-5 py-3 text-right">বকেয়া দেনা (BDT)</th>
                    <th className="px-5 py-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {apData?.topCreditors?.map((creditor, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-white">{creditor.supplierName}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-rose-400">
                        ৳{creditor.outstanding.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                          পেমেন্ট বরাদ্দ করুন
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!apData?.topCreditors || apData.topCreditors.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-500">
                        বর্তমানে কোনো অনিষ্পন্ন দেনা নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: PARTNERSHIP ACCOUNTS ────────────────────────────────────── */}
      {activeTab === 'PARTNERSHIP' && (
        <div className="space-y-6">
          {/* Partnership Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>সান বার্ড কর্পোরেশন অংশীদারি চুক্তি ও মূলধন (Partnership Deed Summary)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  নিবন্ধিত চুক্তি অনুযায়ী ১০০% শেয়ার বণ্টন ও যৌথ স্বাক্ষর নীতি কার্যকর
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold text-amber-400">
                  মোট পার্টনার মূলধন: ৳{totalPartnerCapital.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-400">সক্রিয় অংশীদার: {partners.length} জন</p>
              </div>
            </div>
          </div>

          {/* Partner Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <div
                key={partner._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{partner.partnerName}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{partner.partnerCode}</p>
                    <span className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-amber-900/50">
                      {partner.partnerType}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-400 font-mono">
                      {partner.profitShareRatio}%
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase">শেয়ার অনুপাত</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">প্রারম্ভিক মূলধন:</span>
                    <span className="font-mono text-white">৳{partner.capitalContribution.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold">
                    <span className="text-amber-300">বর্তমান ইকুইটি ব্যালেন্স:</span>
                    <span className="font-mono text-amber-400">
                      ৳{(partner.currentBalance || partner.capitalContribution).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-2 flex justify-between">
                  <span>ফোন: {partner.phone || 'N/A'}</span>
                  <span>ইমেইল: {partner.email || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 8: BANK RECONCILIATION ─────────────────────────────────────── */}
      {activeTab === 'BANK_RECON' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-400" />
                  <span>ব্যাংক স্টেটমেন্ট রিকনসিলিয়েশন ও ব্যালেন্স ম্যাচিং</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ব্যাংক স্টেটমেন্ট এবং জিএল বুকের মধ্যে অমিল চিহ্নিতকরণ ও সমন্বয়
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">ব্যাংক হিসাব</th>
                    <th className="px-5 py-3">পিরিয়ড</th>
                    <th className="px-5 py-3 text-right">স্টেটমেন্ট ক্লোজিং</th>
                    <th className="px-5 py-3 text-right">বইয়ের ব্যালেন্স</th>
                    <th className="px-5 py-3 text-right">পার্থক্য (Variance)</th>
                    <th className="px-5 py-3 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {reconciliations.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-semibold text-white">
                        {r.bankAccountName} ({r.bankAccountCode})
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {new Date(r.statementPeriodStart).toLocaleDateString()} -{' '}
                        {new Date(r.statementPeriodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-white">
                        ৳{r.statementClosingBalance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-300">
                        ৳{r.bookBalance.toLocaleString()}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-mono font-bold ${
                          r.difference === 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ৳{r.difference.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'FINALIZED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reconciliations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        বর্তমানে কোনো রিকনসিলিয়েশন শীট নেই। উপরে &quot;নতুন রিকনসিলিয়েশন&quot; বাটনে ক্লিক করুন।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 9: BUDGET MANAGEMENT ───────────────────────────────────────── */}
      {activeTab === 'BUDGET' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>বাজেট বনাম প্রকৃত ব্যয় বিশ্লেষণ (Budget vs Actual Variance Analysis)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">খাত / হিসাবের নাম</th>
                    <th className="px-5 py-3 text-right">বাজেট বরাদ্দ (BDT)</th>
                    <th className="px-5 py-3 text-right">প্রকৃত ব্যয় (Actual BDT)</th>
                    <th className="px-5 py-3 text-right">ভ্যারিয়্যান্স (Variance)</th>
                    <th className="px-5 py-3 text-center">ব্যবহার অনুপাত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {bvaItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-sans font-semibold text-white">
                        {item.accountCode} - {item.accountName}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-300">৳{item.budgetedAmount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-white font-bold">৳{item.actualAmount.toLocaleString()}</td>
                      <td
                        className={`px-5 py-3 text-right font-bold ${
                          item.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.variance >= 0 ? '+' : ''}৳{item.variance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.variancePct <= 100
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {item.variancePct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {bvaItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500 font-sans">
                        কোনো বাজেট ভ্যারিয়্যান্স রেকর্ড নেই।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 10: FINANCIAL REPORTS ──────────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {/* Sub-report selector buttons */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
            <button
              type="button"
              onClick={() => setReportSubTab('TB')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                reportSubTab === 'TB' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              রেওয়ামিল (Trial Balance)
            </button>
            <button
              type="button"
              onClick={() => setReportSubTab('PNL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                reportSubTab === 'PNL' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              লাভ-ক্ষতি বিবরণী (P&amp;L)
            </button>
            <button
              type="button"
              onClick={() => setReportSubTab('BS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                reportSubTab === 'BS' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              উদ্বৃত্তপত্র (Balance Sheet)
            </button>
            <button
              type="button"
              onClick={() => setReportSubTab('CF')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                reportSubTab === 'CF' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ক্যাশ ফ্লো বিবরণী (Cash Flow)
            </button>
          </div>

          {/* Trial Balance View */}
          {reportSubTab === 'TB' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span>সান বার্ড কর্পোরেশন রেওয়ামিল (Trial Balance Statement)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    মোট ডেবিট ও মোট ক্রেডিটের সমতা পরীক্ষা
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono ${
                      trialBalance?.isBalanced
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {trialBalance?.isBalanced ? '✓ রেওয়ামিল নিখুঁতভাবে মিলেছে (Balanced)' : 'ইমব্যালেন্স সনাক্ত হয়েছে'}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-sans">
                    <tr>
                      <th className="px-5 py-3">অ্যাকাউন্ট কোড</th>
                      <th className="px-5 py-3">হিসাবের শিরোনাম (Account Title)</th>
                      <th className="px-5 py-3">টাইপ</th>
                      <th className="px-5 py-3 text-right">ডেবিট (Debit BDT)</th>
                      <th className="px-5 py-3 text-right">ক্রেডিট (Credit BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {trialBalance?.accounts?.map((acc) => (
                      <tr key={acc.accountCode} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-2.5 font-bold text-amber-400">{acc.accountCode}</td>
                        <td className="px-5 py-2.5 font-sans font-medium text-white">{acc.accountName}</td>
                        <td className="px-5 py-2.5 font-sans text-slate-400">{acc.accountType}</td>
                        <td className="px-5 py-2.5 text-right text-emerald-400">
                          {acc.debit > 0 ? `৳${acc.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-5 py-2.5 text-right text-sky-400">
                          {acc.credit > 0 ? `৳${acc.credit.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-950 font-bold text-white border-t-2 border-slate-700">
                      <td colSpan={3} className="px-5 py-3 font-sans text-amber-400 uppercase">
                        সর্বমোট সমাপনী জের (Grand Total)
                      </td>
                      <td className="px-5 py-3 text-right text-emerald-400 text-sm">
                        ৳{(trialBalance?.totalDebit || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-sky-400 text-sm">
                        ৳{(trialBalance?.totalCredit || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profit & Loss View */}
          {reportSubTab === 'PNL' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Coins className="w-5 h-5 text-emerald-400" />
                <span>আয় বিবরণী / লাভ-ক্ষতি হিসাব (Profit &amp; Loss Statement)</span>
              </h3>
              <div className="space-y-3 text-xs max-w-2xl font-mono">
                <div className="flex justify-between py-2 border-b border-slate-800 font-sans">
                  <span className="text-slate-300 font-semibold">১. মোট পণ্য বিক্রয় ও সেবা রাজস্ব (Revenue)</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    +৳{(pnl?.revenue || 14500000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 font-sans">
                  <span className="text-slate-400">২. বিক্রিত পণ্যের ব্যয় (COGS)</span>
                  <span className="font-mono text-rose-400">
                    -৳{(pnl?.costOfGoodsSold || 8850000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 bg-slate-950 px-4 rounded-xl font-bold font-sans">
                  <span className="text-amber-400">মোট লাভ (Gross Profit)</span>
                  <span className="font-mono text-white text-base">
                    ৳{(pnl?.grossProfit || 5650000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 font-sans">
                  <span className="text-slate-400">৩. পরিচালন ও প্রশাসনিক ব্যয় (OpEx)</span>
                  <span className="font-mono text-rose-400">
                    -৳{(pnl?.operatingExpenses || 970000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-emerald-950/60 border border-emerald-800 px-4 rounded-xl font-bold font-sans">
                  <span className="text-emerald-300 text-sm">নিট মুনাফা (Net Profit After Tax)</span>
                  <span className="font-mono text-emerald-400 text-lg">
                    ৳{(pnl?.netProfit || 4680000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Balance Sheet View */}
          {reportSubTab === 'BS' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>উদ্বৃত্তপত্র / আর্থিক অবস্থার বিবরণী (Balance Sheet)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                {/* Assets */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-sans font-bold text-emerald-400 text-sm border-b border-slate-800 pb-2">
                    মোট সম্পত্তি (Assets)
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="font-sans text-slate-300">চলতি সম্পদ (ক্যাশ, ব্যাংক, এআর):</span>
                    <span className="text-white font-bold">৳২,১০,৭৮,২০০</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-sans text-slate-300">মজুদ পণ্য (Inventory Assets):</span>
                    <span className="text-white font-bold">৳১,৩৫,০০,০০০</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-800 font-bold text-emerald-400 text-sm">
                    <span className="font-sans">মোট সম্পদ (Total Assets):</span>
                    <span>৳{(balanceSheet?.totalAssets || 34578200).toLocaleString()}</span>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-sans font-bold text-amber-400 text-sm border-b border-slate-800 pb-2">
                    দায় ও অংশীদারি মূলধন (Liabilities &amp; Equity)
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="font-sans text-slate-300">চলতি দায় (সাপ্লায়ার পে-অ্যাবল):</span>
                    <span className="text-rose-400 font-bold">
                      ৳{(balanceSheet?.totalLiabilities || 7450000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-sans text-slate-300">অংশীদার মূলধন ও সংরক্ষিত আয়:</span>
                    <span className="text-amber-400 font-bold">
                      ৳{(balanceSheet?.totalEquity || 27128200).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-800 font-bold text-white text-sm">
                    <span className="font-sans">মোট দায় ও ইকুইটি:</span>
                    <span>৳{(balanceSheet?.totalAssets || 34578200).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cash Flow View */}
          {reportSubTab === 'CF' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Landmark className="w-5 h-5 text-sky-400" />
                <span>নগদ প্রবাহ বিবরণী (Cash Flow Statement)</span>
              </h3>
              <div className="space-y-3 text-xs max-w-xl font-mono">
                <div className="flex justify-between py-2 border-b border-slate-800 font-sans">
                  <span className="text-slate-300 font-semibold">পরিচালন কার্যক্রম থেকে নগদ প্রবাহ (Operating):</span>
                  <span className="text-emerald-400 font-bold">
                    +৳{(cashFlow?.operatingActivities || 3850000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 font-sans">
                  <span className="text-slate-400">বিনিয়োগ কার্যক্রম থেকে নগদ প্রবাহ (Investing):</span>
                  <span className="text-rose-400">
                    -৳{(cashFlow?.investingActivities || 650000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800 font-sans">
                  <span className="text-slate-400">অর্থায়ন কার্যক্রম থেকে নগদ প্রবাহ (Financing):</span>
                  <span className="text-white">
                    +৳{(cashFlow?.financingActivities || 200000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-slate-950 px-4 rounded-xl font-bold font-sans">
                  <span className="text-sky-300">নিট নগদ বৃদ্ধি / হ্রাস (Net Cash Flow):</span>
                  <span className="font-mono text-emerald-400 text-base">
                    ৳{(cashFlow?.netCashFlow || 3400000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: ADD INCOME / EXPENSE ──────────────────────────────────── */}
      {isIeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>নগদ ও ব্যাংক লেনদেন এন্ট্রি</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsIeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncomeExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIeType('RECEIPT');
                    setIeCounterpartCode(4010);
                  }}
                  className={`py-2 rounded-lg font-bold border transition-colors ${
                    ieType === 'RECEIPT'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  আয় প্রাপ্তি (Receipt)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIeType('PAYMENT');
                    setIeCounterpartCode(5200);
                  }}
                  className={`py-2 rounded-lg font-bold border transition-colors ${
                    ieType === 'PAYMENT'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  ব্যয় প্রদান (Payment)
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ক্যাশ/ব্যাংক হিসাব কোড</label>
                <select
                  value={ieAccountCode}
                  onChange={(e) => setIeAccountCode(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                >
                  <option value={1005}>1005 - Cash in Hand (পেটি ক্যাশ)</option>
                  <option value={1010}>1010 - Cash at Bank (সিটি ব্যাংক A/C 2901)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">বিপরীত খতিয়ান কোড (Counterpart Account)</label>
                <select
                  value={ieCounterpartCode}
                  onChange={(e) => setIeCounterpartCode(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                >
                  <option value={4010}>4010 - Sales Revenue (বিক্রয় রাজস্ব)</option>
                  <option value={1020}>1020 - Accounts Receivable (গ্রাহক বকেয়া সংগ্রহ)</option>
                  <option value={2010}>2010 - Accounts Payable (সরবরাহকারী দেনা পরিশোধ)</option>
                  <option value={5200}>5200 - Marketing &amp; Distribution Expenses</option>
                  <option value={6020}>6020 - Logistics &amp; Transport Expenses</option>
                  <option value={6030}>6030 - Warehouse Rent &amp; Utilities</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">টাকার পরিমাণ (BDT) *</label>
                <input
                  type="number"
                  required
                  value={ieAmount}
                  onChange={(e) => setIeAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-base font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">লেনদেনের বিবরণ *</label>
                <input
                  type="text"
                  required
                  value={ieDesc}
                  onChange={(e) => setIeDesc(e.target.value)}
                  placeholder="যেমন: সেন্ট্রাল ক্লিনিক থেকে আইসিইউ বেড বিল সংগ্রহ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">রেফারেন্স / মানি রিসিট / চালান নং</label>
                <input
                  type="text"
                  value={ieRef}
                  onChange={(e) => setIeRef(e.target.value)}
                  placeholder="যেমন: MR-2026-091"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>পোস্ট করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: JOURNAL VOUCHER (JV) ─────────────────────────────────── */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <span>নতুন ডাবল-এন্ট্রি জার্নাল ভাউচার (JV)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">ভাউচার টাইপ</label>
                <select
                  value={jvType}
                  onChange={(e) => setJvType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-500"
                >
                  <option value="JOURNAL">JOURNAL (সাধারণ জার্নাল)</option>
                  <option value="PAYMENT">PAYMENT (পেমেন্ট ভাউচার)</option>
                  <option value="RECEIPT">RECEIPT (রিসিট ভাউচার)</option>
                  <option value="CONTRA">CONTRA (কন্ট্রা ভাউচার - ক্যাশ-ব্যাংক ট্রান্সফার)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">লেনদেনের বিবরণ (Narration) *</label>
                <input
                  type="text"
                  required
                  value={jvDesc}
                  onChange={(e) => setJvDesc(e.target.value)}
                  placeholder="যেমন: তেজগাঁও সেন্ট্রাল ডেপো মাসিক ভাড়া ও মূসক সমন্বয়..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-400 font-semibold mb-1">ডেবিট হিসাব (Debit A/C) *</label>
                  <select
                    value={jvDebitAcc}
                    onChange={(e) => setJvDebitAcc(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
                  >
                    {coa.map((acc) => (
                      <option key={acc.accountCode} value={acc.accountCode}>
                        {acc.accountCode} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sky-400 font-semibold mb-1">ক্রেডিট হিসাব (Credit A/C) *</label>
                  <select
                    value={jvCreditAcc}
                    onChange={(e) => setJvCreditAcc(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-sky-500 font-mono"
                  >
                    {coa.map((acc) => (
                      <option key={acc.accountCode} value={acc.accountCode}>
                        {acc.accountCode} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">টাকার পরিমাণ (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={jvAmount}
                    onChange={(e) => setJvAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono font-bold text-base outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">রেফারেন্স / ডকুমেন্ট নং</label>
                  <input
                    type="text"
                    value={jvRef}
                    onChange={(e) => setJvRef(e.target.value)}
                    placeholder="যেমন: BILL-2026-90"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Live Double Entry Balance Indicator */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400">Total Debit: ৳{jvAmount.toLocaleString()}</span>
                <span className="text-slate-400">=</span>
                <span className="text-sky-400">Total Credit: ৳{jvAmount.toLocaleString()}</span>
                <span className="text-emerald-400 font-bold">✓ Balanced</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-amber-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ভাউচার পোস্ট করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD PARTNER ───────────────────────────────────────────── */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>নতুন অংশীদার নিবন্ধন (Register Partner)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPartnerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">অংশীদারের নাম *</label>
                <input
                  type="text"
                  required
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder="যেমন: ইঞ্জিঃ মোস্তাফিজুর রহমান"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">পার্টনার কোড *</label>
                  <input
                    type="text"
                    required
                    value={newPartnerCode}
                    onChange={(e) => setNewPartnerCode(e.target.value)}
                    placeholder="PRT-04"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">পার্টনার ধরণ</label>
                  <select
                    value={newPartnerType}
                    onChange={(e) => setNewPartnerType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
                  >
                    <option value="EQUITY_PARTNER">Equity Partner</option>
                    <option value="MANAGING_PARTNER">Managing Partner</option>
                    <option value="SLEEPING_PARTNER">Sleeping Partner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">প্রারম্ভিক মূলধন (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={newPartnerCapital}
                    onChange={(e) => setNewPartnerCapital(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">মুনাফা শেয়ারিং % *</label>
                  <input
                    type="number"
                    required
                    value={newPartnerRatio}
                    onChange={(e) => setNewPartnerRatio(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={newPartnerPhone}
                    onChange={(e) => setNewPartnerPhone(e.target.value)}
                    placeholder="+880 1711..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ইমেইল</label>
                  <input
                    type="email"
                    value={newPartnerEmail}
                    onChange={(e) => setNewPartnerEmail(e.target.value)}
                    placeholder="partner@sunbird.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-amber-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: DISTRIBUTE PROFIT ─────────────────────────────────────── */}
      {isProfitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>পার্টনারদের মধ্যে বার্ষিক মুনাফা বণ্টন</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProfitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDistributeProfit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">বণ্টনযোগ্য মোট নিট মুনাফা (BDT) *</label>
                <input
                  type="number"
                  required
                  value={profitToDistribute}
                  onChange={(e) => setProfitToDistribute(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-base font-bold outline-none focus:border-amber-500"
                />
              </div>

              {/* Live Preview of allocation */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-slate-400 font-semibold text-[11px]">স্বয়ংক্রিয় বণ্টন পূর্বরূপ:</p>
                {partners.map((p) => {
                  const share = Math.round((profitToDistribute * p.profitShareRatio) / 100);
                  return (
                    <div key={p._id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        {p.partnerName} ({p.profitShareRatio}%)
                      </span>
                      <span className="font-mono font-bold text-emerald-400">+৳{share.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-amber-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>মুনাফা বণ্টন নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: CAPITAL CONTRIBUTION ──────────────────────────────────── */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>অতিরিক্ত মূলধন বিনিয়োগ জমা (Capital Injection)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCapitalModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordCapital} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">অংশীদার নির্বাচন করুন *</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                >
                  {partners.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.partnerName} ({p.partnerType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">বিনিয়োগের পরিমাণ (BDT) *</label>
                <input
                  type="number"
                  required
                  value={partnerAmount}
                  onChange={(e) => setPartnerAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-base font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCapitalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>জমা রেকর্ড করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: RECORD DRAWINGS ───────────────────────────────────────── */}
      {isDrawingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-400" />
                <span>পার্টনার ব্যক্তিগত ক্যাশ উত্তোলন (Drawings Entry)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDrawingsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDrawings} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">অংশীদার নির্বাচন করুন *</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500"
                >
                  {partners.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.partnerName} ({p.partnerType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">উত্তোলনের পরিমাণ (BDT) *</label>
                <input
                  type="number"
                  required
                  value={partnerAmount}
                  onChange={(e) => setPartnerAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-base font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDrawingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>উত্তোলন নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: CREATE BUDGET ─────────────────────────────────────────── */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <span>নতুন বাজেট বরাদ্দ নির্ধারণ</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">বাজেটের শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="যেমন: ২০২৬ কিউ-৩ মার্কেটিং ও ডেলিভারি বাজেট"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">অর্থবছর</label>
                  <input
                    type="number"
                    required
                    value={budgetFiscalYear}
                    onChange={(e) => setBudgetFiscalYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">বিভাগ (Dept)</label>
                  <input
                    type="text"
                    value={budgetDept}
                    onChange={(e) => setBudgetDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ব্যয় খতিয়ান কোড (Expense Account)</label>
                <select
                  value={budgetAccountCode}
                  onChange={(e) => setBudgetAccountCode(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-indigo-500"
                >
                  {coa.filter((a) => a.accountType === 'EXPENSE').map((acc) => (
                    <option key={acc.accountCode} value={acc.accountCode}>
                      {acc.accountCode} - {acc.accountName}
                    </option>
                  ))}
                  <option value={5200}>5200 - Marketing &amp; Distribution Expenses</option>
                  <option value={6020}>6020 - Logistics &amp; Transport Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">বরাদ্দকৃত পরিমাণ (BDT) *</label>
                <input
                  type="number"
                  required
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-base font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>বাজেট সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 8: ADD ACCOUNT TO COA ────────────────────────────────────── */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <span>নতুন চার্ট অফ অ্যাকাউন্টস (Add Account)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">হিসাবের নাম (Account Name) *</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="যেমন: ইলেকট্রোম্যডিকেল ক্যালিব্রেশন ফি"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">অ্যাকাউন্ট কোড *</label>
                  <input
                    type="number"
                    required
                    value={newAccCode}
                    onChange={(e) => setNewAccCode(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ক্যাটাগরি</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-sky-500"
                  >
                    <option value="ASSET">ASSET (সম্পদ)</option>
                    <option value="LIABILITY">LIABILITY (দায়)</option>
                    <option value="EQUITY">EQUITY (ইকুইটি)</option>
                    <option value="REVENUE">REVENUE (রাজস্ব)</option>
                    <option value="EXPENSE">EXPENSE (ব্যয়)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">স্বাভাবিক জের (Normal Balance)</label>
                <select
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-sky-500"
                >
                  <option value="DEBIT">DEBIT (ডেবিট জের)</option>
                  <option value="CREDIT">CREDIT (ক্রেডিট জের)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-sky-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>কোড যুক্ত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 9: BANK RECONCILIATION ──────────────────────────────────── */}
      {isReconModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                <span>নতুন ব্যাংক রিকনসিলিয়েশন শীট</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReconModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReconciliation} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">ব্যাংক হিসাবের নাম</label>
                <input
                  type="text"
                  required
                  value={reconBankName}
                  onChange={(e) => setReconBankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">ব্যাংক কোড</label>
                  <input
                    type="number"
                    required
                    value={reconBankCode}
                    onChange={(e) => setReconBankCode(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">স্টেটমেন্ট ক্লোজিং ব্যালেন্স (BDT)</label>
                  <input
                    type="number"
                    required
                    value={reconClosingBal}
                    onChange={(e) => setReconClosingBal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">স্টেটমেন্ট লাইনের বিবরণ</label>
                <input
                  type="text"
                  required
                  value={reconLineDesc}
                  onChange={(e) => setReconLineDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">লাইনের পরিমাণ (BDT)</label>
                  <input
                    type="number"
                    required
                    value={reconLineAmt}
                    onChange={(e) => setReconLineAmt(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ট্রানজ্যাকশন টাইপ</label>
                  <select
                    value={reconLineType}
                    onChange={(e) => setReconLineType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-teal-500"
                  >
                    <option value="CREDIT">CREDIT (জমা)</option>
                    <option value="DEBIT">DEBIT (খরচ)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReconModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-teal-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>তৈরি করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ErpAccountingView;
