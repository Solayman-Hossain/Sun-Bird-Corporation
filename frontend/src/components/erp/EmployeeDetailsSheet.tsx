'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Save,
  X,
  Printer,
  Download,
  List,
  User,
  Search,
  RefreshCw,
  Check,
  FileText,
  Calendar,
  AlertCircle,
  Building,
  Briefcase,
  Clock,
  Phone,
  Mail,
  Award
} from 'lucide-react';
import { hrmService, EmployeeProfileData } from '../../services/hrm.service';
import { useToast } from '../../context/ToastContext';

interface EmployeeFormState {
  _id?: string;
  employeeCode: string;
  depSl?: number | string;
  salSl?: number | string;
  nidNumber?: string;
  photoUrl?: string;
  signUrl?: string;
  fullName: string;
  againstId?: string;
  againstName?: string;
  fatherOrHusbandName?: string;
  motherName?: string;
  accountName?: string;
  accountNo?: string;
  age?: number | string;
  gender?: string;
  bankName?: string;
  permanentAddress?: string;
  presentAddress?: string;
  attendanceCount?: number | string;
  hasSignature?: boolean;
  cityDistrict?: string;
  personalPhone?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  qualification?: string;
  highQualification?: string;
  jobDuration?: string;
  currentDate?: string;
  joiningDate?: string;
  joiningSalary?: number | string;
  currentSalary?: number | string;
  allowance?: number | string;
  overtime?: number | string;
  department: string;
  designation: string;
  jobGrade?: string;
  dateOfModify?: string;
  idCardGiven?: boolean;
  idCardGivenDate?: string;
  isResigned?: boolean;
  terminationOrResignedDate?: string;
  jobDescriptionCategory?: string;
  jobDescriptionIndividual?: string;
  responsibilitiesIndividual?: string;
  leaveReport?: {
    cl?: number;
    sl?: number;
    wp?: number;
    ml?: number;
    el?: number;
    gh?: number;
  };
  leaveTick?: boolean;
  wtComment?: string;
}

const defaultForm: EmployeeFormState = {
  employeeCode: '',
  depSl: '0',
  salSl: '0',
  nidNumber: '',
  fullName: '',
  againstId: '',
  againstName: '',
  fatherOrHusbandName: '',
  motherName: '',
  accountName: '',
  accountNo: '',
  age: '',
  gender: 'Male',
  bankName: '',
  permanentAddress: '',
  presentAddress: '',
  attendanceCount: 0,
  hasSignature: false,
  cityDistrict: '',
  personalPhone: '',
  dateOfBirth: '',
  maritalStatus: 'Unmarried',
  bloodGroup: 'O+',
  nationality: 'Bangladeshi',
  religion: 'Islam',
  qualification: 'HSC',
  highQualification: 'H.S.C',
  jobDuration: '0',
  currentDate: '',
  joiningDate: '',
  joiningSalary: 10500,
  currentSalary: 10500,
  allowance: 0,
  overtime: 0,
  department: '',
  designation: '',
  jobGrade: 'Grade-B',
  dateOfModify: '',
  idCardGiven: false,
  idCardGivenDate: '',
  isResigned: false,
  terminationOrResignedDate: '',
  jobDescriptionCategory: 'Turn on all applicable appliances.\nCheck prep list and begin prep work for the day.\nNotifies Cafeteria Supervisor of any product problems.\nEnsures that food preparation, food handling procedures, food store correctly operates all food service equipment.',
  jobDescriptionIndividual: '',
  responsibilitiesIndividual: '',
  leaveReport: { cl: 0, sl: 0, wp: 0, ml: 0, el: 0, gh: 0 },
  leaveTick: false,
  wtComment: ''
};

export function EmployeeDetailsSheet() {
  const { showToast } = useToast();

  const [employees, setEmployees] = useState<EmployeeProfileData[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [jobGrades, setJobGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'view' | 'add' | 'edit'>('view');
  const [form, setForm] = useState<EmployeeFormState>(defaultForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [filterResignedOnly, setFilterResignedOnly] = useState(false);

  // Load Initial Data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desigRes, gradesRes] = await Promise.allSettled([
        hrmService.getEmployees({ limit: 500 }),
        hrmService.getDepartments(),
        hrmService.getDesignations(),
        hrmService.getJobGrades()
      ]);

      let empList: EmployeeProfileData[] = [];
      if (empRes.status === 'fulfilled' && empRes.value.employees) {
        empList = empRes.value.employees;
        setEmployees(empList);
      }
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value || []);
      if (desigRes.status === 'fulfilled') setDesignations(desigRes.value || []);
      if (gradesRes.status === 'fulfilled') setJobGrades(gradesRes.value || []);

      if (empList.length > 0) {
        loadEmployeeIntoForm(empList[0]);
        setCurrentIndex(0);
      }
    } catch (err: any) {
      console.error('Error loading employee details data:', err);
      showToast('ডাটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Map employee data to form
  const loadEmployeeIntoForm = (emp: EmployeeProfileData) => {
    const fullName =
      emp.userId?.fullName ||
      `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim() ||
      '';

    setForm({
      _id: emp._id,
      employeeCode: emp.employeeCode || '',
      depSl: emp.depSl ?? '0',
      salSl: emp.salSl ?? '0',
      nidNumber: emp.personalInfo?.nidNumber || '',
      photoUrl: emp.personalInfo?.photoUrl || '',
      fullName: fullName,
      againstId: emp.againstId || '',
      againstName: emp.againstName || '',
      fatherOrHusbandName: emp.fatherOrHusbandName || '',
      motherName: emp.motherName || '',
      accountName: emp.bankDetails?.accountName || '',
      accountNo: emp.bankDetails?.accountNo || '',
      age: emp.age || '',
      gender: emp.personalInfo?.gender || 'Male',
      bankName: emp.bankDetails?.bankName || '',
      permanentAddress: (emp.contactInfo as any)?.permanentAddress || '',
      presentAddress: emp.contactInfo?.presentAddress || '',
      attendanceCount: 0,
      hasSignature: false,
      cityDistrict: emp.cityDistrict || '',
      personalPhone: emp.contactInfo?.personalPhone || '',
      dateOfBirth: emp.personalInfo?.dateOfBirth ? String(emp.personalInfo.dateOfBirth).slice(0, 10) : '',
      maritalStatus: (emp.personalInfo as any)?.maritalStatus || 'Unmarried',
      bloodGroup: emp.personalInfo?.bloodGroup || 'O+',
      nationality: (emp.personalInfo as any)?.nationality || 'Bangladeshi',
      religion: (emp.personalInfo as any)?.religion || 'Islam',
      qualification: emp.qualification || 'HSC',
      highQualification: emp.highQualification || 'H.S.C',
      jobDuration: emp.jobDuration || '0',
      currentDate: new Date().toISOString().slice(0, 10),
      joiningDate: emp.joiningDate ? String(emp.joiningDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      joiningSalary: emp.joiningSalary ?? emp.basicSalary ?? 10500,
      currentSalary: emp.currentSalary ?? emp.grossSalary ?? 10500,
      allowance: emp.allowance ?? ((emp.houseRentAllowance || 0) + (emp.medicalAllowance || 0) + (emp.conveyanceAllowance || 0)),
      overtime: emp.overtime ?? 0,
      department: emp.department || '',
      designation: emp.designation || '',
      jobGrade: emp.jobGrade || 'Grade-B',
      dateOfModify: emp.dateOfModify ? String(emp.dateOfModify).slice(0, 10) : new Date().toISOString().slice(0, 10),
      idCardGiven: !!emp.idCardGiven,
      idCardGivenDate: emp.idCardGivenDate ? String(emp.idCardGivenDate).slice(0, 10) : '',
      isResigned: !!emp.isResigned,
      terminationOrResignedDate: emp.terminationOrResignedDate ? String(emp.terminationOrResignedDate).slice(0, 10) : '',
      jobDescriptionCategory: emp.jobDescriptionCategory || defaultForm.jobDescriptionCategory,
      jobDescriptionIndividual: emp.jobDescriptionIndividual || '',
      responsibilitiesIndividual: emp.responsibilitiesIndividual || '',
      leaveReport: emp.leaveReport || { cl: 0, sl: 0, wp: 0, ml: 0, el: 0, gh: 0 },
      leaveTick: false,
      wtComment: ''
    });
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (filterResignedOnly && !emp.isResigned) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const name = (
        emp.userId?.fullName ||
        `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`
      ).toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      const against = (emp.againstName || '').toLowerCase();
      return (
        name.includes(term) ||
        code.includes(term) ||
        dept.includes(term) ||
        desig.includes(term) ||
        against.includes(term)
      );
    });
  }, [employees, searchTerm, filterResignedOnly]);

  // Against ID lookup - auto populate againstName
  const handleAgainstIdChange = (id: string) => {
    setForm((prev) => {
      const match = employees.find(
        (e) => e.employeeCode.toLowerCase() === id.trim().toLowerCase()
      );
      const matchedName = match
        ? match.userId?.fullName || `${match.personalInfo?.firstName || ''} ${match.personalInfo?.lastName || ''}`.trim()
        : prev.againstName;
      return {
        ...prev,
        againstId: id,
        againstName: matchedName || prev.againstName
      };
    });
  };

  // Designation change - auto populate jobGrade
  const handleDesignationChange = (desigTitle: string) => {
    const matchedDesig = designations.find((d) => d.title === desigTitle || d.name === desigTitle);
    let autoGrade = form.jobGrade;
    if (matchedDesig?.grade || matchedDesig?.jobGrade) {
      autoGrade = matchedDesig.grade || matchedDesig.jobGrade;
    } else if (desigTitle.toLowerCase().includes('manager')) {
      autoGrade = 'Grade-A';
    } else if (desigTitle.toLowerCase().includes('officer') || desigTitle.toLowerCase().includes('executive')) {
      autoGrade = 'Grade-B';
    } else if (desigTitle.toLowerCase().includes('boy') || desigTitle.toLowerCase().includes('assistant')) {
      autoGrade = 'Grade-C';
    }
    setForm((prev) => ({
      ...prev,
      designation: desigTitle,
      jobGrade: autoGrade
    }));
  };

  // Navigation Handlers
  const handleFirst = () => {
    if (filteredEmployees.length === 0) return;
    setCurrentIndex(0);
    loadEmployeeIntoForm(filteredEmployees[0]);
    setMode('view');
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setCurrentIndex(nextIdx);
      loadEmployeeIntoForm(filteredEmployees[nextIdx]);
      setMode('view');
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredEmployees.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      loadEmployeeIntoForm(filteredEmployees[nextIdx]);
      setMode('view');
    }
  };

  const handleLast = () => {
    if (filteredEmployees.length === 0) return;
    const lastIdx = filteredEmployees.length - 1;
    setCurrentIndex(lastIdx);
    loadEmployeeIntoForm(filteredEmployees[lastIdx]);
    setMode('view');
  };

  // Add Action (Auto Generated ID)
  const handleAdd = async () => {
    try {
      setLoading(true);
      const nextCode = await hrmService.getNextEmployeeCode('SBC-EMP');
      setForm({
        ...defaultForm,
        employeeCode: nextCode,
        currentDate: new Date().toISOString().slice(0, 10),
        joiningDate: new Date().toISOString().slice(0, 10),
        dateOfModify: new Date().toISOString().slice(0, 10),
        department: departments[0]?.name || 'Cafeteria',
        designation: designations[0]?.title || 'Service Boy'
      });
      setMode('add');
      showToast(`অটোমেটিক নতুন কর্মী আইডি জেনারেট হয়েছে: ${nextCode}`, 'info');
    } catch (err: any) {
      console.error('Error getting next code:', err);
      setForm({
        ...defaultForm,
        employeeCode: `SBC-EMP-${String(employees.length + 1).padStart(3, '0')}`,
        department: departments[0]?.name || 'Operations',
        designation: designations[0]?.title || 'Staff'
      });
      setMode('add');
    } finally {
      setLoading(false);
    }
  };

  // Edit Action
  const handleEdit = () => {
    if (!form._id) {
      showToast('কোনো কর্মী সিলেক্ট করা নেই', 'error');
      return;
    }
    setMode('edit');
  };

  // Cancel Action
  const handleCancel = () => {
    if (filteredEmployees[currentIndex]) {
      loadEmployeeIntoForm(filteredEmployees[currentIndex]);
    } else {
      setForm(defaultForm);
    }
    setMode('view');
  };

  // Save / Update Action
  const handleSaveOrUpdate = async () => {
    if (!form.fullName.trim()) {
      showToast('কর্মীর নাম আবশ্যক', 'error');
      return;
    }
    if (!form.department) {
      showToast('ডিপার্টমেন্ট সিলেক্ট করুন', 'error');
      return;
    }
    if (!form.designation) {
      showToast('পদবি সিলেক্ট করুন', 'error');
      return;
    }

    setSaving(true);
    try {
      const names = form.fullName.trim().split(' ');
      const firstName = names[0] || form.fullName;
      const lastName = names.slice(1).join(' ') || '';

      const payload: any = {
        employeeCode: form.employeeCode,
        department: form.department,
        designation: form.designation,
        joiningDate: form.joiningDate || new Date().toISOString().slice(0, 10),
        basicSalary: Number(form.joiningSalary) || Number(form.currentSalary) || 10500,
        grossSalary: Number(form.currentSalary) || 10500,
        personalInfo: {
          firstName,
          lastName,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || 'Male',
          bloodGroup: form.bloodGroup,
          nidNumber: form.nidNumber,
          photoUrl: form.photoUrl,
          maritalStatus: form.maritalStatus,
          religion: form.religion,
          nationality: form.nationality
        },
        contactInfo: {
          personalPhone: form.personalPhone,
          presentAddress: form.presentAddress,
          permanentAddress: form.permanentAddress
        },
        bankDetails: {
          bankName: form.bankName,
          accountName: form.accountName,
          accountNo: form.accountNo
        },
        // Extended Sheet Fields
        depSl: Number(form.depSl) || 0,
        salSl: Number(form.salSl) || 0,
        againstId: form.againstId,
        againstName: form.againstName,
        fatherOrHusbandName: form.fatherOrHusbandName,
        motherName: form.motherName,
        age: Number(form.age) || undefined,
        qualification: form.qualification,
        highQualification: form.highQualification,
        jobGrade: form.jobGrade,
        joiningSalary: Number(form.joiningSalary) || 0,
        currentSalary: Number(form.currentSalary) || 0,
        allowance: Number(form.allowance) || 0,
        overtime: Number(form.overtime) || 0,
        dateOfModify: form.dateOfModify,
        jobDuration: form.jobDuration,
        cityDistrict: form.cityDistrict,
        idCardGiven: form.idCardGiven,
        idCardGivenDate: form.idCardGivenDate || undefined,
        isResigned: form.isResigned,
        terminationOrResignedDate: form.terminationOrResignedDate || undefined,
        jobDescriptionCategory: form.jobDescriptionCategory,
        jobDescriptionIndividual: form.jobDescriptionIndividual,
        responsibilitiesIndividual: form.responsibilitiesIndividual,
        leaveReport: form.leaveReport
      };

      if (mode === 'add') {
        const created = await hrmService.createEmployee(payload);
        showToast(`কর্মী ${created.employeeCode} সফলভাবে তৈরি হয়েছে!`, 'success');
        const updatedList = [created, ...employees];
        setEmployees(updatedList);
        loadEmployeeIntoForm(created);
        setCurrentIndex(0);
        setMode('view');
      } else if (mode === 'edit' && form._id) {
        const updated = await hrmService.updateEmployee(form._id, payload);
        showToast(`কর্মী ${updated.employeeCode} সফলভাবে আপডেট হয়েছে!`, 'success');
        const updatedList = employees.map((e) => (e._id === updated._id ? updated : e));
        setEmployees(updatedList);
        loadEmployeeIntoForm(updated);
        setMode('view');
      }
    } catch (err: any) {
      console.error('Error saving employee:', err);
      showToast(err.message || 'ডাটা সেভ করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setSaving(false);
    }
  };

  // CSV / Excel Download
  const handleDownloadCSV = () => {
    if (employees.length === 0) {
      showToast('ডাউনলোড করার মত কোনো কর্মী ডাটা নেই', 'error');
      return;
    }
    const headers = [
      'Employee Code',
      'Name',
      'Dep Sl',
      'Sal Sl',
      'National ID',
      'Against ID',
      'Against Name',
      'Father/Husband Name',
      'Mother Name',
      'Age',
      'Gender',
      'Bank Name',
      'Account Name',
      'Account No',
      'Present Address',
      'Permanent Address',
      'City/District',
      'Phone',
      'Date of Birth',
      'Marital Status',
      'Blood Group',
      'Nationality',
      'Religion',
      'Qualification',
      'High Qualification',
      'Joining Date',
      'Joining Salary',
      'Current Salary',
      'Allowance',
      'Overtime',
      'Department',
      'Designation',
      'Job Grade',
      'Resigned',
      'Resigned Date'
    ];

    const rows = employees.map((emp) => [
      emp.employeeCode,
      emp.userId?.fullName || `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`.trim(),
      emp.depSl || '',
      emp.salSl || '',
      emp.personalInfo?.nidNumber || '',
      emp.againstId || '',
      emp.againstName || '',
      emp.fatherOrHusbandName || '',
      emp.motherName || '',
      emp.age || '',
      emp.personalInfo?.gender || '',
      emp.bankDetails?.bankName || '',
      emp.bankDetails?.accountName || '',
      emp.bankDetails?.accountNo || '',
      emp.contactInfo?.presentAddress || '',
      (emp.contactInfo as any)?.permanentAddress || '',
      emp.cityDistrict || '',
      emp.contactInfo?.personalPhone || '',
      emp.personalInfo?.dateOfBirth ? String(emp.personalInfo.dateOfBirth).slice(0, 10) : '',
      (emp.personalInfo as any)?.maritalStatus || '',
      emp.personalInfo?.bloodGroup || '',
      (emp.personalInfo as any)?.nationality || '',
      (emp.personalInfo as any)?.religion || '',
      emp.qualification || '',
      emp.highQualification || '',
      emp.joiningDate ? String(emp.joiningDate).slice(0, 10) : '',
      emp.joiningSalary ?? emp.basicSalary ?? '',
      emp.currentSalary ?? emp.grossSalary ?? '',
      emp.allowance || '',
      emp.overtime || '',
      emp.department || '',
      emp.designation || '',
      emp.jobGrade || '',
      emp.isResigned ? 'Yes' : 'No',
      emp.terminationOrResignedDate ? String(emp.terminationOrResignedDate).slice(0, 10) : ''
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SunBird_Employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('কর্মীদের তালিকা এক্সেল/সিএসভি আকারে ডাউনলোড হয়েছে', 'success');
  };

  // Print Employee Details Sheet
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#f0f2f5] p-2 text-slate-800 text-[11px] font-sans antialiased select-none">
      {/* ── TOP BANNER / WINDOW HEADER ── */}
      <div className="bg-[#e4e7eb] border border-[#b2b8c2] px-3 py-1.5 flex items-center justify-between rounded-t shadow-xs mb-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#1e3932] text-[#e6b980] flex items-center justify-center font-bold text-[9px]">
            SB
          </div>
          <span className="font-bold text-slate-800 text-xs tracking-wide">
            Employee Details — SUN BIRD CORPORATION ERP
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-2">
            [{currentIndex + 1} / {filteredEmployees.length}]
          </span>
        </div>

        {/* Quick Search & Tools */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="খুঁজুন (নাম, কোড, কার পরিবর্তে)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-0.5 text-[11px] bg-white border border-[#b2b8c2] rounded w-48 focus:outline-none focus:border-[#1e3932]"
            />
          </div>
          <button
            onClick={loadInitialData}
            title="রিফ্রেশ"
            className="p-1 bg-white hover:bg-slate-100 border border-[#b2b8c2] rounded text-slate-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── MAIN FORM CONTAINER (DESKTOP SHEET STYLE) ── */}
      <div className="bg-[#eceff1] border border-[#b2b8c2] p-2 rounded shadow-inner grid grid-cols-12 gap-2">
        {/* LEFT & CENTER: FORM FIELDS (9 COLS) */}
        <div className="col-span-9 bg-white border border-[#c4cad4] p-3 rounded space-y-1.5 text-slate-700">
          {/* ROW 1: Employee ID, Dep. SL, Sal. SL, National ID */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 flex items-center justify-between font-semibold">
              <span>Employee Id</span>
            </div>
            <div className="col-span-3">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded font-mono font-bold text-slate-900 focus:outline-none focus:border-[#1e3932]"
              />
            </div>
            <div className="col-span-1 text-right font-semibold">Dep. SL:</div>
            <div className="col-span-1">
              <input
                type="number"
                disabled={mode === 'view'}
                value={form.depSl}
                onChange={(e) => setForm({ ...form, depSl: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded text-center"
              />
            </div>
            <div className="col-span-1 text-right font-semibold">Sal. SL:</div>
            <div className="col-span-1">
              <input
                type="number"
                disabled={mode === 'view'}
                value={form.salSl}
                onChange={(e) => setForm({ ...form, salSl: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded text-center"
              />
            </div>
            <div className="col-span-1 text-right font-semibold">National ID:</div>
            <div className="col-span-2">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.nidNumber}
                onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                placeholder="422 494 0439"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded font-mono"
              />
            </div>
          </div>

          {/* ROW 2: Employee Name & Against ID/Name (কার পরিবর্তে যোগদান) */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">Employee Name</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="কর্মীর পূর্ণ নাম লিখুন"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded font-bold text-slate-900"
              />
            </div>
            <div className="col-span-2 text-right font-semibold text-rose-700">Against Id:</div>
            <div className="col-span-1">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.againstId}
                onChange={(e) => handleAgainstIdChange(e.target.value)}
                placeholder="ID"
                className="w-full bg-[#fff1f2] border border-rose-300 px-1 py-0.5 rounded font-mono font-bold text-rose-900"
              />
            </div>
            <div className="col-span-3">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.againstName}
                onChange={(e) => setForm({ ...form, againstName: e.target.value })}
                placeholder="কার পরিবর্তে (নাম)"
                className="w-full bg-[#fff1f2] border border-rose-300 px-2 py-0.5 rounded font-semibold text-rose-900"
              />
            </div>
          </div>

          {/* ROW 3: Father's / Husband Name & Account Name */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">Father's / Husband</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.fatherOrHusbandName}
                onChange={(e) => setForm({ ...form, fatherOrHusbandName: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded"
              />
            </div>
            <div className="col-span-2 text-right font-semibold">Account Name:</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded"
              />
            </div>
          </div>

          {/* ROW 4: Mother's Name & Account No */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">Mother's Name</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.motherName}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded"
              />
            </div>
            <div className="col-span-2 text-right font-semibold">Account No:</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.accountNo}
                onChange={(e) => setForm({ ...form, accountNo: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded font-mono"
              />
            </div>
          </div>

          {/* ROW 5: Age, Sex, Bank Name */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">Age</div>
            <div className="col-span-1">
              <input
                type="number"
                disabled={mode === 'view'}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="23"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded text-center"
              />
            </div>
            <div className="col-span-1 text-right font-semibold">Sex:</div>
            <div className="col-span-2">
              <select
                disabled={mode === 'view'}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2 text-right font-semibold">Bank Name:</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="ব্যাংকের নাম"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded"
              />
            </div>
          </div>

          {/* ROW 6: Permanent Address */}
          <div className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-2 font-semibold pt-1">Permanent Address</div>
            <div className="col-span-10">
              <textarea
                rows={2}
                disabled={mode === 'view'}
                value={form.permanentAddress}
                onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                placeholder="স্থায়ী ঠিকানা (গ্রাম, ডাকঘর, থানা, জেলা)"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-1 rounded resize-none"
              />
            </div>
          </div>

          {/* ROW 7: Present Address & Attendance / Sign */}
          <div className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-2 font-semibold pt-1">Present Address</div>
            <div className="col-span-6">
              <textarea
                rows={2}
                disabled={mode === 'view'}
                value={form.presentAddress}
                onChange={(e) => setForm({ ...form, presentAddress: e.target.value })}
                placeholder="বর্তমান ঠিকানা"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-1 rounded resize-none"
              />
            </div>
            <div className="col-span-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold w-24">Attendance:</span>
                <input
                  type="number"
                  disabled={mode === 'view'}
                  value={form.attendanceCount}
                  onChange={(e) => setForm({ ...form, attendanceCount: e.target.value })}
                  className="w-16 bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-24">Sign Check:</span>
                <input
                  type="checkbox"
                  disabled={mode === 'view'}
                  checked={form.hasSignature}
                  onChange={(e) => setForm({ ...form, hasSignature: e.target.checked })}
                  className="rounded text-[#1e3932]"
                />
                <span className="text-slate-500 text-[10px]">স্বাক্ষর প্রাপ্ত</span>
              </div>
            </div>
          </div>

          {/* ROW 8: City / District */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">City / District</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.cityDistrict}
                onChange={(e) => setForm({ ...form, cityDistrict: e.target.value })}
                placeholder="Mymensingh / Dhaka"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded"
              />
            </div>
            <div className="col-span-2 text-right font-semibold">Phone:</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.personalPhone}
                onChange={(e) => setForm({ ...form, personalPhone: e.target.value })}
                placeholder="017xxxxxxxx"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded font-mono"
              />
            </div>
          </div>

          {/* ROW 9: Date of Birth & Marital Status */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">Date of Birth</div>
            <div className="col-span-4">
              <input
                type="date"
                disabled={mode === 'view'}
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded"
              />
            </div>
            <div className="col-span-2 text-right font-semibold">Marital Status:</div>
            <div className="col-span-4">
              <select
                disabled={mode === 'view'}
                value={form.maritalStatus}
                onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded"
              >
                <option value="Unmarried">Unmarried</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>

          {/* ROW 10: Blood Group & Nationality */}
          <div className="grid grid-cols-12 gap-2 items-center bg-[#fefce8] p-1 rounded border border-[#fef08a]">
            <div className="col-span-2 font-semibold text-amber-900">Blood Group</div>
            <div className="col-span-4">
              <select
                disabled={mode === 'view'}
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full bg-white border border-[#94a3b8] px-1 py-0.5 rounded font-bold text-amber-900"
              >
                <option value="A+">A+ (Positive)</option>
                <option value="A-">A- (Negative)</option>
                <option value="B+">B+ (Positive)</option>
                <option value="B-">B- (Negative)</option>
                <option value="O+">O+ (Positive)</option>
                <option value="O-">O- (Negative)</option>
                <option value="AB+">AB+ (Positive)</option>
                <option value="AB-">AB- (Negative)</option>
              </select>
            </div>
            <div className="col-span-2 text-right font-semibold text-amber-900">Nationality:</div>
            <div className="col-span-4">
              <select
                disabled={mode === 'view'}
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="w-full bg-white border border-[#94a3b8] px-1 py-0.5 rounded font-semibold text-amber-900"
              >
                <option value="Bangladeshi">Bangladeshi</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* ROW 11: Religion & Qualification (শিক্ষাগত যোগ্যতা) */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">Religion</div>
            <div className="col-span-4">
              <select
                disabled={mode === 'view'}
                value={form.religion}
                onChange={(e) => setForm({ ...form, religion: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded"
              >
                <option value="Islam">Islam</option>
                <option value="Hinduism">Hinduism</option>
                <option value="Buddhism">Buddhism</option>
                <option value="Christianity">Christianity</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2 text-right font-semibold text-indigo-900">Qualification:</div>
            <div className="col-span-4">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                placeholder="HSC / SSC / Degree"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-2 py-0.5 rounded font-semibold text-indigo-900"
              />
            </div>
          </div>

          {/* ROW 12: High Qualification & Job Duration */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold text-indigo-900">High Qualification</div>
            <div className="col-span-4">
              <select
                disabled={mode === 'view'}
                value={form.highQualification}
                onChange={(e) => setForm({ ...form, highQualification: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded font-semibold text-indigo-900"
              >
                <option value="H.S.C">H.S.C</option>
                <option value="S.S.C">S.S.C</option>
                <option value="Bachelor / Degree">Bachelor / Degree</option>
                <option value="Masters">Masters</option>
                <option value="Diploma">Diploma</option>
                <option value="PhD">PhD</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-2 text-right font-semibold">Job Duration / Date:</div>
            <div className="col-span-2">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.jobDuration}
                onChange={(e) => setForm({ ...form, jobDuration: e.target.value })}
                placeholder="Duration"
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded text-center"
              />
            </div>
            <div className="col-span-2">
              <input
                type="date"
                disabled={mode === 'view'}
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded"
              />
            </div>
          </div>

          {/* ROW 13: Salary & Allowance info */}
          <div className="grid grid-cols-12 gap-2 items-center bg-[#f0fdf4] p-1.5 rounded border border-emerald-200">
            <div className="col-span-2 font-semibold text-emerald-900">Joining Salary</div>
            <div className="col-span-2">
              <input
                type="number"
                disabled={mode === 'view'}
                value={form.joiningSalary}
                onChange={(e) => setForm({ ...form, joiningSalary: e.target.value })}
                className="w-full bg-white border border-[#94a3b8] px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900"
              />
            </div>
            <div className="col-span-2 text-right font-semibold text-emerald-900">Current Salary:</div>
            <div className="col-span-2">
              <input
                type="number"
                disabled={mode === 'view'}
                value={form.currentSalary}
                onChange={(e) => setForm({ ...form, currentSalary: e.target.value })}
                className="w-full bg-white border border-[#94a3b8] px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900"
              />
            </div>
            <div className="col-span-1 text-right font-semibold text-emerald-900">Allowance:</div>
            <div className="col-span-1">
              <input
                type="number"
                disabled={mode === 'view'}
                value={form.allowance}
                onChange={(e) => setForm({ ...form, allowance: e.target.value })}
                className="w-full bg-white border border-[#94a3b8] px-1 py-0.5 rounded text-center"
              />
            </div>
            <div className="col-span-1 text-right font-semibold text-emerald-900">Over Time:</div>
            <div className="col-span-1">
              <input
                type="number"
                disabled={mode === 'view'}
                value={form.overtime}
                onChange={(e) => setForm({ ...form, overtime: e.target.value })}
                className="w-full bg-white border border-[#94a3b8] px-1 py-0.5 rounded text-center"
              />
            </div>
          </div>

          {/* ROW 14: Department, Designation, Auto Grade */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">Department</div>
            <div className="col-span-3">
              <select
                disabled={mode === 'view'}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded font-semibold text-slate-800"
              >
                <option value="">সিলেক্ট করুন...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-1 text-right font-semibold">Designation:</div>
            <div className="col-span-3">
              <select
                disabled={mode === 'view'}
                value={form.designation}
                onChange={(e) => handleDesignationChange(e.target.value)}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded font-semibold text-slate-800"
              >
                <option value="">সিলেক্ট করুন...</option>
                {designations.map((des) => (
                  <option key={des._id} value={des.title || des.name}>
                    {des.title || des.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-1 text-right font-semibold text-indigo-700">Grade:</div>
            <div className="col-span-2">
              <input
                type="text"
                disabled={mode === 'view'}
                value={form.jobGrade}
                onChange={(e) => setForm({ ...form, jobGrade: e.target.value })}
                placeholder="Grade-A / B"
                className="w-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold text-indigo-900"
              />
            </div>
          </div>

          {/* ROW 15: Date of Modify, ID Card Given, Resigned Status */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 font-semibold">Date of Modify</div>
            <div className="col-span-2">
              <input
                type="date"
                disabled={mode === 'view'}
                value={form.dateOfModify}
                onChange={(e) => setForm({ ...form, dateOfModify: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded"
              />
            </div>
            <div className="col-span-2 flex items-center gap-1.5 font-semibold">
              <input
                type="checkbox"
                disabled={mode === 'view'}
                checked={form.idCardGiven}
                onChange={(e) => setForm({ ...form, idCardGiven: e.target.checked })}
                className="rounded"
              />
              <span>Id Card Given</span>
            </div>
            <div className="col-span-2">
              <input
                type="date"
                disabled={mode === 'view' || !form.idCardGiven}
                value={form.idCardGivenDate}
                onChange={(e) => setForm({ ...form, idCardGivenDate: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded"
              />
            </div>
            <div className="col-span-2 flex items-center gap-1.5 font-semibold text-rose-700">
              <input
                type="checkbox"
                disabled={mode === 'view'}
                checked={form.isResigned}
                onChange={(e) => setForm({ ...form, isResigned: e.target.checked })}
                className="rounded text-rose-600"
              />
              <span>Resigned</span>
            </div>
            <div className="col-span-2">
              <input
                type="date"
                disabled={mode === 'view' || !form.isResigned}
                value={form.terminationOrResignedDate}
                onChange={(e) => setForm({ ...form, terminationOrResignedDate: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] px-1 py-0.5 rounded"
              />
            </div>
          </div>

          {/* ROW 16: Job Description & Responsibilities */}
          <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-200">
            <div className="col-span-6 space-y-1">
              <span className="font-semibold text-slate-700 block">Job Description (Category):</span>
              <textarea
                rows={3}
                disabled={mode === 'view'}
                value={form.jobDescriptionCategory}
                onChange={(e) => setForm({ ...form, jobDescriptionCategory: e.target.value })}
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] p-1.5 rounded resize-none text-[10px] leading-tight"
              />
            </div>
            <div className="col-span-6 space-y-1">
              <span className="font-semibold text-slate-700 block">Responsibilities (Individual):</span>
              <textarea
                rows={3}
                disabled={mode === 'view'}
                value={form.responsibilitiesIndividual}
                onChange={(e) => setForm({ ...form, responsibilitiesIndividual: e.target.value })}
                placeholder="কর্মীর একক দায়িত্বসমূহ লিখুন..."
                className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] p-1.5 rounded resize-none text-[10px] leading-tight"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PHOTO, LEAVE REPORT, RIGHT ACTIONS (3 COLS) */}
        <div className="col-span-3 space-y-2">
          {/* Photo Box */}
          <div className="bg-white border border-[#c4cad4] p-2 rounded flex flex-col items-center">
            <div className="w-28 h-28 bg-[#f1f5f9] border border-[#94a3b8] rounded flex items-center justify-center overflow-hidden mb-1">
              {form.photoUrl ? (
                <img src={form.photoUrl} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-300" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
              <input type="checkbox" checked={!!form.photoUrl} readOnly className="rounded" />
              <span>Photo Attached</span>
            </div>
          </div>

          {/* Leave Report Numeric Grid (CL, SL, WP, ML, EL, GH) */}
          <div className="bg-white border border-[#c4cad4] p-2 rounded space-y-1">
            <span className="font-bold text-slate-800 block text-[10px] border-b pb-0.5">
              Leave Report (ছুটি রিপোর্ট)
            </span>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border">
                <span className="font-bold">CL:</span>
                <input
                  type="number"
                  disabled={mode === 'view'}
                  value={form.leaveReport?.cl ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      leaveReport: { ...form.leaveReport, cl: Number(e.target.value) }
                    })
                  }
                  className="w-8 text-right bg-white border border-slate-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border">
                <span className="font-bold">SL:</span>
                <input
                  type="number"
                  disabled={mode === 'view'}
                  value={form.leaveReport?.sl ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      leaveReport: { ...form.leaveReport, sl: Number(e.target.value) }
                    })
                  }
                  className="w-8 text-right bg-white border border-slate-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border">
                <span className="font-bold">WP:</span>
                <input
                  type="number"
                  disabled={mode === 'view'}
                  value={form.leaveReport?.wp ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      leaveReport: { ...form.leaveReport, wp: Number(e.target.value) }
                    })
                  }
                  className="w-8 text-right bg-white border border-slate-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border">
                <span className="font-bold">ML:</span>
                <input
                  type="number"
                  disabled={mode === 'view'}
                  value={form.leaveReport?.ml ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      leaveReport: { ...form.leaveReport, ml: Number(e.target.value) }
                    })
                  }
                  className="w-8 text-right bg-white border border-slate-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border">
                <span className="font-bold">EL:</span>
                <input
                  type="number"
                  disabled={mode === 'view'}
                  value={form.leaveReport?.el ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      leaveReport: { ...form.leaveReport, el: Number(e.target.value) }
                    })
                  }
                  className="w-8 text-right bg-white border border-slate-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border">
                <span className="font-bold">GH:</span>
                <input
                  type="number"
                  disabled={mode === 'view'}
                  value={form.leaveReport?.gh ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      leaveReport: { ...form.leaveReport, gh: Number(e.target.value) }
                    })
                  }
                  className="w-8 text-right bg-white border border-slate-300 rounded px-1"
                />
              </div>
            </div>
          </div>

          {/* Side Action Buttons */}
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => showToast('ছুটি এন্ট্রি মডিউলে নেভিগেট করুন', 'info')}
              className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#94a3b8] rounded font-semibold text-[10px] text-center"
            >
              Leave Entry
            </button>
            <button
              onClick={() => showToast('ছুটি রিপোর্ট তৈরি হচ্ছে...', 'info')}
              className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#94a3b8] rounded font-semibold text-[10px] text-center"
            >
              Leave Report
            </button>
            <button
              onClick={() => showToast('মোট ছুটির সারসংক্ষেপ', 'info')}
              className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#94a3b8] rounded font-semibold text-[10px] text-center"
            >
              Total Leave
            </button>
            <button
              onClick={() => showToast('ফিঙ্গারপ্রিন্ট উপস্থিতি লগ', 'info')}
              className="px-2 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#94a3b8] rounded font-semibold text-[10px] text-center"
            >
              Finger Report
            </button>
          </div>

          {/* W/T Comment Box */}
          <div className="bg-white border border-[#c4cad4] p-2 rounded space-y-1">
            <div className="flex items-center gap-1 font-semibold text-[10px]">
              <input
                type="checkbox"
                disabled={mode === 'view'}
                checked={form.leaveTick}
                onChange={(e) => setForm({ ...form, leaveTick: e.target.checked })}
                className="rounded"
              />
              <span>Leave W/P Check</span>
            </div>
            <textarea
              rows={3}
              disabled={mode === 'view'}
              value={form.wtComment}
              onChange={(e) => setForm({ ...form, wtComment: e.target.value })}
              placeholder="W/P Comment / বিশেষ মন্তব্য..."
              className="w-full bg-[#f8fafc] disabled:bg-[#f1f5f9] border border-[#94a3b8] p-1 rounded resize-none text-[10px]"
            />
          </div>
        </div>
      </div>

      {/* ── BOTTOM TOOLBAR (DESKTOP CONTROLS) ── */}
      <div className="bg-[#e4e7eb] border border-[#b2b8c2] p-1.5 rounded-b mt-1 flex items-center justify-between flex-wrap gap-1 shadow-xs">
        {/* Navigation Buttons: ◄◄ ◄ ► ►► */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded border border-[#b2b8c2]">
          <button
            onClick={handleFirst}
            disabled={currentIndex === 0 || mode !== 'view'}
            title="প্রথম রেকর্ড (First)"
            className="p-1 hover:bg-slate-100 disabled:opacity-40 rounded"
          >
            <ChevronFirst className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || mode !== 'view'}
            title="পূর্ববর্তী (Prev)"
            className="p-1 hover:bg-slate-100 disabled:opacity-40 rounded"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= filteredEmployees.length - 1 || mode !== 'view'}
            title="পরবর্তী (Next)"
            className="p-1 hover:bg-slate-100 disabled:opacity-40 rounded"
          >
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={handleLast}
            disabled={currentIndex >= filteredEmployees.length - 1 || mode !== 'view'}
            title="সর্বশেষ রেকর্ড (Last)"
            className="p-1 hover:bg-slate-100 disabled:opacity-40 rounded"
          >
            <ChevronLast className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        {/* CRUD Buttons: Add, Edit, Update, Cancel */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleAdd}
            disabled={mode !== 'view'}
            className="px-2.5 py-1 bg-[#1e3932] hover:bg-[#152823] disabled:opacity-50 text-[#e6b980] rounded font-bold text-xs flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          <button
            onClick={handleEdit}
            disabled={mode !== 'view' || !form._id}
            className="px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            onClick={handleSaveOrUpdate}
            disabled={mode === 'view' || saving}
            className="px-3 py-1 bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'Update'}</span>
          </button>

          <button
            onClick={handleCancel}
            disabled={mode === 'view'}
            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 rounded font-semibold text-xs shadow-xs"
          >
            Cancel
          </button>
        </div>

        {/* Operation Buttons: Print, Download, Bio Data, Display */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrint}
            title="প্রিন্ট করুন"
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-[#b2b8c2] text-slate-800 rounded font-semibold text-xs flex items-center gap-1 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            title="সকল কর্মী সিএসভি/এক্সেলে ডাউনলোড"
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-[#b2b8c2] text-emerald-800 rounded font-semibold text-xs flex items-center gap-1 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data Download</span>
          </button>

          <button
            onClick={() => setFilterResignedOnly(!filterResignedOnly)}
            className={`px-2 py-1 border rounded font-semibold text-xs shadow-xs ${
              filterResignedOnly
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white text-slate-700 border-[#b2b8c2] hover:bg-slate-100'
            }`}
          >
            Resigned List
          </button>

          <button
            onClick={() => setShowTable(!showTable)}
            className="px-2.5 py-1 bg-[#1e3932] hover:bg-[#152823] text-[#e6b980] rounded font-bold text-xs flex items-center gap-1 shadow-xs"
          >
            <List className="w-3.5 h-3.5" />
            <span>{showTable ? 'Hide Table' : 'Display'}</span>
          </button>
        </div>
      </div>

      {/* ── OPTIONAL DISPLAY TABLE PANEL (TOGGLED VIA DISPLAY BUTTON) ── */}
      {showTable && (
        <div className="mt-2 bg-white border border-[#b2b8c2] rounded shadow-md overflow-hidden">
          <div className="bg-[#1e3932] text-[#e6b980] px-3 py-1.5 font-bold flex items-center justify-between text-xs">
            <span>সকল কর্মীর তালিকা ({filteredEmployees.length})</span>
            <span className="text-[10px] text-slate-300">যেকোনো সারিতে ক্লিক করে বিস্তারিত দেখুন</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 sticky top-0 font-bold">
                <tr>
                  <th className="px-3 py-1.5">ID</th>
                  <th className="px-3 py-1.5">Name</th>
                  <th className="px-3 py-1.5">Department</th>
                  <th className="px-3 py-1.5">Designation</th>
                  <th className="px-3 py-1.5">Against</th>
                  <th className="px-3 py-1.5">Blood Group</th>
                  <th className="px-3 py-1.5">Grade</th>
                  <th className="px-3 py-1.5">Salary</th>
                  <th className="px-3 py-1.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp, index) => (
                  <tr
                    key={emp._id}
                    onClick={() => {
                      setCurrentIndex(index);
                      loadEmployeeIntoForm(emp);
                      setMode('view');
                    }}
                    className={`cursor-pointer hover:bg-emerald-50 transition-colors ${
                      currentIndex === index ? 'bg-amber-50 font-semibold' : ''
                    }`}
                  >
                    <td className="px-3 py-1 font-mono font-bold text-slate-900">{emp.employeeCode}</td>
                    <td className="px-3 py-1 font-semibold text-slate-800">
                      {emp.userId?.fullName || `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`}
                    </td>
                    <td className="px-3 py-1 text-slate-600">{emp.department}</td>
                    <td className="px-3 py-1 text-slate-600">{emp.designation}</td>
                    <td className="px-3 py-1 text-rose-700">{emp.againstName || emp.againstId || '-'}</td>
                    <td className="px-3 py-1 font-bold text-amber-800">{emp.personalInfo?.bloodGroup || '-'}</td>
                    <td className="px-3 py-1 text-indigo-700">{emp.jobGrade || '-'}</td>
                    <td className="px-3 py-1 font-mono">৳{(emp.currentSalary || emp.basicSalary || 0).toLocaleString()}</td>
                    <td className="px-3 py-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          emp.isResigned
                            ? 'bg-rose-100 text-rose-700'
                            : emp.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {emp.isResigned ? 'পদত্যাগকৃত' : emp.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PRINT-ONLY STYLED SHEET (WINDOW.PRINT LAYOUT) ── */}
      <div id="printable-employee-sheet" className="hidden print:block p-8 bg-white text-black font-sans">
        <div className="border-b-2 border-black pb-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SUN BIRD CORPORATION</h1>
            <h2 className="text-sm font-semibold text-gray-700">EMPLOYEE DETAILS SHEET / কর্মীর তথ্যাবলি</h2>
          </div>
          <div className="text-right text-xs">
            <div>Printed Date: {form.currentDate || '—'}</div>
            <div className="font-mono font-bold text-base mt-1">ID: {form.employeeCode}</div>
          </div>
        </div>

        <table className="w-full text-xs border-collapse border border-gray-400 mb-4">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100 w-1/4">Employee ID:</td>
              <td className="border border-gray-400 p-2 font-mono font-bold">{form.employeeCode}</td>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100 w-1/4">National ID (NID):</td>
              <td className="border border-gray-400 p-2 font-mono">{form.nidNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Employee Name:</td>
              <td className="border border-gray-400 p-2 font-bold text-sm">{form.fullName}</td>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100 text-red-700">কার পরিবর্তে যোগদান:</td>
              <td className="border border-gray-400 p-2 font-bold text-red-700">
                {form.againstName} ({form.againstId || 'N/A'})
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Father / Husband:</td>
              <td className="border border-gray-400 p-2">{form.fatherOrHusbandName || 'N/A'}</td>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Mother Name:</td>
              <td className="border border-gray-400 p-2">{form.motherName || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Department:</td>
              <td className="border border-gray-400 p-2 font-semibold">{form.department}</td>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Designation & Grade:</td>
              <td className="border border-gray-400 p-2 font-semibold">
                {form.designation} [{form.jobGrade}]
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Joining Date:</td>
              <td className="border border-gray-400 p-2">{form.joiningDate}</td>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Current Salary:</td>
              <td className="border border-gray-400 p-2 font-bold font-mono">৳{Number(form.currentSalary || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Blood Group:</td>
              <td className="border border-gray-400 p-2 font-bold text-red-600">{form.bloodGroup}</td>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Educational Qualification:</td>
              <td className="border border-gray-400 p-2 font-semibold">{form.highQualification || form.qualification}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Phone Number:</td>
              <td className="border border-gray-400 p-2 font-mono">{form.personalPhone || 'N/A'}</td>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">City / District:</td>
              <td className="border border-gray-400 p-2">{form.cityDistrict || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Present Address:</td>
              <td colSpan={3} className="border border-gray-400 p-2">{form.presentAddress || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Permanent Address:</td>
              <td colSpan={3} className="border border-gray-400 p-2">{form.permanentAddress || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold bg-gray-100">Bank & Account No:</td>
              <td colSpan={3} className="border border-gray-400 p-2 font-mono">
                {form.bankName} - {form.accountNo} ({form.accountName})
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="mt-16 flex justify-between text-xs pt-8 border-t border-gray-300">
          <div className="text-center">
            <div className="w-36 border-t border-black mb-1"></div>
            <div>Employee Signature</div>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-black mb-1"></div>
            <div>HR Officer</div>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-black mb-1"></div>
            <div>Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetailsSheet;
