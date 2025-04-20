import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/auth';
import { registerSchema } from '@/lib/schemas/auth';
import { ZodError } from 'zod';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
