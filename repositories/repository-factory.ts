import { InventoryItemRepository } from './inventory-item-repository';
import { UserRepository } from './user-repository';
import { LocationRepository } from './location-repository';
import { ConsumptionRecordRepository } from './consumption-record-repository';

/**
 * Repository factory
 * Provides access to all repositories
 */
export class RepositoryFactory {
  private static inventoryItemRepository: InventoryItemRepository;
  private static userRepository: UserRepository;
  private static locationRepository: LocationRepository;
  private static consumptionRecordRepository: ConsumptionRecordRepository;
  
  /**
   * Get the inventory item repository
   * @returns Inventory item repository
   */
  static getInventoryItemRepository(): InventoryItemRepository {
    if (!this.inventoryItemRepository) {
      this.inventoryItemRepository = new InventoryItemRepository();
    }
    
    return this.inventoryItemRepository;
  }
  
  /**
   * Get the user repository
   * @returns User repository
   */
  static getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository();
    }
    
    return this.userRepository;
  }
  
  /**
   * Get the location repository
   * @returns Location repository
   */
  static getLocationRepository(): LocationRepository {
    if (!this.locationRepository) {
      this.locationRepository = new LocationRepository();
    }
    
    return this.locationRepository;
  }
  
  /**
   * Get the consumption record repository
   * @returns Consumption record repository
   */
  static getConsumptionRecordRepository(): ConsumptionRecordRepository {
    if (!this.consumptionRecordRepository) {
      this.consumptionRecordRepository = new ConsumptionRecordRepository();
    }
    
    return this.consumptionRecordRepository;
  }
}
