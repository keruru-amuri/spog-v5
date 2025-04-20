import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/auth';
import { registerSchema } from '@/lib/schemas/auth';
import { ZodError } from 'zod';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    
    // Register the user
    const authResponse = await register({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      department: validatedData.department,
    });
    
    // Return successful response
    return NextResponse.json({
      user: authResponse.user,
      token: authResponse.token,
      expiresAt: authResponse.expiresAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.format() },
        { status: 400 }
      );
    }
    
    // Handle specific registration errors
    if (error instanceof Error) {
      // Check for specific error codes
      if (error.name === 'AuthError') {
        const message = error.message;
        
        // Handle email already exists error
        if (message.includes('already exists')) {
          return NextResponse.json(
            { error: message },
            { status: 409 } // Conflict
          );
        }
        
        // Handle other auth errors
        return NextResponse.json(
          { error: message },
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
