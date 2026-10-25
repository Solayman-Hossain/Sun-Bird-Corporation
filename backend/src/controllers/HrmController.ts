import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { EmployeeProfileModel } from '../models/EmployeeProfile';
import { PayrollRunModel } from '../models/PayrollRun';
import { AttendancePunchModel } from '../models/AttendancePunch';
import { EmployeeService } from '../services/EmployeeService';
import { AttendanceService } from '../services/AttendanceService';
import { PayrollService } from '../services/PayrollService';
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
}

export default HrmController;
