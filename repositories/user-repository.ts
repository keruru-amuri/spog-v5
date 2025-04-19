import { BaseRepository, QueryOptions } from './base-repository';
import { connectionManager } from '../lib/supabase';
import { fetchById, fetchMany, insert, update, remove } from '../lib/db-utils';
import { Database } from '../types/supabase';
import bcrypt from 'bcrypt';

// Type aliases for better readability
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * Repository for users
 */
export class UserRepository implements BaseRepository<User, UserInsert, UserUpdate> {
  private readonly tableName = 'users';
  private readonly saltRounds = 10;
  
  /**
   * Find a user by ID
   * @param id User ID
   * @returns Promise resolving to the user or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const result = await fetchById<User>(this.tableName, id);
    return result.data;
  }
  
  /**
   * Find all users
   * @param options Query options
   * @returns Promise resolving to an array of users
   */
  async findAll(options?: QueryOptions): Promise<User[]> {
    const result = await fetchMany<User>(this.tableName, options);
    return result.data || [];
  }
  
  /**
   * Find users by a filter
   * @param filter Filter criteria
   * @param options Query options
   * @returns Promise resolving to an array of users
   */
  async findBy(filter: Record<string, any>, options?: QueryOptions): Promise<User[]> {
    const result = await fetchMany<User>(this.tableName, {
      ...options,
      filters: filter,
    });
    return result.data || [];
  }
  
  /**
   * Create a new user
   * @param data User data
   * @returns Promise resolving to the created user
   */
  async create(data: UserInsert): Promise<User> {
    // Hash the password if provided
    if (data.password_hash) {
      data.password_hash = await bcrypt.hash(data.password_hash, this.saltRounds);
    }
    
    const result = await insert<User, UserInsert>(this.tableName, data);
    
    if (!result.data) {
      throw new Error('Failed to create user');
    }
    
    return result.data;
  }
  
  /**
   * Update an existing user
   * @param id User ID
   * @param data User data
   * @returns Promise resolving to the updated user
   */
  async update(id: string, data: UserUpdate): Promise<User> {
    // Hash the password if provided
    if (data.password_hash) {
      data.password_hash = await bcrypt.hash(data.password_hash, this.saltRounds);
    }
    
    const result = await update<User, UserUpdate>(this.tableName, id, data);
    
    if (!result.data) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return result.data;
  }
  
  /**
   * Delete a user
   * @param id User ID
   * @returns Promise resolving to true if the user was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await remove(this.tableName, id);
    return result.success;
  }
  
  /**
   * Count users
   * @param filter Filter criteria
   * @returns Promise resolving to the count
   */
  async count(filter?: Record<string, any>): Promise<number> {
    try {
      const query = connectionManager.getClient().from(this.tableName).select('id', { count: 'exact' });
      
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query.eq(key, value);
        });
      }
      
      const { count, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }
  
  /**
   * Find a user by email
   * @param email Email
   * @returns Promise resolving to the user or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const { data, error } = await client
          .from(this.tableName)
          .select('*')
          .eq('email', email)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            return null;
          }
          throw error;
        }
        
        return data as User;
      });
      
      return result;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }
  
  /**
   * Find users by role
   * @param role Role
   * @param options Query options
   * @returns Promise resolving to an array of users
   */
  async findByRole(role: 'admin' | 'manager' | 'user', options?: QueryOptions): Promise<User[]> {
    return this.findBy({ role }, options);
  }
  
  /**
   * Find active users
   * @param options Query options
   * @returns Promise resolving to an array of users
   */
  async findActive(options?: QueryOptions): Promise<User[]> {
    return this.findBy({ is_active: true }, options);
  }
  
  /**
   * Authenticate a user
   * @param email Email
   * @param password Password
   * @returns Promise resolving to the user or null if authentication fails
   */
  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // Update last login
      await this.update(user.id, {
        last_login: new Date().toISOString(),
      });
      
      return user;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }
  
  /**
   * Create a password reset token
   * @param email Email
   * @returns Promise resolving to the reset token or null if the user is not found
   */
  async createPasswordResetToken(email: string): Promise<string | null> {
    try {
      const user = await this.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Set the token expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Update the user with the reset token
      await this.update(user.id, {
        reset_token: token,
        reset_token_expires: expiresAt.toISOString(),
      });
      
      return token;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      return null;
    }
  }
  
  /**
   * Reset a user's password
   * @param token Reset token
   * @param newPassword New password
   * @returns Promise resolving to true if the password was reset, false otherwise
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        // Find the user with the reset token
        const { data, error } = await client
          .from(this.tableName)
          .select('*')
          .eq('reset_token', token)
          .gt('reset_token_expires', new Date().toISOString())
          .single();
        
        if (error || !data) {
          return false;
        }
        
        const user = data as User;
        
        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);
        
        // Update the user with the new password and clear the reset token
        await this.update(user.id, {
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expires: null,
        });
        
        return true;
      });
      
      return result;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }
}
