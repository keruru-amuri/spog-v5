/**
 * Base repository interface
 * Defines common operations for all repositories
 */
export interface BaseRepository<T, TInsert, TUpdate> {
  /**
   * Find a record by ID
   * @param id Record ID
   * @returns Promise resolving to the record or null if not found
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Find all records
   * @param options Query options
   * @returns Promise resolving to an array of records
   */
  findAll(options?: QueryOptions): Promise<T[]>;
  
  /**
   * Find records by a filter
   * @param filter Filter criteria
   * @param options Query options
   * @returns Promise resolving to an array of records
   */
  findBy(filter: Record<string, any>, options?: QueryOptions): Promise<T[]>;
  
  /**
   * Create a new record
   * @param data Record data
   * @returns Promise resolving to the created record
   */
  create(data: TInsert): Promise<T>;
  
  /**
   * Update an existing record
   * @param id Record ID
   * @param data Record data
   * @returns Promise resolving to the updated record
   */
  update(id: string, data: TUpdate): Promise<T>;
  
  /**
   * Delete a record
   * @param id Record ID
   * @returns Promise resolving to true if the record was deleted, false otherwise
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Count records
   * @param filter Filter criteria
   * @returns Promise resolving to the count
   */
  count(filter?: Record<string, any>): Promise<number>;
}

/**
 * Query options interface
 */
export interface QueryOptions {
  /**
   * Maximum number of records to return
   */
  limit?: number;
  
  /**
   * Number of records to skip
   */
  offset?: number;
  
  /**
   * Order by column and direction
   */
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}
