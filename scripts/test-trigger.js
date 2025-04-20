// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

/**
 * Script to test the database trigger for user creation
 * 
 * This script creates a user with the Supabase Auth API and checks if the trigger
 * automatically creates a record in the public.users table.
 * 
 * Run this script with:
 * node scripts/test-trigger.js
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

async function testTrigger() {
  try {
    const email = 'trigger-test@example.com';
    const password = 'Test123!';
    const firstName = 'Trigger';
    const lastName = 'Test';
    const department = 'Testing';

    console.log(`Creating test user: ${email}`);

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

    // Step 2: Wait a moment for the trigger to execute
    console.log('Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Check if the user was added to the public.users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error(`Error checking user in public.users table:`, userError);
      return;
    }

    if (!userData) {
      console.error(`User not found in public.users table. Trigger may not be working.`);
      return;
    }

    console.log('Trigger worked! User found in public.users table:');
    console.log(userData);

    // Step 4: Confirm the user's email
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
    console.error('Unexpected error testing trigger:', error);
  }
}

async function main() {
  await testTrigger();
}

main().catch(console.error);
