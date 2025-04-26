import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name?: string;
  department?: string;
  role?: string;
}

/**
 * Fetches users from the database
 * @returns Array of users
 */
export async function getUsers(): Promise<{ data: User[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return { data: [], error: error.message };
    }
    
    return { data: data as User[], error: null };
  } catch (err) {
    console.error('Exception fetching users:', err);
    return { 
      data: [], 
      error: err instanceof Error ? err.message : 'Unknown error fetching users' 
    };
  }
}

/**
 * Gets user departments for filtering
 * @returns Array of unique department names
 */
export async function getUserDepartments(): Promise<{ data: string[]; error: string | null }> {
  try {
    const { data: users, error } = await getUsers();
    
    if (error) {
      return { data: [], error };
    }
    
    // Extract unique departments
    const departments = Array.from(
      new Set(
        users
          .map(user => user.department)
          .filter(Boolean) as string[]
      )
    );
    
    return { data: departments, error: null };
  } catch (err) {
    console.error('Exception getting user departments:', err);
    return { 
      data: [], 
      error: err instanceof Error ? err.message : 'Unknown error getting user departments' 
    };
  }
}
