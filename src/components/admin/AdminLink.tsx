import { Link, type LinkProps } from 'react-router-dom'
import { adminButtonClassName, type AdminButtonStyleProps } from './adminStyles'

export default function AdminLink({
  variant,
  size,
  className,
  ...props
}: LinkProps & AdminButtonStyleProps) {
  return <Link {...props} className={adminButtonClassName({ variant, size, className })} />
}
