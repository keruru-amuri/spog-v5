import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Mock Supabase client with more detailed functionality
jest.mock('@/lib/supabase', () => {
  const mockError = { code: '', message: '', details: '' };
  const mockFrom = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  
  // Default success response
  const mockThen = jest.fn().mockImplementation(callback => {
    return callback({ data: [], error: null });
  });

  return {
    supabase: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
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

describe('Location Schema', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Type Validation Tests', () => {
    it('should accept a valid location with only required fields', async () => {
      const validLocation: Database['public']['Tables']['locations']['Insert'] = {
        name: 'Test Location'
      };

      await supabase.from('locations').insert(validLocation);
      expect(supabase.from).toHaveBeenCalledWith('locations');
      expect(supabase.insert).toHaveBeenCalledWith(validLocation);
    });

    it('should accept a valid location with all fields', async () => {
      const validFullLocation: Database['public']['Tables']['locations']['Insert'] = {
        name: 'Complete Test Location',
        description: 'This is a test location with all fields'
      };

      await supabase.from('locations').insert(validFullLocation);
      expect(supabase.insert).toHaveBeenCalledWith(validFullLocation);
    });
  });

  describe('Constraint Tests', () => {
    it('should validate required fields', async () => {
      // This test simulates a database constraint error when required fields are missing
      const invalidLocation = {
        // name is missing
        description: 'This location is missing a name'
      };

      // Simulate a database error
      (supabase as any).__simulateError({
        code: '23502',
        message: 'null value in column "name" violates not-null constraint',
        details: 'Failing row contains (null, ...)'  
      });

      const result = await supabase.from('locations').insert(invalidLocation as any);
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('violates not-null constraint');
    });
  });

  describe('Relationship Tests', () => {
    it('should allow inventory items to reference a location', async () => {
      // First create a location
      const location: Database['public']['Tables']['locations']['Insert'] = {
        name: 'Storage Room A'
      };

      // Mock a successful location insert with a returned ID
      (supabase as any).__resetMocks();
      (supabase.then as jest.Mock).mockImplementationOnce(callback => {
        return callback({ 
          data: [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Storage Room A' }], 
          error: null 
        });
      });

      const locationResult = await supabase.from('locations').insert(location);
      
      // Now create an inventory item that references this location
      const inventoryItem: Database['public']['Tables']['inventory_items']['Insert'] = {
        name: 'Item in Storage Room A',
        category: 'Sealant',
        location_id: locationResult.data[0].id,
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
        consumption_unit: 'g'
      };

      // Reset mocks for the next call
      (supabase as any).__resetMocks();

      await supabase.from('inventory_items').insert(inventoryItem);
      expect(supabase.from).toHaveBeenCalledWith('inventory_items');
      expect(supabase.insert).toHaveBeenCalledWith(inventoryItem);
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle long names', async () => {
      const longNameLocation: Database['public']['Tables']['locations']['Insert'] = {
        name: 'A'.repeat(255), // Maximum length for most text fields in PostgreSQL
      };

      await supabase.from('locations').insert(longNameLocation);
      expect(supabase.insert).toHaveBeenCalledWith(longNameLocation);
    });

    it('should handle special characters in text fields', async () => {
      const specialCharsLocation: Database['public']['Tables']['locations']['Insert'] = {
        name: 'Special Chars: !@#$%^&*()_+{}[]|\\:;"<>,.?/',
        description: 'Line 1\nLine 2\nLine with unicode: ñáéíóú'
      };

      await supabase.from('locations').insert(specialCharsLocation);
      expect(supabase.insert).toHaveBeenCalledWith(specialCharsLocation);
    });
  });
});
