import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, 'SKU must be at least 2 characters')
    .max(50, 'SKU must not exceed 50 characters')
    .transform((val) => val.toUpperCase()),
  nameEn: z
    .string()
    .trim()
    .min(1, 'English name cannot be empty')
    .max(255, 'English name must not exceed 255 characters'),
  nameBn: z
    .string()
    .trim()
    .min(1, 'Bangla name cannot be empty')
    .max(255, 'Bangla name must not exceed 255 characters'),
  category: z
    .string()
    .trim()
    .min(1, 'Category cannot be empty'),
  hsCode: z
    .string()
    .trim()
    .min(4, 'HS Code must be valid (e.g. 9018.31.00)'),
  baseUom: z
    .string()
    .trim()
    .min(1, 'Base UOM cannot be empty'),
  brand: z.string().trim().optional(),
  isMedical: z.boolean().default(false),
  isExpirable: z.boolean().default(false),
  minStockQty: z.number().min(0).default(0),
  retailPrice: z.number().min(0, 'Retail price cannot be negative'),
  showroomPrice: z.number().min(0).optional(),
  resellerTierPrices: z
    .array(
      z.object({
        tier: z.number().int().min(1),
        price: z.number().min(0),
      })
    )
    .optional()
    .default([]),
  barcodes: z.array(z.string().trim()).optional().default([]),
  seoContent: z
    .object({
      metaTitle: z.string().trim().optional(),
      descriptionEn: z.string().trim().optional(),
      descriptionBn: z.string().trim().optional(),
      keywords: z.array(z.string().trim()).optional(),
    })
    .optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    sku: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .transform((val) => val.toUpperCase())
      .optional(),
  });

export const createUomConversionSchema = z.object({
  productId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid MongoDB ObjectId for productId'),
  sku: z
    .string()
    .trim()
    .min(1, 'SKU is required')
    .transform((val) => val.toUpperCase()),
  fromUom: z
    .string()
    .trim()
    .min(1, 'Source UOM cannot be empty'),
  toUom: z
    .string()
    .trim()
    .min(1, 'Target UOM cannot be empty'),
  conversionFactor: z
    .number()
    .positive('Conversion factor must be greater than 0'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateUomConversionInput = z.infer<typeof createUomConversionSchema>;
