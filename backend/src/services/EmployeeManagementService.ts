import { Types } from 'mongoose';
import {
  EmployeeProfileModel,
  IEmployeeProfile,
  DepartmentModel,
  IDepartment,
  DesignationModel,
  IDesignation,
  JobGradeModel,
  IJobGrade,
  EmploymentTypeModel,
  IEmploymentType,
  CounterModel,
  UserModel,
} from '../models';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../errors/AppError';

export interface CreateEmployeeDTO {
  userId?: string | Types.ObjectId;
  employeeCode?: string;
  department: string;
  designation: string;
  joiningDate: Date | string;
  basicSalary: number;
  houseRentAllowance?: number;
  medicalAllowance?: number;
  conveyanceAllowance?: number;
  grossSalary?: number;
  salesCommissionRate?: number;
  assignedWarehouseId?: string | Types.ObjectId;
  organizationId?: string | Types.ObjectId;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date | string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    nidNumber?: string;
    passportNumber?: string;
    maritalStatus?: string;
    religion?: string;
    nationality?: string;
    photoUrl?: string;
    signatureUrl?: string;
  };
  contactInfo?: {
    personalEmail?: string;
    officialEmail?: string;
    personalPhone?: string;
    officialPhone?: string;
    presentAddress?: string;
    permanentAddress?: string;
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
    departmentId?: string | Types.ObjectId;
    designationId?: string | Types.ObjectId;
    jobGradeId?: string | Types.ObjectId;
    employmentTypeId?: string | Types.ObjectId;
    reportingToId?: string | Types.ObjectId;
    shiftId?: string | Types.ObjectId;
    employmentType?: string;
    status?: 'PROBATION' | 'CONFIRMED' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'RETIRED';
    probationEndDate?: Date | string;
    confirmationDate?: Date | string;
    onboardingChecklist?: Array<{ task: string; completed: boolean; completedAt?: Date }>;
  };
  bankDetails?: {
    bankName?: string;
    branchName?: string;
    accountName?: string;
    accountNo?: string;
    routingNo?: string;
    paymentMethod?: 'BANK' | 'CASH' | 'MFS' | 'CHEQUE';
  };
  documents?: Array<{
    docType: string;
    title: string;
    docUrl: string;
    expiryDate?: Date | string;
    verified?: boolean;
  }>;
  salaryStructureId?: string | Types.ObjectId;
  // Extended Desktop Employee Details Sheet Fields
  againstId?: string;
  againstName?: string;
  fatherOrHusbandName?: string;
  motherName?: string;
  age?: number;
  qualification?: string;
  highQualification?: string;
  jobGrade?: string;
  joiningSalary?: number;
  currentSalary?: number;
  allowance?: number;
  overtime?: number;
  dateOfModify?: Date | string;
  jobDuration?: string;
  jobDescriptionCategory?: string;
  jobDescriptionIndividual?: string;
  responsibilitiesIndividual?: string;
  cityDistrict?: string;
  depSl?: number;
  salSl?: number;
  idCardGiven?: boolean;
  idCardGivenDate?: Date | string;
  isResigned?: boolean;
  terminationOrResignedDate?: Date | string;
  leaveReport?: {
    cl?: number;
    sl?: number;
    wp?: number;
    ml?: number;
    el?: number;
    gh?: number;
  };
}

export class EmployeeManagementService {
  /**
   * Generates next unique employee code (e.g. SBC-EMP-001)
   */
  public static async generateEmployeeCode(prefix = 'SBC-EMP'): Promise<string> {
    const counterKey = `EMPLOYEE_${prefix}`;
    const counter = await CounterModel.findByIdAndUpdate(
      counterKey,
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    return `${prefix}-${String(counter.seq).padStart(3, '0')}`;
  }

  /**
   * Previews next sequential employee code without incrementing
   */
  public static async getNextEmployeeCode(prefix = 'SBC-EMP'): Promise<string> {
    const counterKey = `EMPLOYEE_${prefix}`;
    const counter = await CounterModel.findById(counterKey);
    const nextSeq = counter ? counter.seq + 1 : 1;
    return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
  }

  /**
   * Creates a new employee with onboarding workflow
   */
  public static async createEmployee(
    data: CreateEmployeeDTO,
    actorId?: string,
    actorRole = 'HR_ADMIN'
  ): Promise<IEmployeeProfile> {
    let userId = data.userId;
    if (!userId) {
      const email =
        data.contactInfo?.personalEmail ||
        data.contactInfo?.officialEmail ||
        `emp.${Date.now()}@sunbirdcorp.com`;
      const mobile =
        data.contactInfo?.personalPhone ||
        data.contactInfo?.officialPhone ||
        `017${Date.now().toString().slice(-8)}`;
      const fullName =
        (data.personalInfo?.firstName
          ? `${data.personalInfo.firstName} ${data.personalInfo.lastName || ''}`.trim()
          : '') || 'Employee';

      let user = await UserModel.findOne({ $or: [{ email }, { mobile }] });
      if (!user) {
        user = await UserModel.create({
          fullName,
          email,
          mobile,
          userType: 'STAFF',
          role: 'ADMIN',
          status: 'ACTIVE',
          passwordHash: 'default_staff_hash',
        });
      }
      userId = user._id;
    }

    const employeeCode = data.employeeCode || (await this.generateEmployeeCode());

    // Basic onboarding checklist if not provided
    const defaultChecklist = [
      { task: 'National ID & Photo Verification', completed: !!data.personalInfo?.nidNumber },
      { task: 'Academic & Experience Certificates Verification', completed: false },
      { task: 'Official Email & System User Account Created', completed: !!data.userId },
      { task: 'Bank Account & Payroll Setup', completed: !!data.bankDetails?.accountNo },
      { task: 'Company Assets & ID Card Handover', completed: false },
    ];

    const gross =
      data.grossSalary ||
      (data.basicSalary || 0) +
        (data.houseRentAllowance || 0) +
        (data.medicalAllowance || 0) +
        (data.conveyanceAllowance || 0);

    const employee = new EmployeeProfileModel({
      ...data,
      userId,
      employeeCode,
      grossSalary: gross,
      employmentDetails: {
        ...data.employmentDetails,
        onboardingChecklist:
          data.employmentDetails?.onboardingChecklist &&
          data.employmentDetails.onboardingChecklist.length > 0
            ? data.employmentDetails.onboardingChecklist
            : defaultChecklist,
        status: data.employmentDetails?.status || 'PROBATION',
      },
    });

    const saved = await employee.save();

    await AuditLogService.record({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorRole,
      action: 'CREATE',
      targetCollection: 'EmployeeProfile',
      targetId: saved._id,
      organizationId: saved.organizationId,
      module: 'HRM',
      diff: { employeeCode: saved.employeeCode, department: saved.department },
    });

    logger.info(`[EmployeeManagementService] Created employee ${saved.employeeCode} (${saved._id})`);
    return saved;
  }

  /**
   * Updates an existing employee profile
   */
  public static async updateEmployee(
    id: string | Types.ObjectId,
    updateData: Partial<CreateEmployeeDTO>,
    actorId?: string,
    actorRole = 'HR_ADMIN'
  ): Promise<IEmployeeProfile> {
    const employee = await EmployeeProfileModel.findById(id);
    if (!employee) {
      throw new NotFoundError(`Employee with ID ${id} not found`);
    }

    Object.assign(employee, updateData);

    if (
      updateData.basicSalary !== undefined ||
      updateData.houseRentAllowance !== undefined ||
      updateData.medicalAllowance !== undefined ||
      updateData.conveyanceAllowance !== undefined
    ) {
      employee.grossSalary =
        (employee.basicSalary || 0) +
        (employee.houseRentAllowance || 0) +
        (employee.medicalAllowance || 0) +
        (employee.conveyanceAllowance || 0);
    }

    const saved = await employee.save();

    await AuditLogService.record({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorRole,
      action: 'UPDATE',
      targetCollection: 'EmployeeProfile',
      targetId: saved._id,
      organizationId: saved.organizationId,
      module: 'HRM',
      diff: updateData,
    });

    return saved;
  }

  /**
   * Onboarding checklist task toggle
   */
  public static async updateOnboardingTask(
    employeeId: string | Types.ObjectId,
    taskIndex: number,
    completed: boolean,
    actorId?: string
  ): Promise<IEmployeeProfile> {
    const employee = await EmployeeProfileModel.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    const checklist = employee.employmentDetails?.onboardingChecklist || [];
    if (!checklist[taskIndex]) {
      throw new ValidationError(`Checklist item at index ${taskIndex} not found`);
    }

    checklist[taskIndex].completed = completed;
    checklist[taskIndex].completedAt = completed ? new Date() : undefined;

    employee.markModified('employmentDetails');
    return await employee.save();
  }

  /**
   * Offboarding clearance workflow
   */
  public static async processOffboarding(
    employeeId: string | Types.ObjectId,
    data: {
      resignationDate?: Date;
      lastWorkingDate?: Date;
      offboardingNotes?: string;
      clearance?: {
        itClearance?: boolean;
        accountsClearance?: boolean;
        adminClearance?: boolean;
        hrClearance?: boolean;
      };
      status?: 'RESIGNED' | 'TERMINATED' | 'RETIRED';
    },
    actorId?: string
  ): Promise<IEmployeeProfile> {
    const employee = await EmployeeProfileModel.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    if (!employee.employmentDetails) {
      employee.employmentDetails = {};
    }

    if (data.resignationDate) employee.employmentDetails.resignationDate = data.resignationDate;
    if (data.lastWorkingDate) employee.employmentDetails.lastWorkingDate = data.lastWorkingDate;
    if (data.offboardingNotes) employee.employmentDetails.offboardingNotes = data.offboardingNotes;

    if (data.clearance) {
      employee.employmentDetails.offboardingClearance = {
        itClearance: data.clearance.itClearance ?? employee.employmentDetails.offboardingClearance?.itClearance ?? false,
        accountsClearance: data.clearance.accountsClearance ?? employee.employmentDetails.offboardingClearance?.accountsClearance ?? false,
        adminClearance: data.clearance.adminClearance ?? employee.employmentDetails.offboardingClearance?.adminClearance ?? false,
        hrClearance: data.clearance.hrClearance ?? employee.employmentDetails.offboardingClearance?.hrClearance ?? false,
      };
    }

    if (data.status) {
      employee.employmentDetails.status = data.status;
      if (['RESIGNED', 'TERMINATED', 'RETIRED'].includes(data.status)) {
        employee.isActive = false;
      }
    }

    employee.markModified('employmentDetails');
    const saved = await employee.save();

    await AuditLogService.record({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      actorRole: 'HR_ADMIN',
      action: 'UPDATE',
      targetCollection: 'EmployeeProfile',
      targetId: saved._id,
      organizationId: saved.organizationId,
      module: 'HRM',
      diff: { offboarding: data },
    });

    return saved;
  }

  /**
   * Generates organization chart tree
   */
  public static async getOrganizationChart(organizationId?: string | Types.ObjectId): Promise<any[]> {
    const query: any = { isActive: true };
    if (organizationId) query.organizationId = organizationId;

    const employees = await EmployeeProfileModel.find(query)
      .select('employeeCode department designation personalInfo employmentDetails userId isActive')
      .populate('userId', 'name email phone avatar')
      .lean();

    const employeeMap = new Map<string, any>();
    employees.forEach((emp) => {
      const name =
        (emp.personalInfo?.firstName || '') + ' ' + (emp.personalInfo?.lastName || '') ||
        (emp.userId as any)?.name ||
        emp.employeeCode;
      employeeMap.set(emp._id.toString(), {
        ...emp,
        displayName: name.trim(),
        children: [],
      });
    });

    const rootNodes: any[] = [];
    employees.forEach((emp) => {
      const node = employeeMap.get(emp._id.toString());
      const reportingToId = emp.employmentDetails?.reportingToId?.toString();
      if (reportingToId && employeeMap.has(reportingToId)) {
        employeeMap.get(reportingToId).children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  /**
   * Generates Employee ID Card formatted data
   */
  public static async getEmployeeIdCardData(employeeId: string | Types.ObjectId): Promise<any> {
    const employee = await EmployeeProfileModel.findById(employeeId)
      .populate('userId', 'name email phone avatar')
      .populate('assignedWarehouseId', 'name address')
      .lean();

    if (!employee) throw new NotFoundError('Employee not found');

    const name =
      ((employee.personalInfo?.firstName || '') + ' ' + (employee.personalInfo?.lastName || '')).trim() ||
      (employee.userId as any)?.name ||
      employee.employeeCode;

    return {
      employeeId: employee._id,
      employeeCode: employee.employeeCode,
      name,
      designation: employee.designation,
      department: employee.department,
      joiningDate: employee.joiningDate,
      bloodGroup: employee.personalInfo?.bloodGroup || 'N/A',
      emergencyPhone: employee.emergencyContacts?.[0]?.phone || employee.contactInfo?.personalPhone || 'N/A',
      photoUrl: employee.personalInfo?.photoUrl || (employee.userId as any)?.avatar || '',
      qrData: `SUNBIRD-EMP:${employee.employeeCode}:${name}`,
      company: 'SUN BIRD CORPORATION',
      website: 'www.sunbirdcorp.com',
    };
  }

  // ── Departments CRUD ──
  public static async getDepartments(organizationId?: string | Types.ObjectId): Promise<IDepartment[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    return await DepartmentModel.find(query).populate('headEmployeeId', 'employeeCode designation').lean() as any;
  }

  public static async createDepartment(data: Partial<IDepartment>): Promise<IDepartment> {
    const dept = new DepartmentModel(data);
    return await dept.save();
  }

  // ── Designations CRUD ──
  public static async getDesignations(organizationId?: string | Types.ObjectId): Promise<IDesignation[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    return await DesignationModel.find(query).populate('departmentId', 'name departmentCode').lean() as any;
  }

  public static async createDesignation(data: Partial<IDesignation>): Promise<IDesignation> {
    const desig = new DesignationModel(data);
    return await desig.save();
  }

  // ── Job Grades & Employment Types ──
  public static async getJobGrades(organizationId?: string | Types.ObjectId): Promise<IJobGrade[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    return await JobGradeModel.find(query).lean() as any;
  }

  public static async createJobGrade(data: Partial<IJobGrade>): Promise<IJobGrade> {
    const grade = new JobGradeModel(data);
    return await grade.save();
  }

  public static async getEmploymentTypes(organizationId?: string | Types.ObjectId): Promise<IEmploymentType[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    return await EmploymentTypeModel.find(query).lean() as any;
  }

  public static async createEmploymentType(data: Partial<IEmploymentType>): Promise<IEmploymentType> {
    const empType = new EmploymentTypeModel(data);
    return await empType.save();
  }
}
