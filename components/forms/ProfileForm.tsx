'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema, ProfileUpdateFormValues } from '@/lib/schemas/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserProfile } from '@/types/user';

interface ProfileFormProps {
  onSuccess?: (user: UserProfile) => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { user, updateProfile, isLoading } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      department: user?.department || '',
      profileImageUrl: user?.profileImageUrl || '',
    },
  });
  
  const onSubmit = async (data: ProfileUpdateFormValues) => {
    setServerError(null);
    setIsSuccess(false);
    
    try {
      const updatedUser = await updateProfile(data);
      
      if (updatedUser) {
        setIsSuccess(true);
        if (onSuccess) {
          onSuccess(updatedUser);
        }
      } else {
        setServerError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during profile update:', error);
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
            Your profile has been successfully updated.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            {...register('firstName')}
            aria-invalid={errors.firstName ? 'true' : 'false'}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            {...register('lastName')}
            aria-invalid={errors.lastName ? 'true' : 'false'}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            type="text"
            placeholder="Enter your department (optional)"
            {...register('department')}
            aria-invalid={errors.department ? 'true' : 'false'}
          />
          {errors.department && (
            <p className="text-sm text-red-500">{errors.department.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="profileImageUrl">Profile Image URL</Label>
          <Input
            id="profileImageUrl"
            type="text"
            placeholder="Enter profile image URL (optional)"
            {...register('profileImageUrl')}
            aria-invalid={errors.profileImageUrl ? 'true' : 'false'}
          />
          {errors.profileImageUrl && (
            <p className="text-sm text-red-500">{errors.profileImageUrl.message}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </div>
  );
}
