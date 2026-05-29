import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { ArrowLeft, CheckCircle2, Compass, Cpu, Globe, Map, Play, Rocket } from 'lucide-react'

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

const languageLabels: Record<string, { name: string; firstLesson: string; milestone: string }> = {
  python: {
    name: 'Python Foundations',
    firstLesson: 'In dòng chữ đầu tiên',
    milestone: 'Hiểu biến, output và điều kiện cơ bản',
  },
  javascript: {
    name: 'JavaScript Web Starter',
    firstLesson: 'Thay đổi nội dung trên trang',
    milestone: 'Tạo tương tác đầu tiên trong trình duyệt',
  },
  cpp: {
    name: 'C++ School Foundations',
    firstLesson: 'Chạy chương trình C++ đầu tiên',
    milestone: 'Nắm input/output và tư duy giải bài',
  },
}

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
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null)
  const [error, setError] = useState('')
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

  const handleExperienceSelect = (levelId: string) => {
    setSelectedExperience(levelId)
    setStep(3)
  }

  const handleComplete = async () => {
    if (!selectedGoal || !selectedLang || !selectedExperience || loading) return

    setError('')
    setLoading(true)
    try {
      let currentPathId: string | undefined
      const pathsResponse = await api.getPathsByGoal(selectedGoal)
      if (pathsResponse.success && pathsResponse.data) {
        const paths = ((pathsResponse.data as { paths?: any[] }).paths || [])
        const matchingPath = paths.find(path => path.languageId === selectedLang)
        currentPathId = matchingPath?.id
      }

      // Save everything to backend before navigating away.
      const updateResponse = await api.updateProfile({
        learningGoal: selectedGoal,
        experienceLevel: selectedExperience,
        onboardingCompleted: true,
        currentPathId,
        preferredLanguage: selectedLang,
      })

      if (!updateResponse.success) {
        throw new Error(updateResponse.error?.message || 'Profile update failed')
      }
      
      await refreshUser()
      navigate(`/library/${selectedLang}`, { replace: true })
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      setError('Chưa lưu được lộ trình. Vui lòng thử lại để Loopy lưu đúng tiến độ của bạn.')
    } finally {
      setLoading(false)
    }
  }

  const selectedGoalData = goals.find(goal => goal.id === selectedGoal)
  const selectedExperienceData = experienceLevels.find(level => level.id === selectedExperience)
  const pathPreview = languageLabels[selectedLang || 'python'] || languageLabels.python

  return (
    <>
      <SEO {...pageMetadata.learn} />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e1a] p-4 py-24">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-bold text-brand-teal">
              <Map className="h-4 w-4" />
              Journey Builder
            </div>
            <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
              {[1, 2, 3].map(item => (
                <div key={item} className={`h-2 rounded-full ${step >= item ? 'bg-brand-teal' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <div className="mb-12 text-center">
                  <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                    Bạn muốn Loopy giúp bạn đạt điều gì trước?
                  </h1>
                  <p className="text-slate-400 text-lg">Chọn mục tiêu gần nhất. Bạn có thể đổi sau.</p>
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
                        className={`group relative rounded-3xl w-full bg-white/5 backdrop-blur-sm border border-white/10 ${classes.border} hover:bg-white/10 transition-all duration-300 cursor-pointer text-left overflow-hidden`}
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
            ) : step === 2 ? (
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
                    <ArrowLeft className="h-4 w-4" /> Quay lại chọn mục tiêu
                  </button>
                  <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                    Bạn đang ở vạch xuất phát nào?
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
                      className="group relative rounded-3xl w-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-brand-teal/50 hover:bg-white/10 transition-all duration-300 cursor-pointer text-left p-6 flex items-center justify-between disabled:opacity-50"
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
            ) : (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mx-auto w-full max-w-4xl"
              >
                <div className="mb-10 text-center">
                  <button
                    onClick={() => setStep(2)}
                    className="mx-auto mb-6 flex cursor-pointer items-center gap-2 font-medium text-brand-teal transition-colors hover:text-brand-cyan"
                  >
                    <ArrowLeft className="h-4 w-4" /> Quay lại mức kinh nghiệm
                  </button>
                  <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                    Đây là lộ trình khởi đầu của bạn.
                  </h1>
                  <p className="text-lg text-slate-400">Nếu ổn, Loopy sẽ lưu lộ trình và đưa bạn tới bài đầu tiên.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
                  <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-left">
                    <div className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-teal">Bạn chọn</div>
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-black/20 p-4">
                        <div className="text-sm text-slate-500">Mục tiêu</div>
                        <div className="mt-1 font-bold text-white">{selectedGoalData?.title}</div>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-4">
                        <div className="text-sm text-slate-500">Kinh nghiệm</div>
                        <div className="mt-1 font-bold text-white">{selectedExperienceData?.title}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-brand-teal/25 bg-brand-teal/[0.06] p-6 text-left">
                    <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-brand-teal">
                      <Rocket className="h-4 w-4" /> Lộ trình đề xuất
                    </div>
                    <h2 className="text-3xl font-black text-white">{pathPreview.name}</h2>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: 'Bài đầu tiên', value: pathPreview.firstLesson },
                        { label: 'Phiên đầu', value: 'Khoảng 5 phút' },
                        { label: 'Cột mốc đầu', value: pathPreview.milestone },
                      ].map(item => (
                        <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.label}</div>
                          <div className="mt-2 text-sm font-bold leading-6 text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {error && (
                      <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                        {error}
                      </div>
                    )}
                    <button
                      onClick={handleComplete}
                      disabled={loading}
                      className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-teal px-6 py-4 text-lg font-black text-[#0a0e1a] shadow-lg shadow-brand-teal/20 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Đang tạo lộ trình...' : 'Bắt đầu hành trình'}
                      {!loading && <CheckCircle2 className="h-5 w-5" />}
                    </button>
                  </div>
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
