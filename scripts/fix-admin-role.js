// Script to fix the administrator user role directly in Supabase
// This script uses the Supabase JS client with service role key

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function fixAdminRole() {
  console.log('Starting admin role fix...');

  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

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
    // Directly update the user's role in the users table
    console.log('Updating user role to admin...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'administrator@spog-inventory.com')
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return;
    }

    console.log('User role updated successfully:', updateData);

    // Get the user's ID
    const userId = updateData.id;

    // Update the user metadata in auth.users
    console.log('Updating user metadata...');
    const { data: authUpdateData, error: authUpdateError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { role: 'admin' } }
    );

    if (authUpdateError) {
      console.error('Error updating user metadata:', authUpdateError);
      return;
    }

    console.log('User metadata updated successfully:', authUpdateData);
    console.log('Administrator role fixed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixAdminRole();
