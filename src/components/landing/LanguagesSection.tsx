import { motion, useTransform, MotionValue } from 'framer-motion'
import { ArrowRight, BookOpen, Code2, GraduationCap, HelpCircle, LayoutTemplate } from 'lucide-react'
import { RefObject } from 'react'
import { useLandingLanguages } from '../../hooks/useContent'
import { getIconComponent } from '../../utils/iconMapper'
import { LanguageCardSkeleton } from '../common/SkeletonLoader'

interface LanguagesSectionProps {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
}

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ sectionRef, opacity, blur }) => {
  const { data: languages, isLoading } = useLandingLanguages()
  const goals = [
    { icon: HelpCircle, title: 'Mình chưa biết gì', desc: 'Bắt đầu nhẹ với Python và các bài học nền tảng.' },
    { icon: LayoutTemplate, title: 'Mình muốn làm web', desc: 'Đi theo JavaScript để hiểu web tương tác.' },
    { icon: GraduationCap, title: 'Mình học ở trường', desc: 'Chọn C++ để luyện tư duy và thuật toán cơ bản.' },
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
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-brand-teal">Chọn theo mục tiêu</div>
            <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Không chắc học ngôn ngữ nào? Chọn điều bạn muốn làm trước.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Loopy có thể gợi ý lộ trình, nhưng bạn vẫn luôn thấy rõ bài đầu tiên và cột mốc tiếp theo.
            </p>
          </motion.div>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
                <goal.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-white">{goal.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{goal.desc}</p>
            </motion.div>
          ))}
        </div>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <LanguageCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!isLoading && languages && languages.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
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
                  <div className="relative h-full rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-7 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-white/20">
                    <div
                      className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${lang.color}20` }}
                    >
                      <LangIcon className="h-10 w-10" style={{ color: lang.color }} />
                    </div>
                    <h3 className="mb-2 text-3xl font-black text-white">{lang.name}</h3>
                    <p className="mb-5 text-sm leading-6 text-slate-400">{lang.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-brand-teal">
                      <span className="inline-flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {lang.lessonCount} bài học
                      </span>
                      <span className="inline-flex items-center gap-2 text-slate-300">
                        <Code2 className="h-4 w-4" />
                        Có bài đầu tiên
                      </span>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm font-bold text-white">
                      Xem lộ trình
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
