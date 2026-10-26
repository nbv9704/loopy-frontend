import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { PublicShell } from '../components/PublicShell'
import { LoadingScreen } from '../components/LoadingScreen'
import ResourceLoadError from '../components/common/ResourceLoadError'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { pvpService } from '../services/pvp.service'
import { pvpLobbyContentKeys } from '../features/pvp/lobbyContent'
import PvPLobbyView from '../features/pvp/PvPLobbyView'

export default function PvPLobbyPage() {
  const { user, loading: authLoading } = useAuth()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { content, initialLoading: contentLoading } = useContentPreloader(
    pvpLobbyContentKeys,
    i18n.language
  )
  const loadEligibility = useCallback(
    (signal: AbortSignal) => pvpService.getEligibility(signal),
    []
  )
  const eligibility = useAsyncResource(user?.onboardingCompleted ? user.id : null, loadEligibility)

  useEffect(() => {
    if (authLoading) return
    if (!user) navigate('/auth', { replace: true, state: { from: location } })
    else if (!user.onboardingCompleted) navigate('/onboarding', { replace: true })
  }, [authLoading, user, navigate, location])

  if (authLoading || !user?.onboardingCompleted || contentLoading)
    return <LoadingScreen message="Đang tải PvP..." />
  const scope = `${user.id}:${location.key}`
  return (
    <>
      <SEO {...pageMetadata.challenges} />
      <PublicShell headerContent={content} footerContent={content}>
        {eligibility.loading ? (
          <LoadingScreen message="Đang kiểm tra điều kiện tham gia..." />
        ) : eligibility.error ? (
          <div className="mx-auto w-full max-w-2xl px-4 py-12">
            <ResourceLoadError message={eligibility.error} onRetry={eligibility.retry} />
          </div>
        ) : eligibility.data ? (
          <PvPLobbyView
            key={scope}
            scope={scope}
            content={content}
            eligibility={eligibility.data}
            languageId={user.preferredLanguage || undefined}
          />
        ) : null}
      </PublicShell>
    </>
  )
}
