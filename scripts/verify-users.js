// Script to verify the remaining users in the database
// This script uses the Supabase JS client with service role key

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verifyUsers() {
  console.log('Verifying remaining users...');

  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Get all users
    console.log('Fetching all users...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    console.log(`Found ${users.length} total users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

verifyUsers();
