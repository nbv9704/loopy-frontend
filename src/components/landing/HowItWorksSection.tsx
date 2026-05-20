import { motion, useTransform, MotionValue } from 'framer-motion'
import { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useHowItWorks } from '../../hooks/useContent'
import { getIconComponent } from '../../utils/iconMapper'
import { HowItWorksStepSkeleton } from '../common/SkeletonLoader'

interface HowItWorksSectionProps {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ sectionRef, opacity, blur }) => {
  const { t } = useTranslation()
  // Fetch how-it-works steps from API
  const { data: steps, isLoading } = useHowItWorks()

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
                {t('landing.howItWorks')}
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t('landing.howItWorksDescription')}
            </p>
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <HowItWorksStepSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Steps Grid */}
        {!isLoading && steps && steps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, i) => {
              const StepIcon = getIconComponent(item.icon)
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 group-hover:border-white/20 transition-all duration-300">
                    <div className="text-6xl font-bold text-brand-teal/20 mb-4">
                      {item.stepNumber}
                    </div>
                    <StepIcon className="w-12 h-12 text-brand-teal mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
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

export default HowItWorksSection
