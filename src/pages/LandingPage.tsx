import { FiArrowRight, FiBookOpen, FiCheck, FiCode, FiPlus, FiTerminal } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { PublicShell } from '../components/PublicShell'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import LessonPreview from '../features/landing/LessonPreview'
import LearningLink from '../features/learning-entry/LearningLink'
import { learningDestination } from '../features/learning-entry/learningDestination'

const contentKeys = [
  'landing.hero.title',
  'landing.hero.subtitle',
  'landing.cta.primary',
  'landing.cta.secondary',
  'landing.learn.title',
  'landing.step1.title',
  'landing.step1.desc',
  'landing.step2.title',
  'landing.step2.desc',
  'landing.step3.title',
  'landing.step3.desc',
  'landing.journey.title',
  'landing.journey.desc',
  'landing.pmock.title',
  'landing.faq.title',
  'landing.faq1.q',
  'landing.faq1.a',
  'landing.faq2.q',
  'landing.faq2.a',
  'landing.faq3.q',
  'landing.faq3.a',
  'landing.ui.eyebrow',
  'landing.ui.free',
  'landing.ui.beginner',
  'landing.ui.browser',
  'landing.ui.example',
  'landing.ui.greeting',
  'landing.ui.output',
  'landing.ui.runCheck',
  'landing.ui.continue',
]

export default function LandingPage() {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const { content, loading } = useContentPreloader(contentKeys, i18n.language)
  const text = (key: string) => content[key] ?? i18n.t(key)
  const destination = learningDestination(user)
  const primaryLabel = text(
    destination === '/onboarding' ? 'landing.cta.primary' : 'landing.ui.continue'
  )

  if (loading) return <LoadingScreen />

  const steps = [
    {
      title: text('landing.step1.title'),
      description: text('landing.step1.desc'),
      icon: FiBookOpen,
    },
    { title: text('landing.step2.title'), description: text('landing.step2.desc'), icon: FiCode },
    {
      title: text('landing.step3.title'),
      description: text('landing.step3.desc'),
      icon: FiTerminal,
    },
  ]
  const questions = [
    [text('landing.faq1.q'), text('landing.faq1.a')],
    [text('landing.faq2.q'), text('landing.faq2.a')],
    [text('landing.faq3.q'), text('landing.faq3.a')],
  ]

  return (
    <PublicShell>
      <main>
        <section
          aria-labelledby="home-title"
          className="relative overflow-hidden px-5 py-12 sm:px-8 lg:py-20"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-brand-teal/10 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            <div>
              <p className="text-sm font-semibold learning-entry-accent">
                {text('landing.ui.eyebrow')}
              </p>
              <h1
                id="home-title"
                className="loopy-heading mt-4 text-4xl font-bold leading-[1.14] tracking-tight sm:text-5xl"
              >
                {text('landing.hero.title')}
              </h1>
              <p className="loopy-body mt-5 max-w-xl text-base leading-7">
                {text('landing.hero.subtitle')}
              </p>
              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <LearningLink to={destination}>
                  {primaryLabel}
                  <FiArrowRight aria-hidden="true" />
                </LearningLink>
                <LearningLink to="/languages" secondary>
                  {text('landing.cta.secondary')}
                </LearningLink>
              </div>
              <ul className="loopy-muted mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs leading-5">
                {[
                  text('landing.ui.free'),
                  text('landing.ui.beginner'),
                  text('landing.ui.browser'),
                ].map(label => (
                  <li key={label} className="flex items-center gap-1.5">
                    <FiCheck aria-hidden="true" className="learning-entry-accent" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <LessonPreview
              title={text('landing.pmock.title')}
              exampleLabel={text('landing.ui.example')}
              greeting={text('landing.ui.greeting')}
              outputLabel={text('landing.ui.output')}
              explanation={text('landing.ui.runCheck')}
            />
          </div>
        </section>

        <section
          id="learn"
          aria-labelledby="learn-title"
          className="loopy-surface border-y loopy-border px-5 py-12 sm:px-8 lg:py-16"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="learn-title"
              className="loopy-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {text('landing.learn.title')}
            </h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={index}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/15 learning-entry-accent">
                        <Icon aria-hidden="true" />
                      </span>
                      <span aria-hidden="true" className="loopy-muted text-xs font-semibold">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="loopy-heading mt-4 text-lg font-bold">{step.title}</h3>
                    <p className="loopy-body mt-2 text-sm leading-7">{step.description}</p>
                  </li>
                )
              })}
            </ol>
            <div
              id="journey"
              className="mt-10 flex flex-col gap-4 border-t loopy-border pt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
            >
              <div className="max-w-2xl">
                <h3 className="loopy-heading text-base font-bold">
                  {text('landing.journey.title')}
                </h3>
                <p className="loopy-body mt-2 text-sm leading-7">{text('landing.journey.desc')}</p>
              </div>
              <LearningLink to="/languages" secondary>
                {text('landing.cta.secondary')}
                <FiArrowRight aria-hidden="true" />
              </LearningLink>
            </div>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-title" className="px-5 py-12 sm:px-8 lg:py-16">
          <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <h2
              id="faq-title"
              className="loopy-heading text-2xl font-bold leading-snug tracking-tight sm:text-3xl"
            >
              {text('landing.faq.title')}
            </h2>
            <div className="border-b loopy-border">
              {questions.map(([question, answer], index) => (
                <details key={index} className="group border-t loopy-border">
                  <summary className="loopy-heading flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 rounded-lg py-4 text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ocean [&::-webkit-details-marker]:hidden">
                    {question}
                    <FiPlus
                      aria-hidden="true"
                      className="shrink-0 learning-entry-accent group-open:rotate-45"
                    />
                  </summary>
                  <p className="loopy-body max-w-prose pb-5 pr-8 text-sm leading-7">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
