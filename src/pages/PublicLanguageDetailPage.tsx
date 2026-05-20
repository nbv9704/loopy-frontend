import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, ArrowRight, Zap, Code2, Sparkles, TrendingUp } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/common/Header'
import SEO from '../components/common/SEO'
import LoadingSpinner from '../components/common/LoadingSpinner'

const langInfo: Record<string, any> = {
  javascript: {
    title: 'JavaScript',
    subtitle: 'Ngôn ngữ của Web',
    desc: 'JavaScript là ngôn ngữ phổ biến nhất thế giới, cho phép bạn xây dựng các trang web tương tác, ứng dụng di động và backend mạnh mẽ.',
    benefits: [
      { title: 'Tương tác tức thì', desc: 'Chạy ngay trên trình duyệt mà không cần cài đặt phức tạp.', icon: Zap },
      { title: 'Vô vàn cơ hội', desc: 'Cộng đồng lớn nhất thế giới, hàng nghìn thư viện hỗ trợ.', icon: Sparkles },
      { title: 'Nhu cầu cao', desc: 'Hầu hết các công ty công nghệ đều cần lập trình viên JavaScript.', icon: TrendingUp }
    ],
    color: 'teal',
    badge: 'Beginners welcome'
  },
  python: {
    title: 'Python',
    subtitle: 'Dễ học, Mạnh mẽ',
    desc: 'Python có cú pháp thân thiện như tiếng Anh. Đây là lựa chọn số 1 cho AI, Data Science và tự động hóa.',
    benefits: [
      { title: 'Dễ đọc, Dễ viết', desc: 'Cú pháp cực kỳ trực quan, phù hợp tuyệt đối cho người mới.', icon: Code2 },
      { title: 'Vua của AI & Data', desc: 'Sở hữu hệ sinh thái thư viện khổng lồ cho Machine Learning.', icon: Sparkles },
      { title: 'Phát triển siêu tốc', desc: 'Viết ít code hơn, làm được nhiều việc hơn.', icon: Zap }
    ],
    color: 'cyan',
    badge: 'High demand'
  },
  cpp: {
    title: 'C++',
    subtitle: 'Tối ưu và Chuyên sâu',
    desc: 'C++ là nền tảng của ngành khoa học máy tính, cung cấp sức mạnh tối đa để kiểm soát phần cứng và bộ nhớ.',
    benefits: [
      { title: 'Hiệu năng đỉnh cao', desc: 'Ngôn ngữ nhanh nhất để làm game, hệ điều hành.', icon: Zap },
      { title: 'Nền tảng vững chắc', desc: 'Học C++ giúp bạn dễ dàng nắm bắt mọi ngôn ngữ khác.', icon: Code2 },
      { title: 'Thách thức thú vị', desc: 'Dành cho những người thích đào sâu vào cốt lõi máy tính.', icon: TrendingUp }
    ],
    color: 'ocean',
    badge: 'For engineers'
  }
}

const PublicLanguageDetailPage: React.FC = () => {
  const { language } = useParams<{ language: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [curriculum, setCurriculum] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const info = langInfo[language || 'javascript'] || langInfo.javascript

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
          {/* Ambient blur */}
          <div className={`absolute top-0 right-0 w-[800px] h-[800px] bg-brand-${info.color}/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3`} />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              
              {/* Left Column: Content */}
              <div className="text-center md:text-left">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-tight"
                >
                  Học {info.title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl text-slate-300 mb-10 leading-relaxed max-w-lg mx-auto md:mx-0"
                >
                  {info.desc}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button 
                    onClick={handleStart}
                    className={`px-8 py-4 rounded-xl bg-brand-${info.color} text-[#0a0e1a] font-bold text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-brand-${info.color}/20 cursor-pointer mx-auto md:mx-0`}
                  >
                    Bắt đầu học ngay
                  </button>
                  
                  <div className="mt-8 flex items-center justify-center md:justify-start gap-4 text-slate-500 font-semibold tracking-widest text-sm uppercase">
                    CÔNG NGHỆ LÕI
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white">
                      <Code2 className={`w-4 h-4 text-brand-${info.color}`} /> {info.title}
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
                    className={`absolute inset-0 bg-brand-${info.color} opacity-40`} 
                    style={{ 
                      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', 
                      transform: 'scale(1.3) rotate(15deg)' 
                    }} 
                  />
                  
                  {/* Inner dark circle */}
                  <div className="absolute w-56 h-56 bg-[#0a0e1a] rounded-full flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                    <div className={`absolute inset-0 bg-brand-${info.color}/10 animate-pulse`} />
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
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Vì sao nên chọn?</h2>
              <p className="text-3xl font-extrabold text-white">Những lợi ích nổi bật của {info.title}</p>
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
                      <Icon className={`w-8 h-8 text-brand-${info.color}`} />
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
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Curriculum</h2>
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
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-${info.color}/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  {/* Chapter Number Badge */}
                  <div className={`w-12 h-12 rounded-2xl bg-brand-${info.color}/10 text-brand-${info.color} font-bold text-xl flex items-center justify-center mb-6`}>
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
              className={`px-8 py-4 rounded-xl bg-brand-${info.color}/10 border border-brand-${info.color}/30 text-brand-${info.color} font-bold text-lg flex items-center gap-3 hover:bg-brand-${info.color}/20 transition-all mx-auto cursor-pointer`}
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
