import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth-server';

/**
 * GET /api/users/[id]
 * Get a user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Create server-side Supabase client
    const supabaseServerClient = createServerClient();

    // Get the user
    const { data, error } = await supabaseServerClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching user ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update a user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Create server-side Supabase client
    const supabaseServerClient = createServerClient();

    // Update the user
    const { data, error } = await supabaseServerClient
      .from('users')
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        role: body.role,
        department: body.department,
        is_active: body.is_active,
        email_verified: body.email_verified
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating user ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
