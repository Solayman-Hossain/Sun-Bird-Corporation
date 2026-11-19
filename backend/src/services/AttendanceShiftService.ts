import { Types } from 'mongoose';
import {
  AttendancePunchModel,
  IAttendancePunch,
  ShiftModel,
  IShift,
  RosterScheduleModel,
  IRosterSchedule,
  HolidayModel,
  IHoliday,
  AttendanceCorrectionModel,
  IAttendanceCorrection,
  EmployeeProfileModel,
} from '../models';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../errors/AppError';

export interface RecordPunchDTO {
  employeeId: string | Types.ObjectId;
  punchType: 'IN' | 'OUT';
  punchTimestamp?: Date;
  punchDate?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  isWithinGeofence?: boolean;
  deviceUUID?: string;
}

export interface BulkAttendanceItem {
  employeeCode: string;
  punchDate: string; // YYYY-MM-DD
  inTime?: string;   // HH:mm or ISO
  outTime?: string;  // HH:mm or ISO
  isPresent?: boolean;
}

export class AttendanceShiftService {
  // ── Shift Management ──
  public static async getShifts(organizationId?: string | Types.ObjectId): Promise<IShift[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    return await ShiftModel.find(query).sort({ shiftCode: 1 }).lean() as any;
  }

  public static async createShift(data: Partial<IShift>): Promise<IShift> {
    const shift = new ShiftModel(data);
    return await shift.save();
  }

  public static async updateShift(id: string | Types.ObjectId, data: Partial<IShift>): Promise<IShift> {
    const shift = await ShiftModel.findByIdAndUpdate(id, data, { new: true });
    if (!shift) throw new NotFoundError('Shift not found');
    return shift;
  }

  // ── Roster Scheduling ──
  public static async getRoster(filter: {
    employeeId?: string | Types.ObjectId;
    startDate?: string;
    endDate?: string;
    organizationId?: string | Types.ObjectId;
  }): Promise<IRosterSchedule[]> {
    const query: any = {};
    if (filter.employeeId) query.employeeId = filter.employeeId;
    if (filter.startDate) query.endDate = { $gte: filter.startDate };
    if (filter.endDate) query.startDate = { $lte: filter.endDate };
    if (filter.organizationId) query.organizationId = filter.organizationId;

    return await RosterScheduleModel.find(query)
      .populate('employeeId', 'employeeCode department designation')
      .populate('shiftId', 'shiftCode name startTime endTime')
      .sort({ startDate: 1 })
      .lean() as any;
  }

  public static async assignRoster(data: Partial<IRosterSchedule>): Promise<IRosterSchedule> {
    const roster = new RosterScheduleModel(data);
    return await roster.save();
  }

  // ── Holiday Management ──
  public static async getHolidays(year?: number, organizationId?: string | Types.ObjectId): Promise<IHoliday[]> {
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    if (year) {
      query.date = { $regex: new RegExp(`^${year}-`) };
    }
    return await HolidayModel.find(query).sort({ date: 1 }).lean() as any;
  }

  public static async createHoliday(data: Partial<IHoliday>): Promise<IHoliday> {
    const holiday = new HolidayModel(data);
    return await holiday.save();
  }

  // ── Daily Punch & Entry ──
  public static async recordPunch(data: RecordPunchDTO): Promise<IAttendancePunch> {
    const employee = await EmployeeProfileModel.findById(data.employeeId);
    if (!employee) throw new NotFoundError('Employee not found');

    const timestamp = data.punchTimestamp || new Date();
    const punchDate = data.punchDate || timestamp.toISOString().slice(0, 10);

    // Calculate if late if punchType is IN
    let isLate = false;
    if (data.punchType === 'IN') {
      let shift: IShift | null = null;
      if (employee.employmentDetails?.shiftId) {
        shift = await ShiftModel.findById(employee.employmentDetails.shiftId);
      }
      if (!shift) {
        shift = await ShiftModel.findOne({ isActive: true });
      }

      if (shift && shift.startTime) {
        const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number);
        const punchHour = timestamp.getHours();
        const punchMin = timestamp.getMinutes();
        const punchTotalMin = punchHour * 60 + punchMin;
        const shiftTotalMin = shiftHour * 60 + shiftMinute + (shift.graceMinutes || 15);

        if (punchTotalMin > shiftTotalMin) {
          isLate = true;
        }
      }
    }

    const punch = new AttendancePunchModel({
      employeeId: data.employeeId,
      punchType: data.punchType,
      punchTimestamp: timestamp,
      punchDate,
      latitude: data.latitude || 23.8103,
      longitude: data.longitude || 90.4125,
      distanceMeters: data.distanceMeters || 0,
      isWithinGeofence: data.isWithinGeofence ?? true,
      isPresent: true,
      deviceUUID: data.deviceUUID,
      isLate,
      isLWP: false,
    });

    const saved = await punch.save();
    logger.info(`[AttendanceShiftService] Recorded punch ${saved.punchType} for employee ${employee.employeeCode}`);
    return saved;
  }

  // ── Bulk Attendance Import ──
  public static async importBulkAttendance(items: BulkAttendanceItem[]): Promise<{
    importedCount: number;
    failedCount: number;
    errors: string[];
  }> {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const employee = await EmployeeProfileModel.findOne({
          employeeCode: item.employeeCode.trim().toUpperCase(),
        });
        if (!employee) {
          errors.push(`Employee code ${item.employeeCode} not found`);
          failed++;
          continue;
        }

        // Punch IN
        if (item.inTime) {
          const inDate = new Date(`${item.punchDate}T${item.inTime}:00`);
          await AttendancePunchModel.create({
            employeeId: employee._id,
            punchType: 'IN',
            punchTimestamp: isNaN(inDate.getTime()) ? new Date() : inDate,
            punchDate: item.punchDate,
            latitude: 23.8103,
            longitude: 90.4125,
            distanceMeters: 0,
            isWithinGeofence: true,
            isPresent: true,
          });
        }

        // Punch OUT
        if (item.outTime) {
          const outDate = new Date(`${item.punchDate}T${item.outTime}:00`);
          await AttendancePunchModel.create({
            employeeId: employee._id,
            punchType: 'OUT',
            punchTimestamp: isNaN(outDate.getTime()) ? new Date() : outDate,
            punchDate: item.punchDate,
            latitude: 23.8103,
            longitude: 90.4125,
            distanceMeters: 0,
            isWithinGeofence: true,
            isPresent: true,
          });
        }

        imported++;
      } catch (err: any) {
        errors.push(`Error importing ${item.employeeCode}: ${err.message}`);
        failed++;
      }
    }

    return { importedCount: imported, failedCount: failed, errors };
  }

  // ── Attendance Correction Requests ──
  public static async requestCorrection(data: {
    employeeId: string | Types.ObjectId;
    date: string;
    requestedInTime?: Date;
    requestedOutTime?: Date;
    reason: string;
    organizationId?: string | Types.ObjectId;
  }): Promise<IAttendanceCorrection> {
    const correction = new AttendanceCorrectionModel(data);
    return await correction.save();
  }

  public static async getCorrectionRequests(filter: {
    status?: string;
    employeeId?: string | Types.ObjectId;
    organizationId?: string | Types.ObjectId;
  }): Promise<IAttendanceCorrection[]> {
    const query: any = {};
    if (filter.status) query.status = filter.status;
    if (filter.employeeId) query.employeeId = filter.employeeId;
    if (filter.organizationId) query.organizationId = filter.organizationId;

    return await AttendanceCorrectionModel.find(query)
      .populate('employeeId', 'employeeCode department designation')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean() as any;
  }

  public static async processCorrection(
    id: string | Types.ObjectId,
    status: 'APPROVED' | 'REJECTED',
    approvedBy: string | Types.ObjectId,
    approvalRemarks?: string
  ): Promise<IAttendanceCorrection> {
    const correction = await AttendanceCorrectionModel.findById(id);
    if (!correction) throw new NotFoundError('Correction request not found');

    correction.status = status;
    correction.approvedBy = new Types.ObjectId(approvedBy);
    if (approvalRemarks) correction.approvalRemarks = approvalRemarks;

    if (status === 'APPROVED') {
      // If approved, upsert corrected attendance punches
      if (correction.requestedInTime) {
        await AttendancePunchModel.findOneAndUpdate(
          { employeeId: correction.employeeId, punchDate: correction.date, punchType: 'IN' },
          {
            $set: {
              punchTimestamp: correction.requestedInTime,
              isPresent: true,
              isLate: false,
              isWithinGeofence: true,
            },
          },
          { upsert: true }
        );
      }
      if (correction.requestedOutTime) {
        await AttendancePunchModel.findOneAndUpdate(
          { employeeId: correction.employeeId, punchDate: correction.date, punchType: 'OUT' },
          {
            $set: {
              punchTimestamp: correction.requestedOutTime,
              isPresent: true,
              isWithinGeofence: true,
            },
          },
          { upsert: true }
        );
      }
    }

    return await correction.save();
  }

  // ── Attendance Dashboard Stats ──
  public static async getAttendanceStats(date?: string, organizationId?: string | Types.ObjectId): Promise<{
    date: string;
    totalEmployees: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    attendanceRate: number;
  }> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const empQuery: any = { isActive: true };
    if (organizationId) empQuery.organizationId = organizationId;

    const totalEmployees = await EmployeeProfileModel.countDocuments(empQuery);

    const punches = await AttendancePunchModel.find({
      punchDate: targetDate,
      punchType: 'IN',
    }).select('employeeId isLate');

    const uniquePresentIds = new Set(punches.map((p) => p.employeeId.toString()));
    const presentToday = uniquePresentIds.size;
    const lateToday = punches.filter((p) => p.isLate).length;
    const absentToday = Math.max(0, totalEmployees - presentToday);
    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 100;

    return {
      date: targetDate,
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      attendanceRate,
    };
  }
}
