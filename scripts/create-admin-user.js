// Script to create an admin user in Supabase
// This script uses the server-side API to bypass RLS policies

async function createAdminUser() {
  console.log('Starting admin user creation...');
  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'administrator@spog-inventory.com',
        first_name: 'SPOG',
        last_name: 'Administrator',
        role: 'admin',
        department: 'Administration',
        is_active: true,
        email_verified: true
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      console.log('Admin user created successfully:', data.user);
    } else {
      console.error('Failed to create admin user:', data.error);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
