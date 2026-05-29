import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Code2, Play, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/common/Header'
import SEO from '../components/common/SEO'
import LoadingSpinner from '../components/common/LoadingSpinner'

const langInfo: Record<string, any> = {
  javascript: {
    title: 'JavaScript',
    subtitle: 'Đường vào web tương tác',
    desc: 'Phù hợp nếu bạn muốn thấy code thay đổi giao diện và hành vi ngay trong trình duyệt.',
    fit: 'Bạn muốn làm web, thích nhìn thấy kết quả trực quan và muốn bắt đầu bằng tương tác nhỏ.',
    firstWin: 'Đổi nội dung trên trang và chạy JavaScript đầu tiên.',
    benefits: [
      { title: 'Thấy kết quả nhanh', desc: 'Thay đổi một dòng code và thấy trang phản hồi ngay.', icon: Zap },
      { title: 'Browser-first', desc: 'Không cần cài môi trường phức tạp trong những bài đầu.', icon: Sparkles },
      { title: 'Đi từng bước', desc: 'Bắt đầu từ biến, hàm, sự kiện rồi tới mini project.', icon: TrendingUp }
    ],
    color: 'teal',
    badge: 'Beginners welcome'
  },
  python: {
    title: 'Python',
    subtitle: 'Bắt đầu nhẹ nhất cho người mới',
    desc: 'Python có cú pháp dễ đọc, phù hợp nếu bạn muốn hiểu tư duy lập trình trước khi lo cú pháp phức tạp.',
    fit: 'Bạn chưa biết gì, muốn học logic cơ bản và có chiến thắng đầu tiên thật nhanh.',
    firstWin: 'In dòng chữ đầu tiên, sửa biến và hiểu output.',
    benefits: [
      { title: 'Dễ đọc, dễ sửa', desc: 'Cú pháp gần với tiếng Anh và ít ký hiệu gây nhiễu.', icon: Code2 },
      { title: 'Hợp để học nền tảng', desc: 'Tập trung vào biến, điều kiện, vòng lặp và tư duy.', icon: Sparkles },
      { title: 'Có output ngay', desc: 'Chạy code trong trình duyệt và thấy kết quả tức thì.', icon: Zap }
    ],
    color: 'cyan',
    badge: 'High demand'
  },
  cpp: {
    title: 'C++',
    subtitle: 'Nền tảng cho trường học và thuật toán',
    desc: 'Phù hợp nếu bạn học ở trường, luyện bài tập hoặc muốn xây nền tư duy giải bài chắc hơn.',
    fit: 'Bạn cần input/output, điều kiện, vòng lặp và tư duy giải thuật cơ bản.',
    firstWin: 'Chạy chương trình C++ đầu tiên và đọc output.',
    benefits: [
      { title: 'Hợp bài tập ở trường', desc: 'Tập trung vào input/output và cách chia nhỏ bài toán.', icon: Zap },
      { title: 'Nền tư duy chắc', desc: 'Hiểu rõ biến, kiểu dữ liệu và dòng chạy chương trình.', icon: Code2 },
      { title: 'Luyện thuật toán sớm', desc: 'Đi từ bài nhỏ tới checkpoint có cấu trúc.', icon: TrendingUp }
    ],
    color: 'ocean',
    badge: 'For engineers'
  }
}

const colorClasses: Record<string, { bg: string; bgSoft: string; text: string; border: string; shadow: string; gradient: string }> = {
  teal: {
    bg: 'bg-brand-teal',
    bgSoft: 'bg-brand-teal/10',
    text: 'text-brand-teal',
    border: 'border-brand-teal/30',
    shadow: 'shadow-brand-teal/20',
    gradient: 'via-brand-teal/50',
  },
  cyan: {
    bg: 'bg-brand-cyan',
    bgSoft: 'bg-brand-cyan/10',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
    shadow: 'shadow-brand-cyan/20',
    gradient: 'via-brand-cyan/50',
  },
  ocean: {
    bg: 'bg-brand-ocean',
    bgSoft: 'bg-brand-ocean/10',
    text: 'text-brand-ocean',
    border: 'border-brand-ocean/30',
    shadow: 'shadow-brand-ocean/20',
    gradient: 'via-brand-ocean/50',
  },
}

const PublicLanguageDetailPage: React.FC = () => {
  const { language } = useParams<{ language: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [curriculum, setCurriculum] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const info = langInfo[language || 'javascript'] || langInfo.javascript
  const colors = colorClasses[info.color] || colorClasses.teal

  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!language) return
      try {
        const res = await api.getCurriculum(language) as any
        if (res.success && res.data) {
          const chapters = res.data.chapters || []
          const lessons = res.data.lessons || []
          // Attach lessons to their parent chapter for display
          const chaptersWithLessons = chapters.map((ch: any) => ({
            ...ch,
            lessons: lessons.filter((l: any) => l.chapterId === ch.id)
          }))
          setCurriculum(chaptersWithLessons)
        }
      } catch (err) {
        console.error('Failed to load curriculum', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCurriculum()
  }, [language])

  const handleStart = () => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/library/${language}` }, intendedLanguage: language } })
    } else if (!user.onboardingCompleted) {
      navigate('/onboarding', { state: { intendedLanguage: language } })
    } else {
      navigate(`/library/${language}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0a0e1a]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <SEO title={`Học ${info.title} | Loopy`} description={`Khám phá lộ trình học ${info.title}`} />
      
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col font-sans">
        <Header />
        
        {/* Hero Section */}
        <div className="pt-40 pb-24 px-4 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-[800px] h-[800px] ${colors.bgSoft} rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3`} />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              
              {/* Left Column: Content */}
              <div className="text-center md:text-left">
                <div className={`mb-5 inline-flex items-center gap-2 rounded-full border ${colors.border} ${colors.bgSoft} px-4 py-2 text-sm font-bold ${colors.text}`}>
                  <CheckCircle2 className="h-4 w-4" /> {info.subtitle}
                </div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-tight"
                >
                  Lộ trình {info.title} cho người mới
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl text-slate-300 mb-10 leading-relaxed max-w-lg mx-auto md:mx-0"
                >
                  {info.desc}
                </motion.p>
                <div className="mb-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Phù hợp nếu</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{info.fit}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">First win</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{info.firstWin}</p>
                  </div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button 
                    onClick={handleStart}
                    className={`px-8 py-4 rounded-xl ${colors.bg} text-[#0a0e1a] font-bold text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-lg ${colors.shadow} cursor-pointer mx-auto md:mx-0`}
                  >
                    Bắt đầu lộ trình này <ArrowRight className="h-5 w-5" />
                  </button>
                  
                  <div className="mt-8 flex items-center justify-center md:justify-start gap-4 text-slate-500 font-semibold tracking-widest text-sm uppercase">
                    CÔNG NGHỆ LÕI
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white">
                      <Code2 className={`w-4 h-4 ${colors.text}`} /> {info.title}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Abstract Visual */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden md:flex relative justify-center items-center"
              >
                <div className="relative w-80 h-80 flex items-center justify-center">
                  {/* Decorative starburst behind */}
                  <div 
                    className={`absolute inset-0 ${colors.bg} opacity-40`} 
                    style={{ 
                      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', 
                      transform: 'scale(1.3) rotate(15deg)' 
                    }} 
                  />
                  
                  {/* Inner dark circle */}
                  <div className="absolute w-56 h-56 bg-[#0a0e1a] rounded-full flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                    <div className={`absolute inset-0 ${colors.bgSoft} animate-pulse`} />
                    <Code2 className="w-24 h-24 text-white/80" />
                  </div>

                  {/* Floating Badge */}
                  <motion.div 
                    animate={{ y: [0, -10, 0], rotate: [12, 14, 12] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute -top-4 -right-4 bg-white text-[#0a0e1a] font-bold px-6 py-3 rounded-2xl shadow-2xl"
                  >
                    {info.badge}
                  </motion.div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-[#121826] border-y border-white/5 py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Cách Loopy dạy</h2>
              <p className="text-3xl font-extrabold text-white">Bắt đầu bằng bài nhỏ, không bị ngợp.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {info.benefits.map((benefit: any, idx: number) => {
                const Icon = benefit.icon
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-end mb-6">
                      <Icon className={`w-8 h-8 ${colors.text}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{benefit.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{benefit.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Curriculum Preview Section */}
        <div id="curriculum" className="flex-grow max-w-6xl mx-auto px-4 py-24 w-full">
          <div className="text-center mb-20">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Roadmap Preview</h2>
            <h3 className="text-4xl font-extrabold text-white mb-4">
              Học {info.title} theo từng bước dễ hiểu
            </h3>
          </div>

          {curriculum.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {curriculum.map((chapter: any, idx: number) => (
                <motion.div 
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col relative overflow-hidden group hover:border-white/20 transition-colors"
                >
                  {/* Subtle top border highlight */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${colors.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  {/* Chapter Number Badge */}
                  <div className={`w-12 h-12 rounded-2xl ${colors.bgSoft} ${colors.text} font-bold text-xl flex items-center justify-center mb-6`}>
                    {chapter.chapterNumber}
                  </div>

                  <h4 className="text-xl font-bold text-white mb-3">{chapter.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-grow">{chapter.description}</p>
                  
                  {/* Lessons list */}
                  {chapter.lessons && chapter.lessons.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-white/5">
                      {chapter.lessons.slice(0, 3).map((lesson: any) => (
                        <div key={lesson.id} className="flex items-start gap-3">
                          <Play className="w-3.5 h-3.5 text-slate-600 mt-1 flex-shrink-0" />
                          <span className="text-slate-300 text-sm">{lesson.title}</span>
                        </div>
                      ))}
                      {chapter.lessons.length > 3 && (
                        <div className="text-xs font-bold text-slate-500 uppercase pt-2">
                          + {chapter.lessons.length - 3} bài học khác
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center p-16 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-slate-400">Đang phát triển nội dung cho ngôn ngữ này...</p>
            </div>
          )}

          <div className="mt-20 text-center">
            <button 
              onClick={handleStart}
              className={`px-8 py-4 rounded-xl ${colors.bgSoft} border ${colors.border} ${colors.text} font-bold text-lg flex items-center gap-3 hover:bg-white/10 transition-all mx-auto cursor-pointer`}
            >
              Bắt đầu hành trình của bạn <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default PublicLanguageDetailPage
