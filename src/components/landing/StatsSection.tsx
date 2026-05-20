import { motion, useTransform, MotionValue } from 'framer-motion'
import { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useLandingStats } from '../../hooks/useContent'
import { getIconComponent } from '../../utils/iconMapper'
import { StatCardSkeleton } from '../common/SkeletonLoader'

interface StatsSectionProps {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
}

const StatsSection: React.FC<StatsSectionProps> = ({ sectionRef, opacity, blur }) => {
  const { t } = useTranslation()
  // Fetch stats from API
  const { data: stats, isLoading } = useLandingStats()

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
              {t('landing.impressiveNumbers').split(' ')[0]}{' '}
              <span className="bg-gradient-to-r from-brand-teal to-brand-cyan bg-clip-text text-transparent">
                {t('landing.impressiveNumbers').split(' ').slice(1).join(' ')}
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t('landing.communityGrowing')}
            </p>
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Stats Grid */}
        {!isLoading && stats && stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const StatIcon = getIconComponent(stat.icon)
              return (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 mb-6">
                    <StatIcon className="w-10 h-10 text-brand-teal" />
                  </div>
                  <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-xl text-slate-400">{stat.label}</div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.section>
  )
}

export default StatsSection
