import { PostgrestError } from '@supabase/supabase-js';
import { connectionManager } from './supabase';

/**
 * Database operation result interface
 */
export interface DbResult<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
}

/**
 * Fetch a single record by ID
 * @param table Table name
 * @param id Record ID
 * @returns Database operation result
 */
export async function fetchById<T>(table: string, id: string): Promise<DbResult<T>> {
  try {
    const result = await connectionManager.executeWithRetry(async (client) => {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as T;
    });
    
    return {
      data: result,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }
}

/**
 * Fetch multiple records with optional filters
 * @param table Table name
 * @param options Query options
 * @returns Database operation result
 */
export async function fetchMany<T>(
  table: string,
  options: {
    filters?: Record<string, any>;
    limit?: number;
    offset?: number;
    orderBy?: { column: string; ascending?: boolean };
  } = {}
): Promise<DbResult<T[]>> {
  try {
    const result = await connectionManager.executeWithRetry(async (client) => {
      let query = client.from(table).select('*');
      
      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Apply ordering
      if (options.orderBy) {
        query = query.order(
          options.orderBy.column,
          { ascending: options.orderBy.ascending ?? true }
        );
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as T[];
    });
    
    return {
      data: result,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }
}

/**
 * Insert a new record
 * @param table Table name
 * @param data Record data
 * @returns Database operation result
 */
export async function insert<T, U>(table: string, data: U): Promise<DbResult<T>> {
  try {
    const result = await connectionManager.executeWithRetry(async (client) => {
      const { data: insertedData, error } = await client
        .from(table)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return insertedData as T;
    });
    
    return {
      data: result,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }
}

/**
 * Update an existing record
 * @param table Table name
 * @param id Record ID
 * @param data Record data
 * @returns Database operation result
 */
export async function update<T, U>(table: string, id: string, data: U): Promise<DbResult<T>> {
  try {
    const result = await connectionManager.executeWithRetry(async (client) => {
      const { data: updatedData, error } = await client
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData as T;
    });
    
    return {
      data: result,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }
}

/**
 * Delete a record
 * @param table Table name
 * @param id Record ID
 * @returns Database operation result
 */
export async function remove(table: string, id: string): Promise<DbResult<null>> {
  try {
    await connectionManager.executeWithRetry(async (client) => {
      const { error } = await client
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return null;
    });
    
    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }
}

/**
 * Execute a custom query
 * @param queryFn Function that executes the custom query
 * @returns Database operation result
 */
export async function executeCustomQuery<T>(
  queryFn: (client: typeof connectionManager.getClient) => Promise<T>
): Promise<DbResult<T>> {
  try {
    const result = await connectionManager.executeWithRetry(async (client) => {
      return await queryFn(client);
    });
    
    return {
      data: result,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }
}

/**
 * Check if a PostgrestError is a foreign key violation
 * @param error Error to check
 * @returns Whether the error is a foreign key violation
 */
export function isForeignKeyViolation(error: PostgrestError): boolean {
  return error.code === '23503';
}

/**
 * Check if a PostgrestError is a unique constraint violation
 * @param error Error to check
 * @returns Whether the error is a unique constraint violation
 */
export function isUniqueConstraintViolation(error: PostgrestError): boolean {
  return error.code === '23505';
}

/**
 * Check if a PostgrestError is a check constraint violation
 * @param error Error to check
 * @returns Whether the error is a check constraint violation
 */
export function isCheckConstraintViolation(error: PostgrestError): boolean {
  return error.code === '23514';
}

/**
 * Check if a PostgrestError is a not null violation
 * @param error Error to check
 * @returns Whether the error is a not null violation
 */
export function isNotNullViolation(error: PostgrestError): boolean {
  return error.code === '23502';
}
