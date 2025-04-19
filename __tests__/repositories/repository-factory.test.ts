import { RepositoryFactory } from '../../repositories/repository-factory';
import { InventoryItemRepository } from '../../repositories/inventory-item-repository';
import { UserRepository } from '../../repositories/user-repository';
import { LocationRepository } from '../../repositories/location-repository';
import { ConsumptionRecordRepository } from '../../repositories/consumption-record-repository';

describe('RepositoryFactory', () => {
  beforeEach(() => {
    // Reset the repositories
    // @ts-ignore - accessing private property for testing
    RepositoryFactory.inventoryItemRepository = undefined;
    // @ts-ignore - accessing private property for testing
    RepositoryFactory.userRepository = undefined;
    // @ts-ignore - accessing private property for testing
    RepositoryFactory.locationRepository = undefined;
    // @ts-ignore - accessing private property for testing
    RepositoryFactory.consumptionRecordRepository = undefined;
  });
  
  describe('getInventoryItemRepository', () => {
    it('should return an instance of InventoryItemRepository', () => {
      const repository = RepositoryFactory.getInventoryItemRepository();
      
      expect(repository).toBeInstanceOf(InventoryItemRepository);
    });
    
    it('should return the same instance on subsequent calls', () => {
      const repository1 = RepositoryFactory.getInventoryItemRepository();
      const repository2 = RepositoryFactory.getInventoryItemRepository();
      
      expect(repository1).toBe(repository2);
    });
  });
  
  describe('getUserRepository', () => {
    it('should return an instance of UserRepository', () => {
      const repository = RepositoryFactory.getUserRepository();
      
      expect(repository).toBeInstanceOf(UserRepository);
    });
    
    it('should return the same instance on subsequent calls', () => {
      const repository1 = RepositoryFactory.getUserRepository();
      const repository2 = RepositoryFactory.getUserRepository();
      
      expect(repository1).toBe(repository2);
    });
  });
  
  describe('getLocationRepository', () => {
    it('should return an instance of LocationRepository', () => {
      const repository = RepositoryFactory.getLocationRepository();
      
      expect(repository).toBeInstanceOf(LocationRepository);
    });
    
    it('should return the same instance on subsequent calls', () => {
      const repository1 = RepositoryFactory.getLocationRepository();
      const repository2 = RepositoryFactory.getLocationRepository();
      
      expect(repository1).toBe(repository2);
    });
  });
  
  describe('getConsumptionRecordRepository', () => {
    it('should return an instance of ConsumptionRecordRepository', () => {
      const repository = RepositoryFactory.getConsumptionRecordRepository();
      
      expect(repository).toBeInstanceOf(ConsumptionRecordRepository);
    });
    
    it('should return the same instance on subsequent calls', () => {
      const repository1 = RepositoryFactory.getConsumptionRecordRepository();
      const repository2 = RepositoryFactory.getConsumptionRecordRepository();
      
      expect(repository1).toBe(repository2);
    });
  });
});
