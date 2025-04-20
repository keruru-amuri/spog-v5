import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Log out the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Logout the user
    await logout();
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    
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
