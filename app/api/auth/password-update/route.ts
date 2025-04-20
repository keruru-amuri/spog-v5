import { NextRequest, NextResponse } from 'next/server';
import { updatePassword } from '@/lib/auth';
import { passwordUpdateSchema } from '@/lib/schemas/auth';
import { ZodError } from 'zod';

/**
 * POST /api/auth/password-update
 * Update a user's password
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = passwordUpdateSchema.parse(body);
    
    // Update password
    await updatePassword({
      token: validatedData.token,
      password: validatedData.password,
    });
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    }, { status: 200 });
  } catch (error) {
    console.error('Password update error:', error);
    
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.format() },
        { status: 400 }
      );
    }
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.name === 'AuthError') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    // Handle unknown errors
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
