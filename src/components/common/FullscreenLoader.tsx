import LoadingSpinner from './LoadingSpinner'
import { useTranslation } from 'react-i18next'

interface FullscreenLoaderProps {
  message?: string
}

const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ message = '' }) => {
  const { t } = useTranslation()
  const displayMessage = message || t('common.loading')

  return (
    <div className="fixed inset-0 bg-[#0a0e1a] flex items-center justify-center z-50">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-teal/10 rounded-full blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-brand-cyan/10 rounded-full blur-[80px] animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <LoadingSpinner size="lg" />
        <p className="text-slate-400 text-lg font-medium animate-pulse">{displayMessage}</p>
      </div>
    </div>
  )
}

export default FullscreenLoader
