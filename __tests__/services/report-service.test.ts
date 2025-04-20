import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ReportService } from '../../services/report-service';
import { InventoryItemRepository } from '../../repositories/inventory-item-repository';
import { ConsumptionRecordRepository } from '../../repositories/consumption-record-repository';
import { LocationRepository } from '../../repositories/location-repository';
import { UserRepository } from '../../repositories/user-repository';

// Mock the repositories
jest.mock('../../repositories/inventory-item-repository');
jest.mock('../../repositories/consumption-record-repository');
jest.mock('../../repositories/location-repository');
jest.mock('../../repositories/user-repository');

describe('ReportService', () => {
  let reportService: ReportService;
  let mockInventoryItemRepository: jest.Mocked<InventoryItemRepository>;
  let mockConsumptionRecordRepository: jest.Mocked<ConsumptionRecordRepository>;
  let mockLocationRepository: jest.Mocked<LocationRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance of the service
    reportService = new ReportService();
    
    // Get the mocked repositories
    mockInventoryItemRepository = InventoryItemRepository.prototype as jest.Mocked<InventoryItemRepository>;
    mockConsumptionRecordRepository = ConsumptionRecordRepository.prototype as jest.Mocked<ConsumptionRecordRepository>;
    mockLocationRepository = LocationRepository.prototype as jest.Mocked<LocationRepository>;
    mockUserRepository = UserRepository.prototype as jest.Mocked<UserRepository>;
  });
  
  describe('generateInventoryStatusReport', () => {
    it('should generate inventory status report with all items', async () => {
      // Mock repository methods
      mockInventoryItemRepository.findBy = jest.fn().mockResolvedValue([
        {
          id: 'item-1',
          name: 'Item 1',
          category: 'Sealant',
          current_quantity: 100,
          original_amount: 200,
          minimum_quantity: 50,
          unit: 'g',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'item-2',
          name: 'Item 2',
          category: 'Paint',
          current_quantity: 20,
          original_amount: 100,
          minimum_quantity: 30,
          unit: 'ml',
          created_at: '2023-01-02T00:00:00Z',
        },
      ]);
      
      // Call the method
      const report = await reportService.generateInventoryStatusReport({
        format: 'json',
        status: 'all',
      });
      
      // Assertions
      expect(report.report_type).toBe('inventory-status');
      expect(report.items).toHaveLength(2);
      expect(report.summary.total_items).toBe(2);
      expect(report.summary.low_stock_items).toBe(1); // Item 2 is below minimum
      expect(report.items[0].stock_percentage).toBe(50); // 100/200 * 100
      expect(report.items[1].status).toBe('low'); // Below minimum quantity
      
      // Verify repository calls
      expect(mockInventoryItemRepository.findBy).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          limit: 1000,
          orderBy: { column: 'name', ascending: true },
        })
      );
    });
    
    it('should filter items by category', async () => {
      // Mock repository methods
      mockInventoryItemRepository.findBy = jest.fn().mockResolvedValue([
        {
          id: 'item-1',
          name: 'Item 1',
          category: 'Sealant',
          current_quantity: 100,
          original_amount: 200,
          minimum_quantity: 50,
          unit: 'g',
          created_at: '2023-01-01T00:00:00Z',
        },
      ]);
      
      // Call the method
      const report = await reportService.generateInventoryStatusReport({
        format: 'json',
        status: 'all',
        category: 'Sealant',
      });
      
      // Assertions
      expect(report.items).toHaveLength(1);
      expect(report.items[0].category).toBe('Sealant');
      
      // Verify repository calls
      expect(mockInventoryItemRepository.findBy).toHaveBeenCalledWith(
        { category: 'Sealant' },
        expect.any(Object)
      );
    });
    
    it('should filter items by low stock status', async () => {
      // Mock repository methods
      mockInventoryItemRepository.findNeedingRestock = jest.fn().mockResolvedValue([
        {
          id: 'item-2',
          name: 'Item 2',
          category: 'Paint',
          current_quantity: 20,
          original_amount: 100,
          minimum_quantity: 30,
          unit: 'ml',
          created_at: '2023-01-02T00:00:00Z',
        },
      ]);
      
      // Call the method
      const report = await reportService.generateInventoryStatusReport({
        format: 'json',
        status: 'low',
      });
      
      // Assertions
      expect(report.items).toHaveLength(1);
      expect(report.items[0].status).toBe('low');
      
      // Verify repository calls
      expect(mockInventoryItemRepository.findNeedingRestock).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });
  });
  
  describe('generateConsumptionTrendsReport', () => {
    it('should generate consumption trends report grouped by day', async () => {
      // Mock repository methods
      mockConsumptionRecordRepository.findByDateRange = jest.fn().mockResolvedValue([
        {
          id: 'record-1',
          inventory_item_id: 'item-1',
          user_id: 'user-1',
          quantity: 50,
          unit: 'g',
          recorded_at: '2023-04-01T10:00:00Z',
        },
        {
          id: 'record-2',
          inventory_item_id: 'item-1',
          user_id: 'user-1',
          quantity: 30,
          unit: 'g',
          recorded_at: '2023-04-01T14:00:00Z',
        },
        {
          id: 'record-3',
          inventory_item_id: 'item-2',
          user_id: 'user-2',
          quantity: 100,
          unit: 'ml',
          recorded_at: '2023-04-02T09:00:00Z',
        },
      ]);
      
      // Call the method
      const report = await reportService.generateConsumptionTrendsReport({
        format: 'json',
        group_by: 'day',
        start_date: '2023-04-01T00:00:00Z',
        end_date: '2023-04-03T00:00:00Z',
      });
      
      // Assertions
      expect(report.report_type).toBe('consumption-trends');
      expect(report.trends).toHaveLength(2); // Two days with data
      expect(report.summary.total_consumption).toBe(180); // 50 + 30 + 100
      expect(report.summary.total_records).toBe(3);
      
      // Verify repository calls
      expect(mockConsumptionRecordRepository.findByDateRange).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });
    
    it('should filter consumption records by category', async () => {
      // Mock repository methods
      mockConsumptionRecordRepository.findByDateRange = jest.fn().mockResolvedValue([
        {
          id: 'record-1',
          inventory_item_id: 'item-1',
          user_id: 'user-1',
          quantity: 50,
          unit: 'g',
          recorded_at: '2023-04-01T10:00:00Z',
        },
        {
          id: 'record-2',
          inventory_item_id: 'item-2',
          user_id: 'user-1',
          quantity: 100,
          unit: 'ml',
          recorded_at: '2023-04-01T14:00:00Z',
        },
      ]);
      
      mockInventoryItemRepository.findBy = jest.fn().mockResolvedValue([
        {
          id: 'item-1',
          name: 'Item 1',
          category: 'Sealant',
        },
      ]);
      
      // Call the method
      const report = await reportService.generateConsumptionTrendsReport({
        format: 'json',
        group_by: 'day',
        category: 'Sealant',
      });
      
      // Assertions
      expect(report.trends).toHaveLength(1);
      expect(report.summary.total_consumption).toBe(50); // Only the Sealant item
      
      // Verify repository calls
      expect(mockInventoryItemRepository.findBy).toHaveBeenCalledWith(
        { category: 'Sealant' }
      );
    });
  });
  
  describe('generateExpiryReport', () => {
    it('should generate expiry report with items expiring within the threshold', async () => {
      // Calculate dates for testing
      const today = new Date();
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      const tenDaysLater = new Date(today);
      tenDaysLater.setDate(today.getDate() + 10);
      const twentyDaysLater = new Date(today);
      twentyDaysLater.setDate(today.getDate() + 20);
      
      // Mock repository methods
      mockInventoryItemRepository.findBy = jest.fn().mockResolvedValue([
        {
          id: 'item-1',
          name: 'Item 1',
          category: 'Sealant',
          current_quantity: 100,
          unit: 'g',
          expiry_date: threeDaysLater.toISOString(),
        },
        {
          id: 'item-2',
          name: 'Item 2',
          category: 'Paint',
          current_quantity: 200,
          unit: 'ml',
          expiry_date: tenDaysLater.toISOString(),
        },
        {
          id: 'item-3',
          name: 'Item 3',
          category: 'Oil',
          current_quantity: 300,
          unit: 'ml',
          expiry_date: twentyDaysLater.toISOString(),
        },
        {
          id: 'item-4',
          name: 'Item 4',
          category: 'Grease',
          current_quantity: 400,
          unit: 'g',
          expiry_date: null, // No expiry date
        },
      ]);
      
      // Call the method
      const report = await reportService.generateExpiryReport({
        format: 'json',
        days_until_expiry: 15,
      });
      
      // Assertions
      expect(report.report_type).toBe('expiry');
      expect(report.items).toHaveLength(2); // Only items 1 and 2 are expiring within 15 days
      expect(report.summary.total_expiring_items).toBe(2);
      expect(report.items[0].status).toBe('critical'); // Less than 7 days
      expect(report.items[1].status).toBe('warning'); // More than 7 days but less than 15
      
      // Verify repository calls
      expect(mockInventoryItemRepository.findBy).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          orderBy: { column: 'expiry_date', ascending: true },
        })
      );
    });
  });
  
  describe('generateLocationUtilizationReport', () => {
    it('should generate location utilization report for all locations', async () => {
      // Mock repository methods
      mockLocationRepository.findAll = jest.fn().mockResolvedValue([
        {
          id: 'location-1',
          name: 'Storage A',
          type: 'Shelf',
        },
        {
          id: 'location-2',
          name: 'Storage B',
          type: 'Cabinet',
        },
      ]);
      
      mockInventoryItemRepository.findAll = jest.fn().mockResolvedValue([
        {
          id: 'item-1',
          name: 'Item 1',
          category: 'Sealant',
          location_id: 'location-1',
          current_quantity: 100,
        },
        {
          id: 'item-2',
          name: 'Item 2',
          category: 'Paint',
          location_id: 'location-1',
          current_quantity: 200,
        },
        {
          id: 'item-3',
          name: 'Item 3',
          category: 'Oil',
          location_id: 'location-2',
          current_quantity: 300,
        },
      ]);
      
      // Call the method
      const report = await reportService.generateLocationUtilizationReport({
        format: 'json',
      });
      
      // Assertions
      expect(report.report_type).toBe('location-utilization');
      expect(report.locations).toHaveLength(2);
      expect(report.summary.total_locations).toBe(2);
      expect(report.summary.total_items).toBe(3);
      expect(report.locations[0].total_items).toBe(2); // Location 1 has 2 items
      expect(report.locations[1].total_items).toBe(1); // Location 2 has 1 item
      
      // Verify repository calls
      expect(mockLocationRepository.findAll).toHaveBeenCalled();
      expect(mockInventoryItemRepository.findAll).toHaveBeenCalled();
    });
    
    it('should generate location utilization report for a specific location', async () => {
      // Mock repository methods
      mockLocationRepository.findById = jest.fn().mockResolvedValue({
        id: 'location-1',
        name: 'Storage A',
        type: 'Shelf',
      });
      
      mockInventoryItemRepository.findAll = jest.fn().mockResolvedValue([
        {
          id: 'item-1',
          name: 'Item 1',
          category: 'Sealant',
          location_id: 'location-1',
          current_quantity: 100,
        },
        {
          id: 'item-2',
          name: 'Item 2',
          category: 'Paint',
          location_id: 'location-1',
          current_quantity: 200,
        },
        {
          id: 'item-3',
          name: 'Item 3',
          category: 'Oil',
          location_id: 'location-2',
          current_quantity: 300,
        },
      ]);
      
      // Call the method
      const report = await reportService.generateLocationUtilizationReport({
        format: 'json',
        location_id: 'location-1',
      });
      
      // Assertions
      expect(report.locations).toHaveLength(1);
      expect(report.locations[0].location_id).toBe('location-1');
      expect(report.locations[0].total_items).toBe(2); // Location 1 has 2 items
      
      // Verify repository calls
      expect(mockLocationRepository.findById).toHaveBeenCalledWith('location-1');
    });
  });
  
  describe('convertToCSV', () => {
    it('should convert inventory status report to CSV', () => {
      // Create sample report data
      const reportData = {
        report_type: 'inventory-status',
        items: [
          {
            id: 'item-1',
            name: 'Item 1',
            category: 'Sealant',
            current_quantity: 100,
            original_amount: 200,
            minimum_quantity: 50,
            unit: 'g',
            stock_percentage: 50,
            status: 'normal',
            last_updated: '2023-01-01T00:00:00Z',
          },
          {
            id: 'item-2',
            name: 'Item 2',
            category: 'Paint',
            current_quantity: 20,
            original_amount: 100,
            minimum_quantity: 30,
            unit: 'ml',
            stock_percentage: 20,
            status: 'low',
            last_updated: '2023-01-02T00:00:00Z',
          },
        ],
      };
      
      // Call the method
      const csv = reportService.convertToCSV(reportData);
      
      // Assertions
      expect(csv).toContain('ID,Name,Category,Current Quantity,Original Amount,Minimum Quantity,Unit,Stock Percentage,Status,Last Updated');
      expect(csv).toContain('item-1,Item 1,Sealant,100,200,50,g,50%,normal,2023-01-01T00:00:00Z');
      expect(csv).toContain('item-2,Item 2,Paint,20,100,30,ml,20%,low,2023-01-02T00:00:00Z');
    });
  });
});
