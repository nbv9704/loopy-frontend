import type { ButtonHTMLAttributes } from 'react'
import { adminButtonClassName, type AdminButtonStyleProps } from './adminStyles'

export default function AdminButton({
  variant = 'secondary',
  size = 'default',
  type = 'button',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & AdminButtonStyleProps) {
  return (
    <button {...props} type={type} className={adminButtonClassName({ variant, size, className })} />
  )
}
