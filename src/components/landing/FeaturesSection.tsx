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
              const isPillar = i < 3
              
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
                    className={`absolute -inset-1 bg-gradient-to-br ${
                      isPillar ? 'from-brand-teal/30 to-brand-cyan/30 blur-2xl' : 'from-white/10 to-transparent blur-xl'
                    } rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <div className={`relative h-full bg-gradient-to-br ${
                    isPillar ? 'from-white/[0.08] to-white/[0.03]' : 'from-white/[0.04] to-white/[0.01]'
                  } backdrop-blur-xl rounded-3xl border ${
                    isPillar ? 'border-brand-teal/30 group-hover:border-brand-teal/50' : 'border-white/10 group-hover:border-white/20'
                  } p-8 transition-all duration-300`}>
                    <div className={`p-3 rounded-2xl w-fit mb-6 ${
                      isPillar ? 'bg-brand-teal/10 text-brand-teal' : 'bg-white/5 text-slate-400'
                    } group-hover:scale-110 transition-transform`}>
                      <FeatureIcon className="w-8 h-8" />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 ${isPillar ? 'text-white' : 'text-slate-200'}`}>
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                    
                    {isPillar && (
                      <div className="mt-6 flex items-center gap-2 text-brand-teal text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Tìm hiểu thêm</span>
                        <div className="w-8 h-px bg-brand-teal" />
                      </div>
                    )}
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
