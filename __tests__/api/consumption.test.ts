import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../../app/api/consumption/route';
import { GET as GET_BY_ID, PUT, DELETE } from '../../app/api/consumption/[id]/route';
import { GET as GET_SUMMARY } from '../../app/api/consumption/summary/route';
import { ConsumptionRecordRepository } from '../../repositories/consumption-record-repository';
import { hasPermission } from '../../lib/auth';
import { createServerClient } from '../../lib/supabase-server';

// Mock the consumption record repository
jest.mock('../../repositories/consumption-record-repository', () => {
  return {
    ConsumptionRecordRepository: jest.fn().mockImplementation(() => ({
      findAll: jest.fn(),
      findById: jest.fn(),
      findBy: jest.fn(),
      findByInventoryItem: jest.fn(),
      findByUser: jest.fn(),
      findByDateRange: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      getConsumptionSummaryByItem: jest.fn(),
      getConsumptionSummaryByUser: jest.fn(),
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

describe('Consumption API Endpoints', () => {
  let mockRepository: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked repository instance
    mockRepository = (ConsumptionRecordRepository as jest.Mock).mock.results[0]?.value || new ConsumptionRecordRepository();
    
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
  
  describe('GET /api/consumption', () => {
    it('should return a list of consumption records', async () => {
      // Mock repository methods
      mockRepository.findAll.mockResolvedValue([
        { id: 'record-1', inventory_item_id: 'item-1', quantity: 100 },
        { id: 'record-2', inventory_item_id: 'item-2', quantity: 200 },
      ]);
      mockRepository.count.mockResolvedValue(2);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/consumption');
      
      // Call the handler
      const response = await GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual({
        records: [
          { id: 'record-1', inventory_item_id: 'item-1', quantity: 100 },
          { id: 'record-2', inventory_item_id: 'item-2', quantity: 200 },
        ],
        pagination: {
          total: 2,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      });
      expect(mockRepository.findAll).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('should filter records by inventory item', async () => {
      // Mock repository methods
      mockRepository.findByInventoryItem.mockResolvedValue([
        { id: 'record-1', inventory_item_id: 'item-1', quantity: 100 },
      ]);
      mockRepository.count.mockResolvedValue(1);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/consumption?inventory_item_id=item-1');
      
      // Call the handler
      const response = await GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.records).toHaveLength(1);
      expect(data.records[0].inventory_item_id).toBe('item-1');
      expect(mockRepository.findByInventoryItem).toHaveBeenCalledWith(
        'item-1',
        expect.any(Object)
      );
    });
    
    it('should filter records by user', async () => {
      // Mock repository methods
      mockRepository.findByUser.mockResolvedValue([
        { id: 'record-1', user_id: 'user-1', quantity: 100 },
      ]);
      mockRepository.count.mockResolvedValue(1);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/consumption?user_id=user-1');
      
      // Call the handler
      const response = await GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.records).toHaveLength(1);
      expect(mockRepository.findByUser).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object)
      );
    });
    
    it('should filter records by date range', async () => {
      // Mock repository methods
      mockRepository.findByDateRange.mockResolvedValue([
        { id: 'record-1', recorded_at: '2023-01-01T00:00:00Z' },
      ]);
      
      // Create mock request
      const request = createMockRequest(
        'GET', 
        'http://localhost:3000/api/consumption?start_date=2023-01-01T00:00:00Z&end_date=2023-01-31T23:59:59Z'
      );
      
      // Call the handler
      const response = await GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.records).toHaveLength(1);
      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        expect.any(Object)
      );
    });
    
    it('should handle invalid query parameters', async () => {
      // Create mock request with invalid parameters
      const request = createMockRequest('GET', 'http://localhost:3000/api/consumption?inventory_item_id=invalid-uuid');
      
      // Call the handler
      const response = await GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });
  });
  
  describe('GET /api/consumption/:id', () => {
    it('should return a specific consumption record', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue({
        id: mockParams.id,
        inventory_item_id: 'item-1',
        quantity: 100,
      });
      
      // Create mock request
      const request = createMockRequest('GET', `http://localhost:3000/api/consumption/${mockParams.id}`);
      
      // Call the handler
      const response = await GET_BY_ID(request, { params: mockParams });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.record).toEqual({
        id: mockParams.id,
        inventory_item_id: 'item-1',
        quantity: 100,
      });
      expect(mockRepository.findById).toHaveBeenCalledWith(mockParams.id);
    });
    
    it('should return 404 if record not found', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue(null);
      
      // Create mock request
      const request = createMockRequest('GET', `http://localhost:3000/api/consumption/${mockParams.id}`);
      
      // Call the handler
      const response = await GET_BY_ID(request, { params: mockParams });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Consumption record not found');
    });
  });
  
  describe('POST /api/consumption', () => {
    it('should create a new consumption record', async () => {
      // Mock repository methods
      mockRepository.create.mockResolvedValue({
        id: 'new-record-id',
        inventory_item_id: 'item-1',
        quantity: 100,
        unit: 'g',
        user_id: 'user-123',
      });
      
      // Create mock request
      const requestBody = {
        inventory_item_id: 'item-1',
        quantity: 100,
        unit: 'g',
        notes: 'Test consumption',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/consumption', requestBody);
      
      // Call the handler
      const response = await POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(201);
      expect(data.record).toEqual({
        id: 'new-record-id',
        inventory_item_id: 'item-1',
        quantity: 100,
        unit: 'g',
        user_id: 'user-123',
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...requestBody,
        user_id: 'user-123',
      });
    });
    
    it('should return 400 for invalid request data', async () => {
      // Create mock request with invalid data
      const requestBody = {
        inventory_item_id: 'item-1',
        // Missing required quantity field
        unit: 'g',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/consumption', requestBody);
      
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
        inventory_item_id: 'item-1',
        quantity: 100,
        unit: 'g',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/consumption', requestBody);
      
      // Call the handler
      const response = await POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });
  
  describe('PUT /api/consumption/:id', () => {
    it('should update an existing consumption record', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue({
        id: mockParams.id,
        inventory_item_id: 'item-1',
        quantity: 100,
        unit: 'g',
        user_id: 'user-123',
        created_at: new Date().toISOString(),
      });
      mockRepository.update.mockResolvedValue({
        id: mockParams.id,
        inventory_item_id: 'item-1',
        quantity: 150,
        unit: 'g',
        user_id: 'user-123',
      });
      
      // Create mock request
      const requestBody = {
        quantity: 150,
      };
      const request = createMockRequest('PUT', `http://localhost:3000/api/consumption/${mockParams.id}`, requestBody);
      
      // Call the handler
      const response = await PUT(request, { params: mockParams });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.record).toEqual({
        id: mockParams.id,
        inventory_item_id: 'item-1',
        quantity: 150,
        unit: 'g',
        user_id: 'user-123',
      });
      expect(mockRepository.update).toHaveBeenCalledWith(
        mockParams.id,
        expect.objectContaining({
          quantity: 150,
          updated_by: 'user-123',
        })
      );
    });
    
    it('should return 404 if record not found', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue(null);
      
      // Create mock request
      const requestBody = {
        quantity: 150,
      };
      const request = createMockRequest('PUT', `http://localhost:3000/api/consumption/${mockParams.id}`, requestBody);
      
      // Call the handler
      const response = await PUT(request, { params: mockParams });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Consumption record not found');
    });
  });
  
  describe('DELETE /api/consumption/:id', () => {
    it('should delete a consumption record', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue({
        id: mockParams.id,
        inventory_item_id: 'item-1',
      });
      mockRepository.delete.mockResolvedValue(true);
      
      // Create mock request
      const request = createMockRequest('DELETE', `http://localhost:3000/api/consumption/${mockParams.id}`);
      
      // Call the handler
      const response = await DELETE(request, { params: mockParams });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockParams.id);
    });
    
    it('should return 404 if record not found', async () => {
      // Mock repository methods
      mockRepository.findById.mockResolvedValue(null);
      
      // Create mock request
      const request = createMockRequest('DELETE', `http://localhost:3000/api/consumption/${mockParams.id}`);
      
      // Call the handler
      const response = await DELETE(request, { params: mockParams });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(404);
      expect(data.error).toBe('Consumption record not found');
    });
    
    it('should return 403 if user is not an admin', async () => {
      // Mock hasPermission to return false for admin role
      (hasPermission as jest.Mock).mockResolvedValue(false);
      
      // Mock repository methods
      mockRepository.findById.mockResolvedValue({
        id: mockParams.id,
        inventory_item_id: 'item-1',
      });
      
      // Create mock request
      const request = createMockRequest('DELETE', `http://localhost:3000/api/consumption/${mockParams.id}`);
      
      // Call the handler
      const response = await DELETE(request, { params: mockParams });
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });
  
  describe('GET /api/consumption/summary', () => {
    it('should return consumption summary by item', async () => {
      // Mock repository methods
      mockRepository.getConsumptionSummaryByItem.mockResolvedValue([
        {
          inventory_item_id: 'item-1',
          inventory_item_name: 'Item 1',
          total_quantity: 250,
          unit: 'g',
          consumption_count: 3,
        },
      ]);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/consumption/summary?summary_type=item');
      
      // Call the handler
      const response = await GET_SUMMARY(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.summary).toHaveLength(1);
      expect(data.summary[0].inventory_item_id).toBe('item-1');
      expect(data.summary_type).toBe('item');
      expect(mockRepository.getConsumptionSummaryByItem).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });
    
    it('should return consumption summary by user', async () => {
      // Mock repository methods
      mockRepository.getConsumptionSummaryByUser.mockResolvedValue([
        {
          user_id: 'user-1',
          user_name: 'User 1',
          total_quantity: 350,
          consumption_count: 4,
        },
      ]);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/consumption/summary?summary_type=user');
      
      // Call the handler
      const response = await GET_SUMMARY(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.summary).toHaveLength(1);
      expect(data.summary[0].user_id).toBe('user-1');
      expect(data.summary_type).toBe('user');
      expect(mockRepository.getConsumptionSummaryByUser).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });
    
    it('should return 403 if user lacks permission', async () => {
      // Mock hasPermission to return false
      (hasPermission as jest.Mock).mockResolvedValue(false);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/consumption/summary');
      
      // Call the handler
      const response = await GET_SUMMARY(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });
});
