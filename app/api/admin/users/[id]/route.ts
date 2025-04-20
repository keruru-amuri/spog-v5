import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { UserRole } from '@/types/user';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Access the id directly in the code without assigning to a variable first
    if (!params?.id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create a Supabase server client (with the service key)
    const supabase = createServerClient();

    // Parse the request body
    const { role, is_active } = await request.json();

    // Prepare update data
    const updateData: Record<string, any> = {};

    // Only include fields that are provided
    if (role !== undefined) {
      updateData.role = role as UserRole;
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update the user
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
