// Script to create an admin user directly in Supabase
// This script uses the Supabase JS client with service role key

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createAdminUser() {
  console.log('Starting admin user creation...');

  // Create Supabase client with service role key
  const supabaseUrl = 'https://klckbtedkpgqdydjpwwc.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsY2tidGVka3BncWR5ZGpwd3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMzc3MDQ3NywiZXhwIjoyMDI5MzQ2NDc3fQ.Iy-kW-bHhQnQQQMQKvJvH9kTG2HvPYCo4hZJPFqTZ8Y';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  console.log('Supabase URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // First, create the auth user
    console.log('Creating auth user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'administrator@spog-inventory.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'SPOG',
        last_name: 'Administrator',
        role: 'admin',
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created:', authUser);

    // Then, create the user profile in the users table
    console.log('Creating user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: 'administrator@spog-inventory.com',
        first_name: 'SPOG',
        last_name: 'Administrator',
        role: 'admin',
        department: 'Administration',
        is_active: true,
        email_verified: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return;
    }

    console.log('User profile created:', profileData);
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();
