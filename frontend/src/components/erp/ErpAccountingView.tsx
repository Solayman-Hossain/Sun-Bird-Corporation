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
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

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

export function ErpAccountingView() {
  const [vouchers, setVouchers] = useState<JournalVoucher[]>(INITIAL_VOUCHERS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New voucher state
  const [desc, setDesc] = useState('');
  const [debitAcc, setDebitAcc] = useState(CHART_OF_ACCOUNTS[0]);
  const [creditAcc, setCreditAcc] = useState(CHART_OF_ACCOUNTS[4]);
  const [voucherAmount, setVoucherAmount] = useState<number>(15000);

  const { showToast } = useToast();

  // Metrics
  const totalDebits = useMemo(() => vouchers.reduce((s, v) => s + v.amount, 0), [vouchers]);
  const totalCredits = useMemo(() => vouchers.reduce((s, v) => s + v.amount, 0), [vouchers]);
  const trialBalanceZeroVariance = totalDebits === totalCredits;

  const grossRevenue = 126087 + 48500;
  const vatPayable = 18913;
  const totalAssets = 4850000;
  const totalLiabilities = 1250000;
  const totalEquity = totalAssets - totalLiabilities;

  const handlePostVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || voucherAmount <= 0) {
      showToast('অনুগ্রহ করে সঠিক বিবরণ ও অংক লিখুন।', 'error');
      return;
    }
    if (debitAcc === creditAcc) {
      showToast('ডেবিট এবং ক্রেডিট অ্যাকাউন্ট ভিন্ন হতে হবে।', 'error');
      return;
    }

    const randomNo = Math.floor(1000 + Math.random() * 9000);
    const newVoucher: JournalVoucher = {
      id: `jv_${Date.now()}`,
      voucherNo: `JV-2026-${randomNo}`,
      date: 'Today, Just now',
      description: desc.trim(),
      debitAccount: debitAcc,
      creditAccount: creditAcc,
      amount: Number(voucherAmount),
    };

    setVouchers([newVoucher, ...vouchers]);
    showToast(`ভাউচার #${newVoucher.voucherNo} সফলভাবে জেনারেল লেজারে পোস্ট হয়েছে।`, 'success');
    setIsModalOpen(false);
    setDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Financial Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            মোট সম্পদ (Total Assets)
          </span>
          <div className="font-extrabold text-slate-900 text-lg font-mono">
            ৳{totalAssets.toLocaleString('en-US')}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">Current + Fixed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            মোট দায় (Liabilities)
          </span>
          <div className="font-extrabold text-slate-900 text-lg font-mono">
            ৳{totalLiabilities.toLocaleString('en-US')}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">Payables + L/C Debt</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            মালিকানা স্বত্ব (Equity)
          </span>
          <div className="font-extrabold text-emerald-700 text-lg font-mono">
            ৳{totalEquity.toLocaleString('en-US')}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Assets - Liabilities</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            গ্রস রেভিনিউ (Revenue)
          </span>
          <div className="font-extrabold text-[#1e3932] text-lg font-mono">
            ৳{grossRevenue.toLocaleString('en-US')}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">YTD Sales Accrual</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            NBR ১৫% ভ্যাট প্রদেয়
          </span>
          <div className="font-extrabold text-[#c89348] text-lg font-mono">
            ৳{vatPayable.toLocaleString('en-US')}
          </div>
          <span className="text-[10px] text-amber-800 font-semibold">মূসক-৬.৩ পে-অর্ডারের জন্য প্রস্তুত</span>
        </div>
      </div>

      {/* Trial Balance Health Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">
                রিয়েল-টাইম ট্রায়াল ব্যালেন্স (Trial Balance Zero-Variance)
              </h3>
              <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Balanced ✓
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              মোট ডেবিট: <strong className="font-mono text-slate-800">৳{totalDebits.toLocaleString('en-US')}</strong> | মোট ক্রেডিট: <strong className="font-mono text-slate-800">৳{totalCredits.toLocaleString('en-US')}</strong> | ভ্যারিয়েন্স: <strong className="text-emerald-700">৳০</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#1e3932]/20 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#e6b980]" />
          <span>ম্যানুয়াল জার্নাল ভাউচার পোস্ট করুন</span>
        </button>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
            জেনারেল লেজার জার্নাল এন্ট্রি রেজিস্টার (General Ledger Transactions)
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            {vouchers.length} Vouchers Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf8f5] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">ভাউচার কোড ও তারিখ</th>
                <th className="p-3.5">লেনদেনের বিবরণ (Description)</th>
                <th className="p-3.5">ডেবিট অ্যাকাউন্ট (Debit)</th>
                <th className="p-3.5">ক্রেডিট অ্যাকাউন্ট (Credit)</th>
                <th className="p-3.5 text-right">পরিমাণ (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono">
                    <span className="font-bold text-[#1e3932]">{v.voucherNo}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{v.date}</span>
                  </td>

                  <td className="p-3.5 font-medium text-slate-800">
                    {v.description}
                  </td>

                  <td className="p-3.5 font-mono text-emerald-800 font-semibold">
                    {v.debitAccount}
                  </td>

                  <td className="p-3.5 font-mono text-slate-600">
                    {v.creditAccount}
                  </td>

                  <td className="p-3.5 text-right font-mono font-extrabold text-slate-900 text-sm">
                    ৳{v.amount.toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Manual Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-[#faf8f5] flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                ম্যানুয়াল জার্নাল ভাউচার এন্ট্রি (Post Journal Voucher)
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostVoucher} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  লেনদেনের বিবরণ (Description) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পোর্ট ফি প্রদান অথবা কুরিয়ার চার্জ রিফান্ড"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1e3932]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ডেবিট অ্যাকাউন্ট (Debit Account) *
                </label>
                <select
                  value={debitAcc}
                  onChange={(e) => setDebitAcc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono focus:outline-none focus:border-[#1e3932]"
                >
                  {CHART_OF_ACCOUNTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ক্রেডিট অ্যাকাউন্ট (Credit Account) *
                </label>
                <select
                  value={creditAcc}
                  onChange={(e) => setCreditAcc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono focus:outline-none focus:border-[#1e3932]"
                >
                  {CHART_OF_ACCOUNTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  টাকার পরিমাণ (Amount in BDT) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#1e3932]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1e3932] hover:bg-[#162f29] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  লেজারে পোস্ট করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

