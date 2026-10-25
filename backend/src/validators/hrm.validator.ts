import { z } from 'zod';

export const createEmployeeSchema = z.object({
  userId: z.string().min(1),
  employeeCode: z.string().optional(),
  department: z.string().min(1),
  designation: z.string().min(1),
  joiningDate: z.string().or(z.date()).optional(),
  basicSalary: z.number().min(0),
  houseRentAllowance: z.number().min(0).optional().default(0),
  medicalAllowance: z.number().min(0).optional().default(0),
  conveyanceAllowance: z.number().min(0).optional().default(0),
  grossSalary: z.number().min(0).optional(),
  salesCommissionRate: z.number().min(0).max(100).optional().default(0),
  assignedWarehouseId: z.string().optional(),
  officeLatLng: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateEmployeeSchema = z.object({
  department: z.string().min(1).optional(),
  designation: z.string().min(1).optional(),
  basicSalary: z.number().min(0).optional(),
  houseRentAllowance: z.number().min(0).optional(),
  medicalAllowance: z.number().min(0).optional(),
  conveyanceAllowance: z.number().min(0).optional(),
  salesCommissionRate: z.number().min(0).max(100).optional(),
  assignedWarehouseId: z.string().optional(),
  officeLatLng: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const mobilePunchSchema = z.object({
  punchType: z.enum(['IN', 'OUT']),
  latitude: z.number(),
  longitude: z.number(),
  deviceUUID: z.string().optional(),
  punchTimestamp: z.string().or(z.date()).optional(),
});

export const computePayrollSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  workingDays: z.number().min(1).max(31).optional(),
});

export const postPayrollGlSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
});
