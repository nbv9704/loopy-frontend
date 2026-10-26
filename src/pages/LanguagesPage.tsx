import { FiArrowRight, FiCompass } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { PublicShell } from '../components/PublicShell'
import { LoadingScreen } from '../components/LoadingScreen'
import ResourceLoadError from '../components/common/ResourceLoadError'
import { useAuth } from '../contexts/AuthContext'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { useAsyncResource } from '../hooks/useAsyncResource'
import LanguagePathCard from '../features/language-catalog/LanguagePathCard'
import { loadCatalogLanguages } from '../features/language-catalog/catalog.service'
import LearningLink from '../features/learning-entry/LearningLink'
import { learningDestination } from '../features/learning-entry/learningDestination'

const descriptionKeys: Record<string, string> = {
  python: 'languages.card.python',
  javascript: 'languages.card.javascript',
  cpp: 'languages.card.cpp',
}

const contentKeys = [
  'languages.title',
  'languages.subtitle',
  'languages.browse.title',
  'languages.card.python',
  'languages.card.javascript',
  'languages.card.cpp',
  'languages.card.other',
  'languages.card.explore',
  'languages.catalog.helpTitle',
  'languages.catalog.helpDescription',
  'languages.catalog.helpAction',
  'languages.catalog.error',
  'languages.catalog.empty',
  'languages.catalog.emptyDescription',
  'languages.catalog.hint',
  'languages.loading',
  'landing.ui.continue',
]

export default function LanguagesPage() {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const { content, loading: contentLoading } = useContentPreloader(contentKeys, i18n.language)
  const catalog = useAsyncResource('public-language-catalog', loadCatalogLanguages)
  const text = (key: string) => content[key] ?? i18n.t(key)
  const destination = learningDestination(user)

  if (contentLoading) return <LoadingScreen />

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-5 pb-14 pt-10 sm:px-8 lg:pb-20 lg:pt-14">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="max-w-2xl">
            <h1 className="loopy-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {text('languages.title')}
            </h1>
            <p className="loopy-body mt-4 text-base leading-7">{text('languages.subtitle')}</p>
          </div>
          {destination !== '/onboarding' && (
            <div className="shrink-0">
              <LearningLink to={destination}>
                {text('landing.ui.continue')}
                <FiArrowRight aria-hidden="true" />
              </LearningLink>
            </div>
          )}
        </header>

        <aside
          aria-labelledby="path-help-title"
          className="loopy-card-soft mt-8 flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <FiCompass aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 learning-entry-accent" />
            <div>
              <h2 id="path-help-title" className="loopy-heading text-base font-bold">
                {text('languages.catalog.helpTitle')}
              </h2>
              <p className="loopy-body mt-1 text-sm leading-6">
                {text('languages.catalog.helpDescription')}
              </p>
            </div>
          </div>
          <LearningLink to="/onboarding" secondary>
            {text('languages.catalog.helpAction')}
            <FiArrowRight aria-hidden="true" />
          </LearningLink>
        </aside>

        <section aria-labelledby="paths-title" className="mt-9">
          <h2 id="paths-title" className="loopy-heading mb-5 text-xl font-bold">
            {text('languages.browse.title')}
          </h2>
          {catalog.loading ? (
            <div
              role="status"
              className="loopy-muted rounded-2xl border loopy-border px-6 py-10 text-sm"
            >
              {text('languages.loading')}
            </div>
          ) : catalog.error ? (
            <ResourceLoadError message={text('languages.catalog.error')} onRetry={catalog.retry} />
          ) : catalog.data?.length === 0 ? (
            <div role="status" className="loopy-card rounded-2xl border px-6 py-10">
              <h3 className="loopy-heading font-semibold">{text('languages.catalog.empty')}</h3>
              <p className="loopy-body mt-2 text-sm leading-6">
                {text('languages.catalog.emptyDescription')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {catalog.data?.map(language => (
                <LanguagePathCard
                  key={language.id}
                  language={language}
                  description={text(descriptionKeys[language.id] || 'languages.card.other')}
                  action={text('languages.card.explore')}
                />
              ))}
            </div>
          )}
          <p className="loopy-muted mt-5 max-w-2xl text-sm leading-6">
            {text('languages.catalog.hint')}
          </p>
        </section>
      </main>
    </PublicShell>
  )
}
