/**
 * Check if a user has a specific permission (server-side implementation)
 * @param userId User ID
 * @param permission Permission to check
 * @returns Whether the user has the permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  // This is a mock implementation that always returns true
  return true;
}
