import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../../utils/admin/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        {
          'gradient-brand text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-primary':
            variant === 'primary',
          'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-primary hover:text-secondary focus-visible:ring-primary':
            variant === 'secondary',
          'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500': variant === 'danger',
          'px-4 py-2 text-sm': size === 'sm',
          'px-5 py-2.5 text-sm': size === 'md',
          'px-6 py-3.5 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
