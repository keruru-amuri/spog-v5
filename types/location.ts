import { Database } from './supabase';

// Location types from the database
export type LocationRow = Database['public']['Tables']['locations']['Row'];
export type LocationInsert = Database['public']['Tables']['locations']['Insert'];
export type LocationUpdate = Database['public']['Tables']['locations']['Update'];

// Location type for frontend use
export interface Location {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
