import { motion, useTransform, MotionValue } from 'framer-motion'
import { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useLandingFeatures } from '../../hooks/useContent'
import { getIconComponent } from '../../utils/iconMapper'
import { FeatureCardSkeleton } from '../common/SkeletonLoader'

interface FeaturesSectionV2Props {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
}

const FeaturesSectionV2: React.FC<FeaturesSectionV2Props> = ({ sectionRef, opacity, blur }) => {
  const { t } = useTranslation()
  // Fetch features from API
  const { data: features, isLoading } = useLandingFeatures()

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
              {t('landing.whyChoose')}{' '}
              <span className="bg-gradient-to-r from-brand-teal to-brand-cyan bg-clip-text text-transparent">
                Loopy
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t('landing.modernPlatform')}
            </p>
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <FeatureCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Features Grid */}
        {!isLoading && features && features.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const FeatureIcon = getIconComponent(feature.icon)
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative"
                >
                  <div
                    className={`absolute -inset-1 bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <div className="relative h-full bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 group-hover:border-white/20 transition-all duration-300">
                    <FeatureIcon className="w-12 h-12 text-brand-teal mb-6" />
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{feature.description}</p>
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

export default FeaturesSectionV2
