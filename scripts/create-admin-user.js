// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

/**
 * Script to create an admin user using the Supabase Auth API
 * 
 * This script creates a user with the Supabase Auth API and then adds the user to the public.users table.
 * 
 * Run this script with:
 * node scripts/create-admin-user.js
 */

// Initialize Supabase client with anon key for auth operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and anon key must be set in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Supabase admin client with service key for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('Supabase service key must be set in environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    const email = 'admin2@example.com';
    const password = 'Admin123!';
    const firstName = 'Admin';
    const lastName = 'User';
    const department = 'Administration';
    const role = 'admin';

    console.log(`Creating admin user: ${email}`);

    // Step 1: Create the user in Supabase Auth
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

    // Step 2: Add the user to the public.users table
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

    console.log(`Successfully created admin user: ${email}`);
    console.log('User data:', userData);

    // Step 3: Confirm the user's email
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error(`Error confirming user ${email}:`, confirmError);
    } else {
      console.log(`Successfully confirmed user: ${email}`);
    }
  } catch (error) {
    console.error('Unexpected error creating admin user:', error);
  }
}

async function main() {
  await createAdminUser();
}

main().catch(console.error);
