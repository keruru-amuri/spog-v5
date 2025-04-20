import { supabase } from '../lib/supabase';

/**
 * Script to update a user's role
 * 
 * This script updates a user's role based on their email address.
 * 
 * Run this script with:
 * npx ts-node scripts/update-user-role.ts <email> <role>
 * 
 * Example:
 * npx ts-node scripts/update-user-role.ts user@example.com admin
 */

async function updateUserRole(email: string, role: 'admin' | 'manager' | 'user') {
  try {
    console.log(`Updating user ${email} to role: ${role}`);
    
    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (findError) {
      console.error(`Error finding user ${email}:`, findError);
      return;
    }
    
    if (!existingUser) {
      console.error(`User ${email} not found`);
      return;
    }
    
    // Update the user's role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', existingUser.id);
    
    if (updateError) {
      console.error(`Error updating role for user ${email}:`, updateError);
      return;
    }
    
    console.log(`Successfully updated user ${email} to role: ${role}`);
  } catch (error) {
    console.error(`Unexpected error updating user ${email}:`, error);
  }
}

async function main() {
  const email = process.argv[2];
  const role = process.argv[3] as 'admin' | 'manager' | 'user';
  
  if (!email || !role) {
    console.error('Usage: npx ts-node scripts/update-user-role.ts <email> <role>');
    console.error('Roles: admin, manager, user');
    process.exit(1);
  }
  
  if (!['admin', 'manager', 'user'].includes(role)) {
    console.error('Invalid role. Must be one of: admin, manager, user');
    process.exit(1);
  }
  
  await updateUserRole(email, role);
}

main().catch(console.error);
