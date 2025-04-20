import { z } from 'zod';

/**
 * Inventory item category enum
 */
export const inventoryItemCategoryEnum = z.enum([
  'Sealant',
  'Paint',
  'Oil',
  'Grease'
]);

export type InventoryItemCategory = z.infer<typeof inventoryItemCategoryEnum>;

/**
 * Inventory item status enum
 */
export const inventoryItemStatusEnum = z.enum([
  'normal',
  'low',
  'critical'
]);

export type InventoryItemStatus = z.infer<typeof inventoryItemStatusEnum>;

/**
 * Base inventory item schema
 */
const inventoryItemBaseSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must be less than 255 characters' }),
  description: z
    .string()
    .max(1000, { message: 'Description must be less than 1000 characters' })
    .optional()
    .nullable(),
  category: inventoryItemCategoryEnum,
  location_id: z
    .string()
    .uuid({ message: 'Location ID must be a valid UUID' })
    .optional()
    .nullable(),
  current_balance: z
    .number()
    .min(0, { message: 'Current balance must be greater than or equal to 0' }),
  original_amount: z
    .number()
    .min(0.1, { message: 'Original amount must be greater than 0' }),
  minimum_quantity: z
    .number()
    .min(0, { message: 'Minimum quantity must be greater than or equal to 0' })
    .optional()
    .default(0),
  unit: z
    .string()
    .min(1, { message: 'Unit is required' })
    .max(50, { message: 'Unit must be less than 50 characters' }),
  consumption_unit: z
    .string()
    .max(50, { message: 'Consumption unit must be less than 50 characters' })
    .optional()
    .nullable(),
  status: inventoryItemStatusEnum.optional(),
  last_refilled: z
    .string()
    .datetime({ message: 'Last refilled must be a valid ISO date string' })
    .optional()
    .nullable(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Expiry date must be in YYYY-MM-DD format' })
    .optional()
    .nullable(),
  image_url: z
    .string()
    .url({ message: 'Image URL must be a valid URL' })
    .optional()
    .nullable(),
});

/**
 * Create inventory item schema
 */
export const createInventoryItemSchema = inventoryItemBaseSchema;

export type CreateInventoryItemValues = z.infer<typeof createInventoryItemSchema>;

/**
 * Update inventory item schema
 */
export const updateInventoryItemSchema = inventoryItemBaseSchema.partial();

export type UpdateInventoryItemValues = z.infer<typeof updateInventoryItemSchema>;

/**
 * Inventory item query schema
 */
export const inventoryItemQuerySchema = z.object({
  category: inventoryItemCategoryEnum.optional(),
  location_id: z
    .string()
    .uuid({ message: 'Location ID must be a valid UUID' })
    .optional(),
  status: inventoryItemStatusEnum.optional(),
  search: z
    .string()
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
    .string()
    .optional(),
  sort_order: z
    .enum(['asc', 'desc'])
    .optional(),
});

export type InventoryItemQueryParams = z.infer<typeof inventoryItemQuerySchema>;
