import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { loginSchema } from '@/lib/schemas/auth';
import { ZodError } from 'zod';

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Authenticate a user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User authenticated successfully
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
 *       401:
 *         description: Authentication failed
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
    const validatedData = loginSchema.parse(body);

    // Attempt to login
    const authResponse = await login({
      email: validatedData.email,
      password: validatedData.password,
      rememberMe: validatedData.rememberMe,
    });

    // Return successful response
    return NextResponse.json({
      user: authResponse.user,
      token: authResponse.token,
      expiresAt: authResponse.expiresAt,
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.format() },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error) {
      const statusCode = error.name === 'AuthError' ? 401 : 500;
      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
