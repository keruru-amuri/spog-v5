import { createClient } from '@supabase/supabase-js';

/**
 * Create a server-side Supabase client with admin privileges
 * This client bypasses RLS policies and should only be used in server-side code
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    throw new Error('Missing Supabase environment variables');
  }

  console.log('Creating server client with URL:', supabaseUrl);

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if a user has a specific permission (server-side implementation)
 * @param userId User ID
 * @param permission Permission to check
 * @returns Whether the user has the permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    // Create a server client
    const supabase = createServerClient();

    // Get the user's role from the database
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error getting user role:', error);
      return false;
    }

    // Import the role permissions mapping
    const { ROLE_PERMISSIONS } = await import('@/types/user');

    // Check if the user's role has the required permission
    const userRole = data.role;
    const permissions = ROLE_PERMISSIONS[userRole];

    if (!permissions) {
      console.error('Invalid user role:', userRole);
      return false;
    }

    return permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}
