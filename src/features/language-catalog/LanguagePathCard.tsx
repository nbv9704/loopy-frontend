import { Link } from 'react-router-dom'
import { FiArrowRight, FiCode, FiCpu } from 'react-icons/fi'
import type { CatalogLanguage } from './catalog.service'

const accents: Record<string, string> = {
  python: 'bg-amber-100 text-amber-900',
  javascript: 'bg-yellow-100 text-yellow-900',
  cpp: 'bg-violet-100 text-violet-900',
}

export default function LanguagePathCard({
  language,
  description,
  action,
}: {
  language: CatalogLanguage
  description: string
  action: string
}) {
  const Icon = language.id === 'javascript' ? FiCode : FiCpu
  return (
    <Link
      to={`/languages/${encodeURIComponent(language.id)}`}
      aria-label={`${action}: ${language.name}`}
      className="loopy-card group flex min-w-0 flex-col rounded-2xl border p-6 transition-colors hover:border-brand-ocean focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ocean"
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accents[language.id] || 'bg-brand-teal/15 learning-entry-accent'}`}
        >
          <Icon aria-hidden="true" />
        </span>
        <h3 className="loopy-heading text-xl font-bold">{language.name}</h3>
      </div>
      <p className="loopy-body mb-6 mt-5 text-sm leading-7">{description}</p>
      <span className="mt-auto flex items-center justify-between gap-3 border-t loopy-border pt-4 text-sm font-semibold learning-entry-accent">
        {action} <FiArrowRight aria-hidden="true" className="shrink-0" />
      </span>
    </Link>
  )
}
