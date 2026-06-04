import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-16 h-16 border-4',
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <motion.div
      className={`${sizeClasses[size]} border-brand-teal border-t-transparent rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      aria-label="Loading"
      role="status"
    />
  )
}

export default LoadingSpinner
