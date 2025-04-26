import { azureDb } from '../azure-db';
import { User } from '@/types/user';

/**
 * User repository for Azure PostgreSQL
 * This class provides methods to interact with the users table in Azure PostgreSQL
 */
export class UserRepositoryAzure {
  /**
   * Get all users
   * @returns Array of users
   */
  async getAllUsers(): Promise<User[]> {
    const query = `
      SELECT * FROM users
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
    return await azureDb.query<User>(query);
  }

  /**
   * Get a user by ID
   * @param id User ID
   * @returns User or null if not found
   */
  async getUserById(id: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE id = $1
    `;
    return await azureDb.queryOne<User>(query, [id]);
  }

  /**
   * Get a user by email
   * @param email User email
   * @returns User or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE email = $1
    `;
    return await azureDb.queryOne<User>(query, [email]);
  }

  /**
   * Create a new user
   * @param user User data
   * @returns Created user
   */
  async createUser(user: Partial<User>): Promise<User> {
    const query = `
      INSERT INTO users (
        id, email, first_name, last_name, role, department, is_active, email_verified, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
      RETURNING *
    `;
    
    const params = [
      user.id,
      user.email,
      user.first_name,
      user.last_name,
      user.role || 'user',
      user.department,
      user.is_active !== undefined ? user.is_active : true,
      user.email_verified !== undefined ? user.email_verified : false,
    ];
    
    const result = await azureDb.queryOne<User>(query, params);
    if (!result) {
      throw new Error('Failed to create user');
    }
    return result;
  }

  /**
   * Update a user
   * @param id User ID
   * @param user User data to update
   * @returns Updated user
   */
  async updateUser(id: string, user: Partial<User>): Promise<User | null> {
    // Build the SET clause dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (user.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(user.email);
    }
    
    if (user.first_name !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(user.first_name);
    }
    
    if (user.last_name !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(user.last_name);
    }
    
    if (user.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(user.role);
    }
    
    if (user.department !== undefined) {
      updates.push(`department = $${paramIndex++}`);
      values.push(user.department);
    }
    
    if (user.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(user.is_active);
    }
    
    if (user.email_verified !== undefined) {
      updates.push(`email_verified = $${paramIndex++}`);
      values.push(user.email_verified);
    }
    
    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // If no fields to update, return the existing user
    if (updates.length === 1) {
      return this.getUserById(id);
    }
    
    // Add the ID parameter
    values.push(id);
    
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    return await azureDb.queryOne<User>(query, values);
  }

  /**
   * Delete a user
   * @param id User ID
   * @returns True if deleted, false otherwise
   */
  async deleteUser(id: string): Promise<boolean> {
    const query = `
      DELETE FROM users
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await azureDb.queryOne<{ id: string }>(query, [id]);
    return !!result;
  }

  /**
   * Deactivate a user
   * @param id User ID
   * @returns Updated user
   */
  async deactivateUser(id: string): Promise<User | null> {
    return this.updateUser(id, { is_active: false });
  }

  /**
   * Activate a user
   * @param id User ID
   * @returns Updated user
   */
  async activateUser(id: string): Promise<User | null> {
    return this.updateUser(id, { is_active: true });
  }

  /**
   * Verify a user's email
   * @param id User ID
   * @returns Updated user
   */
  async verifyUserEmail(id: string): Promise<User | null> {
    return this.updateUser(id, { email_verified: true });
  }
}
