export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          role: 'admin' | 'manager' | 'user'
          department: string | null
          is_active: boolean
          last_login: string | null
          profile_image_url: string | null
          email_verified: boolean
          reset_token: string | null
          reset_token_expires: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          role?: 'admin' | 'manager' | 'user'
          department?: string | null
          is_active?: boolean
          last_login?: string | null
          profile_image_url?: string | null
          email_verified?: boolean
          reset_token?: string | null
          reset_token_expires?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          password_hash?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'manager' | 'user'
          department?: string | null
          is_active?: boolean
          last_login?: string | null
          profile_image_url?: string | null
          email_verified?: boolean
          reset_token?: string | null
          reset_token_expires?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          token: string
          expires_at: string
          ip_address: string | null
          user_agent: string | null
          is_valid: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          token: string
          expires_at: string
          ip_address?: string | null
          user_agent?: string | null
          is_valid?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          token?: string
          expires_at?: string
          ip_address?: string | null
          user_agent?: string | null
          is_valid?: boolean
        }
      }
      user_permissions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          permission: string
          resource: string | null
          granted_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          permission: string
          resource?: string | null
          granted_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          permission?: string
          resource?: string | null
          granted_by?: string | null
        }
      }
      inventory_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          category: 'Sealant' | 'Paint' | 'Oil' | 'Grease'
          location_id: string | null
          current_balance: number
          original_amount: number
          unit: string
          consumption_unit: string
          status: 'normal' | 'low' | 'critical'
          description: string | null
          last_refilled: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          category: 'Sealant' | 'Paint' | 'Oil' | 'Grease'
          location_id?: string | null
          current_balance: number
          original_amount: number
          unit: string
          consumption_unit: string
          status?: 'normal' | 'low' | 'critical'
          description?: string | null
          last_refilled?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          category?: 'Sealant' | 'Paint' | 'Oil' | 'Grease'
          location_id?: string | null
          current_balance?: number
          original_amount?: number
          unit?: string
          consumption_unit?: string
          status?: 'normal' | 'low' | 'critical'
          description?: string | null
          last_refilled?: string | null
          image_url?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
        }
      }
    }
  }
}
