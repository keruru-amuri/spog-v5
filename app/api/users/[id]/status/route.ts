import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth-server';

/**
 * PATCH /api/users/[id]/status
 * Update a user's status (activate/deactivate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Validate required fields
    if (body.is_active === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: is_active' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client
    const supabaseServerClient = createServerClient();

    // Update the user's status
    const { data, error } = await supabaseServerClient
      .from('users')
      .update({
        is_active: body.is_active
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating user status ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to update user status' },
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
