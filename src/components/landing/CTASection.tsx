import { motion, useTransform, MotionValue } from 'framer-motion'
import { Play, ArrowRight } from 'lucide-react'
import { RefObject } from 'react'
import { useTranslation } from 'react-i18next'

interface CTASectionProps {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
  onStartCoding: () => void
}

const CTASection: React.FC<CTASectionProps> = ({ sectionRef, opacity, blur, onStartCoding }) => {
  const { t } = useTranslation()

  return (
    <motion.section
      ref={sectionRef}
      style={{
        opacity,
        filter: useTransform(blur, value => `blur(${value}px)`),
      }}
      className="relative px-6 md:px-12 py-32"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/20 via-brand-cyan/20 to-brand-ocean/20 rounded-[3rem] blur-3xl" />
          <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-2xl rounded-[3rem] border border-white/10 p-16">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {t('landing.readyToStart')}
            </h2>
            <p className="text-xl text-slate-400 mb-10">{t('landing.joinThousands')}</p>

            <button
              onClick={onStartCoding}
              className="group relative inline-flex items-center gap-3 px-10 py-5 cursor-pointer overflow-hidden rounded-2xl border-2 border-brand-teal bg-[#0a0e1a]"
            >
              {/* Simple liquid fill from left to right */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-brand-cyan -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />

              {/* Button content */}
              <span className="relative flex items-center gap-3 font-bold text-xl transition-colors duration-300 text-brand-teal group-hover:text-[#0a0e1a] z-10">
                <Play className="w-6 h-6" />
                {t('landing.startLearningFree')}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default CTASection
