import { Types } from 'mongoose';
import {
  LeaveTypeModel,
  ILeaveType,
  LeaveRequestModel,
  ILeaveRequest,
  LeaveBalanceModel,
  ILeaveBalance,
  EmployeeProfileModel,
  CounterModel,
} from '../models';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../errors/AppError';

export interface SubmitLeaveRequestDTO {
  employeeId: string | Types.ObjectId;
  leaveTypeId: string | Types.ObjectId;
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number;
  reason: string;
  handoverEmployeeId?: string | Types.ObjectId;
  organizationId?: string | Types.ObjectId;
}

export class LeaveManagementService {
  // ── Leave Types ──
  public static async getLeaveTypes(organizationId?: string | Types.ObjectId): Promise<ILeaveType[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    return await LeaveTypeModel.find(query).sort({ code: 1 }).lean() as any;
  }

  public static async createLeaveType(data: Partial<ILeaveType>): Promise<ILeaveType> {
    const leaveType = new LeaveTypeModel(data);
    return await leaveType.save();
  }

  // ── Leave Balances ──
  public static async initializeBalancesForYear(
    year: number,
    organizationId?: string | Types.ObjectId
  ): Promise<number> {
    const empQuery: any = { isActive: true };
    if (organizationId) empQuery.organizationId = organizationId;
    const employees = await EmployeeProfileModel.find(empQuery);

    const ltQuery: any = { isActive: true };
    if (organizationId) ltQuery.organizationId = organizationId;
    const leaveTypes = await LeaveTypeModel.find(ltQuery);

    let count = 0;
    for (const emp of employees) {
      for (const lt of leaveTypes) {
        await LeaveBalanceModel.findOneAndUpdate(
          { employeeId: emp._id, leaveTypeId: lt._id, year },
          {
            $setOnInsert: {
              allocatedDays: lt.annualQuota,
              usedDays: 0,
              remainingDays: lt.annualQuota,
              carriedForwardDays: 0,
              organizationId: emp.organizationId,
            },
          },
          { upsert: true, new: true }
        );
        count++;
      }
    }
    return count;
  }

  public static async getEmployeeBalances(
    employeeId: string | Types.ObjectId,
    year?: number
  ): Promise<ILeaveBalance[]> {
    const targetYear = year || new Date().getFullYear();
    return await LeaveBalanceModel.find({
      employeeId,
      year: targetYear,
    })
      .populate('leaveTypeId', 'code name annualQuota isPaid')
      .lean() as any;
  }

  // ── Submit Leave Request ──
  public static async submitLeaveRequest(data: SubmitLeaveRequestDTO): Promise<ILeaveRequest> {
    const employee = await EmployeeProfileModel.findById(data.employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    const leaveType = await LeaveTypeModel.findById(data.leaveTypeId);
    if (!leaveType) throw new NotFoundError('Leave type not found');

    const year = new Date(data.startDate).getFullYear();
    let balance = await LeaveBalanceModel.findOne({
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      year,
    });

    if (!balance) {
      balance = await LeaveBalanceModel.create({
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        year,
        allocatedDays: leaveType.annualQuota,
        usedDays: 0,
        remainingDays: leaveType.annualQuota,
        organizationId: data.organizationId || employee.organizationId,
      });
    }

    if (balance.remainingDays < data.totalDays) {
      throw new ValidationError(
        `Insufficient leave balance. Requested: ${data.totalDays}, Remaining: ${balance.remainingDays}`
      );
    }

    const counter = await CounterModel.findByIdAndUpdate(
      `LEAVE_REQ_${year}`,
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const requestNo = `LV-${year}-${String(counter.seq).padStart(4, '0')}`;

    const request = new LeaveRequestModel({
      ...data,
      requestNo,
      status: 'PENDING',
    });

    const saved = await request.save();
    logger.info(`[LeaveManagementService] Submitted leave request ${saved.requestNo} for ${employee.employeeCode}`);
    return saved;
  }

  // ── Approve or Reject Leave Request ──
  public static async processLeaveApproval(
    requestId: string | Types.ObjectId,
    status: 'APPROVED' | 'REJECTED',
    approvedBy: string | Types.ObjectId,
    approvalRemarks?: string
  ): Promise<ILeaveRequest> {
    const request = await LeaveRequestModel.findById(requestId);
    if (!request) throw new NotFoundError('Leave request not found');

    if (request.status !== 'PENDING') {
      throw new ValidationError(`Cannot process request in status ${request.status}`);
    }

    request.status = status;
    request.approvedBy = new Types.ObjectId(approvedBy);
    if (approvalRemarks) request.approvalRemarks = approvalRemarks;

    if (status === 'APPROVED') {
      const year = new Date(request.startDate).getFullYear();
      await LeaveBalanceModel.findOneAndUpdate(
        { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year },
        {
          $inc: { usedDays: request.totalDays, remainingDays: -request.totalDays },
        }
      );
    }

    const saved = await request.save();

    await AuditLogService.record({
      actorId: new Types.ObjectId(approvedBy),
      actorRole: 'HR_MANAGER',
      action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
      targetCollection: 'LeaveRequest',
      targetId: saved._id,
      organizationId: saved.organizationId,
      module: 'HRM',
      diff: { status, approvalRemarks },
    });

    return saved;
  }

  // ── Leave Calendar ──
  public static async getLeaveCalendar(filter: {
    year?: number;
    month?: number; // 1-12
    department?: string;
    organizationId?: string | Types.ObjectId;
  }): Promise<any[]> {
    const query: any = { status: 'APPROVED' };
    if (filter.organizationId) query.organizationId = filter.organizationId;

    if (filter.year && filter.month) {
      const start = new Date(filter.year, filter.month - 1, 1);
      const end = new Date(filter.year, filter.month, 0);
      query.startDate = { $lte: end };
      query.endDate = { $gte: start };
    }

    return await LeaveRequestModel.find(query)
      .populate('employeeId', 'employeeCode department designation personalInfo')
      .populate('leaveTypeId', 'code name')
      .sort({ startDate: 1 })
      .lean();
  }
}
