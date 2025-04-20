import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';
import { passwordResetRequestSchema } from '@/lib/schemas/auth';
import { ZodError } from 'zod';

/**
 * POST /api/auth/password-reset
 * Request a password reset
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = passwordResetRequestSchema.parse(body);
    
    // Request password reset
    await requestPasswordReset({
      email: validatedData.email,
    });
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: 'Password reset email sent',
    }, { status: 200 });
  } catch (error) {
    console.error('Password reset request error:', error);
    
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
