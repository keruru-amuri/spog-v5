import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { UserRole } from '@/types/user';

export async function GET(request: NextRequest) {
  try {
    // Create a Supabase server client (with the service key)
    const supabase = createServerClient();

    // Fetch all users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('role', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: data || [] });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase server client (with the service key)
    const supabase = createServerClient();

    // Parse the request body
    const { email, firstName, lastName, password, role, department } = await request.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        department: department || null,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Wait for the trigger to create the user in the public.users table
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the user's role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: role as UserRole })
      .eq('id', authData.user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Return the created user
    return NextResponse.json({ user: authData.user });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
