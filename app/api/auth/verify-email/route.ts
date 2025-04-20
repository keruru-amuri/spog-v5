import { NextRequest, NextResponse } from 'next/server';
import { sendEmailVerification } from '@/lib/auth';
import { z } from 'zod';

// Email verification schema
const emailVerificationSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
});

/**
 * POST /api/auth/verify-email
 * Send email verification
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = emailVerificationSchema.parse(body);
    
    // Send email verification
    await sendEmailVerification(validatedData.email);
    
    // Return successful response
    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    }, { status: 200 });
  } catch (error) {
    console.error('Email verification error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
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
