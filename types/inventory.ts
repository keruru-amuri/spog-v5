export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  currentBalance: number;
  originalAmount: number;
  unit: string;
  consumptionUnit: string;
  status: 'normal' | 'low' | 'critical';
}
