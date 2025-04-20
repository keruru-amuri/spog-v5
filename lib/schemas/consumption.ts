import { z } from 'zod';

/**
 * Base consumption record schema
 */
const consumptionRecordBaseSchema = z.object({
  inventory_item_id: z
    .string()
    .uuid({ message: 'Inventory item ID must be a valid UUID' }),
  quantity: z
    .number()
    .positive({ message: 'Quantity must be greater than 0' }),
  unit: z
    .string()
    .min(1, { message: 'Unit is required' })
    .max(50, { message: 'Unit must be less than 50 characters' }),
  notes: z
    .string()
    .max(1000, { message: 'Notes must be less than 1000 characters' })
    .optional()
    .nullable(),
  recorded_at: z
    .string()
    .datetime({ message: 'Recorded at must be a valid ISO date string' })
    .optional(),
});

/**
 * Schema for creating a consumption record
 */
export const createConsumptionRecordSchema = consumptionRecordBaseSchema.extend({
  // No additional fields needed for creation
});

/**
 * Schema for updating a consumption record
 */
export const updateConsumptionRecordSchema = consumptionRecordBaseSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided for update',
    }
  );

/**
 * Schema for querying consumption records
 */
export const consumptionRecordQuerySchema = z.object({
  inventory_item_id: z
    .string()
    .uuid({ message: 'Inventory item ID must be a valid UUID' })
    .optional(),
  user_id: z
    .string()
    .uuid({ message: 'User ID must be a valid UUID' })
    .optional(),
  start_date: z
    .string()
    .datetime({ message: 'Start date must be a valid ISO date string' })
    .optional(),
  end_date: z
    .string()
    .datetime({ message: 'End date must be a valid ISO date string' })
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a number' })
    .transform(Number)
    .optional(),
  offset: z
    .string()
    .regex(/^\d+$/, { message: 'Offset must be a number' })
    .transform(Number)
    .optional(),
  sort_by: z
    .enum(['recorded_at', 'quantity', 'created_at'])
    .optional(),
  sort_order: z
    .enum(['asc', 'desc'])
    .optional(),
});

/**
 * Schema for consumption summary query
 */
export const consumptionSummaryQuerySchema = z.object({
  start_date: z
    .string()
    .datetime({ message: 'Start date must be a valid ISO date string' })
    .optional(),
  end_date: z
    .string()
    .datetime({ message: 'End date must be a valid ISO date string' })
    .optional(),
  summary_type: z
    .enum(['item', 'user'])
    .default('item'),
});

// Export types
export type CreateConsumptionRecordInput = z.infer<typeof createConsumptionRecordSchema>;
export type UpdateConsumptionRecordInput = z.infer<typeof updateConsumptionRecordSchema>;
export type ConsumptionRecordQueryParams = z.infer<typeof consumptionRecordQuerySchema>;
export type ConsumptionSummaryQueryParams = z.infer<typeof consumptionSummaryQuerySchema>;
