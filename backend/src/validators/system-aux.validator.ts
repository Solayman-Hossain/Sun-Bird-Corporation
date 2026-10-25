import { z } from 'zod';

export const signQuorumSchema = z.object({
  directorRole: z.enum(['MD', 'DIRECTOR_ADMIN', 'DIRECTOR_FINANCE']).optional(),
  remarks: z.string().optional(),
  comment: z.string().optional(),
  signatureHash: z.string().optional(),
});

export const emergencyOverrideSchema = z.object({
  reason: z.string().min(3),
});

export const approvalActionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});

export const createCrmActivitySchema = z.object({
  activityType: z.enum(['LEAD', 'ENQUIRY', 'VISIT_LOG', 'COMPLAINT', 'QUOTATION_FOLLOWUP']),
  customerId: z.string().optional(),
  leadName: z.string().optional(),
  contactMobile: z.string().min(1),
  notes: z.string().min(1),
  followUpDate: z.string().or(z.date()).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  outcome: z.string().optional(),
  assignedStaffId: z.string().optional(),
});

export const updateCrmActivitySchema = z.object({
  notes: z.string().min(1).optional(),
  followUpDate: z.string().or(z.date()).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  outcome: z.string().optional(),
  assignedStaffId: z.string().optional(),
});

export const createWarehouseSchema = z.object({
  warehouseCode: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(['CENTRAL', 'BRANCH', 'OUTLET']),
  address: z.string().min(1),
  district: z.string().min(1),
  isCentralHub: z.boolean().optional(),
  contactPerson: z.string().optional(),
  mobile: z.string().optional(),
  capacityCbf: z.number().optional(),
  binCount: z.number().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  geofenceRadiusMeters: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['CENTRAL', 'BRANCH', 'OUTLET']).optional(),
  address: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  isCentralHub: z.boolean().optional(),
  contactPerson: z.string().optional(),
  mobile: z.string().optional(),
  capacityCbf: z.number().optional(),
  binCount: z.number().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  geofenceRadiusMeters: z.number().optional(),
  isActive: z.boolean().optional(),
});
