import { Types } from 'mongoose';
import {
  PerformanceReviewModel,
  IPerformanceReview,
  TrainingRecordModel,
  ITrainingRecord,
  HrSettingsModel,
  IHrSettings,
  AuditLogModel,
  EmployeeProfileModel,
  PayrollBatchModel,
  AttendancePunchModel,
  LeaveRequestModel,
  CounterModel,
} from '../models';
import logger from '../config/logger';
import { NotFoundError } from '../errors/AppError';

export class HRAuxiliaryService {
  // ── Performance Management ──
  public static async getPerformanceReviews(filter: {
    employeeId?: string | Types.ObjectId;
    period?: string;
    organizationId?: string | Types.ObjectId;
  }): Promise<IPerformanceReview[]> {
    const query: any = {};
    if (filter.employeeId) query.employeeId = filter.employeeId;
    if (filter.period) query.period = filter.period;
    if (filter.organizationId) query.organizationId = filter.organizationId;

    return await PerformanceReviewModel.find(query)
      .populate('employeeId', 'employeeCode department designation personalInfo')
      .populate('reviewerId', 'name email')
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  public static async createPerformanceReview(data: Partial<IPerformanceReview>): Promise<IPerformanceReview> {
    const counter = await CounterModel.findByIdAndUpdate(
      'PERF_REV_COUNTER',
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const reviewCode = `PR-${new Date().getFullYear()}-${String(counter.seq).padStart(3, '0')}`;

    const review = new PerformanceReviewModel({
      ...data,
      reviewCode,
    });

    return await review.save();
  }

  // ── Training & Development ──
  public static async getTrainingRecords(organizationId?: string | Types.ObjectId): Promise<ITrainingRecord[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;

    return await TrainingRecordModel.find(query)
      .populate('attendees.employeeId', 'employeeCode department designation personalInfo')
      .sort({ startDate: -1 })
      .lean() as any;
  }

  public static async createTrainingRecord(data: Partial<ITrainingRecord>): Promise<ITrainingRecord> {
    const counter = await CounterModel.findByIdAndUpdate(
      'TRAINING_COUNTER',
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const trainingCode = `TRN-${new Date().getFullYear()}-${String(counter.seq).padStart(3, '0')}`;

    const training = new TrainingRecordModel({
      ...data,
      trainingCode,
    });

    return await training.save();
  }

  // ── HR Reports Engine ──
  public static async getHeadcountReport(organizationId?: string | Types.ObjectId): Promise<any> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;

    const employees = await EmployeeProfileModel.find(query).lean();

    const byDepartment: Record<string, number> = {};
    let activeCount = 0;
    let probationCount = 0;
    let confirmedCount = 0;
    let resignedCount = 0;

    employees.forEach((emp) => {
      const dept = emp.department || 'Unassigned';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;

      if (emp.isActive) activeCount++;
      const status = emp.employmentDetails?.status || (emp.isActive ? 'CONFIRMED' : 'RESIGNED');
      if (status === 'PROBATION') probationCount++;
      if (status === 'CONFIRMED') confirmedCount++;
      if (['RESIGNED', 'TERMINATED', 'RETIRED'].includes(status)) resignedCount++;
    });

    return {
      totalEmployees: employees.length,
      activeCount,
      probationCount,
      confirmedCount,
      resignedCount,
      departmentBreakdown: Object.entries(byDepartment).map(([department, count]) => ({
        department,
        count,
      })),
    };
  }

  public static async getPayrollAnalyticsReport(organizationId?: string | Types.ObjectId): Promise<any> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;

    const batches = await PayrollBatchModel.find(query).sort({ monthYear: 1 }).lean();

    let totalDisbursedYtd = 0;
    const monthlyTrend = batches.map((b) => {
      totalDisbursedYtd += b.totalNet;
      return {
        monthYear: b.monthYear,
        totalEmployees: b.totalEmployees,
        totalGross: b.totalGross,
        totalDeductions: b.totalDeductions,
        totalNet: b.totalNet,
        status: b.status,
      };
    });

    return {
      totalBatches: batches.length,
      totalDisbursedYtd,
      monthlyTrend,
    };
  }

  // ── HR Audit Logs ──
  public static async getHrAuditLogs(limit = 50, organizationId?: string | Types.ObjectId): Promise<any[]> {
    const query: any = {
      $or: [
        { module: 'HRM' },
        {
          targetCollection: {
            $in: [
              'EmployeeProfile',
              'AttendancePunch',
              'PayrollRun',
              'PayrollBatch',
              'Payslip',
              'LeaveRequest',
              'LeaveType',
              'EmployeeAdvance',
              'ExpenseReimbursement',
            ],
          },
        },
      ],
    };
    if (organizationId) query.organizationId = organizationId;

    return await AuditLogModel.find(query)
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // ── HR Settings ──
  public static async getSettings(organizationId?: string | Types.ObjectId): Promise<IHrSettings> {
    const orgId = organizationId || new Types.ObjectId('000000000000000000000001');
    let settings = await HrSettingsModel.findOne({ organizationId: orgId });
    if (!settings) {
      settings = await HrSettingsModel.create({
        organizationId: orgId,
        workingDaysPerMonth: 26,
        dailyWorkingHours: 8,
        overtimeRateMultiplier: 1.5,
        lateGraceMinutes: 15,
        probationPeriodMonths: 6,
        companyPrefix: 'SBC-EMP',
      });
    }
    return settings;
  }

  public static async updateSettings(
    updateData: Partial<IHrSettings>,
    organizationId?: string | Types.ObjectId
  ): Promise<IHrSettings> {
    const orgId = organizationId || new Types.ObjectId('000000000000000000000001');
    const settings = await HrSettingsModel.findOneAndUpdate(
      { organizationId: orgId },
      { $set: updateData },
      { upsert: true, new: true }
    );
    return settings;
  }
}
