import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../../utils/admin/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: Array<{ value: string; label: string }>
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, required, id, ...props }, ref) => {
    // Generate unique IDs for accessibility
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`
    const errorId = `${selectId}-error`
    const helperId = `${selectId}-helper`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block mb-2 text-sm font-semibold text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
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
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = 'Select'

export default Select
