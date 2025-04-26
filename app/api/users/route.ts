import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerClient } from '@/lib/auth-server';

/**
 * GET /api/users
 * Get all users with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const isActive = searchParams.get('is_active');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const sortBy = searchParams.get('sort_by') || 'role';
    const sortOrder = searchParams.get('sort_order') as 'asc' | 'desc' || 'desc';

    // Create server-side Supabase client
    const supabaseServerClient = createServerClient();
    console.log('Created server client for users API');

    // Start building the query
    let query = supabaseServerClient
      .from('users')
      .select('*', { count: 'exact' });

    console.log('Building query for users API');

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (search) {
      // Search in email, first_name, or last_name fields
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    // Get the count
    const { count, error: countError } = await query;

    if (countError) {
      console.error('Error counting users:', countError);
      return NextResponse.json(
        { error: 'Failed to count users' },
        { status: 500 }
      );
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    console.log('Users fetched successfully:', data?.length, 'users found');

    // Return the users and pagination info
    return NextResponse.json({
      users: data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (offset + limit) < count!
      }
    });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received user creation request with body:', body);

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

    // Create server-side Supabase client
    const supabaseServerClient = createServerClient();

    // Log environment variables (without sensitive values)
    console.log('Environment variables:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    });

    // First, create the auth user
    console.log('Creating auth user with Supabase client...');

    // Create the user with Supabase Auth
    const { data: authUser, error: authError } = await supabaseServerClient.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          role: body.role,
        },
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

    // Then, create the user profile in the users table
    const { data, error } = await supabaseServerClient
      .from('users')
      .insert({
        id: authUser.user.id,
        email: body.email,
        first_name: body.first_name,
        last_name: body.last_name,
        role: body.role,
        department: body.department || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        email_verified: body.email_verified !== undefined ? body.email_verified : false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return NextResponse.json(
        { error: `Failed to create user profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Error in users API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
