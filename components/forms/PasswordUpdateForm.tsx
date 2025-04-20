'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordUpdateSchema, PasswordUpdateFormValues } from '@/lib/schemas/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordUpdateFormProps {
  token: string;
  onSuccess?: () => void;
}

export function PasswordUpdateForm({ token, onSuccess }: PasswordUpdateFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { updatePassword, isLoading } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordUpdateFormValues>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  const onSubmit = async (data: PasswordUpdateFormValues) => {
    setServerError(null);
    setIsSuccess(false);
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...updateData } = data;
      
      const result = await updatePassword({
        ...updateData,
        token,
      });
      
      if ('error' in result) {
        // Error is already handled in the auth context
        console.error('Password update failed:', result.error);
      } else {
        setIsSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Unexpected error during password update:', error);
      setServerError('An unexpected error occurred. Please try again.');
    }
  };
  
  return (
    <div className="space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      
      {isSuccess && (
        <Alert className="bg-green-50 text-green-800 border-green-300">
          <AlertDescription>
            Your password has been successfully updated. You can now log in with your new password.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter new password"
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            {...register('confirmPassword')}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading || isSuccess}>
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}
