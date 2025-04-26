import { subDays, format } from 'date-fns';

// Generate mock consumption records
export function generateMockConsumptionRecords(count: number = 100) {
  const departments = ['Engineering', 'Maintenance', 'Operations', 'Quality Control'];
  const users = Array.from({ length: 10 }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `user${i + 1}@example.com`,
    department: departments[i % departments.length]
  }));
  
  const inventoryItems = Array.from({ length: 20 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`,
    category: ['S', 'P', 'O', 'G'][i % 4],
    unit: ['L', 'kg', 'pcs', 'box'][i % 4]
  }));
  
  return Array.from({ length: count }, (_, i) => {
    const recordDate = subDays(new Date(), Math.floor(Math.random() * 180)); // Random date within last 180 days
    
    return {
      id: `record-${i + 1}`,
      inventory_item_id: inventoryItems[Math.floor(Math.random() * inventoryItems.length)].id,
      user_id: users[Math.floor(Math.random() * users.length)].id,
      quantity: Math.random() * 10 + 1, // Random quantity between 1 and 11
      unit: inventoryItems[Math.floor(Math.random() * inventoryItems.length)].unit,
      recorded_at: recordDate.toISOString(),
      user_department: users[Math.floor(Math.random() * users.length)].department
    };
  });
}

// Generate mock users with departments
export function generateMockUsers(count: number = 10) {
  const departments = ['Engineering', 'Maintenance', 'Operations', 'Quality Control'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `user${i + 1}@example.com`,
    name: `User ${i + 1}`,
    department: departments[i % departments.length]
  }));
}

// Generate mock inventory items with consumption rates
export function generateMockInventoryItems(count: number = 20) {
  const categories = ['S', 'P', 'O', 'G'];
  const units = ['L', 'kg', 'pcs', 'box'];
  const statuses = ['normal', 'low', 'critical'];
  
  return Array.from({ length: count }, (_, i) => {
    const originalAmount = Math.random() * 100 + 50; // Random amount between 50 and 150
    const currentBalance = originalAmount * (Math.random() * 0.8 + 0.2); // Random percentage of original amount
    const status = currentBalance < originalAmount * 0.3 
      ? 'critical' 
      : currentBalance < originalAmount * 0.5 
        ? 'low' 
        : 'normal';
    
    return {
      id: `item-${i + 1}`,
      name: `Item ${i + 1} ${categories[i % 4]}`,
      category: categories[i % 4],
      original_amount: originalAmount,
      current_balance: currentBalance,
      unit: units[i % 4],
      status: status,
      consumption_rate: Math.random() * 2 + 0.1, // Random consumption rate between 0.1 and 2.1 per day
      reorder_point: originalAmount * 0.3 // 30% of original amount
    };
  });
}
