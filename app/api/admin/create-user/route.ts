import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/create-user
 * Create a new user with admin privileges
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received admin user creation request with body:', body);

    // Validate required fields
    if (!body.email || !body.password || !body.first_name || !body.last_name || !body.role) {
      console.log('Missing required fields:', {
        email: !!body.email,
        password: !!body.password,
        first_name: !!body.first_name,
        last_name: !!body.last_name,
        role: !!body.role
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create direct Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('Creating direct Supabase client with service role key');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // First, create the auth user
    console.log('Creating auth user...');

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: body.email_verified !== undefined ? body.email_verified : false,
      user_metadata: {
        first_name: body.first_name,
        last_name: body.last_name,
        role: body.role,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create auth user' },
        { status: 500 }
      );
    }

    if (!authUser || !authUser.user) {
      console.error('Auth user data is missing');
      return NextResponse.json(
        { error: 'Failed to create auth user - no user data returned' },
        { status: 500 }
      );
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Check if a user with this ID already exists in the users table
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    let data;
    let error;

    if (existingUser) {
      console.log('User already exists in users table, updating instead of inserting');
      // Update the existing user
      const result = await supabaseAdmin
        .from('users')
        .update({
          email: body.email,
          first_name: body.first_name,
          last_name: body.last_name,
          role: body.role,
          department: body.department || null,
          is_active: body.is_active !== undefined ? body.is_active : true,
          email_verified: body.email_verified !== undefined ? body.email_verified : false
        })
        .eq('id', authUser.user.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Create a new user in the users table
      const result = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          email: body.email,
          password_hash: 'managed-by-supabase-auth', // Dummy value since auth is handled by Supabase Auth
          first_name: body.first_name,
          last_name: body.last_name,
          role: body.role,
          department: body.department || null,
          is_active: body.is_active !== undefined ? body.is_active : true,
          email_verified: body.email_verified !== undefined ? body.email_verified : false
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error creating user profile:', error);
      return NextResponse.json(
        { error: `Failed to create user profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Error in admin create-user API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
