import { ClientSession, Types } from 'mongoose';
import {
  AttendancePunchModel,
  IAttendancePunch,
  PunchType,
} from '../models/AttendancePunch';
import { EmployeeProfileModel } from '../models/EmployeeProfile';
import { WarehouseModel } from '../models/Warehouse';
import { ValidationError, NotFoundError } from '../errors/AppError';
import logger from '../config/logger';

export interface RecordPunchDTO {
  punchType: PunchType;
  latitude: number;
  longitude: number;
  deviceUUID?: string;
  punchTimestamp?: Date | string;
  shiftStartTime?: string; // Optional "HH:mm" in local time, default "09:00"
  timezoneOffsetMinutes?: number; // Minutes ahead of UTC (e.g. +360 for BST UTC+6), default +360
}

export interface AttendanceSummaryDTO {
  employeeId: Types.ObjectId;
  employeeCode: string;
  fullName: string;
  totalPresentDays: number;
  totalLateDays: number;
  totalLWPDays: number;
}

export class AttendanceService {
  public static readonly GEOFENCE_RADIUS_METERS = 50; // Statutory 50m geofence anchor
  public static readonly DEFAULT_SHIFT_START = '09:00'; // Standard 9:00 AM shift start
  public static readonly LATE_GRACE_MINUTES = 15; // 15-minute grace period (late after 09:15 AM)
  public static readonly BST_TIMEZONE_OFFSET = 360; // UTC+6 for Bangladesh Standard Time

  /**
   * Calculates the great-circle distance between two geographic coordinates using Haversine formula.
   *
   * Formula:
   *   Δφ = (lat2 - lat1) * π / 180
   *   Δλ = (lon2 - lon1) * π / 180
   *   a  = sin²(Δφ / 2) + cos(φ1) * cos(φ2) * sin²(Δλ / 2)
   *   c  = 2 * arcsin(√a)
   *   d  = R * c (where R = 6,371,000 meters)
   *
   * @returns Distance in meters
   */
  public static calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Mean Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10;
  }

  /**
   * Determines if a clock-in punch is late based on shift start time and grace period.
   */
  public static isPunchLate(
    punchTimestamp: Date,
    shiftStartTime: string = AttendanceService.DEFAULT_SHIFT_START,
    tzOffsetMinutes: number = AttendanceService.BST_TIMEZONE_OFFSET
  ): boolean {
    const [shiftHour, shiftMin] = shiftStartTime.split(':').map(Number);
    const shiftTotalMinutes = shiftHour * 60 + shiftMin + AttendanceService.LATE_GRACE_MINUTES;

    // Convert punch time to local timezone (default BST UTC+6)
    const utcMillis = punchTimestamp.getTime() + punchTimestamp.getTimezoneOffset() * 60000;
    const localDate = new Date(utcMillis + tzOffsetMinutes * 60000);
    const punchTotalMinutes = localDate.getHours() * 60 + localDate.getMinutes();

    return punchTotalMinutes > shiftTotalMinutes;
  }

  /**
   * Records a mobile attendance punch, verifies 50m geofence anchor and shift timing.
   */
  public static async recordPunch(
    employeeId: string | Types.ObjectId,
    dto: RecordPunchDTO,
    session?: ClientSession
  ): Promise<IAttendancePunch> {
    if (!dto.punchType || !['IN', 'OUT'].includes(dto.punchType)) {
      throw new ValidationError('Invalid punchType. Must be IN or OUT');
    }
    if (dto.latitude === undefined || dto.longitude === undefined) {
      throw new ValidationError('GPS latitude and longitude are required');
    }

    const employee = await EmployeeProfileModel.findById(employeeId).session(session || null);
    if (!employee) {
      throw new NotFoundError(`Employee with ID ${employeeId} not found`);
    }

    // Determine Anchor GPS coordinates (from assigned warehouse or employee officeLatLng)
    let anchorLat: number | undefined;
    let anchorLng: number | undefined;

    if (employee.assignedWarehouseId) {
      const warehouse = await WarehouseModel.findById(employee.assignedWarehouseId).session(
        session || null
      );
      if (
        warehouse &&
        (warehouse as any).location &&
        Array.isArray((warehouse as any).location.coordinates)
      ) {
        // GeoJSON format: [longitude, latitude]
        anchorLng = (warehouse as any).location.coordinates[0];
        anchorLat = (warehouse as any).location.coordinates[1];
      }
    }

    // Fallback to employee profile officeLatLng if warehouse location not available
    if (anchorLat === undefined || anchorLng === undefined) {
      if (employee.officeLatLng?.lat !== undefined && employee.officeLatLng?.lng !== undefined) {
        anchorLat = employee.officeLatLng.lat;
        anchorLng = employee.officeLatLng.lng;
      }
    }

    let distanceMeters = 0;
    let isWithinGeofence = true;

    if (anchorLat !== undefined && anchorLng !== undefined) {
      distanceMeters = this.calculateHaversineDistance(
        dto.latitude,
        dto.longitude,
        anchorLat,
        anchorLng
      );
      isWithinGeofence = distanceMeters <= this.GEOFENCE_RADIUS_METERS;
    } else {
      logger.warn(
        `Employee ${employee.employeeCode} has no GPS anchor location configured. Defaulting to 0m.`
      );
    }

    const punchDateObj = dto.punchTimestamp ? new Date(dto.punchTimestamp) : new Date();
    // Local date string in YYYY-MM-DD
    const tzOffset = dto.timezoneOffsetMinutes ?? this.BST_TIMEZONE_OFFSET;
    const utcMillis = punchDateObj.getTime() + punchDateObj.getTimezoneOffset() * 60000;
    const localDate = new Date(utcMillis + tzOffset * 60000);
    const punchDate = localDate.toISOString().slice(0, 10);

    // Shift Late Check (only applicable on clock-in)
    let isLate = false;
    if (dto.punchType === 'IN') {
      isLate = this.isPunchLate(punchDateObj, dto.shiftStartTime, tzOffset);
    }

    const punch = new AttendancePunchModel({
      employeeId: employee._id,
      punchType: dto.punchType,
      punchTimestamp: punchDateObj,
      punchDate,
      latitude: dto.latitude,
      longitude: dto.longitude,
      distanceMeters,
      isWithinGeofence,
      isPresent: isWithinGeofence, // Valid presence requires being within geofence
      deviceUUID: dto.deviceUUID,
      isLate,
      isLWP: false,
    });

    await punch.save({ session });

    if (!isWithinGeofence) {
      logger.warn(
        `⚠️ Geofence anomaly detected for employee ${employee.employeeCode}: Distance was ${distanceMeters}m (Threshold: ${this.GEOFENCE_RADIUS_METERS}m)`
      );
    }

    logger.info(
      `Attendance punch recorded: ${employee.employeeCode} [${dto.punchType}] on ${punchDate} (Dist: ${distanceMeters}m, WithinGeofence: ${isWithinGeofence}, Late: ${isLate})`
    );

    return punch;
  }

  /**
   * Retrieves punch records for an employee across a specific month or date range.
   */
  public static async getEmployeeAttendance(
    employeeId: string | Types.ObjectId,
    monthYear?: string, // e.g. "2026-10"
    session?: ClientSession
  ): Promise<IAttendancePunch[]> {
    const query: any = { employeeId: new Types.ObjectId(employeeId) };

    if (monthYear) {
      query.punchDate = { $regex: `^${monthYear}` };
    }

    return AttendancePunchModel.find(query).sort({ punchTimestamp: -1 }).session(session || null);
  }

  /**
   * Aggregates attendance statistics for payroll computation:
   * - Total present days
   * - Total late arrivals
   * - LWP days (absences)
   */
  public static async getMonthlyAttendanceStats(
    employeeId: string | Types.ObjectId,
    monthYear: string, // "YYYY-MM"
    totalWorkingDays: number = 26
  ): Promise<{
    presentDays: number;
    latePunchesCount: number;
    absentDaysCount: number;
  }> {
    const punches = await AttendancePunchModel.find({
      employeeId: new Types.ObjectId(employeeId),
      punchDate: { $regex: `^${monthYear}` },
      punchType: 'IN',
      isWithinGeofence: true,
    });

    const uniquePresentDates = new Set(punches.map((p) => p.punchDate));
    const presentDays = uniquePresentDates.size;
    const latePunchesCount = punches.filter((p) => p.isLate).length;
    const absentDaysCount = Math.max(0, totalWorkingDays - presentDays);

    return {
      presentDays,
      latePunchesCount,
      absentDaysCount,
    };
  }
}

export default AttendanceService;
