// @ts-check
const { createClient } = require('@supabase/supabase-js');

/**
 * Script to update a user's role
 *
 * This script updates a user's role based on their email address.
 *
 * Run this script with:
 * node scripts/update-user-role.js <email> <role>
 *
 * Example:
 * node scripts/update-user-role.js user@example.com admin
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and key must be set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Update a user's role
 * @param {string} email
 * @param {'admin' | 'manager' | 'user'} role
 */
async function updateUserRole(email, role) {
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
  const role = process.argv[3];

  if (!email || !role) {
    console.error('Usage: node scripts/update-user-role.js <email> <role>');
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
