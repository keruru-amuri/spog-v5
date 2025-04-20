import { z } from 'zod';

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
  rememberMe: z
    .boolean()
    .optional()
    .default(false),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Registration form schema
 */
export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name must be less than 50 characters' }),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name must be less than 50 characters' }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  department: z
    .string()
    .max(100, { message: 'Department must be less than 100 characters' })
    .optional(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100, { message: 'Password must be less than 100 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
});

export type PasswordResetRequestFormValues = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password update schema
 */
export const passwordUpdateSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100, { message: 'Password must be less than 100 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type PasswordUpdateFormValues = z.infer<typeof passwordUpdateSchema>;

/**
 * Profile update schema
 */
export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name must be less than 50 characters' }),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name must be less than 50 characters' }),
  department: z
    .string()
    .max(100, { message: 'Department must be less than 100 characters' })
    .optional(),
  profileImageUrl: z
    .string()
    .url({ message: 'Profile image URL must be a valid URL' })
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
