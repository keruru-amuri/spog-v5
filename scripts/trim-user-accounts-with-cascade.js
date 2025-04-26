// Script to trim user accounts, keeping only specified accounts
// This script uses the Supabase JS client with service role key
// It handles foreign key constraints by deleting related records first

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// List of email addresses to keep
const EMAILS_TO_KEEP = [
  'administrator@spog-inventory.com',
  'test.user3@spog-inventory.com',
  'test.user4@spog-inventory.com'
];

async function trimUserAccounts() {
  console.log('Starting user account trimming with cascade delete...');

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
    // Get all users
    console.log('Fetching all users...');
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    console.log(`Found ${allUsers.length} total users`);
    
    // Filter users to delete (those not in the keep list)
    const usersToDelete = allUsers.filter(user => !EMAILS_TO_KEEP.includes(user.email));
    console.log(`Will delete ${usersToDelete.length} users and keep ${EMAILS_TO_KEEP.length} users`);
    
    // Log users to keep for verification
    console.log('Users to keep:');
    allUsers
      .filter(user => EMAILS_TO_KEEP.includes(user.email))
      .forEach(user => console.log(`- ${user.email} (${user.role})`));
    
    // Log users to delete for verification
    console.log('Users to delete:');
    usersToDelete.forEach(user => console.log(`- ${user.email} (${user.role})`));
    
    // Confirm before proceeding
    console.log('\nPROCEEDING WITH DELETION IN 5 SECONDS...');
    console.log('Press Ctrl+C to abort if the above lists are incorrect');
    
    // Wait 5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete users one by one
    console.log('\nDeleting users...');
    
    for (const user of usersToDelete) {
      console.log(`Processing user ${user.email}...`);
      
      // First delete related consumption records
      console.log(`- Deleting consumption records for user ${user.email}...`);
      const { error: deleteConsumptionError } = await supabase
        .from('consumption_records')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteConsumptionError) {
        console.error(`  Error deleting consumption records for user ${user.email}:`, deleteConsumptionError);
        // Continue anyway, as there might not be any consumption records
      } else {
        console.log(`  Successfully deleted consumption records for user ${user.email}`);
      }
      
      // Delete from the users table
      console.log(`- Deleting user ${user.email} from users table...`);
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (deleteUserError) {
        console.error(`  Error deleting user ${user.email} from users table:`, deleteUserError);
        continue; // Skip auth deletion if we couldn't delete from users table
      } else {
        console.log(`  Successfully deleted user ${user.email} from users table`);
      }
      
      // Try to delete from auth.users (might fail if user doesn't exist in auth)
      try {
        console.log(`- Deleting user ${user.email} from auth...`);
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteAuthError) {
          console.error(`  Error deleting user ${user.email} from auth:`, deleteAuthError);
          // Continue anyway, as we've already deleted from the users table
        } else {
          console.log(`  Successfully deleted user ${user.email} from auth`);
        }
      } catch (authError) {
        console.error(`  Error deleting user ${user.email} from auth:`, authError);
        // Continue anyway, as we've already deleted from the users table
      }
      
      console.log(`Completed processing user ${user.email}`);
    }
    
    // Verify final user count
    const { data: remainingUsers, error: verifyError } = await supabase
      .from('users')
      .select('*');
      
    if (verifyError) {
      console.error('Error verifying remaining users:', verifyError);
      return;
    }
    
    console.log(`\nDeletion complete. ${remainingUsers.length} users remain in the database.`);
    remainingUsers.forEach(user => console.log(`- ${user.email} (${user.role})`));
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

trimUserAccounts();
