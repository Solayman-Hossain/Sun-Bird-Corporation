import { apiClient } from '../lib/api';

export interface EmployeeProfileData {
  _id: string;
  userId?: any;
  employeeCode: string;
  department: string;
  designation: string;
  joiningDate: string;
  basicSalary: number;
  houseRentAllowance?: number;
  medicalAllowance?: number;
  conveyanceAllowance?: number;
  grossSalary: number;
  salesCommissionRate?: number;
  loanOutstanding?: number;
  casualLeaveBalance?: number;
  sickLeaveBalance?: number;
  earnedLeaveBalance?: number;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    nidNumber?: string;
    photoUrl?: string;
  };
  contactInfo?: {
    officialEmail?: string;
    officialPhone?: string;
    personalEmail?: string;
    personalPhone?: string;
    presentAddress?: string;
  };
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    altPhone?: string;
    address?: string;
    isPrimary?: boolean;
  }>;
  employmentDetails?: {
    departmentId?: string;
    designationId?: string;
    jobGradeId?: string;
    employmentType?: string;
    status?: string;
    probationEndDate?: string;
    confirmationDate?: string;
    resignationDate?: string;
    lastWorkingDate?: string;
    offboardingNotes?: string;
    offboardingClearance?: {
      itClearance: boolean;
      accountsClearance: boolean;
      adminClearance: boolean;
      hrClearance: boolean;
    };
    onboardingChecklist?: Array<{ task: string; completed: boolean; completedAt?: string }>;
  };
  bankDetails?: {
    bankName?: string;
    branchName?: string;
    accountName?: string;
    accountNo?: string;
    paymentMethod?: string;
  };
  documents?: Array<{
    docType: string;
    title: string;
    docUrl: string;
    verified?: boolean;
  }>;
  isActive: boolean;
}

export const hrmService = {
  // ── Employees & Onboarding/Offboarding ──
  async getEmployees(params: Record<string, any> = {}): Promise<{ employees: EmployeeProfileData[]; pagination?: any }> {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    const res = await apiClient<{ success: boolean; data: EmployeeProfileData[]; pagination?: any }>(
      `/erp/hrm/employees?${q.toString()}`
    );
    return { employees: res.data || [], pagination: res.pagination };
  },

  async getEmployeeById(id: string): Promise<EmployeeProfileData> {
    const res = await apiClient<{ success: boolean; data: EmployeeProfileData }>(`/erp/hrm/employees/${id}`);
    return res.data;
  },

  async createEmployee(payload: any): Promise<EmployeeProfileData> {
    const res = await apiClient<{ success: boolean; data: EmployeeProfileData }>(
      '/erp/hrm/employees',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async updateEmployee(id: string, payload: any): Promise<EmployeeProfileData> {
    const res = await apiClient<{ success: boolean; data: EmployeeProfileData }>(
      `/erp/hrm/employees/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async updateOnboardingTask(id: string, index: number, completed: boolean): Promise<EmployeeProfileData> {
    const res = await apiClient<{ success: boolean; data: EmployeeProfileData }>(
      `/erp/hrm/employees/${id}/onboarding-task`,
      { method: 'PATCH', body: JSON.stringify({ index, completed }) }
    );
    return res.data;
  },

  async processOffboarding(id: string, payload: any): Promise<EmployeeProfileData> {
    const res = await apiClient<{ success: boolean; data: EmployeeProfileData }>(
      `/erp/hrm/employees/${id}/offboarding`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  // ── Org Structure & ID Card ──
  async getDepartments(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/departments');
    return res.data || [];
  },

  async createDepartment(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/departments',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getDesignations(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/designations');
    return res.data || [];
  },

  async createDesignation(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/designations',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getJobGrades(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/job-grades');
    return res.data || [];
  },

  async createJobGrade(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/job-grades',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getEmploymentTypes(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/employment-types');
    return res.data || [];
  },

  async createEmploymentType(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/employment-types',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getEmployeeIdCard(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(`/erp/hrm/employees/${id}/id-card`);
    return res.data;
  },

  async getOrganizationChart(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/org-chart');
    return res.data || [];
  },

  // ── Attendance, Shifts, Rosters & Holidays ──
  async getAttendanceStats(date?: string): Promise<any> {
    const q = date ? `?date=${date}` : '';
    const res = await apiClient<{ success: boolean; data: any }>(`/erp/hrm/attendance/stats${q}`);
    return res.data;
  },

  async importAttendance(records: any[]): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/attendance/import',
      { method: 'POST', body: JSON.stringify({ records }) }
    );
    return res.data;
  },

  async getAttendanceCorrections(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/attendance/corrections?${q}`);
    return res.data || [];
  },

  async requestAttendanceCorrection(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/attendance/corrections',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async processAttendanceCorrection(id: string, status: string, approvalRemarks?: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/attendance/corrections/${id}`,
      { method: 'PUT', body: JSON.stringify({ status, approvalRemarks }) }
    );
    return res.data;
  },

  async getShifts(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/shifts');
    return res.data || [];
  },

  async createShift(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/shifts',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getRosters(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/rosters?${q}`);
    return res.data || [];
  },

  async assignRoster(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/rosters',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getHolidays(year?: number): Promise<any[]> {
    const q = year ? `?year=${year}` : '';
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/holidays${q}`);
    return res.data || [];
  },

  async createHoliday(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/holidays',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  // ── Leaves ──
  async getLeaveTypes(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/leaves/types');
    return res.data || [];
  },

  async createLeaveType(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/leaves/types',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getLeaveBalances(employeeId: string, year?: number): Promise<any[]> {
    const q = year ? `?year=${year}` : '';
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/leaves/balances/${employeeId}${q}`);
    return res.data || [];
  },

  async initLeaveBalances(year?: number): Promise<any> {
    const res = await apiClient<{ success: boolean; message: string; count: number }>(
      '/erp/hrm/leaves/init-balances',
      { method: 'POST', body: JSON.stringify({ year: year || new Date().getFullYear() }) }
    );
    return res;
  },

  async getLeaveRequests(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/leaves/requests?${q}`);
    return res.data || [];
  },

  async submitLeaveRequest(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/leaves/requests',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async processLeaveApproval(id: string, status: string, approvalRemarks?: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/leaves/requests/${id}`,
      { method: 'PUT', body: JSON.stringify({ status, approvalRemarks }) }
    );
    return res.data;
  },

  async getLeaveCalendar(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/leaves/calendar?${q}`);
    return res.data || [];
  },

  // ── Payroll, Salary Structure, Batches & Payslips ──
  async getSalaryComponents(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/salary/components');
    return res.data || [];
  },

  async createSalaryComponent(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/salary/components',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getSalaryStructures(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/salary/structures');
    return res.data || [];
  },

  async createSalaryStructure(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/salary/structures',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getPayrollBatches(monthYear?: string): Promise<any[]> {
    const q = monthYear ? `?monthYear=${monthYear}` : '';
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/payroll/batches${q}`);
    return res.data || [];
  },

  async computePayrollBatch(monthYear: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/payroll/batches/compute',
      { method: 'POST', body: JSON.stringify({ monthYear }) }
    );
    return res.data;
  },

  async updateBatchStatus(id: string, status: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/payroll/batches/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ status }) }
    );
    return res.data;
  },

  async postBatchToGl(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/payroll/batches/${id}/post-gl`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  async disburseSalaryPayment(id: string, paymentMethod = 'BANK_TRANSFER'): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/payroll/batches/${id}/disburse`,
      { method: 'POST', body: JSON.stringify({ paymentMethod }) }
    );
    return res.data;
  },

  async getPayslips(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/payroll/payslips?${q}`);
    return res.data || [];
  },

  async getPayslipPrint(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(`/erp/hrm/payroll/payslips/${id}/print`);
    return res.data;
  },

  // ── Loans, Advances & Claims ──
  async getAdvances(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/advances?${q}`);
    return res.data || [];
  },

  async requestAdvance(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/advances',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async approveAdvance(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/advances/${id}/approve`,
      { method: 'PUT', body: JSON.stringify({}) }
    );
    return res.data;
  },

  async disburseAdvance(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/advances/${id}/disburse`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  async getEmployeeLoans(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/loans');
    return res.data || [];
  },

  async createEmployeeLoan(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/loans',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getExpenseClaims(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/expense-claims?${q}`);
    return res.data || [];
  },

  async submitExpenseClaim(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/expense-claims',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async approveExpenseClaim(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/expense-claims/${id}/approve`,
      { method: 'PUT', body: JSON.stringify({}) }
    );
    return res.data;
  },

  async settleExpenseClaim(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/erp/hrm/expense-claims/${id}/settle`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  // ── Performance, Training, Reports & Settings ──
  async getPerformanceReviews(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/performance?${q}`);
    return res.data || [];
  },

  async createPerformanceReview(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/performance',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getTrainingRecords(): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>('/erp/hrm/training');
    return res.data || [];
  },

  async createTrainingRecord(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/training',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async getHeadcountReport(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/hrm/reports/headcount');
    return res.data;
  },

  async getPayrollAnalyticsReport(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/hrm/reports/payroll');
    return res.data;
  },

  async getHrAuditLogs(limit = 50): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/hrm/audit-logs?limit=${limit}`);
    return res.data || [];
  },

  async getSettings(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/hrm/settings');
    return res.data;
  },

  async updateSettings(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(
      '/erp/hrm/settings',
      { method: 'PUT', body: JSON.stringify(payload) }
    );
    return res.data;
  },
};

export default hrmService;
