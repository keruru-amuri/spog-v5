import { Database } from './supabase';

// User types from the database
export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// User session types from the database
export type UserSessionRow = Database['public']['Tables']['user_sessions']['Row'];
export type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert'];
export type UserSessionUpdate = Database['public']['Tables']['user_sessions']['Update'];

// User permission types from the database
export type UserPermissionRow = Database['public']['Tables']['user_permissions']['Row'];
export type UserPermissionInsert = Database['public']['Tables']['user_permissions']['Insert'];
export type UserPermissionUpdate = Database['public']['Tables']['user_permissions']['Update'];

// User role type
export type UserRole = 'admin' | 'manager' | 'user';

// User profile type (for frontend use)
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  department?: string;
  profileImageUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
}

// Authentication request types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordUpdateRequest {
  token: string;
  password: string;
}

// Profile update request type
export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  department?: string;
  profileImageUrl?: string;
}

// Authentication response types
export interface AuthResponse {
  user: UserProfile;
  token: string;
  expiresAt: string;
}

// Permission constants
export const PERMISSIONS = {
  // User management permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'manage:users',

  // Inventory permissions
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',

  // Consumption permissions
  CONSUMPTION_CREATE: 'consumption:create',
  CONSUMPTION_READ: 'consumption:read',

  // Report permissions
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',

  // Location permissions
  LOCATION_CREATE: 'location:create',
  LOCATION_READ: 'location:read',
  LOCATION_UPDATE: 'location:update',
  LOCATION_DELETE: 'location:delete',
};

// Default role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.CONSUMPTION_CREATE,
    PERMISSIONS.CONSUMPTION_READ,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.LOCATION_CREATE,
    PERMISSIONS.LOCATION_READ,
    PERMISSIONS.LOCATION_UPDATE,
    PERMISSIONS.LOCATION_DELETE,
  ],
  user: [
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.CONSUMPTION_CREATE,
    PERMISSIONS.CONSUMPTION_READ,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.LOCATION_READ,
  ],
};
