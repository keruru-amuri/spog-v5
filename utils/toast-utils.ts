import { toast } from '@/hooks/use-toast';

/**
 * Toast types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast options
 */
export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: React.ReactNode;
}

/**
 * Default toast titles
 */
const DEFAULT_TITLES: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
};

/**
 * Default toast durations
 */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 3000,
  warning: 3000,
  info: 3000,
};

/**
 * Show a toast notification
 * @param type Toast type
 * @param options Toast options
 */
export function showToast(type: ToastType, options: ToastOptions = {}) {
  const {
    title = DEFAULT_TITLES[type],
    description,
    duration = DEFAULT_DURATIONS[type],
    action,
  } = options;

  return toast({
    title,
    description,
    duration,
    action,
    variant: type === 'error' ? 'destructive' :
             type === 'success' ? 'success' :
             type === 'warning' ? 'warning' :
             type === 'info' ? 'info' : 'default',
  });
}

/**
 * Show a success toast
 * @param options Toast options
 */
export function showSuccessToast(options: Omit<ToastOptions, 'variant'> = {}) {
  return showToast('success', options);
}

/**
 * Show an error toast
 * @param options Toast options
 */
export function showErrorToast(options: Omit<ToastOptions, 'variant'> = {}) {
  return showToast('error', options);
}

/**
 * Show a warning toast
 * @param options Toast options
 */
export function showWarningToast(options: Omit<ToastOptions, 'variant'> = {}) {
  return showToast('warning', options);
}

/**
 * Show an info toast
 * @param options Toast options
 */
export function showInfoToast(options: Omit<ToastOptions, 'variant'> = {}) {
  return showToast('info', options);
}

/**
 * Show an API error toast
 * @param error Error object or message
 * @param fallbackMessage Fallback message if error is not a string
 */
export function showApiErrorToast(error: unknown, fallbackMessage = 'An error occurred') {
  const errorMessage = error instanceof Error ? error.message :
                      typeof error === 'string' ? error :
                      fallbackMessage;

  return showErrorToast({
    description: errorMessage,
  });
}
