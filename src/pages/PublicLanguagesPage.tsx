import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Code2, Compass, Cpu, GraduationCap, Globe, HelpCircle, LayoutTemplate } from 'lucide-react'
import { api } from '../lib/api'
import Header from '../components/common/Header'
import SEO from '../components/common/SEO'
import LoadingSpinner from '../components/common/LoadingSpinner'

interface Language {
  id: string
  name: string
  displayName: string
  icon: string
  description?: string
  color: 'teal' | 'cyan' | 'ocean'
}

// Map from database ID to UI details
const langConfig: Record<string, { icon: React.ElementType; color: 'teal' | 'cyan' | 'ocean'; desc: string }> = {
  javascript: { icon: Globe, color: 'teal', desc: 'Xây dựng website tương tác và ứng dụng web hiện đại.' },
  python: { icon: Compass, color: 'cyan', desc: 'Ngôn ngữ dễ học nhất cho người mới, phù hợp với AI/Data.' },
  cpp: { icon: Cpu, color: 'ocean', desc: 'Nền tảng vững chắc về thuật toán và cấu trúc dữ liệu.' },
}

const colorStyles = {
  teal: 'from-brand-teal/20 to-brand-teal/5 border-brand-teal/30 hover:border-brand-teal/60 text-brand-teal shadow-brand-teal/20',
  cyan: 'from-brand-cyan/20 to-brand-cyan/5 border-brand-cyan/30 hover:border-brand-cyan/60 text-brand-cyan shadow-brand-cyan/20',
  ocean: 'from-brand-ocean/20 to-brand-ocean/5 border-brand-ocean/30 hover:border-brand-ocean/60 text-brand-ocean shadow-brand-ocean/20',
}

const goalCards = [
  { icon: HelpCircle, title: 'Mình chưa biết gì', desc: 'Bắt đầu nhẹ với Python và bài học đầu tiên trong 5 phút.', target: '/languages/python' },
  { icon: LayoutTemplate, title: 'Mình muốn làm web', desc: 'Đi theo JavaScript để tạo tương tác trong trình duyệt.', target: '/languages/javascript' },
  { icon: GraduationCap, title: 'Mình học ở trường', desc: 'Chọn C++ để luyện tư duy bài tập và thuật toán cơ bản.', target: '/languages/cpp' },
]

const PublicLanguagesPage: React.FC = () => {
  const navigate = useNavigate()
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await api.getLanguages() as any
        if (res.success && res.data) {
          // Backend wraps in { languages: [...] } or returns array directly
          const rawLangs = Array.isArray(res.data) ? res.data : (res.data.languages || [])
          const formatted = rawLangs.map((l: any) => ({
            id: l.id,
            name: l.name,
            displayName: l.displayName || l.display_name,
            icon: l.icon,
            description: langConfig[l.id]?.desc || 'Khám phá thế giới lập trình.',
            color: langConfig[l.id]?.color || 'teal'
          }))
          setLanguages(formatted)
        }
      } catch (err) {
        console.error('Failed to load languages', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLanguages()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Khám phá ngôn ngữ | Loopy" description="Lựa chọn ngôn ngữ lập trình phù hợp với bạn" />
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
        <Header />
        <div className="flex-grow pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-teal/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-brand-cyan/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
            >
              Chọn cách bắt đầu phù hợp với bạn.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg max-w-3xl mx-auto leading-8"
            >
              Nếu chưa chắc nên học ngôn ngữ nào, hãy chọn theo mục tiêu. Loopy sẽ dẫn bạn tới bài đầu tiên đủ nhỏ để bắt đầu ngay.
            </motion.p>
          </div>

          <div className="mb-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {goalCards.map((goal, idx) => {
              const Icon = goal.icon
              return (
                <motion.button
                  key={goal.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => navigate(goal.target)}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition-all hover:-translate-y-1 hover:border-brand-teal/40 hover:bg-brand-teal/[0.06]"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-black text-white">{goal.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{goal.desc}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-brand-teal">
                    Bắt đầu <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </motion.button>
              )
            })}
          </div>

          <div className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            <Code2 className="h-4 w-4 text-brand-teal" /> Hoặc chọn trực tiếp ngôn ngữ
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {languages.map((lang, idx) => {
              const IconComp = langConfig[lang.id]?.icon || Globe
              const styles = colorStyles[lang.color]

              return (
                <motion.div
                  key={lang.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  onClick={() => navigate(`/languages/${lang.id}`)}
                  className={`group relative bg-gradient-to-br ${styles} bg-opacity-10 backdrop-blur-sm border rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden`}
                >
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComp className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">{lang.displayName}</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed h-12">{lang.description}</p>
                    
                    <div className="flex items-center text-sm font-bold tracking-wide uppercase mt-auto">
                      <span className="group-hover:mr-2 transition-all">Xem chi tiết</span>
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </div>
                  </div>
                  
                  {/* Decorative element */}
                  <div className="absolute -bottom-6 -right-6 text-[120px] opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-500 font-bold">
                    {lang.icon}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

export default PublicLanguagesPage
