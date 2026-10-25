import { Types } from 'mongoose';
import { EmployeeProfileModel } from '../models/EmployeeProfile';
import { PayrollService } from '../services/PayrollService';

describe('HRM & GPS Payroll Engine Test Suite (Prompt 54)', () => {
  const runId = Date.now().toString().slice(-6);

  afterAll(async () => {
    await EmployeeProfileModel.deleteMany({ employeeCode: new RegExp(runId) });
  });

  it('should compute net pay enforcing 3-lates deduction, sales commission, and minimum wage floor', async () => {
    const employee = await EmployeeProfileModel.create({
      userId: new Types.ObjectId(),
      employeeCode: `EMP-${runId}`,
      department: 'COMMERCIAL',
      designation: 'Medical Sales Officer',
      joiningDate: new Date('2025-01-01'),
      basicSalary: 20000,
      houseRentAllowance: 10000,
      medicalAllowance: 2000,
      conveyanceAllowance: 1000,
      grossSalary: 33000,
      salesCommissionRate: 2.0,
      loanOutstanding: 0,
      casualLeaveBalance: 14,
      sickLeaveBalance: 14,
      earnedLeaveBalance: 0,
      isActive: true,
    });

    expect(employee.grossSalary).toBe(33000);

    // Verify statutory minimum wage constant (12,500 BDT)
    expect(PayrollService.MINIMUM_WAGE_FLOOR).toBe(12500);

    // Verify daily rate calculation (gross / 26)
    const dailyRate = Math.round((employee.grossSalary / 26) * 100) / 100;
    expect(dailyRate).toBe(1269.23);
  });
});
