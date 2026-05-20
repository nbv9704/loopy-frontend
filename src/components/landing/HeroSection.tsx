import { motion, useTransform, MotionValue } from 'framer-motion'
import {
  Play,
  Code2,
  BookOpen,
  Zap,
  Terminal,
  CheckCircle2,
} from 'lucide-react'
import { RefObject } from 'react'
import { useTranslation } from 'react-i18next'

interface HeroSectionV2Props {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
  onStartCoding: () => void
  onViewDocs: () => void
}

const HeroSectionV2: React.FC<HeroSectionV2Props> = ({
  sectionRef,
  opacity,
  blur,
  onStartCoding,
  onViewDocs,
}) => {
  const { t, i18n } = useTranslation()
  return (
    <motion.section
      ref={sectionRef}
      style={{
        opacity,
        filter: useTransform(blur, value => `blur(${value}px)`),
      }}
      className="relative px-6 md:px-12 pt-32 pb-32"
    >
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-10">
            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="mb-6">
                <img
                  src={`/images/hero/${i18n.language}/textbanner-w1024.png`}
                  srcSet={`/images/hero/${i18n.language}/textbanner-w256.png 256w,
                          /images/hero/${i18n.language}/textbanner-w512.png 512w,
                          /images/hero/${i18n.language}/textbanner-w1024.png 1024w,
                          /images/hero/${i18n.language}/textbanner-w2048.png 2048w`}
                  sizes="(max-width: 768px) 55vw, (max-width: 1024px) 45vw, 500px"
                  alt={t('hero.titlePrefix')}
                  className="w-full max-w-xl h-auto"
                />
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 leading-relaxed max-w-2xl">
                Loopy giúp người mới bắt đầu vượt qua 20 giờ đầu tiên học lập trình bằng các bài học siêu nhỏ, thực hành thật và phản hồi hữu ích.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <button
                onClick={onStartCoding}
                className="group relative inline-flex items-center gap-3 px-10 py-5 cursor-pointer overflow-hidden rounded-2xl bg-brand-teal text-[#0a0e1a] shadow-lg shadow-brand-teal/20"
              >
                <div className="absolute inset-0 bg-brand-cyan -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                <span className="relative flex items-center gap-2 font-bold text-xl transition-colors duration-300 z-10">
                  <Code2 className="w-6 h-6" />
                  Bắt đầu từ số 0
                </span>
              </button>

              <button
                onClick={onViewDocs}
                className="px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-xl hover:bg-white/10 hover:border-brand-teal/50 transition-all cursor-pointer flex items-center gap-2 group"
              >
                <Play className="w-5 h-5 text-brand-teal group-hover:translate-x-1 transition-transform" />
                Thử bài đầu tiên
              </button>
            </motion.div>

            {/* Core Values / Three Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid sm:grid-cols-3 gap-6 pt-8"
            >
              {[
                { icon: BookOpen, title: 'Lộ trình rõ ràng', desc: 'Biết chính xác cần học gì' },
                { icon: Zap, title: 'Thực hành ngay', desc: 'Code thật từ phút đầu tiên' },
                { icon: CheckCircle2, title: 'Học từ lỗi sai', desc: 'AI gợi ý cách sửa thông minh' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-lg bg-brand-teal/10">
                    <item.icon className="w-4 h-4 text-brand-teal" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{item.title}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Stats removed as per new direction */}
          </div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-teal/20 via-brand-cyan/20 to-transparent rounded-3xl blur-2xl" />

              <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                      <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    </div>
                    <span className="text-slate-400 text-sm font-mono">playground.js</span>
                  </div>
                  <Terminal className="w-4 h-4 text-brand-teal/60" />
                </div>

                <div className="p-6 font-mono text-sm space-y-2">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-500"
                  >
                    <span className="text-slate-600">// {t('hero.code.comment')}</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <span className="text-purple-400">function</span>
                    <span className="text-yellow-300"> startLearning</span>
                    <span className="text-slate-400">() {'{'}</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="pl-6"
                  >
                    <span className="text-pink-400">const</span>
                    <span className="text-slate-300"> skills = [</span>
                  </motion.div>
                  {['JavaScript', 'Python', 'C++'].map((lang, i) => (
                    <motion.div
                      key={lang}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="pl-12"
                    >
                      <span className="text-green-400">'{lang}'</span>
                      <span className="text-slate-400">{i < 2 ? ',' : ''}</span>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                    className="pl-6"
                  >
                    <span className="text-slate-300">];</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                    className="pl-6"
                  >
                    <span className="text-blue-400">return</span>
                    <span className="text-slate-300"> skills;</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 }}
                  >
                    <span className="text-slate-400">{'}'}</span>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="px-6 py-4 bg-black/30 border-t border-white/10"
                >
                  <div className="flex items-start gap-2 text-sm font-mono">
                    <span className="text-brand-teal/60 mt-0.5">{'>'}</span>
                    <div className="flex-1">
                      <div className="text-brand-teal">['JavaScript', 'Python', 'C++']</div>
                      <div className="flex items-center gap-2 mt-2 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs">{t('hero.code.executed')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute -bottom-6 -right-6 px-6 py-4 rounded-2xl bg-gradient-to-br from-brand-cyan/90 to-brand-teal/90 backdrop-blur-xl border border-white/20 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-white" />
                  <div>
                    <div className="text-white font-bold text-lg">
                      {t('hero.code.runInstantly')}
                    </div>
                    <div className="text-white/80 text-xs">{t('hero.code.noInstall')}</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

export default HeroSectionV2
