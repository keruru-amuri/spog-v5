// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

/**
 * Script to create a user using the Supabase Auth API
 *
 * This script creates a user with the Supabase Auth API and then adds the user to the public.users table.
 *
 * Run this script with:
 * node scripts/create-user-auth.js
 */

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use anon key for auth operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and key must be set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser(email, password, firstName, lastName, department, role) {
  try {

    console.log(`Creating user: ${email} (${role})`);

    // Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          department,
        }
      }
    });

    if (authError) {
      console.error(`Error creating auth user ${email}:`, authError);
      return;
    }

    if (!authData.user) {
      console.error(`Failed to create auth user ${email}`);
      return;
    }

    console.log('Auth user created:', authData.user.id);

    // Initialize Supabase client with service key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Create user profile in users table with the specified role
    const { data: userData, error: userError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      password_hash: '', // We don't store the actual password hash, Supabase Auth handles that
      first_name: firstName,
      last_name: lastName,
      role, // Set the role explicitly
      department,
      is_active: true,
      email_verified: true, // Set to true for test users
    }).select();

    if (userError) {
      console.error(`Error creating user profile for ${email}:`, userError);
      return;
    }

    console.log(`Successfully created user: ${email} (${role})`);
    console.log('User data:', userData);

    // Update the user's email_confirmed_at to confirm the email
    const { error: confirmError } = await supabaseAdmin.rpc('confirm_user', {
      user_id: authData.user.id
    });

    if (confirmError) {
      console.error(`Error confirming user ${email}:`, confirmError);
    } else {
      console.log(`Successfully confirmed user: ${email}`);
    }
  } catch (error) {
    console.error('Unexpected error creating user:', error);
  }
}

async function main() {
  // Create admin user
  await createUser('admin@test.com', 'Admin123!', 'Admin', 'User', 'Administration', 'admin');

  // Create manager user
  await createUser('manager@test.com', 'Manager123!', 'Manager', 'User', 'Operations', 'manager');

  // Create regular user
  await createUser('user@test.com', 'User123!', 'Regular', 'User', 'Maintenance', 'user');

  // Create warehouse staff user
  await createUser('warehouse@test.com', 'Warehouse123!', 'Warehouse', 'Staff', 'Warehouse', 'user');

  // Create logistics coordinator user
  await createUser('logistics@test.com', 'Logistics123!', 'Logistics', 'Coordinator', 'Logistics', 'manager');
}

main().catch(console.error);
