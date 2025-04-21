import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { showToast, showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showApiErrorToast } from '@/utils/toast-utils';

// Create a mock function
const mockToast = jest.fn();

// Mock the module
jest.mock('@/hooks/use-toast', () => ({
  toast: mockToast,
  useToast: jest.fn(),
}));

describe('Toast Utilities', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe('showToast', () => {
    it('should call toast with default values for success type', () => {
      showToast('success');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: undefined,
        duration: 3000,
        action: undefined,
        variant: 'default',
      });
    });

    it('should call toast with default values for error type', () => {
      showToast('error');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: undefined,
        duration: 5000,
        action: undefined,
        variant: 'destructive',
      });
    });

    it('should call toast with custom values', () => {
      const action = 'action-button';

      showToast('warning', {
        title: 'Custom Warning',
        description: 'This is a custom warning',
        duration: 10000,
        action,
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Custom Warning',
        description: 'This is a custom warning',
        duration: 10000,
        action,
        variant: 'default',
      });
    });
  });

  describe('showSuccessToast', () => {
    it('should call showToast with success type', () => {
      showSuccessToast({
        description: 'Success message',
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Success message',
        duration: 3000,
        action: undefined,
        variant: 'default',
      });
    });
  });

  describe('showErrorToast', () => {
    it('should call showToast with error type', () => {
      showErrorToast({
        description: 'Error message',
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Error message',
        duration: 5000,
        action: undefined,
        variant: 'destructive',
      });
    });
  });

  describe('showWarningToast', () => {
    it('should call showToast with warning type', () => {
      showWarningToast({
        description: 'Warning message',
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Warning',
        description: 'Warning message',
        duration: 4000,
        action: undefined,
        variant: 'default',
      });
    });
  });

  describe('showInfoToast', () => {
    it('should call showToast with info type', () => {
      showInfoToast({
        description: 'Info message',
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Information',
        description: 'Info message',
        duration: 3000,
        action: undefined,
        variant: 'default',
      });
    });
  });

  describe('showApiErrorToast', () => {
    it('should handle Error objects', () => {
      const error = new Error('API error');
      showApiErrorToast(error);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'API error',
        duration: 5000,
        action: undefined,
        variant: 'destructive',
      });
    });

    it('should handle string errors', () => {
      showApiErrorToast('String error');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'String error',
        duration: 5000,
        action: undefined,
        variant: 'destructive',
      });
    });

    it('should use fallback message for unknown error types', () => {
      showApiErrorToast(null);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'An error occurred',
        duration: 5000,
        action: undefined,
        variant: 'destructive',
      });
    });

    it('should use custom fallback message', () => {
      showApiErrorToast(null, 'Custom fallback message');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Custom fallback message',
        duration: 5000,
        action: undefined,
        variant: 'destructive',
      });
    });
  });
});
