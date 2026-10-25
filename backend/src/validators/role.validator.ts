import { z } from 'zod';

const roleActionEnum = z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT']);

const rolePermissionSchema = z.object({
  module: z.string().trim().min(1, 'Module name required'),
  actions: z.array(roleActionEnum).min(1, 'At least one action is required per module'),
});

export const createRoleSchema = z.object({
  roleName: z.string().trim().min(2, 'Role name must be at least 2 characters'),
  slug: z.string().trim().min(2, 'Role slug must be at least 2 characters').toLowerCase(),
  description: z.string().trim().optional(),
  permissions: z.array(rolePermissionSchema).default([]),
  isSystemRole: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateRoleSchema = z.object({
  roleName: z.string().trim().min(2, 'Role name must be at least 2 characters').optional(),
  description: z.string().trim().optional(),
  permissions: z.array(rolePermissionSchema).optional(),
  isActive: z.boolean().optional(),
});
