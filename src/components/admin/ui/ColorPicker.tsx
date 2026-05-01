import { useState, useEffect } from 'react'
import { cn } from '../../../utils/admin/cn'

interface ColorPickerProps {
  label?: string
  value: string
  onChange: (color: string) => void
  error?: string
  required?: boolean
  disabled?: boolean
}

const ColorPicker = ({
  label,
  value,
  onChange,
  error,
  required,
  disabled = false,
}: ColorPickerProps) => {
  const [hexValue, setHexValue] = useState(value || '#000000')

  // Generate unique IDs for accessibility
  const colorId = `color-${Math.random().toString(36).substr(2, 9)}`
  const hexInputId = `${colorId}-hex`
  const errorId = `${colorId}-error`

  useEffect(() => {
    setHexValue(value || '#000000')
  }, [value])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setHexValue(newColor)
    onChange(newColor)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.trim()

    // Add # if missing
    if (inputValue && !inputValue.startsWith('#')) {
      inputValue = '#' + inputValue
    }

    setHexValue(inputValue)

    // Validate hex format before calling onChange
    if (/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      onChange(inputValue)
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={colorId} className="block mb-2 text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-3">
        <input
          type="color"
          id={colorId}
          value={hexValue}
          onChange={handleColorChange}
          disabled={disabled}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : 'false'}
          aria-label={label ? undefined : 'Color picker'}
          className={cn(
            'h-10 w-16 rounded-lg border cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:border-primary',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          )}
        />
        <input
          type="text"
          id={hexInputId}
          value={hexValue}
          onChange={handleHexInputChange}
          placeholder="#000000"
          maxLength={7}
          disabled={disabled}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : 'false'}
          aria-label="Hex color code"
          className={cn(
            'flex-1 px-3.5 py-2.5 border rounded-lg text-sm transition-all font-mono',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:border-primary',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          )}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-500 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default ColorPicker
