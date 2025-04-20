import { supabase } from './supabase';
import {
  UserProfile,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  ProfileUpdateRequest,
  AuthResponse,
  UserRole,
  ROLE_PERMISSIONS
} from '../types/user';

/**
 * Authentication error class
 */
export class AuthError extends Error {
  code: string;

  constructor(message: string, code: string = 'unknown_error') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/**
 * Authenticate a user with email and password
 * @param credentials Login credentials
 * @returns Authentication response with user profile and token
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  try {
    // Validate credentials
    if (!credentials.email || !credentials.password) {
      throw new AuthError('Email and password are required', 'invalid_credentials');
    }

    // Authenticate with Supabase Auth
    console.log('Attempting to sign in with:', credentials.email);

    // We can't directly check auth.users table from the client, so we'll skip this step

    // Then try to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    console.log('Auth response:', authData ? 'Success' : 'Failed', authError ? `Error: ${authError.message}` : 'No error');

    // If auth failed, check if the user exists in the public.users table
    if (authError) {
      const { data: publicUser, error: publicUserError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', credentials.email)
        .single();

      console.log('Public user check:', publicUser ? `Found user with ID: ${publicUser.id}` : 'User not found',
                  publicUserError ? `Error: ${publicUserError.message}` : 'No error');
    }

    if (authError) {
      throw new AuthError(authError.message, authError.code);
    }

    if (!authData.user || !authData.session) {
      throw new AuthError('Login failed', 'login_failed');
    }

    // Get user profile from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      throw new AuthError(userError.message, userError.code);
    }

    if (!userData) {
      throw new AuthError('User not found', 'user_not_found');
    }

    // Check if the user is active
    if (!userData.is_active) {
      // Sign out the user since they're deactivated
      await supabase.auth.signOut();
      throw new AuthError('Your account has been deactivated. Please contact an administrator.', 'account_deactivated');
    }

    // Update the last login timestamp
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Return the auth response with user profile and token
    return {
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        fullName: `${userData.first_name} ${userData.last_name}`,
        role: userData.role as UserRole,
        department: userData.department || undefined,
        profileImageUrl: userData.profile_image_url || undefined,
        isActive: userData.is_active,
        emailVerified: userData.email_verified,
        lastLogin: userData.last_login || undefined,
      },
      token: authData.session.access_token,
      expiresAt: new Date(authData.session.expires_at!).toISOString(),
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'Unknown error during login',
      'login_failed'
    );
  }
}

/**
 * Register a new user
 * @param userData User registration data
 * @returns Authentication response with user profile and token
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  try {
    // Validate user data
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      throw new AuthError('All required fields must be provided', 'invalid_data');
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (existingUserError) {
      throw new AuthError(existingUserError.message, existingUserError.code);
    }

    if (existingUser) {
      throw new AuthError('User with this email already exists', 'email_already_exists');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          department: userData.department || null,
        },
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-email`,
      },
    });

    if (authError) {
      throw new AuthError(authError.message, authError.code);
    }

    if (!authData.user) {
      throw new AuthError('User registration failed', 'registration_failed');
    }

    // The database trigger will automatically create a user profile in the public.users table
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify that the user was created in the public.users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userRecord) {
      // If there was an error or the user wasn't created, delete the auth user
      console.error('Error verifying user creation in public.users table:', userError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new AuthError('Failed to create user profile', 'user_creation_failed');
    }

    // Return the auth response
    return {
      user: {
        id: authData.user.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: `${userData.firstName} ${userData.lastName}`,
        role: 'user',
        department: userData.department,
        isActive: true,
        emailVerified: false,
        lastLogin: new Date().toISOString(),
      },
      token: authData.session?.access_token || '',
      expiresAt: authData.session ? new Date(authData.session.expires_at!).toISOString() :
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'Unknown error during registration',
      'registration_failed'
    );
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new AuthError(error.message, error.code);
    }

    return;
  } catch (error) {
    console.error('Logout error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'Unknown error during logout',
      'logout_failed'
    );
  }
}

/**
 * Request a password reset
 * @param request Password reset request
 */
export async function requestPasswordReset(request: PasswordResetRequest): Promise<void> {
  try {
    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
    });

    if (error) {
      throw new AuthError(error.message, error.code);
    }

    return;
  } catch (error) {
    console.error('Password reset request error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'Unknown error requesting password reset',
      'password_reset_failed'
    );
  }
}

/**
 * Update password with reset token
 * @param request Password update request
 */
export async function updatePassword(request: PasswordUpdateRequest): Promise<void> {
  try {
    // Update password via Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: request.password,
    });

    if (error) {
      throw new AuthError(error.message, error.code);
    }

    return;
  } catch (error) {
    console.error('Password update error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'Unknown error updating password',
      'password_update_failed'
    );
  }
}

/**
 * Get user profile by ID
 * @param userId User ID
 * @returns User profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    // Get user from the database
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AuthError(error.message, error.code);
    }

    if (!userData) {
      throw new AuthError('User not found', 'user_not_found');
    }

    // Return the user profile
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      fullName: `${userData.first_name} ${userData.last_name}`,
      role: userData.role as UserRole,
      department: userData.department || undefined,
      profileImageUrl: userData.profile_image_url || undefined,
      isActive: userData.is_active,
      emailVerified: userData.email_verified,
      lastLogin: userData.last_login || undefined,
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'Unknown error getting user profile',
      'get_profile_failed'
    );
  }
}

/**
 * Check if a user has a specific permission
 * @param userRole User role
 * @param permission Permission to check
 * @returns Whether the user has the permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Get all permissions for a user role
 * @param userRole User role
 * @returns Array of permissions
 */
export function getPermissionsForRole(userRole: UserRole): string[] {
  return ROLE_PERMISSIONS[userRole];
}

/**
 * Verify a JWT token
 * @param token JWT token
 * @returns Whether the token is valid
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    // Verify the token with Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Token verification error:', error);
      return false;
    }

    return !!data.user;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * Get the current user session
 * @returns The current session or null if not logged in
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new AuthError(error.message, error.code);
    }

    return data.session;
  } catch (error) {
    console.error('Get current session error:', error);
    return null;
  }
}

/**
 * Get the current user
 * @returns The current user profile or null if not logged in
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    // Get the current session
    const session = await getCurrentSession();

    if (!session) {
      return null;
    }

    // Get the user profile
    const userProfile = await getUserProfile(session.user.id);

    // Check if the user is active
    if (!userProfile.isActive) {
      // Sign out the user since they're deactivated
      await supabase.auth.signOut();
      return null;
    }

    return userProfile;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Send email verification
 * @param email Email to verify
 */
export async function sendEmailVerification(email: string): Promise<void> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-email`,
      },
    });

    if (error) {
      throw new AuthError(error.message, error.code);
    }
  } catch (error) {
    console.error('Send email verification error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'Unknown error sending verification email',
      'verification_email_failed'
    );
  }
}

/**
 * Update user profile
 * @param userId User ID
 * @param profileData Profile data to update
 * @returns Updated user profile
 */
export async function updateUserProfile(userId: string, profileData: ProfileUpdateRequest): Promise<UserProfile> {
  try {
    // Validate user ID
    if (!userId) {
      throw new AuthError('User ID is required', 'invalid_user_id');
    }

    // Check if user exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingUserError) {
      throw new AuthError(existingUserError.message, existingUserError.code);
    }

    if (!existingUser) {
      throw new AuthError('User not found', 'user_not_found');
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    if (profileData.firstName !== undefined) {
      updateData.first_name = profileData.firstName;
    }

    if (profileData.lastName !== undefined) {
      updateData.last_name = profileData.lastName;
    }

    if (profileData.department !== undefined) {
      updateData.department = profileData.department;
    }

    if (profileData.profileImageUrl !== undefined) {
      updateData.profile_image_url = profileData.profileImageUrl;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update user in the database
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      throw new AuthError(updateError.message, updateError.code);
    }

    // Get the updated user profile
    return await getUserProfile(userId);
  } catch (error) {
    console.error('Update user profile error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      error instanceof Error ? error.message : 'Unknown error updating user profile',
      'update_profile_failed'
    );
  }
}
