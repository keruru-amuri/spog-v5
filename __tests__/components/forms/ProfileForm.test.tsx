import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileForm } from '@/components/forms/ProfileForm';

// Mock useAuth hook
const mockUpdateProfile = vi.fn().mockResolvedValue({
  id: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  fullName: 'John Doe',
  role: 'user',
  department: 'IT',
  isActive: true,
  emailVerified: true,
});

const mockUseAuth = vi.fn().mockReturnValue({
  user: {
    id: '123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    fullName: 'John Doe',
    role: 'user',
    department: 'IT',
    isActive: true,
    emailVerified: true,
  },
  updateProfile: mockUpdateProfile,
  isLoading: false,
  error: null,
});

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the profile form with user data', () => {
    render(<ProfileForm />);

    expect(screen.getByLabelText('First Name')).toHaveValue('John');
    expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
    expect(screen.getByLabelText('Department')).toHaveValue('IT');
  });

  it('submits the form with valid data', async () => {
    mockUpdateProfile.mockClear();

    render(<ProfileForm />);

    const user = userEvent.setup();
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const departmentInput = screen.getByLabelText('Department');
    const submitButton = screen.getByRole('button', { name: /update profile/i });

    // Update form values
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'Smith');
    await user.clear(departmentInput);
    await user.type(departmentInput, 'HR');

    // Submit the form
    await user.click(submitButton);

    // Check if updateProfile was called with the correct data
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        department: 'HR',
        profileImageUrl: '',
      });
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Your profile has been successfully updated.')).toBeInTheDocument();
    });
  });

  it('handles errors from the API', async () => {
    mockUpdateProfile.mockClear();
    mockUpdateProfile.mockResolvedValue(null);

    render(<ProfileForm />);

    const user = userEvent.setup();
    const firstNameInput = screen.getByLabelText('First Name');
    const submitButton = screen.getByRole('button', { name: /update profile/i });

    // Update form values
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    // Submit the form
    await user.click(submitButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback when profile is updated successfully', async () => {
    const onSuccess = vi.fn();
    mockUpdateProfile.mockClear();
    mockUpdateProfile.mockResolvedValue({
      id: '123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      role: 'user',
      department: 'IT',
      isActive: true,
      emailVerified: true,
    });

    render(<ProfileForm onSuccess={onSuccess} />);

    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /update profile/i });

    // Submit the form
    await user.click(submitButton);

    // Check if updateProfile was called
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Your profile has been successfully updated.')).toBeInTheDocument();
    });

    // Check if onSuccess was called
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
