'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { 
  showToast, 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast, 
  showApiErrorToast,
  ToastType,
  ToastOptions
} from '@/utils/toast-utils'
import { useToast } from '@/hooks/use-toast'

// Define the shape of the toast context
interface ToastContextType {
  // Toast functions
  showToast: (type: ToastType, options?: ToastOptions) => void
  showSuccessToast: (options?: Omit<ToastOptions, 'variant'>) => void
  showErrorToast: (options?: Omit<ToastOptions, 'variant'>) => void
  showWarningToast: (options?: Omit<ToastOptions, 'variant'>) => void
  showInfoToast: (options?: Omit<ToastOptions, 'variant'>) => void
  showApiErrorToast: (error: unknown, fallbackMessage?: string) => void
}

// Create the toast context with default values
const ToastContext = createContext<ToastContextType>({
  // Default implementations that will be overridden by the provider
  showToast: () => {},
  showSuccessToast: () => {},
  showErrorToast: () => {},
  showWarningToast: () => {},
  showInfoToast: () => {},
  showApiErrorToast: () => {},
})

// Props for the ToastProvider component
interface ToastProviderProps {
  children: ReactNode
}

// Create the ToastProvider component
export function ToastProvider({ children }: ToastProviderProps) {
  // Get the toast function from the useToast hook
  const { toast } = useToast()

  // Create the context value
  const contextValue: ToastContextType = {
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    showApiErrorToast,
  }

  // Provide the context to children
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}

// Custom hook to use the toast context
export function useToastContext() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }

  return context
}

// Export the context for advanced use cases
export default ToastContext
