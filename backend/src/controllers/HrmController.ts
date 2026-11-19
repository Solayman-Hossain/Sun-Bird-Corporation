import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { EmployeeProfileModel } from '../models/EmployeeProfile';
import { PayrollRunModel } from '../models/PayrollRun';
import { AttendancePunchModel } from '../models/AttendancePunch';
import { EmployeeService } from '../services/EmployeeService';
import { AttendanceService } from '../services/AttendanceService';
import { PayrollService } from '../services/PayrollService';
import { EmployeeManagementService } from '../services/EmployeeManagementService';
import { AttendanceShiftService } from '../services/AttendanceShiftService';
import { LeaveManagementService } from '../services/LeaveManagementService';
import { PayrollCalculationService } from '../services/PayrollCalculationService';
import { EmployeeLoanAdvanceService } from '../services/EmployeeLoanAdvanceService';
import { HRAuxiliaryService } from '../services/HRAuxiliaryService';
import {
  PayrollBatchModel,
  PayslipModel,
  LeaveRequestModel,
  DepartmentModel,
  DesignationModel,
  JobGradeModel,
  EmploymentTypeModel,
  ShiftModel,
  HolidayModel,
} from '../models';
import { NotFoundError, ValidationError, UnauthorizedError } from '../errors/AppError';

export class HrmController {
  // ── Employee Master Handlers (§7.1) ─────────────────────────────────────────

  /**
   * @route   POST /api/v1/erp/hrm/employees
   * @desc    Onboards a new employee and sets up salary grade compensation
   * @access  Bearer JWT (hrm:CREATE)
   */
  public static async createEmployee(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const employee = await EmployeeService.createEmployee(req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message: 'Employee onboarded successfully',
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/hrm/employees
   * @desc    Lists employees with department, active status, search filters and pagination
   * @access  Bearer JWT (hrm:READ)
   */
  public static async getEmployees(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filter = {
        department: req.query.department ? String(req.query.department) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        assignedWarehouseId: req.query.assignedWarehouseId
          ? String(req.query.assignedWarehouseId)
          : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
        page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
      };

      const result = await EmployeeService.listEmployees(filter);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Employees retrieved successfully',
        data: result.employees,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/hrm/employees/:id
   * @desc    Gets detailed employee profile by ID
   * @access  Bearer JWT (hrm:READ)
   */
  public static async getEmployeeById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const employee = await EmployeeService.getEmployeeById(String(req.params.id));

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Employee retrieved successfully',
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/v1/erp/hrm/employees/:id
   * @desc    Updates employee details and recalculates gross salary if modified
   * @access  Bearer JWT (hrm:UPDATE)
   */
  public static async updateEmployee(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const employee = await EmployeeService.updateEmployee(String(req.params.id), req.body);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Employee profile updated successfully',
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Mobile GPS Geofenced Attendance Handlers (§7.2) ─────────────────────────

  /**
   * @route   POST /api/v1/portal/employee/punch
   * @desc    Records GPS clock-in / clock-out punch with Haversine distance verification
   * @access  Bearer JWT (STAFF / Any authenticated staff)
   */
  public static async recordPunch(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required to record attendance');
      }

      // Resolve employee profile for the authenticated user
      let employee = await EmployeeProfileModel.findOne({ userId: req.user.userId });
      if (!employee && req.body.employeeId) {
        employee = await EmployeeProfileModel.findById(req.body.employeeId);
      }

      if (!employee) {
        throw new NotFoundError(
          'No active employee profile linked to the authenticated user account'
        );
      }

      const punch = await AttendanceService.recordPunch(employee._id, req.body);

      res.status(201).json({
        success: true,
        statusCode: 201,
        message:
          punch.punchType === 'IN'
            ? 'Clock-in recorded successfully'
            : 'Clock-out recorded successfully',
        data: {
          punchId: punch._id,
          employeeCode: employee.employeeCode,
          punchType: punch.punchType,
          punchDate: punch.punchDate,
          punchTimestamp: punch.punchTimestamp,
          distanceMeters: punch.distanceMeters,
          isWithinGeofence: punch.isWithinGeofence,
          isLate: punch.isLate,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/portal/employee/attendance
   * @desc    Retrieves personal attendance punch history for the logged-in employee
   * @access  Bearer JWT (STAFF)
   */
  public static async getMyAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const employee = await EmployeeProfileModel.findOne({ userId: req.user.userId });
      if (!employee) {
        throw new NotFoundError('No employee profile linked to your user account');
      }

      const monthYear = req.query.monthYear ? String(req.query.monthYear) : undefined;
      const history = await AttendanceService.getEmployeeAttendance(employee._id, monthYear);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Attendance history retrieved successfully',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Monthly Payroll Processing Handlers (§7.3) ──────────────────────────────

  /**
   * @route   POST /api/v1/erp/hrm/payroll-runs/compute
   * @desc    Batch computes monthly payroll including sales commissions, late/LWP and loan deductions
   * @access  Bearer JWT (payroll:MANAGE / hrm:UPDATE)
   */
  public static async computeMonthlyPayroll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { monthYear, workingDays } = req.body;
      const summary = await PayrollService.computeMonthlyPayroll(monthYear, { workingDays });

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Monthly payroll computed for ${summary.totalEmployees} employees`,
        data: {
          monthYear: summary.monthYear,
          totalEmployees: summary.totalEmployees,
          totalGrossSalary: summary.totalGrossSalary,
          totalCommissions: summary.totalCommissions,
          totalDeductions:
            summary.totalLwpDeductions +
            summary.totalLateDeductions +
            summary.totalLoanDeductions,
          totalNetPay: summary.totalNetPay,
          status: 'SUBMITTED',
          payrollRuns: summary.payrollRuns,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/v1/erp/hrm/payroll-runs/post-gl
   * @desc    Posts monthly payroll to General Ledger with automatic balanced Journal Entry
   * @access  Bearer JWT (payroll:APPROVE / hrm:APPROVE)
   */
  public static async postPayrollToGl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required to post payroll to GL');
      }

      const { monthYear } = req.body;
      const idempotencyKey = req.header('X-Idempotency-Key') || undefined;

      const result = await PayrollService.postPayrollToGl(
        monthYear,
        req.user.userId,
        undefined,
        idempotencyKey
      );

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: `Payroll for ${monthYear} posted to General Ledger successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/erp/hrm/payroll-runs
   * @desc    Lists payroll runs by month/year and status
   * @access  Bearer JWT (hrm:READ / payroll:READ)
   */
  public static async getPayrollRuns(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || '20'), 10)));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (req.query.monthYear) filter.monthYear = String(req.query.monthYear);
      if (req.query.status) filter.status = String(req.query.status);
      if (req.query.employeeId) {
        filter.employeeId = new Types.ObjectId(String(req.query.employeeId));
      }

      const [runs, total] = await Promise.all([
        PayrollRunModel.find(filter)
          .populate('employeeId', 'employeeCode designation department basicSalary grossSalary')
          .sort({ monthYear: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PayrollRunModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Payroll runs retrieved successfully',
        data: runs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/v1/portal/employee/payslips
   * @desc    Allows employee to view personal payslips from the portal
   * @access  Bearer JWT (STAFF)
   */
  public static async getMyPayslips(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const employee = await EmployeeProfileModel.findOne({ userId: req.user.userId });
      if (!employee) {
        throw new NotFoundError('No employee profile linked to your user account');
      }

      const payslips = await PayrollRunModel.find({ employeeId: employee._id })
        .sort({ monthYear: -1 })
        .lean();

      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Payslips retrieved successfully',
        data: payslips,
      });
    } catch (error) {
      next(error);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MODULE 10 — EXTENDED HRM & PAYROLL CONTROLLER METHODS
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 05. Employee Onboarding Checklist ──
  public static async updateOnboardingTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { index, completed } = req.body;
      const employee = await EmployeeManagementService.updateOnboardingTask(
        String(req.params.id),
        Number(index),
        Boolean(completed),
        req.user?.userId ? String(req.user.userId) : undefined
      );
      res.status(200).json({ success: true, message: 'Onboarding task updated', data: employee });
    } catch (err) { next(err); }
  }

  // ── 06. Employee Offboarding Clearance ──
  public static async processOffboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await EmployeeManagementService.processOffboarding(
        String(req.params.id),
        req.body,
        req.user?.userId ? String(req.user.userId) : undefined
      );
      res.status(200).json({ success: true, message: 'Offboarding updated', data: employee });
    } catch (err) { next(err); }
  }

  // ── 07. Departments ──
  public static async getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await EmployeeManagementService.getDepartments(req.query.organizationId as string);
      res.status(200).json({ success: true, data: departments });
    } catch (err) { next(err); }
  }

  public static async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await EmployeeManagementService.createDepartment(req.body);
      res.status(201).json({ success: true, message: 'Department created', data: dept });
    } catch (err) { next(err); }
  }

  // ── 08. Designations ──
  public static async getDesignations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const designations = await EmployeeManagementService.getDesignations(req.query.organizationId as string);
      res.status(200).json({ success: true, data: designations });
    } catch (err) { next(err); }
  }

  public static async createDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const desig = await EmployeeManagementService.createDesignation(req.body);
      res.status(201).json({ success: true, message: 'Designation created', data: desig });
    } catch (err) { next(err); }
  }

  // ── 09. Job Grades ──
  public static async getJobGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grades = await EmployeeManagementService.getJobGrades(req.query.organizationId as string);
      res.status(200).json({ success: true, data: grades });
    } catch (err) { next(err); }
  }

  public static async createJobGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const grade = await EmployeeManagementService.createJobGrade(req.body);
      res.status(201).json({ success: true, message: 'Job grade created', data: grade });
    } catch (err) { next(err); }
  }

  // ── 10. Employment Types ──
  public static async getEmploymentTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await EmployeeManagementService.getEmploymentTypes(req.query.organizationId as string);
      res.status(200).json({ success: true, data: types });
    } catch (err) { next(err); }
  }

  public static async createEmploymentType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empType = await EmployeeManagementService.createEmploymentType(req.body);
      res.status(201).json({ success: true, message: 'Employment type created', data: empType });
    } catch (err) { next(err); }
  }

  // ── 12. Employee ID Card ──
  public static async getEmployeeIdCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const card = await EmployeeManagementService.getEmployeeIdCardData(String(req.params.id));
      res.status(200).json({ success: true, data: card });
    } catch (err) { next(err); }
  }

  // ── 15. Org Chart ──
  public static async getOrganizationChart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chart = await EmployeeManagementService.getOrganizationChart(req.query.organizationId as string);
      res.status(200).json({ success: true, data: chart });
    } catch (err) { next(err); }
  }

  // ── 16-24. Attendance & Shifts ──
  public static async getAttendanceStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AttendanceShiftService.getAttendanceStats(
        req.query.date as string,
        req.query.organizationId as string
      );
      res.status(200).json({ success: true, data: stats });
    } catch (err) { next(err); }
  }

  public static async importAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AttendanceShiftService.importBulkAttendance(req.body.records || []);
      res.status(200).json({ success: true, message: 'Attendance records processed', data: result });
    } catch (err) { next(err); }
  }

  public static async getAttendanceCorrections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const corrections = await AttendanceShiftService.getCorrectionRequests({
        status: req.query.status as string,
        employeeId: req.query.employeeId as string,
        organizationId: req.query.organizationId as string,
      });
      res.status(200).json({ success: true, data: corrections });
    } catch (err) { next(err); }
  }

  public static async requestAttendanceCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correction = await AttendanceShiftService.requestCorrection(req.body);
      res.status(201).json({ success: true, message: 'Correction request submitted', data: correction });
    } catch (err) { next(err); }
  }

  public static async processAttendanceCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correction = await AttendanceShiftService.processCorrection(
        String(req.params.id),
        req.body.status,
        String(req.user?.userId || req.body.approvedBy),
        req.body.approvalRemarks
      );
      res.status(200).json({ success: true, message: 'Correction processed', data: correction });
    } catch (err) { next(err); }
  }

  public static async getShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shifts = await AttendanceShiftService.getShifts(req.query.organizationId as string);
      res.status(200).json({ success: true, data: shifts });
    } catch (err) { next(err); }
  }

  public static async createShift(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shift = await AttendanceShiftService.createShift(req.body);
      res.status(201).json({ success: true, message: 'Shift created', data: shift });
    } catch (err) { next(err); }
  }

  public static async getRosters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rosters = await AttendanceShiftService.getRoster({
        employeeId: req.query.employeeId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        organizationId: req.query.organizationId as string,
      });
      res.status(200).json({ success: true, data: rosters });
    } catch (err) { next(err); }
  }

  public static async assignRoster(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roster = await AttendanceShiftService.assignRoster(req.body);
      res.status(201).json({ success: true, message: 'Roster assigned', data: roster });
    } catch (err) { next(err); }
  }

  public static async getHolidays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const holidays = await AttendanceShiftService.getHolidays(
        req.query.year ? Number(req.query.year) : undefined,
        req.query.organizationId as string
      );
      res.status(200).json({ success: true, data: holidays });
    } catch (err) { next(err); }
  }

  public static async createHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const holiday = await AttendanceShiftService.createHoliday(req.body);
      res.status(201).json({ success: true, message: 'Holiday created', data: holiday });
    } catch (err) { next(err); }
  }

  // ── 25-30. Leave Management ──
  public static async getLeaveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await LeaveManagementService.getLeaveTypes(req.query.organizationId as string);
      res.status(200).json({ success: true, data: types });
    } catch (err) { next(err); }
  }

  public static async createLeaveType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = await LeaveManagementService.createLeaveType(req.body);
      res.status(201).json({ success: true, message: 'Leave type created', data: type });
    } catch (err) { next(err); }
  }

  public static async getLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const balances = await LeaveManagementService.getEmployeeBalances(
        String(req.params.employeeId),
        req.query.year ? Number(req.query.year) : undefined
      );
      res.status(200).json({ success: true, data: balances });
    } catch (err) { next(err); }
  }

  public static async initLeaveBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await LeaveManagementService.initializeBalancesForYear(
        Number(req.body.year) || new Date().getFullYear(),
        req.body.organizationId
      );
      res.status(200).json({ success: true, message: `Initialized ${count} leave balances`, count });
    } catch (err) { next(err); }
  }

  public static async getLeaveRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: any = {};
      if (req.query.status) query.status = req.query.status;
      if (req.query.employeeId) query.employeeId = req.query.employeeId;
      const requests = await LeaveRequestModel.find(query)
        .populate('employeeId', 'employeeCode department designation personalInfo')
        .populate('leaveTypeId', 'code name')
        .sort({ createdAt: -1 })
        .lean();
      res.status(200).json({ success: true, data: requests });
    } catch (err) { next(err); }
  }

  public static async submitLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await LeaveManagementService.submitLeaveRequest(req.body);
      res.status(201).json({ success: true, message: 'Leave request submitted', data: request });
    } catch (err) { next(err); }
  }

  public static async processLeaveApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await LeaveManagementService.processLeaveApproval(
        String(req.params.id),
        req.body.status,
        String(req.user?.userId || req.body.approvedBy),
        req.body.approvalRemarks
      );
      res.status(200).json({ success: true, message: 'Leave request processed', data: request });
    } catch (err) { next(err); }
  }

  public static async getLeaveCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const calendar = await LeaveManagementService.getLeaveCalendar({
        year: req.query.year ? Number(req.query.year) : undefined,
        month: req.query.month ? Number(req.query.month) : undefined,
        department: req.query.department as string,
        organizationId: req.query.organizationId as string,
      });
      res.status(200).json({ success: true, data: calendar });
    } catch (err) { next(err); }
  }

  // ── 33-43. Payroll Management ──
  public static async getSalaryComponents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const components = await PayrollCalculationService.getSalaryComponents(req.query.organizationId as string);
      res.status(200).json({ success: true, data: components });
    } catch (err) { next(err); }
  }

  public static async createSalaryComponent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comp = await PayrollCalculationService.createSalaryComponent(req.body);
      res.status(201).json({ success: true, message: 'Salary component created', data: comp });
    } catch (err) { next(err); }
  }

  public static async getSalaryStructures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structures = await PayrollCalculationService.getSalaryStructures(req.query.organizationId as string);
      res.status(200).json({ success: true, data: structures });
    } catch (err) { next(err); }
  }

  public static async createSalaryStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const struct = await PayrollCalculationService.createSalaryStructure(req.body);
      res.status(201).json({ success: true, message: 'Salary structure created', data: struct });
    } catch (err) { next(err); }
  }

  public static async getPayrollBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: any = {};
      if (req.query.monthYear) query.monthYear = req.query.monthYear;
      if (req.query.status) query.status = req.query.status;
      const batches = await PayrollBatchModel.find(query).sort({ monthYear: -1 }).lean();
      res.status(200).json({ success: true, data: batches });
    } catch (err) { next(err); }
  }

  public static async computePayrollBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batch = await PayrollCalculationService.computePayrollBatch({
        monthYear: req.body.monthYear,
        organizationId: req.body.organizationId,
        actorId: req.user?.userId,
      });
      res.status(201).json({ success: true, message: 'Payroll batch computed', data: batch });
    } catch (err) { next(err); }
  }

  public static async updateBatchStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batch = await PayrollCalculationService.updateBatchStatus(
        String(req.params.id),
        req.body.status,
        req.user?.userId ? String(req.user.userId) : undefined
      );
      res.status(200).json({ success: true, message: 'Batch status updated', data: batch });
    } catch (err) { next(err); }
  }

  public static async postBatchToGl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PayrollCalculationService.postPayrollToGl(
        String(req.params.id),
        req.user?.userId ? String(req.user.userId) : undefined
      );
      res.status(200).json({ success: true, message: 'Batch posted to GL', data: result });
    } catch (err) { next(err); }
  }

  public static async disburseSalaryPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const batch = await PayrollCalculationService.disburseSalaryPayment(
        String(req.params.id),
        req.body.paymentMethod || 'BANK_TRANSFER',
        req.user?.userId ? String(req.user.userId) : undefined
      );
      res.status(200).json({ success: true, message: 'Salaries disbursed successfully', data: batch });
    } catch (err) { next(err); }
  }

  public static async getPayslips(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: any = {};
      if (req.query.payrollBatchId) query.payrollBatchId = req.query.payrollBatchId;
      if (req.query.employeeId) query.employeeId = req.query.employeeId;
      if (req.query.monthYear) query.monthYear = req.query.monthYear;
      const payslips = await PayslipModel.find(query)
        .populate('employeeId', 'employeeCode department designation personalInfo bankDetails')
        .sort({ payslipNo: 1 })
        .lean();
      res.status(200).json({ success: true, data: payslips });
    } catch (err) { next(err); }
  }

  public static async getPayslipPrint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PayrollCalculationService.getPayslipPrintData(String(req.params.id));
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── 44-47. Loans, Advances & Claims ──
  public static async getAdvances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const advances = await EmployeeLoanAdvanceService.getAdvances({
        employeeId: req.query.employeeId as string,
        repaymentMonth: req.query.repaymentMonth as string,
        status: req.query.status as string,
        organizationId: req.query.organizationId as string,
      });
      res.status(200).json({ success: true, data: advances });
    } catch (err) { next(err); }
  }

  public static async requestAdvance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adv = await EmployeeLoanAdvanceService.requestAdvance(req.body);
      res.status(201).json({ success: true, message: 'Advance request submitted', data: adv });
    } catch (err) { next(err); }
  }

  public static async approveAdvance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adv = await EmployeeLoanAdvanceService.approveAdvance(
        String(req.params.id),
        String(req.user?.userId || req.body.approvedBy)
      );
      res.status(200).json({ success: true, message: 'Advance approved', data: adv });
    } catch (err) { next(err); }
  }

  public static async disburseAdvance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adv = await EmployeeLoanAdvanceService.disburseAdvance(
        String(req.params.id),
        req.user?.userId ? String(req.user.userId) : undefined
      );
      res.status(200).json({ success: true, message: 'Advance disbursed & journal entry posted', data: adv });
    } catch (err) { next(err); }
  }

  public static async getEmployeeLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loans = await EmployeeLoanAdvanceService.getEmployeeLoans(req.query.organizationId as string);
      res.status(200).json({ success: true, data: loans });
    } catch (err) { next(err); }
  }

  public static async createEmployeeLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const loan = await EmployeeLoanAdvanceService.createEmployeeLoan({
        ...req.body,
        actorId: req.user?.userId,
      });
      res.status(201).json({ success: true, message: 'Employee loan created', data: loan });
    } catch (err) { next(err); }
  }

  public static async getExpenseClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const claims = await EmployeeLoanAdvanceService.getExpenseClaims({
        employeeId: req.query.employeeId as string,
        status: req.query.status as string,
        organizationId: req.query.organizationId as string,
      });
      res.status(200).json({ success: true, data: claims });
    } catch (err) { next(err); }
  }

  public static async submitExpenseClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const claim = await EmployeeLoanAdvanceService.submitExpenseClaim(req.body);
      res.status(201).json({ success: true, message: 'Expense claim submitted', data: claim });
    } catch (err) { next(err); }
  }

  public static async approveExpenseClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const claim = await EmployeeLoanAdvanceService.approveExpenseClaim(
        String(req.params.id),
        String(req.user?.userId || req.body.approvedBy)
      );
      res.status(200).json({ success: true, message: 'Claim approved', data: claim });
    } catch (err) { next(err); }
  }

  public static async settleExpenseClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const claim = await EmployeeLoanAdvanceService.settleExpenseClaim(
        String(req.params.id),
        req.user?.userId ? String(req.user.userId) : undefined
      );
      res.status(200).json({ success: true, message: 'Claim settled & journal posted', data: claim });
    } catch (err) { next(err); }
  }

  // ── 48-52. Talent, Reports, Logs & Settings ──
  public static async getPerformanceReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviews = await HRAuxiliaryService.getPerformanceReviews({
        employeeId: req.query.employeeId as string,
        period: req.query.period as string,
        organizationId: req.query.organizationId as string,
      });
      res.status(200).json({ success: true, data: reviews });
    } catch (err) { next(err); }
  }

  public static async createPerformanceReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const review = await HRAuxiliaryService.createPerformanceReview({
        ...req.body,
        reviewerId: req.user?.userId || req.body.reviewerId,
      });
      res.status(201).json({ success: true, message: 'Performance review created', data: review });
    } catch (err) { next(err); }
  }

  public static async getTrainingRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await HRAuxiliaryService.getTrainingRecords(req.query.organizationId as string);
      res.status(200).json({ success: true, data: records });
    } catch (err) { next(err); }
  }

  public static async createTrainingRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await HRAuxiliaryService.createTrainingRecord(req.body);
      res.status(201).json({ success: true, message: 'Training record created', data: record });
    } catch (err) { next(err); }
  }

  public static async getHeadcountReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await HRAuxiliaryService.getHeadcountReport(req.query.organizationId as string);
      res.status(200).json({ success: true, data: report });
    } catch (err) { next(err); }
  }

  public static async getPayrollAnalyticsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await HRAuxiliaryService.getPayrollAnalyticsReport(req.query.organizationId as string);
      res.status(200).json({ success: true, data: report });
    } catch (err) { next(err); }
  }

  public static async getHrAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const logs = await HRAuxiliaryService.getHrAuditLogs(limit, req.query.organizationId as string);
      res.status(200).json({ success: true, data: logs });
    } catch (err) { next(err); }
  }

  public static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await HRAuxiliaryService.getSettings(req.query.organizationId as string);
      res.status(200).json({ success: true, data: settings });
    } catch (err) { next(err); }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await HRAuxiliaryService.updateSettings(req.body, req.query.organizationId as string);
      res.status(200).json({ success: true, message: 'HR settings updated', data: settings });
    } catch (err) { next(err); }
  }
}

export default HrmController;
