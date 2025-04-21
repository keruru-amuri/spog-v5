import { Database } from './supabase';

// Inventory item types from the database
export type InventoryItemRow = Database['public']['Tables']['inventory_items']['Row'];
export type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
export type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update'];

// Inventory item type for frontend use
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  location_id?: string;
  location_name?: string; // Populated from join
  current_balance: number;
  original_amount: number;
  minimum_quantity?: number;
  unit: string;
  consumption_unit?: string;
  status: 'normal' | 'low' | 'critical';
  last_refilled?: string;
  expiry_date?: string;
  batch_number?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}
