import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { Compass, Play, Globe, Cpu } from 'lucide-react'

import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'

const goals = [
  {
    id: 'start_from_zero',
    langId: 'python',
    icon: Compass,
    color: 'cyan',
    title: 'Tôi chưa biết gì, muốn học lập trình từ đầu',
    desc: 'Bắt đầu với những khái niệm cơ bản nhất qua ngôn ngữ Python dễ hiểu.'
  },
  {
    id: 'build_web',
    langId: 'javascript',
    icon: Globe,
    color: 'teal',
    title: 'Tôi muốn học làm website',
    desc: 'Làm quen với JavaScript - ngôn ngữ chính để tạo nên các trang web hiện đại.'
  },
  {
    id: 'school_work',
    langId: 'cpp',
    icon: Cpu,
    color: 'ocean',
    title: 'Tôi cần học để phục vụ việc trên trường',
    desc: 'Nắm vững tư duy lập trình và cấu trúc dữ liệu với C++.'
  },
  {
    id: 'explore',
    langId: 'python',
    icon: Play,
    color: 'pink',
    title: 'Tôi chỉ muốn học thử xem mình có hợp không',
    desc: 'Trải nghiệm nhanh các bài học thú vị để khám phá tiềm năng bản thân.'
  },
]

// Map goal ID → language ID for routing
const goalToLang: Record<string, string> = {
  start_from_zero: 'python',
  build_web: 'javascript',
  school_work: 'cpp',
  explore: 'python',
}

const supportedLanguages = new Set(['javascript', 'python', 'cpp'])

interface OnboardingLocationState {
  intendedLanguage?: string
}

const experienceLevels = [
  { id: 'never_coded', title: 'Tôi chưa bao giờ lập trình', desc: 'Sẽ bắt đầu từ những thứ nhỏ nhất.' },
  { id: 'watched_some', title: 'Tôi đã xem/đọc qua nhưng chưa tự làm được', desc: 'Cần thực hành để hiểu rõ hơn.' },
  { id: 'know_basics', title: 'Tôi đã biết một vài kiến thức cơ bản', desc: 'Muốn hệ thống lại và nâng cao kỹ năng.' },
]

const colorMapClasses: Record<string, { border: string; text: string; glow: string }> = {
  teal: {
    border: 'hover:border-brand-teal/50',
    text: 'text-brand-teal',
    glow: 'group-hover:shadow-brand-teal/20',
  },
  cyan: {
    border: 'hover:border-brand-cyan/50',
    text: 'text-brand-cyan',
    glow: 'group-hover:shadow-brand-cyan/20',
  },
  ocean: {
    border: 'hover:border-brand-ocean/50',
    text: 'text-brand-ocean',
    glow: 'group-hover:shadow-brand-ocean/20',
  },
  pink: {
    border: 'hover:border-pink-500/50',
    text: 'text-pink-400',
    glow: 'group-hover:shadow-pink-500/20',
  },
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser } = useAuth()
  const locationState = location.state as OnboardingLocationState | null
  const intendedLanguage = locationState?.intendedLanguage
  const safeIntendedLanguage = intendedLanguage && supportedLanguages.has(intendedLanguage)
    ? intendedLanguage
    : undefined
  
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If not logged in, redirect to auth page
    if (!user) {
      navigate('/auth', {
        state: {
          from: { pathname: '/onboarding' },
          intendedLanguage: safeIntendedLanguage,
        },
      })
      return
    }

    // If user has already completed onboarding, redirect to their course
    if (user.onboardingCompleted) {
      const lang = safeIntendedLanguage || goalToLang[user.learningGoal || ''] || 'javascript'
      navigate(`/library/${lang}`, { replace: true })
    }
  }, [safeIntendedLanguage, user, navigate])

  const handleGoalSelect = (goalId: string, langId: string) => {
    setSelectedGoal(goalId)
    setSelectedLang(safeIntendedLanguage || langId)
    setStep(2)
  }

  const handleExperienceSelect = async (levelId: string) => {
    if (!selectedGoal || !selectedLang || loading) return
    
    setLoading(true)
    try {
      let currentPathId: string | undefined
      const pathsResponse = await api.getPathsByGoal(selectedGoal)
      if (pathsResponse.success && pathsResponse.data) {
        const paths = ((pathsResponse.data as { paths?: any[] }).paths || [])
        const matchingPath = paths.find(path => path.languageId === selectedLang)
        currentPathId = matchingPath?.id
      }

      // Save everything to backend
      await api.updateProfile({
        learningGoal: selectedGoal,
        experienceLevel: levelId,
        onboardingCompleted: true,
        currentPathId,
        preferredLanguage: selectedLang,
      })
      
      await refreshUser()
      navigate(`/library/${selectedLang}`, { replace: true })
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      navigate(`/library/${selectedLang}`, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO {...pageMetadata.learn} />
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="text-center relative z-10 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <div className="mb-12">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                    Mục tiêu của bạn là gì?
                  </h1>
                  <p className="text-slate-400 text-lg">Chúng mình sẽ cá nhân hóa lộ trình dựa trên lựa chọn của bạn.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  {goals.map((goal, index) => {
                    const Icon = goal.icon
                    const classes = colorMapClasses[goal.color] || colorMapClasses.teal

                    return (
                      <motion.button
                        key={goal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => handleGoalSelect(goal.id, goal.langId)}
                        className={`group relative rounded-2xl w-full bg-white/5 backdrop-blur-sm border border-white/10 ${classes.border} hover:bg-white/10 transition-all duration-300 cursor-pointer text-left overflow-hidden`}
                      >
                        <div className="relative z-10 flex items-center p-6 gap-5">
                          <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors ${classes.text}`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          <div>
                            <h2 className="text-white font-bold text-lg mb-0.5">{goal.title}</h2>
                            <p className="text-slate-500 text-sm">{goal.desc}</p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="mb-12">
                  <button 
                    onClick={() => setStep(1)}
                    className="text-brand-teal hover:text-brand-cyan transition-colors flex items-center gap-2 mx-auto mb-6 cursor-pointer font-medium"
                  >
                    Quay lại chọn mục tiêu
                  </button>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                    Bạn đã có kinh nghiệm chưa?
                  </h1>
                  <p className="text-slate-400 text-lg">Điều này giúp chúng mình chọn điểm bắt đầu phù hợp.</p>
                </div>

                <div className="space-y-4">
                  {experienceLevels.map((level, index) => (
                    <motion.button
                      key={level.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 8 }}
                      onClick={() => handleExperienceSelect(level.id)}
                      disabled={loading}
                      className="group relative rounded-2xl w-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-brand-teal/50 hover:bg-white/10 transition-all duration-300 cursor-pointer text-left p-6 flex items-center justify-between disabled:opacity-50"
                    >
                      <div>
                        <h2 className="text-white font-bold text-xl mb-1 group-hover:text-brand-teal transition-colors">
                          {level.title}
                        </h2>
                        <p className="text-slate-500 text-sm">{level.desc}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-teal group-hover:text-[#0a0e1a] transition-all">
                        <Play className="w-5 h-5" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

export default OnboardingPage
