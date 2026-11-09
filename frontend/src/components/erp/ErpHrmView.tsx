'use client';

import React, { useState } from 'react';
import './ErpHrmView.css';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  UserCheck,
  Calendar,
  CreditCard,
  Briefcase,
  CheckCircle2,
  X,
  Building,
  Award,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { HrmEmployee } from '../../types';

const INITIAL_EMPLOYEES: HrmEmployee[] = [
  {
    id: 'emp-1',
    employeeCode: 'SBC-EMP-001',
    name: 'ডাঃ মোস্তাফিজুর রহমান',
    designation: 'Managing Director & CEO',
    department: 'HR & Admin',
    phone: '01711-123456',
    email: 'ceo@sunbirdcorp.com',
    joiningDate: '2022-01-01',
    basicSalary: 90000,
    houseRent: 35000,
    medicalAllowance: 15000,
    conveyance: 10000,
    grossSalary: 150000,
    bankAccountNo: 'City Bank - 11029412',
    status: 'ACTIVE',
    attendanceDays: 24,
  },
  {
    id: 'emp-2',
    employeeCode: 'SBC-EMP-002',
    name: 'ইঞ্জিনিয়ার তারেক মাহমুদ',
    designation: 'Chief Biomedical Engineer',
    department: 'Biomedical & QC',
    phone: '01711-234567',
    email: 'tarek.lab@sunbirdcorp.com',
    joiningDate: '2023-03-15',
    basicSalary: 45000,
    houseRent: 20000,
    medicalAllowance: 5000,
    conveyance: 5000,
    grossSalary: 75000,
    bankAccountNo: 'EBL - 2049182',
    status: 'ACTIVE',
    attendanceDays: 25,
  },
  {
    id: 'emp-3',
    employeeCode: 'SBC-EMP-003',
    name: 'মোঃ সাইফুল ইসলাম',
    designation: 'Sr. Marketing & Institutional Sales Officer',
    department: 'Sales & Marketing',
    phone: '01751-195752',
    email: 'saiful.sales@sunbirdcorp.com',
    joiningDate: '2023-06-01',
    basicSalary: 35000,
    houseRent: 15000,
    medicalAllowance: 5000,
    conveyance: 5000,
    grossSalary: 60000,
    bankAccountNo: 'DBBL - 1928374',
    status: 'ACTIVE',
    attendanceDays: 26,
  },
  {
    id: 'emp-4',
    employeeCode: 'SBC-EMP-004',
    name: 'ফারহানা আহমেদ',
    designation: 'Chief Accounts & VAT Officer',
    department: 'Finance & Accounts',
    phone: '01811-345678',
    email: 'farhana.acc@sunbirdcorp.com',
    joiningDate: '2023-08-01',
    basicSalary: 40000,
    houseRent: 18000,
    medicalAllowance: 5000,
    conveyance: 7000,
    grossSalary: 70000,
    bankAccountNo: 'City Bank - 9988221',
    status: 'ACTIVE',
    attendanceDays: 24,
  },
  {
    id: 'emp-5',
    employeeCode: 'SBC-EMP-005',
    name: 'কবির হোসেন',
    designation: 'Warehouse & Logistics Executive',
    department: 'Warehouse & Logistics',
    phone: '01911-456789',
    email: 'kabir.depot@sunbirdcorp.com',
    joiningDate: '2024-01-10',
    basicSalary: 22000,
    houseRent: 10000,
    medicalAllowance: 4000,
    conveyance: 4000,
    grossSalary: 40000,
    bankAccountNo: 'Brac Bank - 4401923',
    status: 'ACTIVE',
    attendanceDays: 25,
  },
];

export function ErpHrmView() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<HrmEmployee[]>(INITIAL_EMPLOYEES);
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'PAYROLL' | 'ATTENDANCE'>('EMPLOYEES');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New employee form
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState<HrmEmployee['department']>('Sales & Marketing');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [grossSalary, setGrossSalary] = useState<number>(45000);
  const [bankAcc, setBankAcc] = useState('');

  const totalPayroll = employees.reduce((sum, e) => sum + e.grossSalary, 0);

  const handleDisbursePayroll = () => {
    showToast(`চলতি মাসের মোট ৳${totalPayroll.toLocaleString()} টাকা বেতন সফলভাবে বিতরণ করা হয়েছে!`, 'success');
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const basic = Math.round(grossSalary * 0.6);
    const houseRent = Math.round(grossSalary * 0.25);
    const medical = Math.round(grossSalary * 0.1);
    const conveyance = grossSalary - (basic + houseRent + medical);

    const newEmp: HrmEmployee = {
      id: `emp-${Date.now()}`,
      employeeCode: `SBC-EMP-${String(employees.length + 1).padStart(3, '0')}`,
      name,
      designation,
      department,
      phone,
      email,
      joiningDate: new Date().toISOString().split('T')[0],
      basicSalary: basic,
      houseRent,
      medicalAllowance: medical,
      conveyance,
      grossSalary,
      bankAccountNo: bankAcc || 'Cash Account',
      status: 'ACTIVE',
      attendanceDays: 24,
    };

    setEmployees([...employees, newEmp]);
    showToast(`কর্মচারী "${name}" এইচ আর ডাটাবেজে যুক্ত হয়েছে।`, 'success');
    setIsAddModalOpen(false);
  };

  const filteredEmployees = employees.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="hrm-container space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>এইচ আর ও পে-রোল ম্যানেজমেন্ট (HRM & Payroll)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            কর্মচারীদের প্রোফাইল, মাসিক বেতন শীট ও হাজিরা ট্র্যাকিং
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কর্মচারী যুক্ত করুন</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">মোট সক্রিয় স্টাফ</p>
          <p className="text-2xl font-bold text-white font-mono">{employees.length} জন</p>
          <p className="text-[10px] text-emerald-400">১০০% বায়োমেডিক্যাল ও সেলস টিম উপস্থিত</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">মাসিক মোট বেতন বিল (Payroll)</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono">৳{totalPayroll.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">বেসিক + বাড়িভাড়া + চিকিৎসা ভাতা</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-xs text-slate-400">গড় কর্মদিবস উপস্থিতি</p>
          <p className="text-2xl font-bold text-sky-400 font-mono">৯৬.৪%</p>
          <p className="text-[10px] text-slate-400">চলতি মাসের বায়োমেট্রিক লগ</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('EMPLOYEES')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'EMPLOYEES'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          কর্মচারীদের তালিকা
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PAYROLL')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            activeTab === 'PAYROLL'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          মাসিক পে-রোল ও বেতন শীট
        </button>
      </div>

      {/* Tab 1: Employee Directory */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80 text-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="কর্মচারীর নাম বা পদবী খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">কোড</th>
                    <th className="px-5 py-3.5">নাম ও যোগাযোগ</th>
                    <th className="px-5 py-3.5">পদবী ও বিভাগ</th>
                    <th className="px-5 py-3.5">যোগদানের তারিখ</th>
                    <th className="px-5 py-3.5 text-right">মূল বেতন</th>
                    <th className="px-5 py-3.5 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-400 font-bold">
                        {emp.employeeCode}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-white">{emp.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.phone}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-200">{emp.designation}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{emp.joiningDate}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400">
                        ৳{emp.grossSalary.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          {emp.status}
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

      {/* Tab 2: Payroll Sheet */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <p className="font-bold text-white">চলতি মাসের স্যালারি শীট ও ডিসবার্সমেন্ট</p>
              <p className="text-slate-400">সকল ভাতার সাথে স্বয়ংক্রিয় লেজার পোস্টিং</p>
            </div>
            <button
              type="button"
              onClick={handleDisbursePayroll}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>বেতন প্রদান করুন (Disburse All)</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">কর্মচারীর নাম</th>
                    <th className="px-4 py-3.5 text-right">মূল বেতন (Basic)</th>
                    <th className="px-4 py-3.5 text-right">বাড়িভাড়া (House)</th>
                    <th className="px-4 py-3.5 text-right">চিকিৎসা (Medical)</th>
                    <th className="px-4 py-3.5 text-right">যাতায়াত (Conv.)</th>
                    <th className="px-4 py-3.5 text-right">মোট প্রদেয় (Gross)</th>
                    <th className="px-4 py-3.5">ব্যাংক হিসাব</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-white">{emp.name}</td>
                      <td className="px-4 py-3.5 text-right font-mono">৳{emp.basicSalary.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-mono">৳{emp.houseRent.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-mono">৳{emp.medicalAllowance.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-mono">৳{emp.conveyance.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                        ৳{emp.grossSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">{emp.bankAccountNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>নতুন কর্মচারী যুক্ত করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোঃ আশিকুর রহমান"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">পদবী *</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="যেমন: সেলস এক্সিকিউটিভ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">বিভাগ</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as HrmEmployee['department'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Biomedical & QC">Biomedical & QC</option>
                    <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="HR & Admin">HR & Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">মোবাইল নাম্বার *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ইমেইল</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@sunbirdcorp.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">মোট বেতন (Gross Salary ৳) *</label>
                  <input
                    type="number"
                    required
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ব্যাংক একাউন্ট নম্বর</label>
                  <input
                    type="text"
                    value={bankAcc}
                    onChange={(e) => setBankAcc(e.target.value)}
                    placeholder="Bank Name & A/C"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ErpHrmView;

