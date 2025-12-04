// components/ui/Button.tsx
// A reusable button component that handles all the common button patterns
// in your application: primary actions, secondary actions, disabled states,
// loading states, and different sizes.

import { ButtonHTMLAttributes, ReactNode } from 'react'

// Define the props that this component accepts.
// We extend ButtonHTMLAttributes so this component accepts all standard
// button props like onClick, type, disabled, etc.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // The content inside the button (text, icons, etc.)
  children: ReactNode

  // Visual variants for different button purposes
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'

  // Size variants for different contexts
  size?: 'sm' | 'md' | 'lg'

  // Loading state - shows spinner and disables interaction
  isLoading?: boolean

  // Full width button (useful in forms)
  fullWidth?: boolean
}

/**
 * Button component with consistent styling and behavior.
 *
 * This component handles all button interactions in the application with
 * a consistent visual language. The variant prop determines the button's
 * purpose and appearance: primary for main actions, secondary for less
 * important actions, danger for destructive actions, and ghost for subtle
 * actions that should not draw attention.
 *
 * Example usage:
 *
 * <Button variant="primary" onClick={handleSubmit}>
 *   Submit Vote
 * </Button>
 *
 * <Button variant="secondary" size="sm" isLoading={isSubmitting}>
 *   Save Draft
 * </Button>
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  // Base styles that apply to all buttons
  const baseStyles =
    'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  // Variant-specific styles determine color scheme
  const variantStyles = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary:
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    ghost:
      'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
  }

  // Size-specific styles determine padding and font size
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  // Combine all styles based on props
  const buttonStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ')

  return (
    <button
      className={buttonStyles}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          {/* Loading spinner SVG */}
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
