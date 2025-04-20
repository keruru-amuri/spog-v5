import { supabase } from '../lib/supabase';

/**
 * Script to create test users with different roles
 * 
 * This script creates three users with different roles:
 * 1. Admin user
 * 2. Manager user
 * 3. Regular user
 * 
 * Run this script with:
 * npx ts-node scripts/create-test-users.ts
 */

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  department: string;
}

const testUsers: TestUser[] = [
  {
    email: 'admin@example.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    department: 'Administration'
  },
  {
    email: 'manager@example.com',
    password: 'Manager123!',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
    department: 'Operations'
  },
  {
    email: 'user@example.com',
    password: 'User123!',
    firstName: 'Regular',
    lastName: 'User',
    role: 'user',
    department: 'Maintenance'
  },
  {
    email: 'warehouse@example.com',
    password: 'Warehouse123!',
    firstName: 'Warehouse',
    lastName: 'Staff',
    role: 'user',
    department: 'Warehouse'
  },
  {
    email: 'logistics@example.com',
    password: 'Logistics123!',
    firstName: 'Logistics',
    lastName: 'Coordinator',
    role: 'manager',
    department: 'Logistics'
  }
];

async function createTestUser(user: TestUser) {
  try {
    console.log(`Creating user: ${user.email} (${user.role})`);
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();
    
    if (existingUser) {
      console.log(`User ${user.email} already exists, skipping...`);
      return;
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          first_name: user.firstName,
          last_name: user.lastName,
          department: user.department,
        }
      }
    });
    
    if (authError) {
      console.error(`Error creating auth user ${user.email}:`, authError);
      return;
    }
    
    if (!authData.user) {
      console.error(`Failed to create auth user ${user.email}`);
      return;
    }
    
    // Create user profile in users table with the specified role
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: user.email,
      password_hash: '', // We don't store the actual password hash, Supabase Auth handles that
      first_name: user.firstName,
      last_name: user.lastName,
      role: user.role, // Set the role explicitly
      department: user.department,
      is_active: true,
      email_verified: true, // Set to true for test users
    });
    
    if (userError) {
      console.error(`Error creating user profile for ${user.email}:`, userError);
      // Try to delete the auth user if the profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }
    
    console.log(`Successfully created user: ${user.email} (${user.role})`);
  } catch (error) {
    console.error(`Unexpected error creating user ${user.email}:`, error);
  }
}

async function main() {
  console.log('Creating test users...');
  
  for (const user of testUsers) {
    await createTestUser(user);
  }
  
  console.log('Done creating test users.');
}

main().catch(console.error);
