// @ts-check
const { createClient } = require('@supabase/supabase-js');

/**
 * Script to list all users and their roles
 *
 * This script retrieves and displays all users from the database.
 *
 * Run this script with:
 * node scripts/list-users.js
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
 * @typedef {Object} UserInfo
 * @property {string} id
 * @property {string} email
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} role
 * @property {string|null} department
 * @property {boolean} is_active
 * @property {boolean} email_verified
 * @property {string} created_at
 */

async function listUsers() {
  try {
    console.log('Retrieving users...');

    // Log the query we're about to run
    console.log('Running query to get users...');

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, department, is_active, email_verified, created_at')
      .order('role', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error retrieving users:', error);
      return;
    }

    console.log('Query response:', users);

    if (!users || users.length === 0) {
      console.log('No users found.');
      return;
    }

    console.log(`Found ${users.length} users:`);
    console.log('---------------------------------------------------');

    // Group users by role
    /** @type {Record<string, UserInfo[]>} */
    const usersByRole = {};

    for (const user of users) {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(/** @type {UserInfo} */(user));
    }

    // Display users by role
    for (const role of ['admin', 'manager', 'user']) {
      if (usersByRole[role]) {
        console.log(`\n${role.toUpperCase()} USERS (${usersByRole[role].length}):`);
        console.log('---------------------------------------------------');

        for (const user of usersByRole[role]) {
          console.log(`Name: ${user.first_name} ${user.last_name}`);
          console.log(`Email: ${user.email}`);
          console.log(`Department: ${user.department || 'N/A'}`);
          console.log(`Active: ${user.is_active ? 'Yes' : 'No'}`);
          console.log(`Email Verified: ${user.email_verified ? 'Yes' : 'No'}`);
          console.log(`Created: ${new Date(user.created_at).toLocaleString()}`);
          console.log('---------------------------------------------------');
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error listing users:', error);
  }
}

async function main() {
  await listUsers();
}

main().catch(console.error);
