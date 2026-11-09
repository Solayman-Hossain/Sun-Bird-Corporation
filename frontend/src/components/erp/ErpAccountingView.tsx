'use client';

import React, { useState, useMemo } from 'react';
import './ErpAccountingView.css';
import {
  FileSpreadsheet,
  Plus,
  Scale,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Receipt,
  Building2,
  X,
  CreditCard,
  PieChart,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  Wallet,
  Coins,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { IncomeExpenseItem, PartnerAccount } from '../../types';

export interface JournalVoucher {
  id: string;
  voucherNo: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

const CHART_OF_ACCOUNTS = [
  '1010 - Cash at Bank (City Bank A/C 2901)',
  '1020 - Accounts Receivable (Hospital Clients)',
  '1050 - Medical Inventory Assets (Tejgaon)',
  '2010 - Accounts Payable (Foreign Suppliers)',
  '2050 - NBR Mushak-6.3 VAT Output Payable',
  '3010 - Retained Earnings & Share Capital',
  '4010 - Sales Revenue (Medical Equipment)',
  '5010 - Cost of Goods Sold (COGS)',
  '6020 - Logistics & Courier Expense',
];

const INITIAL_VOUCHERS: JournalVoucher[] = [
  {
    id: 'jv-1',
    voucherNo: 'JV-2026-0841',
    date: 'Today, 10:30 AM',
    description: 'Sale of ICU Bed & Multipara Monitor (SBC-ORD-2026-9023)',
    debitAccount: '1010 - Cash at Bank (City Bank A/C 2901)',
    creditAccount: '4010 - Sales Revenue (Medical Equipment)',
    amount: 126087,
  },
  {
    id: 'jv-2',
    voucherNo: 'JV-2026-0842',
    date: 'Today, 10:30 AM',
    description: 'Statutory 15% NBR VAT Collection on Order #9023',
    debitAccount: '1010 - Cash at Bank (City Bank A/C 2901)',
    creditAccount: '2050 - NBR Mushak-6.3 VAT Output Payable',
    amount: 18913,
  },
  {
    id: 'jv-3',
    voucherNo: 'JV-2026-0843',
    date: 'Today, 11:15 AM',
    description: 'Inventory Cost of Goods Sold (COGS) Recognition',
    debitAccount: '5010 - Cost of Goods Sold (COGS)',
    creditAccount: '1050 - Medical Inventory Assets (Tejgaon)',
    amount: 88500,
  },
  {
    id: 'jv-4',
    voucherNo: 'JV-2026-0839',
    date: 'Yesterday, 03:00 PM',
    description: 'Steadfast Courier Delivery Remittance Received',
    debitAccount: '1010 - Cash at Bank (City Bank A/C 2901)',
    creditAccount: '1020 - Accounts Receivable (Hospital Clients)',
    amount: 48500,
  },
  {
    id: 'jv-5',
    voucherNo: 'JV-2026-0838',
    date: '03 Nov 2026',
    description: 'Customs Duty & Port Clearance for 10L Oxygen Concentrators',
    debitAccount: '1050 - Medical Inventory Assets (Tejgaon)',
    creditAccount: '1010 - Cash at Bank (City Bank A/C 2901)',
    amount: 95000,
  },
];

const INITIAL_INCOME_EXPENSES: IncomeExpenseItem[] = [
  {
    id: 'ie-1',
    type: 'INCOME',
    date: '09 Nov 2026',
    category: 'হাসপাতাল সেলস রেভিনিউ',
    description: 'সেন্ট্রাল ক্লিনিক আইসিইউ বেড সরবরাহ বাবদ বিল',
    amount: 145000,
    paymentMethod: 'BANK',
    referenceNo: 'CH-2026-9023',
  },
  {
    id: 'ie-2',
    type: 'INCOME',
    date: '08 Nov 2026',
    category: 'বায়োমেডিক্যাল ইনস্টলেশন ফি',
    description: 'গ্রীন লাইফ হসপিটাল পেশেন্ট মনিটর ক্যালিব্রেশন',
    amount: 12500,
    paymentMethod: 'BKASH',
    referenceNo: 'SVC-2026-44',
  },
  {
    id: 'ie-3',
    type: 'EXPENSE',
    date: '08 Nov 2026',
    category: 'ওয়্যারহাউজ ভাড়া',
    description: 'তেজগাঁও সেন্ট্রাল ডেপো মাসিক ভাড়া পরিশোধ',
    amount: 35000,
    paymentMethod: 'BANK',
    referenceNo: 'RENT-NOV-26',
  },
  {
    id: 'ie-4',
    type: 'EXPENSE',
    date: '07 Nov 2026',
    category: 'কুরিয়ার ও লজিস্টিক',
    description: 'স্টেডফাস্ট ও পাঠাও পার্সেল ডেলিভারি চার্জ',
    amount: 4850,
    paymentMethod: 'CASH',
    referenceNo: 'LOG-081',
  },
  {
    id: 'ie-5',
    type: 'EXPENSE',
    date: '06 Nov 2026',
    category: 'ফুয়েল ও পরিবহন',
    description: 'ডেলিভারি পিকআপ ভ্যান ডিজেল ও টোল চার্জ',
    amount: 3200,
    paymentMethod: 'CASH',
    referenceNo: 'TR-119',
  },
];

const INITIAL_PARTNERS: PartnerAccount[] = [
  {
    id: 'prt-1',
    partnerName: 'ডাঃ মোস্তাফিজুর রহমান',
    phone: '01711-123456',
    email: 'mustafiz@sunbirdcorp.com',
    nidOrPassport: '1984269182341',
    role: 'Managing Partner',
    sharePercentage: 50,
    initialCapital: 2500000,
    additionalInvestment: 500000,
    accumulatedProfit: 650000,
    totalDrawings: 120000,
    currentCapitalBalance: 3530000,
    deedStartDate: '01 Jan 2023',
    deedRegistrationNo: 'SBC-DEED-2023-01',
    bankAccountDetails: 'City Bank Ltd - A/C 11029412',
  },
  {
    id: 'prt-2',
    partnerName: 'ইঞ্জিনিয়ার তারেক মাহমুদ',
    phone: '01711-234567',
    email: 'tarek@sunbirdcorp.com',
    nidOrPassport: '1987269182992',
    role: 'General Partner',
    sharePercentage: 30,
    initialCapital: 1500000,
    additionalInvestment: 300000,
    accumulatedProfit: 390000,
    totalDrawings: 80000,
    currentCapitalBalance: 2110000,
    deedStartDate: '01 Jan 2023',
    deedRegistrationNo: 'SBC-DEED-2023-01',
    bankAccountDetails: 'Eastern Bank PLC - A/C 2049182',
  },
  {
    id: 'prt-3',
    partnerName: 'হাজী মোঃ সালাহউদ্দিন',
    phone: '01811-998877',
    email: 'salahuddin@sunbirdcorp.com',
    nidOrPassport: '1979269184410',
    role: 'Sleeping Partner',
    sharePercentage: 20,
    initialCapital: 1000000,
    additionalInvestment: 200000,
    accumulatedProfit: 260000,
    totalDrawings: 50000,
    currentCapitalBalance: 1410000,
    deedStartDate: '01 Jan 2023',
    deedRegistrationNo: 'SBC-DEED-2023-01',
    bankAccountDetails: 'Dutch-Bangla Bank - A/C 9988221',
  },
];

export function ErpAccountingView() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'INCOME_EXPENSE' | 'PARTNERSHIP' | 'GL'>('INCOME_EXPENSE');

  // Vouchers state
  const [vouchers, setVouchers] = useState<JournalVoucher[]>(INITIAL_VOUCHERS);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [debitAcc, setDebitAcc] = useState(CHART_OF_ACCOUNTS[0]);
  const [creditAcc, setCreditAcc] = useState(CHART_OF_ACCOUNTS[4]);
  const [voucherAmount, setVoucherAmount] = useState<number>(15000);

  // Income / Expense state
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpenseItem[]>(INITIAL_INCOME_EXPENSES);
  const [isIeModalOpen, setIsIeModalOpen] = useState(false);
  const [ieType, setIeType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [ieCategory, setIeCategory] = useState('হাসপাতাল সেলস রেভিনিউ');
  const [ieDesc, setIeDesc] = useState('');
  const [ieAmount, setIeAmount] = useState<number>(5000);
  const [iePaymentMethod, setIePaymentMethod] = useState<IncomeExpenseItem['paymentMethod']>('BANK');
  const [ieRef, setIeRef] = useState('');

  // Partners state
  const [partners, setPartners] = useState<PartnerAccount[]>(INITIAL_PARTNERS);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [profitToDistribute, setProfitToDistribute] = useState<number>(300000);
  const [isDrawingsModalOpen, setIsDrawingsModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState(INITIAL_PARTNERS[0].id);
  const [drawingAmount, setDrawingAmount] = useState<number>(25000);

  // Calculations
  const totalIncome = useMemo(
    () => incomeExpenses.filter((i) => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0),
    [incomeExpenses]
  );
  const totalExpense = useMemo(
    () => incomeExpenses.filter((i) => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0),
    [incomeExpenses]
  );
  const netCashFlow = totalIncome - totalExpense;

  const totalPartnerCapital = useMemo(
    () => partners.reduce((s, p) => s + p.currentCapitalBalance, 0),
    [partners]
  );

  // Post new voucher
  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) {
      showToast('ভাউচারের বিবরণ দিন।', 'error');
      return;
    }

    const newV: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNo: `JV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: 'Just now',
      description: desc,
      debitAccount: debitAcc,
      creditAccount: creditAcc,
      amount: voucherAmount,
    };

    setVouchers([newV, ...vouchers]);
    setIsVoucherModalOpen(false);
    setDesc('');
    showToast('জার্নাল ভাউচার সফলভাবে পোস্টেড হয়েছে!', 'success');
  };

  // Add Income / Expense
  const handleAddIncomeExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ieDesc.trim()) return;

    const newItem: IncomeExpenseItem = {
      id: `ie-${Date.now()}`,
      type: ieType,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: ieCategory,
      description: ieDesc,
      amount: ieAmount,
      paymentMethod: iePaymentMethod,
      referenceNo: ieRef || `TR-${Math.floor(100 + Math.random() * 900)}`,
    };

    setIncomeExpenses([newItem, ...incomeExpenses]);
    setIsIeModalOpen(false);
    setIeDesc('');
    showToast(
      `${ieType === 'INCOME' ? 'আয়' : 'ব্যয়'} বাবদ ৳${ieAmount.toLocaleString()} এন্ট্রি সফল হয়েছে!`,
      'success'
    );
  };

  // Distribute Profit to Partners according to percentage
  const handleDistributeProfit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profitToDistribute <= 0) return;

    const updated = partners.map((p) => {
      const share = Math.round((profitToDistribute * p.sharePercentage) / 100);
      return {
        ...p,
        accumulatedProfit: p.accumulatedProfit + share,
        currentCapitalBalance: p.currentCapitalBalance + share,
      };
    });

    setPartners(updated);
    setIsProfitModalOpen(false);
    showToast(
      `মোট ৳${profitToDistribute.toLocaleString()} টাকা পার্টনারদের শেয়ার অনুযায়ী সফলভাবে বণ্টন করা হয়েছে!`,
      'success'
    );
  };

  // Record Partner Drawings / Withdrawal
  const handleRecordDrawings = (e: React.FormEvent) => {
    e.preventDefault();
    if (drawingAmount <= 0) return;

    const updated = partners.map((p) => {
      if (p.id === selectedPartnerId) {
        return {
          ...p,
          totalDrawings: p.totalDrawings + drawingAmount,
          currentCapitalBalance: p.currentCapitalBalance - drawingAmount,
        };
      }
      return p;
    });

    setPartners(updated);
    setIsDrawingsModalOpen(false);
    showToast(`পার্টনার ক্যাশ উত্তোলন (Drawings) বাবদ ৳${drawingAmount.toLocaleString()} রেকর্ড করা হয়েছে।`, 'info');
  };

  return (
    <div className="accounting-view-root space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <span>অ্যাকাউন্টিং, আয়-ব্যয় ও অংশীদারি মূলধন (Partnership Accounts)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            দৈনন্দিন নগদ প্রবাহ, পার্টনারশিপ ডিড চুক্তি, শেয়ার মুনাফা বণ্টন এবং এনবিআর মূসক-৬.৩ জেনারেল লেজার
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'INCOME_EXPENSE' && (
            <button
              type="button"
              onClick={() => setIsIeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>আয় / ব্যয় এন্ট্রি করুন</span>
            </button>
          )}

          {activeTab === 'PARTNERSHIP' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProfitModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950 transition-all cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>মুনাফা বণ্টন করুন (Profit Share)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDrawingsModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-rose-400" />
                <span>ক্যাশ উত্তোলন</span>
              </button>
            </div>
          )}

          {activeTab === 'GL' && (
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#1e3932] hover:bg-[#254940] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#e6b980]" />
              <span>ম্যানুয়াল জার্নাল ভাউচার (JV)</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('INCOME_EXPENSE')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'INCOME_EXPENSE'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          দৈনন্দিন আয় ও ব্যয় (Income & Expense)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PARTNERSHIP')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'PARTNERSHIP'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          অংশীদারি হিসাব ও পার্টনার ডিড ({partners.length} Partners)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GL')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'GL'
              ? 'bg-[#1e3932] text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          ডাবল-এন্ট্রি জেনারেল লেজার ও মূসক-৬.৩
        </button>
      </div>

      {/* TAB 1: INCOME & EXPENSE */}
      {activeTab === 'INCOME_EXPENSE' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>মোট প্রাপ্ত আয় (Total Inflow)</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 font-mono">৳{totalIncome.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">মেডিকেল ইকুইপমেন্ট ও সার্ভিস চার্জ</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>মোট ব্যয় (Total Outflow)</span>
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold text-rose-400 font-mono">৳{totalExpense.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">ভাড়া, ফুয়েল, লজিস্টিক ও অপারেশনাল</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>নিট নগদ ক্যাশ ফ্লো (Net Cash Flow)</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white font-mono">৳{netCashFlow.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400">পজিটিভ ব্যালেন্স সংরক্ষিত</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">তারিখ</th>
                    <th className="px-5 py-3.5">টাইপ</th>
                    <th className="px-5 py-3.5">ক্যাটাগরি</th>
                    <th className="px-5 py-3.5">বিবরণ</th>
                    <th className="px-5 py-3.5">পেমেন্ট মেথড</th>
                    <th className="px-5 py-3.5 text-right">পরিমাণ (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {incomeExpenses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-400">{item.date}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'INCOME'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {item.type === 'INCOME' ? 'আয় (In)' : 'ব্যয় (Out)'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-white">{item.category}</td>
                      <td className="px-5 py-3.5 text-slate-300">{item.description}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-3.5 text-right font-mono font-bold ${
                          item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.type === 'INCOME' ? '+' : '-'}৳{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTNERSHIP ACCOUNTS & DEED */}
      {activeTab === 'PARTNERSHIP' && (
        <div className="space-y-6">
          {/* Deed Overview Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>সান বার্ড কর্পোরেশন অংশীদারি চুক্তি (Partnership Deed Summary)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  রেজিস্ট্রেশন নং: SBC-DEED-2023-01 | কার্যকর তারিখ: ০১ জানুয়ারি ২০২৩
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-amber-400">
                  মোট পার্টনারশিপ মূলধন: ৳{totalPartnerCapital.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-400">১০০% শেয়ার বণ্টন সম্পন্ন</p>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-[11px]">
              অংশীদারদের সম্মতিক্রমে কোম্পানির নিট লাভ ও লোকসান নির্ধারিত শেয়ার পার্সেন্টেজ অনুযায়ী বণ্টন করা হয়।
              প্রতিটি ব্যাংক লেনদেনের জন্য ম্যানেজিং পার্টনারের স্বাক্ষর বাধ্যতামূলক।
            </p>
          </div>

          {/* Partners Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{partner.partnerName}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{partner.phone}</p>
                    <span className="text-[10px] mt-1 inline-block px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-amber-900/50">
                      {partner.role}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {partner.sharePercentage}%
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase">শেয়ার অনুপাত</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">প্রারম্ভিক মূলধন:</span>
                    <span className="font-mono text-white">৳{partner.initialCapital.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">অতিরিক্ত বিনিয়োগ:</span>
                    <span className="font-mono text-slate-300">৳{partner.additionalInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">অর্জিত মুনাফা (Profit):</span>
                    <span className="font-mono text-emerald-400 font-bold">+৳{partner.accumulatedProfit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">মোট উত্তোলন (Drawings):</span>
                    <span className="font-mono text-rose-400">-৳{partner.totalDrawings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold">
                    <span className="text-amber-300">বর্তমান মূলধন ব্যালেন্স:</span>
                    <span className="font-mono text-amber-400">৳{partner.currentCapitalBalance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                  ব্যাংক হিসাব: {partner.bankAccountDetails}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL LEDGER (GL) */}
      {activeTab === 'GL' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">মোট সম্পদ (Total Assets)</p>
              <p className="text-2xl font-bold text-white font-mono">৳৩,৪৫,৭৮,২০০</p>
              <p className="text-[10px] text-emerald-400">ক্যাশ ও তেজগাঁও ওয়্যারহাউজ স্টক</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">মোট দায় (Liabilities)</p>
              <p className="text-2xl font-bold text-white font-mono">৳৭৪,৫০,০০০</p>
              <p className="text-[10px] text-slate-400">বিদেশি সাপ্লায়ার পে-অ্যাবল ও এল/সি</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">এনবিআর মূসক-৬.৩ ভ্যাট পে-অ্যাবল</p>
              <p className="text-2xl font-bold text-amber-400 font-mono">৳২,১৮,৪৫০</p>
              <p className="text-[10px] text-amber-300/80">১৫% ভ্যাট চালান সংরক্ষিত</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">মোট ইকুইটি (Shareholders Equity)</p>
              <p className="text-2xl font-bold text-emerald-400 font-mono">৳২,৭১,২৮,২০০</p>
              <p className="text-[10px] text-emerald-400">রিটেইন্ড আর্নিংস সহ</p>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">ভাউচার নম্বর</th>
                    <th className="px-5 py-3.5">তারিখ</th>
                    <th className="px-5 py-3.5">লেনদেনের বিবরণ</th>
                    <th className="px-5 py-3.5">ডেবিট হিসাব (Debit A/C)</th>
                    <th className="px-5 py-3.5">ক্রেডিট হিসাব (Credit A/C)</th>
                    <th className="px-5 py-3.5 text-right">পরিমাণ (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-amber-400 font-bold">{v.voucherNo}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{v.date}</td>
                      <td className="px-5 py-3.5 text-white font-medium">{v.description}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-emerald-400">{v.debitAccount}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-sky-400">{v.creditAccount}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-white">
                        ৳{v.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD INCOME / EXPENSE */}
      {isIeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>নতুন আয় / ব্যয় এন্ট্রি করুন</span>
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
                    setIeType('INCOME');
                    setIeCategory('হাসপাতাল সেলস রেভিনিউ');
                  }}
                  className={`py-2 rounded-lg font-bold border transition-colors ${
                    ieType === 'INCOME'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  আয় (Income)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIeType('EXPENSE');
                    setIeCategory('অফিস ও ওয়্যারহাউজ ভাড়া');
                  }}
                  className={`py-2 rounded-lg font-bold border transition-colors ${
                    ieType === 'EXPENSE'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  ব্যয় (Expense)
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ক্যাটাগরি</label>
                <input
                  type="text"
                  required
                  value={ieCategory}
                  onChange={(e) => setIeCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">লেনদেনের বিবরণ *</label>
                <input
                  type="text"
                  required
                  value={ieDesc}
                  onChange={(e) => setIeDesc(e.target.value)}
                  placeholder="যেমন: সেন্ট্রাল ক্লিনিক থেকে পেমেন্ট প্রাপ্তি..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">টাকার পরিমাণ (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={ieAmount}
                    onChange={(e) => setIeAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={iePaymentMethod}
                    onChange={(e) => setIePaymentMethod(e.target.value as IncomeExpenseItem['paymentMethod'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="BKASH">bKash / Nagad</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">রেফারেন্স / ভাউচার / চালান নং</label>
                <input
                  type="text"
                  value={ieRef}
                  onChange={(e) => setIeRef(e.target.value)}
                  placeholder="Optional ref"
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

      {/* MODAL 2: DISTRIBUTE PROFIT */}
      {isProfitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>পার্টনারদের মধ্যে মুনাফা বণ্টন (Profit Allocation)</span>
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
                  const share = Math.round((profitToDistribute * p.sharePercentage) / 100);
                  return (
                    <div key={p.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">
                        {p.partnerName} ({p.sharePercentage}%)
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

      {/* MODAL 3: RECORD DRAWINGS */}
      {isDrawingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-400" />
                <span>পার্টনার ক্যাশ উত্তোলন (Drawings Entry)</span>
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
                <label className="block text-slate-400 mb-1">পার্টনার নির্বাচন করুন *</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-500 cursor-pointer"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partnerName} ({p.role} — ব্যালেন্স: ৳{p.currentCapitalBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">উত্তোলনের পরিমাণ (BDT) *</label>
                <input
                  type="number"
                  required
                  value={drawingAmount}
                  onChange={(e) => setDrawingAmount(Number(e.target.value))}
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
                  <span>উত্তোলন রেকর্ড করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MANUAL JOURNAL VOUCHER */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <span>নতুন ডাবল-এন্ট্রি জার্নাল ভাউচার</span>
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
                <label className="block text-slate-400 mb-1">লেনদেনের বিবরণ (Narration) *</label>
                <input
                  type="text"
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="যেমন: কাস্টমস ক্লিয়ারেন্স ও ভ্যাট চালান পরিশোধ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ডেবিট অ্যাকাউন্ট (Debit A/C) *</label>
                <select
                  value={debitAcc}
                  onChange={(e) => setDebitAcc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-500 font-mono"
                >
                  {CHART_OF_ACCOUNTS.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ক্রেডিট অ্যাকাউন্ট (Credit A/C) *</label>
                <select
                  value={creditAcc}
                  onChange={(e) => setCreditAcc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-amber-500 font-mono"
                >
                  {CHART_OF_ACCOUNTS.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">টাকার পরিমাণ (BDT) *</label>
                <input
                  type="number"
                  required
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500"
                />
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
    </div>
  );
}

export default ErpAccountingView;
