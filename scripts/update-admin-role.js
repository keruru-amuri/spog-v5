// Script to update the administrator user role to admin
// This script uses the Supabase JS client with service role key

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function updateAdminRole() {
  console.log('Starting admin role update...');

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
    // First, find the administrator user
    console.log('Finding administrator user...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'administrator@spog-inventory.com')
      .single();

    if (userError) {
      console.error('Error finding administrator user:', userError);
      return;
    }

    if (!userData) {
      console.error('Administrator user not found');
      return;
    }

    console.log('Found administrator user:', userData);
    console.log('Current role:', userData.role);

    // Update the user's role to admin
    console.log('Updating user role to admin...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return;
    }

    console.log('User role updated successfully:', updateData);

    // Also update the user metadata in auth.users
    console.log('Updating user metadata...');
    const { data: authUpdateData, error: authUpdateError } = await supabase.auth.admin.updateUserById(
      userData.id,
      { user_metadata: { role: 'admin' } }
    );

    if (authUpdateError) {
      console.error('Error updating user metadata:', authUpdateError);
      return;
    }

    console.log('User metadata updated successfully:', authUpdateData);
    console.log('Administrator role updated successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateAdminRole();
