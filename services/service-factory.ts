import { InventoryService } from './inventory-service';
import { LocationService } from './location-service';
import { ConsumptionService } from './consumption-service';
import { ReportServiceClient } from './report-service-client';

// Supabase implementations
import { InventoryServiceSupabase } from './inventory-service-supabase';
import { LocationServiceSupabase } from './location-service-supabase';
import { ConsumptionServiceSupabase } from './consumption-service-supabase';

/**
 * Service factory
 * Provides access to all services
 */
export class ServiceFactory {
  private static inventoryService: InventoryServiceSupabase;
  private static locationService: LocationServiceSupabase;
  private static consumptionService: ConsumptionServiceSupabase;
  private static reportService: ReportServiceClient;

  /**
   * Get the inventory service
   * @returns Inventory service
   */
  static getInventoryService(): InventoryServiceSupabase {
    if (!this.inventoryService) {
      this.inventoryService = new InventoryServiceSupabase();
    }
    return this.inventoryService;
  }

  /**
   * Get the location service
   * @returns Location service
   */
  static getLocationService(): LocationServiceSupabase {
    if (!this.locationService) {
      this.locationService = new LocationServiceSupabase();
    }
    return this.locationService;
  }

  /**
   * Get the consumption service
   * @returns Consumption service
   */
  static getConsumptionService(): ConsumptionServiceSupabase {
    if (!this.consumptionService) {
      this.consumptionService = new ConsumptionServiceSupabase();
    }
    return this.consumptionService;
  }

  /**
   * Get the report service
   * @returns Report service
   */
  static getReportService(): ReportServiceClient {
    if (!this.reportService) {
      this.reportService = new ReportServiceClient();
    }
    return this.reportService;
  }
}
