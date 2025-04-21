import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../../app/api/inventory/route';
import { GET as GET_BY_ID, PUT, DELETE } from '../../app/api/inventory/[id]/route';
import { InventoryItemRepository } from '../../repositories/inventory-item-repository';
import { hasPermission } from '../../lib/auth';
import { createServerClient } from '../../lib/supabase-server';

// Mock the inventory item repository
jest.mock('../../repositories/inventory-item-repository', () => {
  return {
    InventoryItemRepository: jest.fn().mockImplementation(() => ({
      findAll: jest.fn(),
      findById: jest.fn(),
      findBy: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    })),
  };
});

// Mock the auth library
jest.mock('../../lib/auth', () => {
  return {
    hasPermission: jest.fn(),
  };
});

// Mock the supabase server client
jest.mock('../../lib/supabase-server', () => {
  return {
    createServerClient: jest.fn().mockReturnValue({
      auth: {
        getUser: jest.fn(),
      },
    }),
  };
});

// Mock NextRequest
const createMockRequest = (method: string, url: string, body?: any) => {
  const request = {
    method,
    url,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;

  // Add URL object for GET requests
  if (method === 'GET') {
    const urlObj = new URL(url);
    request.url = urlObj.toString();
  }

  return request;
};

// Mock params
const mockParams = { id: '123e4567-e89b-12d3-a456-426614174000' };

describe('Inventory API Endpoints', () => {
  let mockRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked repository instance
    mockRepository = (InventoryItemRepository as jest.Mock).mock.results[0]?.value || new InventoryItemRepository();

    // Mock the auth getUser method
    const mockSupabase = createServerClient();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      error: null,
    });

    // Mock hasPermission to return true by default
    (hasPermission as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/inventory', () => {
    it('should return a list of inventory items', async () => {
      // Mock repository methods
      mockRepository.findBy.mockResolvedValue([
        { id: 'item-1', name: 'Item 1' },
        { id: 'item-2', name: 'Item 2' },
      ]);
      mockRepository.count.mockResolvedValue(2);

      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/inventory');

      // Call the handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual({
        items: [
          { id: 'item-1', name: 'Item 1' },
          { id: 'item-2', name: 'Item 2' },
        ],
        pagination: {
          total: 2,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      });
      expect(mockRepository.findBy).toHaveBeenCalledWith({}, expect.any(Object));
    });

    it('should filter items by category', async () => {
      // Mock repository methods
      mockRepository.findBy.mockResolvedValue([
        { id: 'item-1', name: 'Item 1', category: 'Sealant' },
      ]);
      mockRepository.count.mockResolvedValue(1);

      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/inventory?category=Sealant');

      // Call the handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].category).toBe('Sealant');
      expect(mockRepository.findBy).toHaveBeenCalledWith(
        { category: 'Sealant' },
        expect.any(Object)
      );
    });

    it('should search items by term', async () => {
      // Mock repository methods
      mockRepository.search.mockResolvedValue([
        { id: 'item-1', name: 'Test Item' },
      ]);
      mockRepository.count.mockResolvedValue(1);

      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/inventory?search=Test');

      // Call the handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe('Test Item');
      expect(mockRepository.search).toHaveBeenCalledWith('Test', expect.any(Object));
    });

    it('should handle invalid query parameters', async () => {
      // Create mock request with invalid category
      const request = createMockRequest('GET', 'http://localhost:3000/api/inventory?category=Invalid');

      // Call the handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('GET /api/inventory/:id', () => {
    it('should return a specific inventory item', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Item',
      });

      // Create mock request
      const request = createMockRequest('GET', `http://localhost:3000/api/inventory/${mockParams.id}`);

      // Call the handler
      const response = await GET_BY_ID(request, { params: mockParams });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.item).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Item',
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(mockParams.id);
    });

    it('should return 404 if item not found', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue(null);

      // Create mock request
      const request = createMockRequest('GET', `http://localhost:3000/api/inventory/${mockParams.id}`);

      // Call the handler
      const response = await GET_BY_ID(request, { params: mockParams });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Inventory item not found');
    });
  });

  describe('POST /api/inventory', () => {
    it('should create a new inventory item', async () => {
      // Mock repository methods
      mockRepository.create.mockResolvedValue({
        id: 'new-item-id',
        name: 'New Item',
        category: 'Sealant',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
      });

      // Create mock request
      const requestBody = {
        name: 'New Item',
        category: 'Sealant',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/inventory', requestBody);

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(data.item).toEqual({
        id: 'new-item-id',
        name: 'New Item',
        category: 'Sealant',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...requestBody,
        created_by: 'user-123',
      });
    });

    it('should return 400 for invalid request data', async () => {
      // Create mock request with invalid data
      const requestBody = {
        name: 'New Item',
        // Missing required fields
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/inventory', requestBody);

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 403 if user lacks permission', async () => {
      // Mock hasPermission to return false
      (hasPermission as jest.Mock).mockResolvedValue(false);

      // Create mock request
      const requestBody = {
        name: 'New Item',
        category: 'Sealant',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/inventory', requestBody);

      // Call the handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });

  describe('PUT /api/inventory/:id', () => {
    it('should update an existing inventory item', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue({
        id: mockParams.id,
        name: 'Existing Item',
      });
      mockRepository.update.mockResolvedValue({
        id: mockParams.id,
        name: 'Updated Item',
        category: 'Paint',
      });

      // Create mock request
      const requestBody = {
        name: 'Updated Item',
        category: 'Paint',
      };
      const request = createMockRequest('PUT', `http://localhost:3000/api/inventory/${mockParams.id}`, requestBody);

      // Call the handler
      const response = await PUT(request, { params: mockParams });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.item).toEqual({
        id: mockParams.id,
        name: 'Updated Item',
        category: 'Paint',
      });
      expect(mockRepository.update).toHaveBeenCalledWith(
        mockParams.id,
        expect.objectContaining({
          name: 'Updated Item',
          category: 'Paint',
          updated_by: 'user-123',
        })
      );
    });

    it('should return 404 if item not found', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue(null);

      // Create mock request
      const requestBody = {
        name: 'Updated Item',
      };
      const request = createMockRequest('PUT', `http://localhost:3000/api/inventory/${mockParams.id}`, requestBody);

      // Call the handler
      const response = await PUT(request, { params: mockParams });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Inventory item not found');
    });
  });

  describe('DELETE /api/inventory/:id', () => {
    it('should delete an inventory item', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue({
        id: mockParams.id,
        name: 'Item to Delete',
      });
      mockRepository.delete.mockResolvedValue(true);

      // Create mock request
      const request = createMockRequest('DELETE', `http://localhost:3000/api/inventory/${mockParams.id}`);

      // Call the handler
      const response = await DELETE(request, { params: mockParams });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockParams.id);
    });

    it('should return 404 if item not found', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue(null);

      // Create mock request
      const request = createMockRequest('DELETE', `http://localhost:3000/api/inventory/${mockParams.id}`);

      // Call the handler
      const response = await DELETE(request, { params: mockParams });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Inventory item not found');
    });

    it('should return 403 if user lacks permission', async () => {
      // Mock hasPermission to return false
      (hasPermission as jest.Mock).mockResolvedValue(false);

      // Mock repository methods
      mockRepository.findById.mockResolvedValue({
        id: mockParams.id,
        name: 'Item to Delete',
      });

      // Create mock request
      const request = createMockRequest('DELETE', `http://localhost:3000/api/inventory/${mockParams.id}`);

      // Call the handler
      const response = await DELETE(request, { params: mockParams });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });
});
