import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../../utils/admin/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, required, id, ...props }, ref) => {
    // Generate unique IDs for accessibility
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block mb-2 text-sm font-semibold text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : 'false'}
          className={cn(
            'w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:border-primary',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-500 font-medium" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
