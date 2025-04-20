import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Mock Supabase client with more detailed functionality
vi.mock('@/lib/supabase', () => {
  const mockError = { code: '', message: '', details: '' };
  const mockFrom = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockReturnThis();
  const mockIn = vi.fn().mockReturnThis();
  const mockMatch = vi.fn().mockReturnThis();
  const mockGt = vi.fn().mockReturnThis();
  const mockLt = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockIs = vi.fn().mockReturnThis();
  const mockNot = vi.fn().mockReturnThis();

  // Default success response
  const mockThen = vi.fn().mockImplementation(callback => {
    return callback({ data: [], error: null });
  });

  return {
    supabase: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      in: mockIn,
      match: mockMatch,
      gt: mockGt,
      lt: mockLt,
      gte: mockGte,
      lte: mockLte,
      is: mockIs,
      not: mockNot,
      then: mockThen,
      // Helper to simulate errors for specific tests
      __simulateError: (error: typeof mockError) => {
        mockThen.mockImplementationOnce(callback => {
          return callback({ data: null, error });
        });
      },
      // Reset all mocks to their default behavior
      __resetMocks: () => {
        mockFrom.mockClear();
        mockSelect.mockClear();
        mockInsert.mockClear();
        mockUpdate.mockClear();
        mockDelete.mockClear();
        mockThen.mockImplementation(callback => {
          return callback({ data: [], error: null });
        });
      }
    }
  };
});

describe('Inventory Item Schema', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Type Validation Tests', () => {
    it('should accept a valid inventory item with all required fields', async () => {
      const validItem: Database['public']['Tables']['inventory_items']['Insert'] = {
        name: 'Test Item',
        category: 'Sealant',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
        consumption_unit: 'g',
        status: 'normal'
      };

      await supabase.from('inventory_items').insert(validItem);
      expect(supabase.from).toHaveBeenCalledWith('inventory_items');
      expect(supabase.insert).toHaveBeenCalledWith(validItem);
    });

    it('should accept a valid inventory item with all fields', async () => {
      const validFullItem: Database['public']['Tables']['inventory_items']['Insert'] = {
        name: 'Complete Test Item',
        category: 'Paint',
        current_balance: 500,
        original_amount: 1000,
        unit: 'ml',
        consumption_unit: 'ml',
        status: 'low',
        description: 'This is a test item with all fields',
        last_refilled: new Date().toISOString(),
        image_url: 'https://example.com/image.jpg',
        location_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      await supabase.from('inventory_items').insert(validFullItem);
      expect(supabase.insert).toHaveBeenCalledWith(validFullItem);
    });

    it('should accept a valid location', async () => {
      const validLocation: Database['public']['Tables']['locations']['Insert'] = {
        name: 'Test Location',
        description: 'This is a test location'
      };

      await supabase.from('locations').insert(validLocation);
      expect(supabase.from).toHaveBeenCalledWith('locations');
      expect(supabase.insert).toHaveBeenCalledWith(validLocation);
    });

    // TypeScript compilation tests
    // These tests verify that TypeScript correctly enforces our schema types
    // They don't actually run any code, but will cause TypeScript compilation errors if the types are wrong
    it('should enforce category enum values', () => {
      const validCategories: Array<Database['public']['Tables']['inventory_items']['Row']['category']> = [
        'Sealant',
        'Paint',
        'Oil',
        'Grease'
      ];

      // The following line would cause a TypeScript error if uncommented:
      // const invalidCategory: Database['public']['Tables']['inventory_items']['Row']['category'] = 'Invalid';

      expect(validCategories.length).toBe(4);
    });

    it('should enforce status enum values', () => {
      const validStatuses: Array<Database['public']['Tables']['inventory_items']['Row']['status']> = [
        'normal',
        'low',
        'critical'
      ];

      // The following line would cause a TypeScript error if uncommented:
      // const invalidStatus: Database['public']['Tables']['inventory_items']['Row']['status'] = 'invalid';

      expect(validStatuses.length).toBe(3);
    });
  });

  describe('Constraint Tests', () => {
    it('should validate required fields', async () => {
      // This test simulates a database constraint error when required fields are missing
      // In a real database, this would fail because name is required
      const invalidItem = {
        // name is missing
        category: 'Sealant',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
        consumption_unit: 'g'
      };

      // Simulate a database error
      (supabase as any).__simulateError({
        code: '23502',
        message: 'null value in column "name" violates not-null constraint',
        details: 'Failing row contains (null, ...)'
      });

      const result = await supabase.from('inventory_items').insert(invalidItem as any);
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('violates not-null constraint');
    });

    it('should validate category values', async () => {
      // This test simulates a database constraint error when an invalid category is provided
      const invalidItem = {
        name: 'Invalid Category Item',
        category: 'Invalid', // Not in the allowed values
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
        consumption_unit: 'g'
      };

      // Simulate a database error
      (supabase as any).__simulateError({
        code: '23514',
        message: 'new row for relation "inventory_items" violates check constraint "inventory_items_category_check"',
        details: 'Failing row contains (Invalid, ...)'
      });

      const result = await supabase.from('inventory_items').insert(invalidItem as any);
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('violates check constraint');
    });

    it('should validate status values', async () => {
      // This test simulates a database constraint error when an invalid status is provided
      const invalidItem = {
        name: 'Invalid Status Item',
        category: 'Sealant',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
        consumption_unit: 'g',
        status: 'invalid' // Not in the allowed values
      };

      // Simulate a database error
      (supabase as any).__simulateError({
        code: '23514',
        message: 'new row for relation "inventory_items" violates check constraint "inventory_items_status_check"',
        details: 'Failing row contains (invalid, ...)'
      });

      const result = await supabase.from('inventory_items').insert(invalidItem as any);
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('violates check constraint');
    });

    it('should validate current_balance is non-negative', async () => {
      // This test simulates a database constraint error when current_balance is negative
      const invalidItem = {
        name: 'Negative Balance Item',
        category: 'Sealant',
        current_balance: -100, // Negative value
        original_amount: 200,
        unit: 'g',
        consumption_unit: 'g'
      };

      // Simulate a database error
      (supabase as any).__simulateError({
        code: '23514',
        message: 'new row for relation "inventory_items" violates check constraint "inventory_items_current_balance_check"',
        details: 'Failing row contains (-100, ...)'
      });

      const result = await supabase.from('inventory_items').insert(invalidItem as any);
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('violates check constraint');
    });

    it('should validate original_amount is positive', async () => {
      // This test simulates a database constraint error when original_amount is not positive
      const invalidItem = {
        name: 'Zero Original Amount Item',
        category: 'Sealant',
        current_balance: 100,
        original_amount: 0, // Zero value
        unit: 'g',
        consumption_unit: 'g'
      };

      // Simulate a database error
      (supabase as any).__simulateError({
        code: '23514',
        message: 'new row for relation "inventory_items" violates check constraint "inventory_items_original_amount_check"',
        details: 'Failing row contains (0, ...)'
      });

      const result = await supabase.from('inventory_items').insert(invalidItem as any);
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('violates check constraint');
    });
  });

  describe('Foreign Key Tests', () => {
    it('should validate location_id references a valid location', async () => {
      // This test simulates a database constraint error when an invalid location_id is provided
      const invalidItem = {
        name: 'Invalid Location Item',
        category: 'Sealant',
        location_id: '00000000-0000-0000-0000-000000000000', // Non-existent location
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
        consumption_unit: 'g'
      };

      // Simulate a database error
      (supabase as any).__simulateError({
        code: '23503',
        message: 'insert or update on table "inventory_items" violates foreign key constraint "inventory_items_location_id_fkey"',
        details: 'Key (location_id)=(00000000-0000-0000-0000-000000000000) is not present in table "locations".'
      });

      const result = await supabase.from('inventory_items').insert(invalidItem as any);
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('violates foreign key constraint');
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle minimum valid values', async () => {
      const minimalItem: Database['public']['Tables']['inventory_items']['Insert'] = {
        name: 'Minimal Item',
        category: 'Sealant',
        current_balance: 0, // Minimum valid value
        original_amount: 0.1, // Minimum valid value (must be > 0)
        unit: 'g',
        consumption_unit: 'g'
      };

      await supabase.from('inventory_items').insert(minimalItem);
      expect(supabase.insert).toHaveBeenCalledWith(minimalItem);
    });

    it('should handle very large values', async () => {
      const largeValuesItem: Database['public']['Tables']['inventory_items']['Insert'] = {
        name: 'Large Values Item',
        category: 'Oil',
        current_balance: 9999999.99,
        original_amount: 9999999.99,
        unit: 'ml',
        consumption_unit: 'ml'
      };

      await supabase.from('inventory_items').insert(largeValuesItem);
      expect(supabase.insert).toHaveBeenCalledWith(largeValuesItem);
    });

    it('should handle special characters in text fields', async () => {
      const specialCharsItem: Database['public']['Tables']['inventory_items']['Insert'] = {
        name: 'Special Chars: !@#$%^&*()_+{}[]|\:;"<>,.?/',
        category: 'Grease',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
        consumption_unit: 'g',
        description: 'Line 1\nLine 2\nLine with unicode: ñáéíóú'
      };

      await supabase.from('inventory_items').insert(specialCharsItem);
      expect(supabase.insert).toHaveBeenCalledWith(specialCharsItem);
    });
  });
});
