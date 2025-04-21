import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { ToastProvider, useToastContext } from '@/contexts/ToastContext';

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the toast utilities to prevent actual calls
jest.mock('@/utils/toast-utils', () => ({
  showToast: jest.fn(),
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
  showWarningToast: jest.fn(),
  showInfoToast: jest.fn(),
  showApiErrorToast: jest.fn(),
}));

// Test component that captures the context value
function TestComponent({ callback }: { callback: (context: any) => void }) {
  const context = useToastContext();
  callback(context);
  return <div>Test Component</div>;
}

describe('ToastContext', () => {
  it('provides all required toast functions', () => {
    // Create a mock callback function
    const contextCallback = jest.fn();

    // Render the component with the callback
    render(
      <ToastProvider>
        <TestComponent callback={contextCallback} />
      </ToastProvider>
    );

    // Get the context value from the callback
    const contextValue = contextCallback.mock.calls[0][0];

    // Check that all expected functions are provided
    expect(contextValue).toHaveProperty('showToast');
    expect(contextValue).toHaveProperty('showSuccessToast');
    expect(contextValue).toHaveProperty('showErrorToast');
    expect(contextValue).toHaveProperty('showWarningToast');
    expect(contextValue).toHaveProperty('showInfoToast');
    expect(contextValue).toHaveProperty('showApiErrorToast');

    // Check that all functions are actually functions
    expect(typeof contextValue.showToast).toBe('function');
    expect(typeof contextValue.showSuccessToast).toBe('function');
    expect(typeof contextValue.showErrorToast).toBe('function');
    expect(typeof contextValue.showWarningToast).toBe('function');
    expect(typeof contextValue.showInfoToast).toBe('function');
    expect(typeof contextValue.showApiErrorToast).toBe('function');
  });
});
