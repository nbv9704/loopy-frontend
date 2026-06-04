import { motion, useTransform, MotionValue } from 'framer-motion'
import { ArrowRight, Eye, Hammer, PlayCircle, RefreshCcw, Rocket } from 'lucide-react'
import { RefObject } from 'react'

interface HowItWorksSectionProps {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ sectionRef, opacity, blur }) => {
  const steps = [
    { icon: Eye, title: 'See', desc: 'Xem ví dụ đủ nhỏ để hiểu ý tưởng.' },
    { icon: Hammer, title: 'Change', desc: 'Sửa một phần code thay vì viết từ trang trắng.' },
    { icon: PlayCircle, title: 'Run', desc: 'Chạy code ngay và thấy output thật.' },
    { icon: RefreshCcw, title: 'Fix', desc: 'Nếu sai, nhận gợi ý dễ hiểu để thử lại.' },
    { icon: Rocket, title: 'Build', desc: 'Hoàn thành bài và mở khóa bước tiếp theo.' },
  ]

  return (
    <motion.section
      ref={sectionRef}
      style={{
        opacity,
        filter: useTransform(blur, value => `blur(${value}px)`),
      }}
      className="relative px-6 py-20 md:px-12 md:py-28"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-brand-teal">Learning loop</div>
            <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Một vòng học ngắn, lặp lại đến khi bạn tự tin.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Loopy biến mỗi bài học thành một vòng thực hành rõ ràng: xem, sửa, chạy, hiểu lỗi và xây tiếp.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative"
            >
              {index < steps.length - 1 && (
                <ArrowRight className="absolute -right-4 top-12 z-10 hidden h-5 w-5 text-brand-teal/40 md:block" />
              )}
              <div className="relative h-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition-all hover:-translate-y-1 hover:border-brand-teal/40 hover:bg-brand-teal/[0.06]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-brand-teal/70">
                  Step {index + 1}
                </div>
                <h3 className="text-xl font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

export default HowItWorksSection
