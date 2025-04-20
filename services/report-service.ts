import { InventoryItemRepository } from '@/repositories/inventory-item-repository';
import { ConsumptionRecordRepository } from '@/repositories/consumption-record-repository';
import { LocationRepository } from '@/repositories/location-repository';
import { UserRepository } from '@/repositories/user-repository';
import { 
  InventoryStatusReportQueryParams,
  ConsumptionTrendsReportQueryParams,
  ExpiryReportQueryParams,
  LocationUtilizationReportQueryParams
} from '@/lib/schemas/reports';
import { QueryOptions } from '@/repositories/base-repository';

/**
 * Service for generating reports
 */
export class ReportService {
  private inventoryItemRepository: InventoryItemRepository;
  private consumptionRecordRepository: ConsumptionRecordRepository;
  private locationRepository: LocationRepository;
  private userRepository: UserRepository;
  
  constructor() {
    this.inventoryItemRepository = new InventoryItemRepository();
    this.consumptionRecordRepository = new ConsumptionRecordRepository();
    this.locationRepository = new LocationRepository();
    this.userRepository = new UserRepository();
  }
  
  /**
   * Generate inventory status report
   * @param params Report parameters
   * @returns Promise resolving to the report data
   */
  async generateInventoryStatusReport(params: InventoryStatusReportQueryParams) {
    const filter: Record<string, any> = {};
    
    // Apply category filter
    if (params.category) {
      filter.category = params.category;
    }
    
    // Apply location filter
    if (params.location_id) {
      filter.location_id = params.location_id;
    }
    
    // Set up query options
    const options: QueryOptions = {
      limit: 1000, // High limit to get all items
      orderBy: {
        column: 'name',
        ascending: true,
      },
    };
    
    // Get inventory items based on status
    let items = [];
    
    if (params.status === 'low') {
      items = await this.inventoryItemRepository.findNeedingRestock(options);
    } else if (params.status === 'critical') {
      // Get items with critical stock level (less than 10% of original amount)
      const allItems = await this.inventoryItemRepository.findBy(filter, options);
      items = allItems.filter(item => 
        (item.current_quantity / item.original_amount) * 100 < 10
      );
    } else {
      // Get all items
      items = await this.inventoryItemRepository.findBy(filter, options);
    }
    
    // Calculate additional metrics
    const totalItems = items.length;
    const lowStockItems = items.filter(item => 
      item.current_quantity <= item.minimum_quantity
    ).length;
    const criticalStockItems = items.filter(item => 
      (item.current_quantity / item.original_amount) * 100 < 10
    ).length;
    
    // Calculate average stock level percentage
    const averageStockLevel = items.length > 0 
      ? Math.round(
          items.reduce((acc, item) => 
            acc + (item.current_quantity / item.original_amount) * 100, 0
          ) / items.length
        )
      : 0;
    
    // Format items for report
    const formattedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      location_id: item.location_id,
      current_quantity: item.current_quantity,
      original_amount: item.original_amount,
      minimum_quantity: item.minimum_quantity,
      unit: item.unit,
      stock_percentage: Math.round((item.current_quantity / item.original_amount) * 100),
      status: item.current_quantity <= item.minimum_quantity 
        ? 'low' 
        : (item.current_quantity / item.original_amount) * 100 < 10 
          ? 'critical' 
          : 'normal',
      last_updated: item.updated_at || item.created_at,
    }));
    
    // Return report data
    return {
      report_type: 'inventory-status',
      generated_at: new Date().toISOString(),
      parameters: params,
      summary: {
        total_items: totalItems,
        low_stock_items: lowStockItems,
        critical_stock_items: criticalStockItems,
        average_stock_level: averageStockLevel,
      },
      items: formattedItems,
    };
  }
  
  /**
   * Generate consumption trends report
   * @param params Report parameters
   * @returns Promise resolving to the report data
   */
  async generateConsumptionTrendsReport(params: ConsumptionTrendsReportQueryParams) {
    // Set default date range if not provided
    const endDate = params.end_date ? new Date(params.end_date) : new Date();
    const startDate = params.start_date 
      ? new Date(params.start_date) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    
    // Get consumption records for the date range
    const records = await this.consumptionRecordRepository.findByDateRange(
      startDate,
      endDate
    );
    
    // Filter records by category or user if specified
    let filteredRecords = records;
    
    if (params.category) {
      // Get inventory items in the category
      const items = await this.inventoryItemRepository.findBy({ category: params.category });
      const itemIds = items.map(item => item.id);
      
      // Filter consumption records by these item IDs
      filteredRecords = records.filter(record => 
        itemIds.includes(record.inventory_item_id)
      );
    }
    
    if (params.user_id) {
      filteredRecords = filteredRecords.filter(record => 
        record.user_id === params.user_id
      );
    }
    
    // Group data based on the grouping parameter
    let groupedData: Record<string, any> = {};
    
    if (params.group_by === 'day') {
      // Group by day
      filteredRecords.forEach(record => {
        const day = new Date(record.recorded_at).toISOString().split('T')[0];
        
        if (!groupedData[day]) {
          groupedData[day] = {
            date: day,
            total_quantity: 0,
            consumption_count: 0,
          };
        }
        
        groupedData[day].total_quantity += record.quantity;
        groupedData[day].consumption_count += 1;
      });
    } else if (params.group_by === 'week') {
      // Group by week
      filteredRecords.forEach(record => {
        const date = new Date(record.recorded_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        const week = weekStart.toISOString().split('T')[0];
        
        if (!groupedData[week]) {
          groupedData[week] = {
            week_start: week,
            total_quantity: 0,
            consumption_count: 0,
          };
        }
        
        groupedData[week].total_quantity += record.quantity;
        groupedData[week].consumption_count += 1;
      });
    } else if (params.group_by === 'month') {
      // Group by month
      filteredRecords.forEach(record => {
        const month = new Date(record.recorded_at).toISOString().substring(0, 7); // YYYY-MM
        
        if (!groupedData[month]) {
          groupedData[month] = {
            month,
            total_quantity: 0,
            consumption_count: 0,
          };
        }
        
        groupedData[month].total_quantity += record.quantity;
        groupedData[month].consumption_count += 1;
      });
    } else if (params.group_by === 'category') {
      // Group by category
      // We need to get item details to know their categories
      const itemIds = [...new Set(filteredRecords.map(record => record.inventory_item_id))];
      const items = await Promise.all(
        itemIds.map(id => this.inventoryItemRepository.findById(id))
      );
      
      // Create a map of item ID to category
      const itemCategories: Record<string, string> = {};
      items.forEach(item => {
        if (item) {
          itemCategories[item.id] = item.category;
        }
      });
      
      // Group records by category
      filteredRecords.forEach(record => {
        const category = itemCategories[record.inventory_item_id] || 'Unknown';
        
        if (!groupedData[category]) {
          groupedData[category] = {
            category,
            total_quantity: 0,
            consumption_count: 0,
          };
        }
        
        groupedData[category].total_quantity += record.quantity;
        groupedData[category].consumption_count += 1;
      });
    } else if (params.group_by === 'user') {
      // Group by user
      // We need to get user details
      const userIds = [...new Set(filteredRecords.map(record => record.user_id))];
      const users = await Promise.all(
        userIds.map(id => this.userRepository.findById(id))
      );
      
      // Create a map of user ID to name
      const userNames: Record<string, string> = {};
      users.forEach(user => {
        if (user) {
          userNames[user.id] = `${user.first_name} ${user.last_name}`;
        }
      });
      
      // Group records by user
      filteredRecords.forEach(record => {
        const userName = userNames[record.user_id] || 'Unknown User';
        
        if (!groupedData[record.user_id]) {
          groupedData[record.user_id] = {
            user_id: record.user_id,
            user_name: userName,
            total_quantity: 0,
            consumption_count: 0,
          };
        }
        
        groupedData[record.user_id].total_quantity += record.quantity;
        groupedData[record.user_id].consumption_count += 1;
      });
    }
    
    // Convert grouped data to array and sort
    const trendsData = Object.values(groupedData).sort((a, b) => {
      if (params.group_by === 'day' || params.group_by === 'week' || params.group_by === 'month') {
        // Sort by date/week/month ascending
        return a[params.group_by === 'week' ? 'week_start' : (params.group_by === 'month' ? 'month' : 'date')]
          .localeCompare(b[params.group_by === 'week' ? 'week_start' : (params.group_by === 'month' ? 'month' : 'date')]);
      } else {
        // Sort by total quantity descending
        return b.total_quantity - a.total_quantity;
      }
    });
    
    // Calculate total consumption
    const totalConsumption = filteredRecords.reduce((sum, record) => sum + record.quantity, 0);
    const totalRecords = filteredRecords.length;
    
    // Return report data
    return {
      report_type: 'consumption-trends',
      generated_at: new Date().toISOString(),
      parameters: params,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
      summary: {
        total_consumption: totalConsumption,
        total_records: totalRecords,
        average_per_record: totalRecords > 0 ? Math.round(totalConsumption / totalRecords * 100) / 100 : 0,
      },
      trends: trendsData,
    };
  }
  
  /**
   * Generate expiry report
   * @param params Report parameters
   * @returns Promise resolving to the report data
   */
  async generateExpiryReport(params: ExpiryReportQueryParams) {
    const daysUntilExpiry = params.days_until_expiry || 30;
    
    // Calculate the expiry threshold date
    const today = new Date();
    const expiryThreshold = new Date(today);
    expiryThreshold.setDate(today.getDate() + daysUntilExpiry);
    
    // Get inventory items that have an expiry date
    const filter: Record<string, any> = {};
    
    // Apply category filter
    if (params.category) {
      filter.category = params.category;
    }
    
    // Set up query options
    const options: QueryOptions = {
      limit: 1000, // High limit to get all items
      orderBy: {
        column: 'expiry_date',
        ascending: true,
      },
    };
    
    // Get all items with expiry dates
    const allItems = await this.inventoryItemRepository.findBy(filter, options);
    
    // Filter items that are expiring within the threshold
    const expiringItems = allItems.filter(item => 
      item.expiry_date && new Date(item.expiry_date) <= expiryThreshold
    );
    
    // Format items for report
    const formattedItems = expiringItems.map(item => {
      const expiryDate = new Date(item.expiry_date!);
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        location_id: item.location_id,
        current_quantity: item.current_quantity,
        unit: item.unit,
        expiry_date: item.expiry_date,
        days_remaining: daysRemaining,
        status: daysRemaining <= 0 ? 'expired' : daysRemaining <= 7 ? 'critical' : 'warning',
      };
    });
    
    // Group by expiry status
    const expired = formattedItems.filter(item => item.status === 'expired').length;
    const critical = formattedItems.filter(item => item.status === 'critical').length;
    const warning = formattedItems.filter(item => item.status === 'warning').length;
    
    // Return report data
    return {
      report_type: 'expiry',
      generated_at: new Date().toISOString(),
      parameters: params,
      summary: {
        total_expiring_items: formattedItems.length,
        expired_items: expired,
        critical_items: critical,
        warning_items: warning,
      },
      items: formattedItems,
    };
  }
  
  /**
   * Generate location utilization report
   * @param params Report parameters
   * @returns Promise resolving to the report data
   */
  async generateLocationUtilizationReport(params: LocationUtilizationReportQueryParams) {
    // Get all locations or a specific location
    let locations = [];
    
    if (params.location_id) {
      const location = await this.locationRepository.findById(params.location_id);
      if (location) {
        locations = [location];
      }
    } else {
      locations = await this.locationRepository.findAll();
    }
    
    // Get all inventory items
    const allItems = await this.inventoryItemRepository.findAll();
    
    // Group items by location
    const locationItems: Record<string, any[]> = {};
    
    locations.forEach(location => {
      locationItems[location.id] = allItems.filter(item => item.location_id === location.id);
    });
    
    // Calculate utilization metrics for each location
    const locationUtilization = await Promise.all(
      locations.map(async location => {
        const items = locationItems[location.id] || [];
        
        // Skip empty locations if not including them
        if (!params.include_empty && items.length === 0) {
          return null;
        }
        
        // Calculate total items and capacity utilization
        const totalItems = items.length;
        const totalQuantity = items.reduce((sum, item) => sum + item.current_quantity, 0);
        
        // Get categories in this location
        const categories = [...new Set(items.map(item => item.category))];
        
        // Calculate items by category
        const itemsByCategory = categories.map(category => {
          const categoryItems = items.filter(item => item.category === category);
          return {
            category,
            item_count: categoryItems.length,
            total_quantity: categoryItems.reduce((sum, item) => sum + item.current_quantity, 0),
          };
        });
        
        return {
          location_id: location.id,
          location_name: location.name,
          location_type: location.type,
          total_items: totalItems,
          total_quantity: totalQuantity,
          categories: itemsByCategory,
        };
      })
    );
    
    // Filter out null values (empty locations that were skipped)
    const filteredUtilization = locationUtilization.filter(item => item !== null);
    
    // Calculate overall metrics
    const totalLocations = filteredUtilization.length;
    const totalItems = filteredUtilization.reduce((sum, location) => sum + location!.total_items, 0);
    const averageItemsPerLocation = totalLocations > 0 ? Math.round(totalItems / totalLocations) : 0;
    
    // Return report data
    return {
      report_type: 'location-utilization',
      generated_at: new Date().toISOString(),
      parameters: params,
      summary: {
        total_locations: totalLocations,
        total_items: totalItems,
        average_items_per_location: averageItemsPerLocation,
      },
      locations: filteredUtilization,
    };
  }
  
  /**
   * Convert report data to CSV format
   * @param reportData Report data
   * @returns CSV string
   */
  convertToCSV(reportData: any): string {
    let csv = '';
    
    // Handle different report types
    switch (reportData.report_type) {
      case 'inventory-status':
        // Add header row
        csv = 'ID,Name,Category,Current Quantity,Original Amount,Minimum Quantity,Unit,Stock Percentage,Status,Last Updated\n';
        
        // Add data rows
        reportData.items.forEach((item: any) => {
          csv += `${item.id},${item.name},${item.category},${item.current_quantity},${item.original_amount},${item.minimum_quantity},${item.unit},${item.stock_percentage}%,${item.status},${item.last_updated}\n`;
        });
        break;
        
      case 'consumption-trends':
        // Add header row based on grouping
        if (reportData.parameters.group_by === 'day') {
          csv = 'Date,Total Quantity,Consumption Count\n';
          
          // Add data rows
          reportData.trends.forEach((trend: any) => {
            csv += `${trend.date},${trend.total_quantity},${trend.consumption_count}\n`;
          });
        } else if (reportData.parameters.group_by === 'week') {
          csv = 'Week Start,Total Quantity,Consumption Count\n';
          
          // Add data rows
          reportData.trends.forEach((trend: any) => {
            csv += `${trend.week_start},${trend.total_quantity},${trend.consumption_count}\n`;
          });
        } else if (reportData.parameters.group_by === 'month') {
          csv = 'Month,Total Quantity,Consumption Count\n';
          
          // Add data rows
          reportData.trends.forEach((trend: any) => {
            csv += `${trend.month},${trend.total_quantity},${trend.consumption_count}\n`;
          });
        } else if (reportData.parameters.group_by === 'category') {
          csv = 'Category,Total Quantity,Consumption Count\n';
          
          // Add data rows
          reportData.trends.forEach((trend: any) => {
            csv += `${trend.category},${trend.total_quantity},${trend.consumption_count}\n`;
          });
        } else if (reportData.parameters.group_by === 'user') {
          csv = 'User ID,User Name,Total Quantity,Consumption Count\n';
          
          // Add data rows
          reportData.trends.forEach((trend: any) => {
            csv += `${trend.user_id},${trend.user_name},${trend.total_quantity},${trend.consumption_count}\n`;
          });
        }
        break;
        
      case 'expiry':
        // Add header row
        csv = 'ID,Name,Category,Current Quantity,Unit,Expiry Date,Days Remaining,Status\n';
        
        // Add data rows
        reportData.items.forEach((item: any) => {
          csv += `${item.id},${item.name},${item.category},${item.current_quantity},${item.unit},${item.expiry_date},${item.days_remaining},${item.status}\n`;
        });
        break;
        
      case 'location-utilization':
        // Add header row
        csv = 'Location ID,Location Name,Location Type,Total Items,Total Quantity\n';
        
        // Add data rows
        reportData.locations.forEach((location: any) => {
          csv += `${location.location_id},${location.location_name},${location.location_type},${location.total_items},${location.total_quantity}\n`;
        });
        break;
        
      default:
        // Generic CSV conversion
        if (Array.isArray(reportData)) {
          // If it's an array, use the first item's keys as headers
          if (reportData.length > 0) {
            const headers = Object.keys(reportData[0]);
            csv = headers.join(',') + '\n';
            
            reportData.forEach(item => {
              csv += headers.map(header => item[header]).join(',') + '\n';
            });
          }
        }
    }
    
    return csv;
  }
}
