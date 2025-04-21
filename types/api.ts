/**
 * Generic API response type
 */
export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  error?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
