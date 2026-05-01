import { motion, useTransform, MotionValue } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useLandingLanguages } from '../../hooks/useContent'
import { getIconComponent } from '../../utils/iconMapper'
import { LanguageCardSkeleton } from '../common/SkeletonLoader'

interface LanguagesSectionProps {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
}

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ sectionRef, opacity, blur }) => {
  const { t } = useTranslation()
  // Fetch languages from API
  const { data: languages, isLoading } = useLandingLanguages()

  return (
    <motion.section
      ref={sectionRef}
      style={{
        opacity,
        filter: useTransform(blur, value => `blur(${value}px)`),
      }}
      className="relative px-6 md:px-12 py-32"
    >
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-brand-teal to-brand-cyan bg-clip-text text-transparent">
                {t('landing.supportedLanguages')}
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t('landing.learnPopularLanguages')}
            </p>
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <LanguageCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Languages Grid */}
        {!isLoading && languages && languages.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8">
            {languages.map((lang, i) => {
              const LangIcon = getIconComponent(lang.icon)
              return (
                <motion.div
                  key={lang.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group relative"
                >
                  <div
                    className="absolute -inset-1 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ backgroundColor: `${lang.color}40` }}
                  />
                  <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 group-hover:border-white/20 transition-all duration-300">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: `${lang.color}20` }}
                    >
                      <LangIcon className="w-10 h-10" style={{ color: lang.color }} />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{lang.name}</h3>
                    <p className="text-slate-400 mb-4">{lang.description}</p>
                    <div className="flex items-center gap-2 text-brand-teal">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {t('landing.lessonsCount', { count: lang.lessonCount })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.section>
  )
}

export default LanguagesSection
