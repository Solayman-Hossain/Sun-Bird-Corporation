import { ClientSession, Types } from 'mongoose';
import {
  EmployeeProfileModel,
  IEmployeeProfile,
} from '../models/EmployeeProfile';
import { UserModel } from '../models/User';
import { WarehouseModel } from '../models/Warehouse';
import { CounterService } from './CounterService';
import { ValidationError, NotFoundError, DuplicateKeyError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateEmployeeDTO {
  userId: string | Types.ObjectId;
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
  loanOutstanding?: number;
  casualLeaveBalance?: number;
  sickLeaveBalance?: number;
  earnedLeaveBalance?: number;
  officeLatLng?: {
    lat?: number;
    lng?: number;
  };
  isActive?: boolean;
}

export interface UpdateEmployeeDTO {
  department?: string;
  designation?: string;
  basicSalary?: number;
  houseRentAllowance?: number;
  medicalAllowance?: number;
  conveyanceAllowance?: number;
  salesCommissionRate?: number;
  assignedWarehouseId?: string | Types.ObjectId;
  loanOutstanding?: number;
  casualLeaveBalance?: number;
  sickLeaveBalance?: number;
  earnedLeaveBalance?: number;
  officeLatLng?: {
    lat?: number;
    lng?: number;
  };
  isActive?: boolean;
}

export interface EmployeeFilterDTO {
  department?: string;
  isActive?: boolean;
  assignedWarehouseId?: string | Types.ObjectId;
  search?: string;
  page?: number;
  limit?: number;
}

export class EmployeeService {
  /**
   * Statutory Gross Salary Calculation Formula:
   * Gross Salary = basicSalary + houseRentAllowance + medicalAllowance + conveyanceAllowance
   */
  public static calculateGrossSalary(
    basicSalary: number,
    houseRentAllowance: number = 0,
    medicalAllowance: number = 0,
    conveyanceAllowance: number = 0
  ): number {
    if (basicSalary < 0) {
      throw new ValidationError('Basic salary cannot be negative');
    }
    if (houseRentAllowance < 0) {
      throw new ValidationError('House rent allowance cannot be negative');
    }
    if (medicalAllowance < 0) {
      throw new ValidationError('Medical allowance cannot be negative');
    }
    if (conveyanceAllowance < 0) {
      throw new ValidationError('Conveyance allowance cannot be negative');
    }

    const gross = basicSalary + houseRentAllowance + medicalAllowance + conveyanceAllowance;
    return Math.round(gross * 100) / 100;
  }

  /**
   * Onboard and create a new Employee profile matching statutory compensation guidelines.
   */
  public static async createEmployee(
    dto: CreateEmployeeDTO,
    session?: ClientSession
  ): Promise<IEmployeeProfile> {
    if (!dto.userId) {
      throw new ValidationError('User ID is required for employee onboarding');
    }
    if (!dto.department) {
      throw new ValidationError('Department is required');
    }
    if (!dto.designation) {
      throw new ValidationError('Designation is required');
    }
    if (dto.basicSalary === undefined || dto.basicSalary === null) {
      throw new ValidationError('Basic salary is required');
    }

    // Verify User exists
    const user = await UserModel.findById(dto.userId).session(session || null);
    if (!user) {
      throw new NotFoundError(`User with ID ${dto.userId} not found`);
    }

    // Verify one-to-one constraint: userId must not already have an employee profile
    const existingProfile = await EmployeeProfileModel.findOne({ userId: dto.userId }).session(session || null);
    if (existingProfile) {
      throw new DuplicateKeyError('userId', dto.userId);
    }

    // Verify assigned warehouse if supplied
    if (dto.assignedWarehouseId) {
      const warehouse = await WarehouseModel.findById(dto.assignedWarehouseId).session(session || null);
      if (!warehouse) {
        throw new NotFoundError(`Assigned Warehouse with ID ${dto.assignedWarehouseId} not found`);
      }
    }

    // Generate atomic sequence code if not provided
    const employeeCode =
      dto.employeeCode?.trim().toUpperCase() ||
      (await CounterService.getNextSequence('EMP', session));

    // Verify unique employeeCode
    const existingCode = await EmployeeProfileModel.findOne({ employeeCode }).session(session || null);
    if (existingCode) {
      throw new DuplicateKeyError('employeeCode', employeeCode);
    }

    // Enforce Statutory Gross Salary formula
    const houseRent = dto.houseRentAllowance ?? 0;
    const medical = dto.medicalAllowance ?? 0;
    const conveyance = dto.conveyanceAllowance ?? 0;
    const grossSalary = this.calculateGrossSalary(dto.basicSalary, houseRent, medical, conveyance);

    // Sales Commission Rate validation: typical 1.5% - 3.0%
    const departmentUpper = dto.department.trim().toUpperCase();
    let salesCommissionRate = dto.salesCommissionRate ?? 0;
    if (salesCommissionRate < 0 || salesCommissionRate > 100) {
      throw new ValidationError('Sales commission rate must be between 0% and 100%');
    }
    if (departmentUpper === 'SALES' && salesCommissionRate === 0) {
      logger.info(
        `Sales department employee ${employeeCode} initialized with 0% commission; standard is 1.5% - 3.0%`
      );
    }

    const joiningDate = dto.joiningDate ? new Date(dto.joiningDate) : new Date();

    const employee = new EmployeeProfileModel({
      userId: dto.userId,
      employeeCode,
      department: departmentUpper,
      designation: dto.designation.trim(),
      joiningDate,
      basicSalary: dto.basicSalary,
      houseRentAllowance: houseRent,
      medicalAllowance: medical,
      conveyanceAllowance: conveyance,
      grossSalary,
      salesCommissionRate,
      assignedWarehouseId: dto.assignedWarehouseId ? new Types.ObjectId(dto.assignedWarehouseId) : undefined,
      loanOutstanding: dto.loanOutstanding ?? 0,
      casualLeaveBalance: dto.casualLeaveBalance ?? 15,
      sickLeaveBalance: dto.sickLeaveBalance ?? 10,
      earnedLeaveBalance: dto.earnedLeaveBalance ?? 0,
      officeLatLng: dto.officeLatLng,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    await employee.save({ session });
    logger.info(
      `Employee onboarded successfully: ${employee.employeeCode} (${employee.designation}, Dept: ${employee.department}, Gross: ${employee.grossSalary} BDT)`
    );

    return employee;
  }

  /**
   * Update employee details and recalculate compensation structure if salary components changed.
   */
  public static async updateEmployee(
    id: string | Types.ObjectId,
    dto: UpdateEmployeeDTO,
    session?: ClientSession
  ): Promise<IEmployeeProfile> {
    const employee = await EmployeeProfileModel.findById(id).session(session || null);
    if (!employee) {
      throw new NotFoundError(`Employee with ID ${id} not found`);
    }

    if (dto.department) {
      employee.department = dto.department.trim().toUpperCase();
    }
    if (dto.designation) {
      employee.designation = dto.designation.trim();
    }
    if (dto.assignedWarehouseId !== undefined) {
      if (dto.assignedWarehouseId) {
        const warehouse = await WarehouseModel.findById(dto.assignedWarehouseId).session(session || null);
        if (!warehouse) {
          throw new NotFoundError(`Assigned Warehouse with ID ${dto.assignedWarehouseId} not found`);
        }
        employee.assignedWarehouseId = new Types.ObjectId(dto.assignedWarehouseId);
      } else {
        employee.assignedWarehouseId = undefined;
      }
    }

    if (dto.salesCommissionRate !== undefined) {
      if (dto.salesCommissionRate < 0 || dto.salesCommissionRate > 100) {
        throw new ValidationError('Sales commission rate must be between 0% and 100%');
      }
      employee.salesCommissionRate = dto.salesCommissionRate;
    }

    if (dto.loanOutstanding !== undefined) {
      employee.loanOutstanding = Math.max(0, dto.loanOutstanding);
    }
    if (dto.casualLeaveBalance !== undefined) {
      employee.casualLeaveBalance = Math.max(0, dto.casualLeaveBalance);
    }
    if (dto.sickLeaveBalance !== undefined) {
      employee.sickLeaveBalance = Math.max(0, dto.sickLeaveBalance);
    }
    if (dto.earnedLeaveBalance !== undefined) {
      employee.earnedLeaveBalance = Math.max(0, dto.earnedLeaveBalance);
    }
    if (dto.officeLatLng !== undefined) {
      employee.officeLatLng = dto.officeLatLng;
    }
    if (dto.isActive !== undefined) {
      employee.isActive = dto.isActive;
    }

    // If any salary component updated, recalculate grossSalary strictly
    const isSalaryModified =
      dto.basicSalary !== undefined ||
      dto.houseRentAllowance !== undefined ||
      dto.medicalAllowance !== undefined ||
      dto.conveyanceAllowance !== undefined;

    if (isSalaryModified) {
      const basic = dto.basicSalary !== undefined ? dto.basicSalary : employee.basicSalary;
      const house =
        dto.houseRentAllowance !== undefined ? dto.houseRentAllowance : employee.houseRentAllowance;
      const med =
        dto.medicalAllowance !== undefined ? dto.medicalAllowance : employee.medicalAllowance;
      const conv =
        dto.conveyanceAllowance !== undefined
          ? dto.conveyanceAllowance
          : employee.conveyanceAllowance;

      employee.basicSalary = basic;
      employee.houseRentAllowance = house;
      employee.medicalAllowance = med;
      employee.conveyanceAllowance = conv;
      employee.grossSalary = this.calculateGrossSalary(basic, house, med, conv);
    }

    await employee.save({ session });
    logger.info(`Employee profile updated: ${employee.employeeCode}`);
    return employee;
  }

  /**
   * Find employee profile by MongoDB _id.
   */
  public static async getEmployeeById(
    id: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IEmployeeProfile> {
    const employee = await EmployeeProfileModel.findById(id)
      .populate('userId', 'fullName email mobile userType')
      .populate('assignedWarehouseId', 'name warehouseCode district location')
      .session(session || null);

    if (!employee) {
      throw new NotFoundError(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  /**
   * Find employee profile by employeeCode.
   */
  public static async getEmployeeByCode(
    employeeCode: string,
    session?: ClientSession
  ): Promise<IEmployeeProfile> {
    const employee = await EmployeeProfileModel.findOne({
      employeeCode: employeeCode.trim().toUpperCase(),
    })
      .populate('userId', 'fullName email mobile userType')
      .populate('assignedWarehouseId', 'name warehouseCode district location')
      .session(session || null);

    if (!employee) {
      throw new NotFoundError(`Employee with code ${employeeCode} not found`);
    }
    return employee;
  }

  /**
   * Find employee profile by User _id (one-to-one link).
   */
  public static async getEmployeeByUserId(
    userId: string | Types.ObjectId,
    session?: ClientSession
  ): Promise<IEmployeeProfile | null> {
    return EmployeeProfileModel.findOne({ userId })
      .populate('userId', 'fullName email mobile userType')
      .populate('assignedWarehouseId', 'name warehouseCode district location')
      .session(session || null);
  }

  /**
   * Query employee directory with filtering and pagination.
   */
  public static async listEmployees(filter: EmployeeFilterDTO = {}) {
    const query: any = {};

    if (filter.department) {
      query.department = filter.department.trim().toUpperCase();
    }
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    if (filter.assignedWarehouseId) {
      query.assignedWarehouseId = new Types.ObjectId(filter.assignedWarehouseId);
    }
    if (filter.search) {
      const regex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ employeeCode: regex }, { designation: regex }];
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      EmployeeProfileModel.find(query)
        .populate('userId', 'fullName email mobile')
        .populate('assignedWarehouseId', 'name warehouseCode district')
        .sort({ employeeCode: 1 })
        .skip(skip)
        .limit(limit),
      EmployeeProfileModel.countDocuments(query),
    ]);

    return {
      employees,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default EmployeeService;
