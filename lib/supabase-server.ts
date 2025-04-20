import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { DB_CONFIG } from './config';

/**
 * Creates a Supabase client with the service key for server-side operations
 * This client has admin privileges and should only be used in server-side code
 */
export function createServerClient() {
  return createClient<Database>(
    DB_CONFIG.supabaseUrl,
    process.env.SUPABASE_SERVICE_KEY || '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
