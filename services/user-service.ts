import { ApiResponse } from '@/types/api';

/**
 * Type for user
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

/**
 * Type for creating a new user
 */
export interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  email_verified: boolean;
}

/**
 * Service for interacting with user API endpoints
 */
export class UserService {
  private readonly baseUrl = '/api/users';

  /**
   * Fetch users with optional filtering
   * @param params Query parameters for filtering
   * @returns Promise resolving to users and pagination info
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
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const queryString = queryParams.toString();
      const url = `${this.baseUrl}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      return {
        data: data.users,
        pagination: data.pagination,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        data: [],
        pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch a specific user by ID
   * @param id User ID
   * @returns Promise resolving to the user
   */
  async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user');
      }

      const data = await response.json();
      return {
        data: data.user,
        success: true,
      };
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      return {
        data: data.user,
        success: true,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }

      const data = await response.json();
      return {
        data: data.user,
        success: true,
      };
    } catch (error) {
      console.error(`Error updating user status ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
