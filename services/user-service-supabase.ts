import { ApiResponse } from '@/types/api';
import { supabase } from '@/lib/supabase';
import { User, CreateUserInput } from './user-service';

/**
 * Service for interacting with user data in Supabase
 */
export class UserServiceSupabase {
  /**
   * Get users with optional filtering and pagination
   * @param params Optional parameters for filtering and pagination
   * @returns Promise resolving to users
   */
  async getUsers(params?: {
    role?: string;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<ApiResponse<User[]>> {
    try {
      console.log('Fetching users with params:', params);

      // Build query parameters
      const queryParams = new URLSearchParams();

      if (params?.role) {
        queryParams.append('role', params.role);
      }

      if (params?.is_active !== undefined) {
        queryParams.append('is_active', params.is_active.toString());
      }

      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      if (params?.offset) {
        queryParams.append('offset', params.offset.toString());
      }

      if (params?.sort_by) {
        queryParams.append('sort_by', params.sort_by);
      }

      if (params?.sort_order) {
        queryParams.append('sort_order', params.sort_order);
      }

      if (params?.search) {
        queryParams.append('search', params.search);
      }

      // Use the API route instead of direct Supabase access to bypass RLS
      const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Fetching users from URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('Users API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      if (!data.users) {
        throw new Error('Failed to fetch users - no data returned');
      }

      // Transform the data to match the User interface
      const users: User[] = data.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department,
        is_active: user.is_active,
        email_verified: user.email_verified,
        created_at: user.created_at
      }));

      return {
        data: users,
        pagination: data.pagination,
        success: true
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          limit: params?.limit || 10,
          offset: params?.offset || 0,
          hasMore: false
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns Promise resolving to the user
   */
  async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('User not found');
      }

      const user: User = {
        id: data.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        department: data.department,
        is_active: data.is_active,
        email_verified: data.email_verified,
        created_at: data.created_at
      };

      return {
        data: user,
        success: true
      };
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new user
   * @param userData User data to create
   * @returns Promise resolving to the created user
   */
  async createUser(userData: CreateUserInput): Promise<ApiResponse<User>> {
    try {
      console.log('Creating user with data:', userData);
      // Use the API route instead of direct Supabase access to bypass RLS
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      if (!data.user) {
        throw new Error('Failed to create user');
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        role: data.user.role,
        department: data.user.department,
        is_active: data.user.is_active,
        email_verified: data.user.email_verified,
        created_at: data.user.created_at
      };

      return {
        data: user,
        success: true
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a user's status (activate/deactivate)
   * @param id User ID
   * @param isActive Whether the user should be active
   * @returns Promise resolving to the updated user
   */
  async updateUserStatus(id: string, isActive: boolean): Promise<ApiResponse<User>> {
    try {
      console.log(`Updating user status for ${id} to ${isActive}`);

      // Use the API endpoint instead of direct Supabase access to bypass RLS
      const response = await fetch(`/api/admin/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: id,
          is_active: isActive
        }),
      });

      const data = await response.json();
      console.log('Update user status response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      if (!data.user) {
        throw new Error('Failed to update user status - no data returned');
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        role: data.user.role,
        department: data.user.department,
        is_active: data.user.is_active,
        email_verified: data.user.email_verified,
        created_at: data.user.created_at
      };

      return {
        data: user,
        success: true
      };
    } catch (error) {
      console.error(`Error updating user status ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
