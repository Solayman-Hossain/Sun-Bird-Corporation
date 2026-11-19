'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  Clock,
  Shield,
  FileText,
  AlertCircle,
  TrendingUp,
  Download,
  Printer,
  ChevronRight,
  Filter,
  RefreshCw,
  Send,
  Eye,
  Check,
  Ban,
  UserPlus,
  BookOpen,
  PieChart,
  Settings,
  HelpCircle,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { HrmSubmodule } from '../../types';
import { hrmService, EmployeeProfileData } from '../../services/hrm.service';

interface ErpHrmViewProps {
  submodule?: HrmSubmodule;
  onSelectSubmodule?: (submodule: HrmSubmodule) => void;
}

export function ErpHrmView({ submodule = 'hr-dashboard', onSelectSubmodule }: ErpHrmViewProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Navigation State
  const activeSubmodule: HrmSubmodule = submodule || 'hr-dashboard';
  const setSubmodule = (s: HrmSubmodule) => {
    if (onSelectSubmodule) onSelectSubmodule(s);
  };

  // Global State
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');

  // Domain Data States
  const [employees, setEmployees] = useState<EmployeeProfileData[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [jobGrades, setJobGrades] = useState<any[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [salaryComponents, setSalaryComponents] = useState<any[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);
  const [payrollBatches, setPayrollBatches] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [expenseClaims, setExpenseClaims] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [hrSettings, setHrSettings] = useState<any | null>(null);
  const [headcountReport, setHeadcountReport] = useState<any>(null);

  // Modals State
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeProfileData | null>(null);
  const [idCardData, setIdCardData] = useState<any>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  // Form inputs for modals
  const [newEmpForm, setNewEmpForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    department: '',
    designation: '',
    joiningDate: '2026-01-01',
    basicSalary: 30000,
    houseRentAllowance: 12000,
    medicalAllowance: 4000,
    conveyanceAllowance: 4000,
  });

  const [punchForm, setPunchForm] = useState({
    employeeId: '',
    punchType: 'IN' as 'IN' | 'OUT',
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '2026-01-01',
    endDate: '2026-01-01',
    reason: '',
  });

  const [payrollForm, setPayrollForm] = useState({
    monthYear: '2026-11',
  });

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desigRes, batchesRes] = await Promise.allSettled([
        hrmService.getEmployees(),
        hrmService.getDepartments(),
        hrmService.getDesignations(),
        hrmService.getPayrollBatches(),
      ]);

      if (empRes.status === 'fulfilled') setEmployees(empRes.value.employees || []);
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value || []);
      if (desigRes.status === 'fulfilled') setDesignations(desigRes.value || []);
      if (batchesRes.status === 'fulfilled') setPayrollBatches(batchesRes.value || []);
    } catch (err) {
      console.error('Failed to load initial HRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const curMonth = today.slice(0, 7);
      setNewEmpForm((prev) => ({ ...prev, joiningDate: today }));
      setLeaveForm((prev) => ({ ...prev, startDate: today, endDate: today }));
      setPayrollForm({ monthYear: curMonth });
    } catch {}
    loadData();
  }, []);

  // Submodule specific loading
  useEffect(() => {
    const fetchSubmoduleData = async () => {
      try {
        if (activeSubmodule === 'departments' && departments.length === 0) {
          const d = await hrmService.getDepartments();
          setDepartments(d);
        } else if (activeSubmodule === 'designations' && designations.length === 0) {
          const des = await hrmService.getDesignations();
          setDesignations(des);
        } else if (activeSubmodule === 'job-grades' && jobGrades.length === 0) {
          const jg = await hrmService.getJobGrades();
          setJobGrades(jg);
        } else if (activeSubmodule === 'employment-types' && employmentTypes.length === 0) {
          const et = await hrmService.getEmploymentTypes();
          setEmploymentTypes(et);
        } else if (['shift-management', 'shift-assignment'].includes(activeSubmodule) && shifts.length === 0) {
          const s = await hrmService.getShifts();
          setShifts(s);
        } else if (activeSubmodule === 'holiday-management' && holidays.length === 0) {
          const h = await hrmService.getHolidays();
          setHolidays(h);
        } else if (['leave-management', 'leave-requests', 'leave-approval'].includes(activeSubmodule)) {
          const [lr, lt] = await Promise.all([hrmService.getLeaveRequests(), hrmService.getLeaveTypes()]);
          setLeaveRequests(lr);
          setLeaveTypes(lt);
        } else if (['salary-components', 'salary-structure'].includes(activeSubmodule)) {
          const [sc, ss] = await Promise.all([hrmService.getSalaryComponents(), hrmService.getSalaryStructures()]);
          setSalaryComponents(sc);
          setSalaryStructures(ss);
        } else if (['payslip', 'payroll-history'].includes(activeSubmodule)) {
          const ps = await hrmService.getPayslips();
          setPayslips(ps);
        } else if (['employee-advance', 'employee-loan'].includes(activeSubmodule)) {
          const [adv, ln] = await Promise.all([hrmService.getAdvances(), hrmService.getEmployeeLoans()]);
          setAdvances(adv);
          setLoans(ln);
        } else if (activeSubmodule === 'expense-reimbursement') {
          const ec = await hrmService.getExpenseClaims();
          setExpenseClaims(ec);
        } else if (activeSubmodule === 'performance-management') {
          const pr = await hrmService.getPerformanceReviews();
          setPerformanceReviews(pr);
        } else if (activeSubmodule === 'training-development') {
          const tr = await hrmService.getTrainingRecords();
          setTrainingRecords(tr);
        } else if (activeSubmodule === 'hr-reports') {
          const rpt = await hrmService.getHeadcountReport();
          setHeadcountReport(rpt);
        } else if (activeSubmodule === 'hr-audit-logs') {
          const logs = await hrmService.getHrAuditLogs();
          setAuditLogs(logs);
        } else if (activeSubmodule === 'hr-settings') {
          const st = await hrmService.getSettings();
          setHrSettings(st);
        }
      } catch (err) {
        console.error('Error fetching data for submodule', activeSubmodule, err);
      }
    };
    fetchSubmoduleData();
  }, [activeSubmodule]);

  // Handlers
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await hrmService.createEmployee(newEmpForm);
      setEmployees((prev) => [created, ...prev]);
      setShowAddEmpModal(false);
      showToast(`কর্মী ${created.employeeCode} সফলভাবে তৈরি হয়েছে!`, 'success');
      setNewEmpForm({
        fullName: '',
        email: '',
        mobile: '',
        department: '',
        designation: '',
        joiningDate: new Date().toISOString().slice(0, 10),
        basicSalary: 30000,
        houseRentAllowance: 12000,
        medicalAllowance: 4000,
        conveyanceAllowance: 4000,
      });
    } catch (err: any) {
      showToast(err.message || 'কর্মী যোগ করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  const handlePunchAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchForm.employeeId) {
      showToast('কর্মী নির্বাচন করুন', 'error');
      return;
    }
    try {
      const emp = employees.find((x) => x._id === punchForm.employeeId);
      const timeStr = new Date().toTimeString().slice(0, 5);
      await hrmService.importAttendance([
        {
          employeeCode: emp?.employeeCode || 'EMP',
          punchDate: new Date().toISOString().slice(0, 10),
          inTime: punchForm.punchType === 'IN' ? timeStr : undefined,
          outTime: punchForm.punchType === 'OUT' ? timeStr : undefined,
        },
      ]);
      setShowPunchModal(false);
      showToast(`উপস্থিতি পাঞ্চ ${punchForm.punchType} সফল হয়েছে!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'পাঞ্চ ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

      const req = await hrmService.submitLeaveRequest({
        employeeId: leaveForm.employeeId,
        leaveTypeId: leaveForm.leaveTypeId,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        totalDays,
        reason: leaveForm.reason,
      });
      setLeaveRequests((prev) => [req, ...prev]);
      setShowLeaveModal(false);
      showToast('ছুটির আবেদন সফলভাবে দাখিল হয়েছে!', 'success');
    } catch (err: any) {
      showToast(err.message || 'ছুটির আবেদন ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleApproveLeave = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const updated = await hrmService.processLeaveApproval(id, action, 'ERP Admin Approved');
      setLeaveRequests((prev) => prev.map((l) => (l._id === id ? updated : l)));
      showToast(`ছুটির আবেদন ${action === 'APPROVED' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'অনুমোদন ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleComputePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const batch = await hrmService.computePayrollBatch(payrollForm.monthYear);
      setPayrollBatches((prev) => [batch, ...prev]);
      setShowPayrollModal(false);
      showToast(`পে-রোল ব্যাচ ${batch.batchCode} হিসাব সম্পন্ন হয়েছে!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'পে-রোল প্রস্তুত করতে ব্যর্থ হয়েছে', 'error');
    }
  };

  const handlePostGL = async (id: string) => {
    try {
      const res = await hrmService.postBatchToGl(id);
      setPayrollBatches((prev) => prev.map((b) => (b._id === id ? res.batch : b)));
      showToast(`জেনারেল লেজারে পোস্টিং সম্পন্ন হয়েছে! ভাউচার: ${res.journalRef}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'লেজার পোস্টিং ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleDisbursePayroll = async (id: string) => {
    try {
      const updated = await hrmService.disburseSalaryPayment(id, 'BANK_TRANSFER');
      setPayrollBatches((prev) => prev.map((b) => (b._id === id ? updated : b)));
      showToast('বেতন বিতরণ সফলভাবে সম্পন্ন হয়েছে!', 'success');
    } catch (err: any) {
      showToast(err.message || 'বিতরণ ব্যর্থ হয়েছে', 'error');
    }
  };

  const handleViewIdCard = async (emp: EmployeeProfileData) => {
    try {
      const card = await hrmService.getEmployeeIdCard(emp._id);
      setIdCardData(card);
      setSelectedEmp(emp);
    } catch (err) {
      showToast('আইডি কার্ড ডাটা লোড ব্যর্থ হয়েছে', 'error');
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp.employeeCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (emp.userId?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (emp.designation?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === 'ALL' || emp.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  // Calculate Metrics for Dashboard
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.isActive).length;
  const totalGrossPayroll = employees.reduce((sum, e) => sum + (e.grossSalary || 0), 0);
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'PENDING').length;
  const totalDepartments = departments.length;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Header & Submodule Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1e3932] uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>MODULE 10 — মানবসম্পদ ও পে-রোল ব্যবস্থাপনা (HRM & Payroll)</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 font-serif">
            {activeSubmodule.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            সেন্ট্রাল কর্মী প্রোফাইল, উপস্থিতি ট্র্যাকিং, বায়োমেট্রিক পাঞ্চ, ছুটি ও ডাবল-এন্ট্রি পে-রোল অ্যাকাউন্টিং।
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPunchModal(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>উপস্থিতি পাঞ্চ (Punch)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>ছুটির আবেদন (Leave)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPayrollModal(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>পে-রোল রান (Payroll)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddEmpModal(true)}
            className="px-3 py-2 bg-[#1e3932] hover:bg-[#152823] text-[#e6b980] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>নতুন কর্মী যোগ</span>
          </button>
        </div>
      </div>

      {/* Submodule Quick Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs">
        {[
          { id: 'hr-dashboard' as HrmSubmodule, label: 'ওভারভিউ ড্যাশবোর্ড' },
          { id: 'employee-management' as HrmSubmodule, label: 'কর্মী ব্যবস্থাপনা' },
          { id: 'employee-directory' as HrmSubmodule, label: 'ডিরেক্টরি ও আইডি' },
          { id: 'departments' as HrmSubmodule, label: 'ডিপার্টমেন্ট ও পদবি' },
          { id: 'attendance-management' as HrmSubmodule, label: 'উপস্থিতি ও শিফট' },
          { id: 'leave-requests' as HrmSubmodule, label: 'ছুটি অনুমোদন' },
          { id: 'payroll-management' as HrmSubmodule, label: 'পে-রোল ও লেজার' },
          { id: 'payslip' as HrmSubmodule, label: 'পে-স্লিপ সমূহ' },
          { id: 'employee-loan' as HrmSubmodule, label: 'ঋণ ও অগ্রিম' },
          { id: 'expense-reimbursement' as HrmSubmodule, label: 'খরচ রিইমবার্স' },
          { id: 'performance-management' as HrmSubmodule, label: 'পারফরম্যান্স ও ট্রেনিং' },
          { id: 'hr-reports' as HrmSubmodule, label: 'এইচআর রিপোর্টস' },
          { id: 'hr-settings' as HrmSubmodule, label: 'সেটিংস' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSubmodule(item.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 cursor-pointer transition-all ${
              activeSubmodule === item.id
                ? 'bg-[#1e3932] text-[#e6b980] shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. SUBMODULE: HR DASHBOARD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubmodule === 'hr-dashboard' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">মোট সক্রিয় কর্মী</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-extrabold text-2xl font-mono text-slate-900">
                {activeEmployees} জন
              </div>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>১০০% ভেরিফাইড প্রোফাইল</span>
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">মাসিক গ্রস পে-রোল দায়</span>
                <DollarSign className="w-4 h-4 text-[#1e3932]" />
              </div>
              <div className="font-extrabold text-2xl font-mono text-slate-900">
                ৳{totalGrossPayroll.toLocaleString()}
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                ডাবল-এন্ট্রি অ্যাক্রুয়াল ভিত্তিক
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">অপেক্ষমান ছুটির আবেদন</span>
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="font-extrabold text-2xl font-mono text-slate-900">
                {pendingLeaves} টি
              </div>
              <span className="text-xs text-amber-800 font-semibold">
                রিভিউ ও অনুমোদন প্রয়োজন
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">ডিপার্টমেন্ট সমূহ</span>
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-extrabold text-2xl font-mono text-slate-900">
                {totalDepartments} টি
              </div>
              <span className="text-xs text-blue-700 font-semibold">
                তেজগাঁও সেন্ট্রাল ওয়্যারহাউজ সহ
              </span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setSubmodule('employee-management')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#1e3932] shadow-xs cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">কর্মী তালিকা ও অনবোর্ডিং</h4>
                  <p className="text-xs text-slate-500">অনবোর্ডিং চেকলিস্ট ও ডকুমেন্টস</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div
              onClick={() => setSubmodule('payroll-management')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#1e3932] shadow-xs cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">মাসিক পে-রোল প্রসেসিং</h4>
                  <p className="text-xs text-slate-500">GL পোস্টিং ও ব্যাংক বিতরণ</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div
              onClick={() => setSubmodule('attendance-management')}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#1e3932] shadow-xs cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">উপস্থিতি ও শিফট রোস্টার</h4>
                  <p className="text-xs text-slate-500">বায়োমেট্রিক ও জিওফেন্স লগ</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. SUBMODULE: EMPLOYEE MANAGEMENT & DIRECTORY */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['employee-management', 'employee-directory', 'employee-profile'].includes(activeSubmodule) && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="নাম, কোড বা পদবি দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e3932]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
              >
                <option value="ALL">সকল ডিপার্টমেন্ট</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="রিফ্রেশ"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">কর্মী ও কোড</th>
                    <th className="px-4 py-3">পদবি ও বিভাগ</th>
                    <th className="px-4 py-3">যোগদান তারিখ</th>
                    <th className="px-4 py-3 text-right">গ্রস বেতন</th>
                    <th className="px-4 py-3">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        কোন কর্মী পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#1e3932] text-[#e6b980] flex items-center justify-center font-bold text-[10px]">
                              {emp.employeeCode.slice(-3)}
                            </div>
                            <div>
                              <div>{emp.userId?.fullName || emp.personalInfo?.firstName || 'কর্মী'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{emp.employeeCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div>{emp.designation}</div>
                          <div className="text-[10px] text-slate-400">{emp.department}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono">
                          {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('bn-BD') : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ৳{(emp.grossSalary || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {emp.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleViewIdCard(emp)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="আইডি কার্ড"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedEmp(emp)}
                              className="p-1 text-slate-500 hover:text-[#1e3932] hover:bg-slate-100 rounded-md transition-colors"
                              title="বিস্তারিত প্রোফাইল"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. SUBMODULE: DEPARTMENTS & DESIGNATIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['departments', 'designations', 'job-grades', 'employment-types'].includes(activeSubmodule) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departments Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-[#1e3932]" />
                <span>ডিপার্টমেন্ট সমূহ ({departments.length})</span>
              </h3>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              {departments.map((dept) => (
                <div key={dept._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-800">{dept.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{dept.departmentCode}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                    সক্রিয়
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Designations Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>পদবি সমূহ ({designations.length})</span>
              </h3>
            </div>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              {designations.map((des) => (
                <div key={des._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-800">{des.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{des.designationCode}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold">
                    সক্রিয়
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. SUBMODULE: ATTENDANCE & SHIFTS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['attendance-management', 'attendance-dashboard', 'attendance-entry', 'shift-management'].includes(
        activeSubmodule
      ) && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">বায়োমেট্রিক ও জিওফেন্স উপস্থিতি লগ</h3>
            <p className="text-xs text-slate-500 mb-4">
              তেজগাঁও সেন্ট্রাল ডিপো ও কুরিয়ার ট্রানজিট হাবের লাইভ উপস্থিতি ট্র্যাকিং।
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 text-xs">আজকের লাইভ উপস্থিতি পাঞ্চ সম্পন্ন করুন</span>
                <p className="text-[11px] text-slate-500">ইন / আউট পাঞ্চ ১৫ মিনিট গ্রেস পিরিয়ড অন্তর্ভুক্ত</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPunchModal(true)}
                className="px-3 py-1.5 bg-[#1e3932] text-white rounded-lg text-xs font-bold hover:bg-[#152823] cursor-pointer"
              >
                এখনই পাঞ্চ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. SUBMODULE: LEAVE MANAGEMENT & APPROVAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['leave-management', 'leave-requests', 'leave-approval', 'leave-types', 'leave-balance'].includes(
        activeSubmodule
      ) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">ছুটির আবেদন তালিকা ও অনুমোদন ওয়ার্কফ্লো</h3>
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer"
            >
              + নতুন আবেদন
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">আবেদন নং</th>
                  <th className="px-4 py-3">কর্মী</th>
                  <th className="px-4 py-3">ছুটির সময়কাল</th>
                  <th className="px-4 py-3">দিন</th>
                  <th className="px-4 py-3">কারণ</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      কোন ছুটির আবেদন পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{req.leaveNumber}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{req.employeeId?.employeeCode || 'কর্মী'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(req.startDate).toLocaleDateString('bn-BD')} —{' '}
                        {new Date(req.endDate).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{req.totalDays} দিন</td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{req.reason}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {req.status === 'PENDING' && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleApproveLeave(req._id, 'APPROVED')}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                            >
                              অনুমোদন
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveLeave(req._id, 'REJECTED')}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                            >
                              বাতিল
                            </button>
                          </div>
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. SUBMODULE: PAYROLL BATCHES & GL POSTING */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['payroll-management', 'payroll-dashboard', 'payroll-processing', 'payroll-review', 'payroll-approval'].includes(
        activeSubmodule
      ) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">মাসিক পে-রোল ব্যাচ ও ডাবল-এন্ট্রি অ্যাকাউন্টিং</h3>
              <p className="text-xs text-slate-500">
                স্যালারি এক্সপেন্স (Debit 6110) ও অ্যাক্রুড স্যালারিজ (Credit 2100) স্বয়ংক্রিয় পোস্টিং।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPayrollModal(true)}
              className="px-3 py-1.5 bg-[#1e3932] text-white rounded-lg text-xs font-bold hover:bg-[#152823] cursor-pointer"
            >
              + নতুন পে-রোল ব্যাচ রান
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ব্যাচ কোড</th>
                  <th className="px-4 py-3">মাস</th>
                  <th className="px-4 py-3 text-right">মোট গ্রস</th>
                  <th className="px-4 py-3 text-right">মোট কর্তন</th>
                  <th className="px-4 py-3 text-right">মোট নিট বেতন</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-center">লেজার পোস্টিং ও বিতরণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      কোন পে-রোল ব্যাচ প্রস্তুত করা হয়নি।
                    </td>
                  </tr>
                ) : (
                  payrollBatches.map((batch) => (
                    <tr key={batch._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{batch.batchCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{batch.monthYear}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        ৳{batch.totalGross.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">
                        ৳{batch.totalDeductions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        ৳{batch.totalNet.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            batch.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : batch.status === 'POSTED_GL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {batch.status === 'REVIEWED' && (
                            <button
                              type="button"
                              onClick={() => handlePostGL(batch._id)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700"
                            >
                              GL Post
                            </button>
                          )}
                          {batch.status === 'POSTED_GL' && (
                            <button
                              type="button"
                              onClick={() => handleDisbursePayroll(batch._id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                            >
                              বিতরণ (Pay)
                            </button>
                          )}
                          {batch.journalRef && (
                            <span className="font-mono text-[10px] text-slate-500">JV: {batch.journalRef}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. SUBMODULE: PAYSLIPS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['payslip', 'payroll-history'].includes(activeSubmodule) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">কর্মীদের ডিজিটাল পে-স্লিপ সমূহ</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">স্লিপ নং</th>
                  <th className="px-4 py-3">মাস</th>
                  <th className="px-4 py-3 text-right">মূল বেতন</th>
                  <th className="px-4 py-3 text-right">গ্রস বেতন</th>
                  <th className="px-4 py-3 text-right">কর্তন</th>
                  <th className="px-4 py-3 text-right">নিট প্রদেয়</th>
                  <th className="px-4 py-3">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      কোন পে-স্লিপ পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  payslips.map((ps) => (
                    <tr key={ps._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{ps.payslipNo}</td>
                      <td className="px-4 py-3 text-slate-700">{ps.monthYear}</td>
                      <td className="px-4 py-3 text-right font-mono">৳{ps.basicSalary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">৳{ps.grossSalary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">
                        ৳{ps.totalDeductions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        ৳{ps.netSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ps.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {ps.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. SUBMODULE: LOANS, ADVANCES & CLAIMS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['employee-loan', 'employee-advance', 'expense-reimbursement'].includes(activeSubmodule) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Advances Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">বেতন অগ্রিম (Salary Advances)</h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              {advances.length === 0 ? (
                <div className="p-4 text-center text-slate-400">কোন অগ্রিম রেকর্ড নেই</div>
              ) : (
                advances.map((adv) => (
                  <div key={adv._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">৳{adv.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">{adv.purpose}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                      {adv.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expense Claims Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">খরচ রিইমবার্সমেন্ট (Expense Claims)</h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              {expenseClaims.length === 0 ? (
                <div className="p-4 text-center text-slate-400">কোন ক্লেইম নেই</div>
              ) : (
                expenseClaims.map((claim) => (
                  <div key={claim._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">৳{claim.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">{claim.description}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      {claim.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. SUBMODULE: PERFORMANCE & TRAINING */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['performance-management', 'training-development'].includes(activeSubmodule) && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">কর্মীদের বার্ষিক মূল্যায়ন ও ট্রেনিং প্রোগ্রাম</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {trainingRecords.map((tr) => (
              <div key={tr._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 text-sm">{tr.title}</div>
                <div className="text-slate-600">প্রশিক্ষক: {tr.trainer}</div>
                <div className="text-slate-500 text-[11px]">ভেন্যু: {tr.venue || 'তেজগাঁও ট্রেনিং ল্যাব'}</div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-mono">
                  <span>বাজেট: ৳{tr.cost?.toLocaleString() || 0}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {tr.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 10. SUBMODULE: HR REPORTS, SETTINGS & AUDIT LOGS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {['hr-reports', 'hr-audit-logs', 'hr-settings'].includes(activeSubmodule) && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">
            {activeSubmodule === 'hr-reports' && 'মানবসম্পদ হেডকাউন্ট ও অ্যানালিটিক্স রিপোর্ট'}
            {activeSubmodule === 'hr-audit-logs' && 'এইচআর অডিট ট্রেইল ও কার্যক্রম লগ'}
            {activeSubmodule === 'hr-settings' && 'এইচআর পলিসি ও কাজের নিয়মাবলী'}
          </h3>

          {activeSubmodule === 'hr-settings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">মাসে কাজের দিন:</span>
                <div className="font-mono text-lg font-extrabold text-[#1e3932]">
                  {hrSettings?.workingDaysPerMonth || 26} দিন
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">উপস্থিতি গ্রেস পিরিয়ড:</span>
                <div className="font-mono text-lg font-extrabold text-[#1e3932]">
                  {hrSettings?.lateGraceMinutes || 15} মিনিট
                </div>
              </div>
            </div>
          )}

          {activeSubmodule === 'hr-audit-logs' && (
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-slate-500 ml-2">{log.entityName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD EMPLOYEE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">নতুন কর্মী নিবন্ধন (Employee Onboarding)</h3>
              <button
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">পূর্ণ নাম</label>
                <input
                  type="text"
                  required
                  value={newEmpForm.fullName}
                  onChange={(e) => setNewEmpForm({ ...newEmpForm, fullName: e.target.value })}
                  placeholder="উদাঃ মোঃ রফিকুল ইসলাম"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1e3932]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    required
                    value={newEmpForm.mobile}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, mobile: e.target.value })}
                    placeholder="01711..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ইমেইল</label>
                  <input
                    type="email"
                    required
                    value={newEmpForm.email}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, email: e.target.value })}
                    placeholder="emp@sunbirdcorp.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ডিপার্টমেন্ট</label>
                  <input
                    type="text"
                    required
                    value={newEmpForm.department}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, department: e.target.value })}
                    placeholder="Biomedical & QC"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">পদবি</label>
                  <input
                    type="text"
                    required
                    value={newEmpForm.designation}
                    onChange={(e) => setNewEmpForm({ ...newEmpForm, designation: e.target.value })}
                    placeholder="Biomedical Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">মূল বেতন (Basic BDT)</label>
                  <input
                    type="number"
                    required
                    value={newEmpForm.basicSalary}
                    onChange={(e) =>
                      setNewEmpForm({ ...newEmpForm, basicSalary: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">বাড়ি ভাড়া (House Rent)</label>
                  <input
                    type="number"
                    value={newEmpForm.houseRentAllowance}
                    onChange={(e) =>
                      setNewEmpForm({ ...newEmpForm, houseRentAllowance: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e3932] text-[#e6b980] rounded-xl font-bold hover:bg-[#152823]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: PUNCH ATTENDANCE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showPunchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">উপস্থিতি পাঞ্চ (Attendance Punch)</h3>
              <button
                type="button"
                onClick={() => setShowPunchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePunchAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">কর্মী নির্বাচন করুন</label>
                <select
                  required
                  value={punchForm.employeeId}
                  onChange={(e) => setPunchForm({ ...punchForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="">নির্বাচন করুন...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employeeCode} — {emp.userId?.fullName || 'কর্মী'} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পাঞ্চ টাইপ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPunchForm({ ...punchForm, punchType: 'IN' })}
                    className={`py-2 rounded-xl font-bold text-center cursor-pointer ${
                      punchForm.punchType === 'IN'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    IN (প্রবেশ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPunchForm({ ...punchForm, punchType: 'OUT' })}
                    className={`py-2 rounded-xl font-bold text-center cursor-pointer ${
                      punchForm.punchType === 'OUT'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    OUT (প্রস্থান)
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>তেজগাঁও সেন্ট্রাল ডিপো (জিপিএস ভেরিফাইড)</span>
                </div>
                <p>দূরত্ব: ১০ মিটার (অনুমোদিত জিওফেন্সের মধ্যে)</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPunchModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  পাঞ্চ রেকর্ড করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: APPLY LEAVE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">ছুটির আবেদন (Leave Application)</h3>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">কর্মী</label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="">কর্মী নির্বাচন করুন...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employeeCode} — {emp.userId?.fullName || 'কর্মী'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ছুটির ধরন</label>
                <select
                  required
                  value={leaveForm.leaveTypeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="">নির্বাচন করুন...</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt._id} value={lt._id}>
                      {lt.name} ({lt.code}) — কোটা: {lt.annualQuota} দিন
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">শুরু</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">শেষ</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">কারণ</label>
                <textarea
                  rows={2}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="ছুটির সুনির্দিষ্ট কারণ লিখুন..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700"
                >
                  আবেদন জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: RUN PAYROLL BATCH */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">মাসিক পে-রোল হিসাব (Payroll Compute)</h3>
              <button
                type="button"
                onClick={() => setShowPayrollModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleComputePayroll} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">হিসাবের মাস (YYYY-MM)</label>
                <input
                  type="month"
                  required
                  value={payrollForm.monthYear}
                  onChange={(e) => setPayrollForm({ ...payrollForm, monthYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none font-mono"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                এই প্রক্রিয়া সকল সক্রিয় কর্মীর বেতন কাঠামো, অনুপস্থিতি কর্তন, লোন কিস্তি ও অগ্রিম সমন্বয় করে
                স্বয়ংক্রিয় পে-স্লিপ তৈরি করবে।
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  পে-রোল রান করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: EMPLOYEE ID CARD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {idCardData && selectedEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ডিজিটাল আইডি কার্ড
              </span>
              <button
                type="button"
                onClick={() => {
                  setIdCardData(null);
                  setSelectedEmp(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ID Card Design */}
            <div className="border border-slate-300 rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-[#1e3932] to-slate-900 text-white shadow-lg space-y-3">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#e6b980]">
                SUN BIRD CORPORATION
              </div>

              <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-[#e6b980] mx-auto flex items-center justify-center text-xl font-black text-[#e6b980]">
                {idCardData.employeeCode.slice(-3)}
              </div>

              <div>
                <h4 className="font-extrabold text-base text-white">{idCardData.fullName}</h4>
                <p className="text-xs text-[#e6b980]">{idCardData.designation}</p>
                <p className="text-[10px] text-slate-300">{idCardData.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left bg-black/30 p-2.5 rounded-xl text-[10px] font-mono">
                <div>
                  <span className="text-slate-400 block">ID:</span>
                  <span className="text-white font-bold">{idCardData.employeeCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">BLOOD:</span>
                  <span className="text-rose-400 font-bold">{idCardData.bloodGroup || 'B+'}</span>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 font-mono">
                Tejgaon Central Depot • Authorized Personnel
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>আইডি কার্ড প্রিন্ট করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
