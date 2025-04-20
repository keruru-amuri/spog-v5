import { z } from 'zod';

/**
 * Base report query schema
 */
const baseReportQuerySchema = z.object({
  start_date: z
    .string()
    .datetime({ message: 'Start date must be a valid ISO date string' })
    .optional(),
  end_date: z
    .string()
    .datetime({ message: 'End date must be a valid ISO date string' })
    .optional(),
  format: z
    .enum(['json', 'csv'])
    .default('json'),
});

/**
 * Inventory status report query schema
 */
export const inventoryStatusReportQuerySchema = baseReportQuerySchema.extend({
  category: z
    .string()
    .min(1, { message: 'Category must not be empty' })
    .optional(),
  location_id: z
    .string()
    .uuid({ message: 'Location ID must be a valid UUID' })
    .optional(),
  status: z
    .enum(['all', 'normal', 'low', 'critical'])
    .default('all'),
});

/**
 * Consumption trends report query schema
 */
export const consumptionTrendsReportQuerySchema = baseReportQuerySchema.extend({
  group_by: z
    .enum(['day', 'week', 'month', 'category', 'user'])
    .default('day'),
  category: z
    .string()
    .min(1, { message: 'Category must not be empty' })
    .optional(),
  user_id: z
    .string()
    .uuid({ message: 'User ID must be a valid UUID' })
    .optional(),
});

/**
 * Expiry report query schema
 */
export const expiryReportQuerySchema = baseReportQuerySchema.extend({
  days_until_expiry: z
    .string()
    .regex(/^\d+$/, { message: 'Days until expiry must be a number' })
    .transform(Number)
    .default('30'),
  category: z
    .string()
    .min(1, { message: 'Category must not be empty' })
    .optional(),
});

/**
 * Location utilization report query schema
 */
export const locationUtilizationReportQuerySchema = baseReportQuerySchema.extend({
  location_id: z
    .string()
    .uuid({ message: 'Location ID must be a valid UUID' })
    .optional(),
  include_empty: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .default('false'),
});

/**
 * Report export schema
 */
export const reportExportSchema = z.object({
  report_type: z
    .enum(['inventory-status', 'consumption-trends', 'expiry', 'location-utilization']),
  parameters: z
    .record(z.string())
    .optional(),
  format: z
    .enum(['json', 'csv'])
    .default('csv'),
});

// Export types
export type InventoryStatusReportQueryParams = z.infer<typeof inventoryStatusReportQuerySchema>;
export type ConsumptionTrendsReportQueryParams = z.infer<typeof consumptionTrendsReportQuerySchema>;
export type ExpiryReportQueryParams = z.infer<typeof expiryReportQuerySchema>;
export type LocationUtilizationReportQueryParams = z.infer<typeof locationUtilizationReportQuerySchema>;
export type ReportExportParams = z.infer<typeof reportExportSchema>;
