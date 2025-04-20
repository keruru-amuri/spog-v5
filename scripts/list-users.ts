import { supabase } from '../lib/supabase';

/**
 * Script to list all users and their roles
 * 
 * This script retrieves and displays all users from the database.
 * 
 * Run this script with:
 * npx ts-node scripts/list-users.ts
 */

interface UserInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

async function listUsers() {
  try {
    console.log('Retrieving users...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, department, is_active, email_verified, created_at')
      .order('role', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error retrieving users:', error);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('No users found.');
      return;
    }
    
    console.log(`Found ${users.length} users:`);
    console.log('---------------------------------------------------');
    
    // Group users by role
    const usersByRole: Record<string, UserInfo[]> = {};
    
    for (const user of users) {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user as UserInfo);
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
