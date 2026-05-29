import { motion, useTransform, MotionValue } from 'framer-motion'
import { ArrowRight, CheckCircle2, Play } from 'lucide-react'
import { RefObject } from 'react'

interface CTASectionProps {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
  onStartCoding: () => void
}

const CTASection: React.FC<CTASectionProps> = ({ sectionRef, opacity, blur, onStartCoding }) => {
  return (
    <motion.section
      ref={sectionRef}
      style={{
        opacity,
        filter: useTransform(blur, value => `blur(${value}px)`),
      }}
      className="relative px-6 py-20 md:px-12 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative text-center"
        >
          <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-r from-brand-teal/20 via-brand-cyan/20 to-brand-ocean/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.1] to-white/[0.03] p-8 backdrop-blur-2xl md:rounded-[3rem] md:p-14">
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-bold text-brand-teal">
              <CheckCircle2 className="h-4 w-4" />
              Miễn phí để bắt đầu
            </div>
            <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Bắt đầu bằng một bài học nhỏ hôm nay.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Không cần cài đặt. Không cần chọn đúng ngay từ đầu. Bạn chỉ cần thử chạy bài học đầu tiên và Loopy sẽ dẫn bước tiếp theo.
            </p>

            <button
              onClick={onStartCoding}
              className="group relative mt-9 inline-flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border-2 border-brand-teal bg-[#0a0e1a] px-9 py-4"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-brand-teal to-brand-cyan transition-transform duration-500 ease-out group-hover:translate-x-0" />

              <span className="relative z-10 flex items-center gap-3 text-lg font-black text-brand-teal transition-colors duration-300 group-hover:text-[#0a0e1a]">
                <Play className="h-5 w-5" />
                Thử bài đầu tiên miễn phí
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default CTASection
