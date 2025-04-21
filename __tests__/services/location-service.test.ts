import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LocationService } from '@/services/location-service';
import { Location } from '@/types/location';

// Mock fetch
global.fetch = jest.fn();

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    service = new LocationService();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLocations', () => {
    it('should fetch locations successfully', async () => {
      // Mock response data
      const mockLocations: Location[] = [
        {
          id: '123',
          name: 'Hangar 5',
          description: 'Main storage facility',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: '456',
          name: 'Hangar 6',
          description: 'Secondary storage facility',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        locations: mockLocations,
      };

      // Mock fetch implementation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Call the service
      const result = await service.getLocations();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/locations', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLocations);
    });

    it('should handle API errors', async () => {
      // Mock error response
      const errorMessage = 'Failed to fetch locations';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      // Call the service
      const result = await service.getLocations();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/locations', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe(errorMessage);
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Call the service
      const result = await service.getLocations();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/locations', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('Network error');
    });
  });

  describe('getLocation', () => {
    it('should fetch a single location successfully', async () => {
      // Mock location
      const mockLocation: Location = {
        id: '123',
        name: 'Hangar 5',
        description: 'Main storage facility',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      // Mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ location: mockLocation }),
      });

      // Call the service
      const result = await service.getLocation('123');

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/locations/123', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLocation);
    });

    it('should handle location not found', async () => {
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Location not found' }),
      });

      // Call the service
      const result = await service.getLocation('999');

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/locations/999', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Location not found');
    });
  });
});
