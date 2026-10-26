import { useTranslation } from 'react-i18next'
import { useLayoutEffect, useRef } from 'react'
import { LoadingScreenLayout } from './LoadingScreenLayout'
import { syncLoadingMotion } from '../features/interface-preparation/loadingMotion'

interface LoadingScreenProps {
  message?: string
  className?: string
}

/** Reuses the initial HTML skeleton so startup and React share one loading layout. */
export function LoadingScreen({ message, className }: LoadingScreenProps) {
  const { t } = useTranslation()
  const screen = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    syncLoadingMotion(screen.current)
  }, [])
  return (
    <LoadingScreenLayout
      screenRef={screen}
      message={message ?? t('common.loading', 'Loading content…')}
      className={className}
    />
  )
}

export default LoadingScreen
