# Toast Notification System

This document describes the toast notification system implemented in the SPOG Inventory Management application.

## Overview

The toast notification system provides a consistent way to display feedback to users about their actions. It supports different types of notifications:

- **Success**: For successful operations
- **Error**: For errors and failures
- **Warning**: For potential issues or warnings
- **Info**: For general information

## Components

The toast notification system consists of the following components:

1. **Toast UI Components**: Located in `components/ui/toast.tsx` and `components/ui/toaster.tsx`
2. **Toast Hook**: Located in `hooks/use-toast.ts`
3. **Toast Utilities**: Located in `utils/toast-utils.ts`
4. **Toast Context**: Located in `contexts/ToastContext.tsx`

## Usage

### Basic Usage

The simplest way to use toast notifications is through the `useToastContext` hook:

```tsx
import { useToastContext } from '@/contexts/ToastContext';

function MyComponent() {
  const { showSuccessToast, showErrorToast } = useToastContext();

  const handleSave = async () => {
    try {
      // Save data
      showSuccessToast({
        description: 'Data saved successfully',
      });
    } catch (error) {
      showErrorToast({
        description: 'Failed to save data',
      });
    }
  };

  return (
    <button onClick={handleSave}>Save</button>
  );
}
```

### Available Toast Functions

The toast context provides the following functions:

- `showToast(type, options)`: Show a toast with a specific type
- `showSuccessToast(options)`: Show a success toast
- `showErrorToast(options)`: Show an error toast
- `showWarningToast(options)`: Show a warning toast
- `showInfoToast(options)`: Show an info toast
- `showApiErrorToast(error, fallbackMessage)`: Show an error toast for API errors

### Toast Options

All toast functions accept an options object with the following properties:

```typescript
interface ToastOptions {
  title?: string;        // Toast title (defaults based on type)
  description?: string;  // Toast description
  duration?: number;     // Duration in milliseconds (defaults based on type)
  action?: React.ReactNode; // Optional action component
}
```

### Default Values

- **Default Titles**:
  - Success: "Success"
  - Error: "Error"
  - Warning: "Warning"
  - Info: "Information"

- **Default Durations**:
  - Success: 3000ms (3 seconds)
  - Error: 5000ms (5 seconds)
  - Warning: 4000ms (4 seconds)
  - Info: 3000ms (3 seconds)

## Examples

### Success Toast

```tsx
showSuccessToast({
  description: 'Item created successfully',
});
```

### Error Toast

```tsx
showErrorToast({
  description: 'Failed to update item',
});
```

### Warning Toast

```tsx
showWarningToast({
  description: 'This action cannot be undone',
});
```

### Info Toast

```tsx
showInfoToast({
  description: 'New features are available',
});
```

### API Error Toast

```tsx
try {
  // API call
} catch (error) {
  showApiErrorToast(error, 'Failed to fetch data');
}
```

### Custom Toast

```tsx
showToast('success', {
  title: 'Custom Title',
  description: 'This is a custom toast message',
  duration: 10000, // 10 seconds
});
```

## Demo

A demo page is available at `/toast-demo` that showcases all toast types and provides usage examples.

## Implementation Details

The toast notification system is built on top of Radix UI's Toast primitive components, which provide accessible and customizable toast notifications. The system is integrated with the application's theme system to ensure consistent styling.

The toast context provider is included in the application's root layout, making toast functions available throughout the application.
