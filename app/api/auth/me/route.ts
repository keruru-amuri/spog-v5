import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { UserRepository } from '@/repositories/user-repository';

// Create repository instance
const userRepository = new UserRepository();

/**
 * GET /api/auth/me
 * Get the current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // Create a Supabase server client
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the user's profile from the database
    const userProfile = await userRepository.findById(user.id);
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is active
    if (!userProfile.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Return the user profile
    return NextResponse.json({
      user: {
        id: userProfile.id,
        email: user.email,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        department: userProfile.department,
        role: userProfile.role,
        is_active: userProfile.is_active,
        created_at: userProfile.created_at,
        updated_at: userProfile.updated_at,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    
    // Handle errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Handle unknown errors
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
