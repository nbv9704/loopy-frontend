import { motion, useTransform, MotionValue } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Map, MonitorPlay, Puzzle, Wrench } from 'lucide-react'
import { RefObject } from 'react'

interface FeaturesSectionV2Props {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
}

const FeaturesSectionV2: React.FC<FeaturesSectionV2Props> = ({ sectionRef, opacity, blur }) => {
  const pains = [
    { icon: Map, title: 'Không biết bắt đầu từ đâu', desc: 'Quá nhiều khóa học, video và thuật ngữ khiến bạn bị ngợp.' },
    { icon: Wrench, title: 'Cài đặt rối ngay từ đầu', desc: 'Mất động lực trước khi viết được dòng code đầu tiên.' },
    { icon: AlertTriangle, title: 'Gặp lỗi nhưng không hiểu lỗi', desc: 'Một thông báo đỏ có thể làm người mới bỏ cuộc.' },
  ]

  const solutions = [
    { icon: Puzzle, title: 'Lộ trình theo mục tiêu', desc: 'Loopy gợi ý bước tiếp theo dựa trên mục tiêu học của bạn.' },
    { icon: MonitorPlay, title: 'Code ngay trong trình duyệt', desc: 'Bài học, editor và output nằm cùng một nơi.' },
    { icon: CheckCircle2, title: 'Phản hồi dễ hiểu', desc: 'Bạn biết vì sao sai và nên thử sửa theo hướng nào.' },
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
        <div className="mb-12 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-brand-teal">Vấn đề thật của người mới</div>
            <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Loopy không bắt bạn tự mò đường.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Hầu hết người mới không thiếu động lực. Họ thiếu một bước tiếp theo đủ nhỏ, đủ rõ và có phản hồi ngay khi sai.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-red-400/15 bg-red-500/[0.04] p-6 md:p-8">
            <div className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-red-200/80">Trước Loopy</div>
            <div className="space-y-4">
              {pains.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-400/10 text-red-200">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-teal/25 bg-brand-teal/[0.06] p-6 md:p-8">
            <div className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-brand-teal">Với Loopy</div>
            <div className="space-y-4">
              {solutions.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="flex gap-4 rounded-2xl border border-brand-teal/20 bg-black/20 p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default FeaturesSectionV2
