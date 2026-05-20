/**
 * PvP Lobby Page
 * Matchmaking and match creation
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Zap, Users, Clock, Target } from 'lucide-react'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import { useAuth } from '../contexts/AuthContext'
import { pvpService } from '../services/pvp.service'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'

const PvPLobbyPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth', { state: { from: location } })
      } else if (!user.onboardingCompleted) {
        navigate('/onboarding')
      }
    }
  }, [user, authLoading, navigate, location])

  const [isSearching, setIsSearching] = useState(false)
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'1v1' | 'battle_royale'>('1v1')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCodeInput.trim()) return

    if (!user) {
      toast.error(t('pvp.loginToPlay'))
      navigate('/auth', { state: { from: location } })
      return
    }

    if (!user.onboardingCompleted) {
      toast.error(t('pvp.completeOnboardingFirst'))
      navigate('/onboarding')
      return
    }

    setIsJoining(true)
    try {
      // Validate room code exists
      const match = await pvpService.joinMatch(roomCodeInput.trim().toUpperCase())
      toast.success(t('pvp.joining'))
      navigate(`/pvp/match/${match.room_code}`)
    } catch (error: any) {
      toast.error(t('pvp.invalidRoomCode'))
    } finally {
      setIsJoining(false)
    }
  }

  const handleQuickMatch = async () => {
    if (!user) {
      toast.error(t('pvp.loginToPlay'))
      navigate('/auth', { state: { from: location } })
      return
    }

    if (!user.onboardingCompleted) {
      toast.error(t('pvp.completeOnboardingFirst'))
      navigate('/onboarding')
      return
    }

    setIsSearching(true)

    try {
      const match = await pvpService.findMatch({
        mode: selectedMode,
        difficulty: selectedDifficulty,
      })

      toast.success(t('pvp.matchFound'))
      navigate(`/pvp/match/${match.room_code}`)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to find match'

      toast.error(errorMessage)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <>
      <SEO {...pageMetadata.challenges} />
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-brand-ocean/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      <Header />

      <main className="flex-grow pt-32 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* PvP Gate: encourage learning first (Roadmap Phase 6) */}
          {user && (user.points === undefined || user.points === 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-gradient-to-r from-brand-teal/10 via-brand-cyan/5 to-brand-teal/10 border border-brand-teal/30 rounded-2xl p-8 text-center"
            >
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Hoàn thành bài học đầu tiên để mở Thách Đấu!
              </h3>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                Bạn cần nắm vững kiến thức cơ bản trước khi đấu trí với người chơi khác. Hãy hoàn thành ít nhất 1 bài học nhé!
              </p>
              <button
                onClick={() => {
                  const lang = user.learningGoal === 'build_web' ? 'javascript' : user.learningGoal === 'school_work' ? 'cpp' : 'python'
                  navigate(`/library/${lang}`)
                }}
                className="px-6 py-3 bg-brand-teal text-[#0a0e1a] font-bold rounded-xl cursor-pointer hover:scale-105 transition-all"
              >
                Bắt đầu học ngay →
              </button>
            </motion.div>
          )}
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <Zap className="w-12 h-12 text-brand-teal" />
              <h1 className="text-5xl font-bold text-white">{t('pvp.title')}</h1>
            </div>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto">
              {t('pvp.subtitle')}
            </p>
          </motion.div>

          {/* Mode Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('pvp.selectMode')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* 1v1 Mode */}
              <button
                onClick={() => setSelectedMode('1v1')}
                className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                  selectedMode === '1v1'
                    ? 'bg-brand-teal/10 border-brand-teal shadow-lg shadow-brand-teal/20'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <Users className="w-12 h-12 text-brand-teal mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-2">{t('pvp.duel')}</h3>
                <p className="text-slate-400 text-sm">
                  {t('pvp.duelDesc')}
                </p>
              </button>

              {/* Battle Royale Mode */}
              <button
                onClick={() => setSelectedMode('battle_royale')}
                disabled
                className="p-8 rounded-2xl border-2 bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
              >
                <Trophy className="w-12 h-12 text-slate-500 mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-white mb-2">{t('pvp.battleRoyale')}</h3>
                <p className="text-slate-400 text-sm">
                  {t('pvp.battleRoyaleDesc')}
                </p>
              </button>
            </div>
          </motion.div>

          {/* Difficulty Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('pvp.selectDifficulty')}</h2>
            <div className="flex gap-4 justify-center">
              {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    selectedDifficulty === difficulty
                      ? 'bg-brand-teal text-[#0a0e1a]'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {t(`pvp.${difficulty}`)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Quick Match Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-6 justify-center items-center mb-16"
          >
            <button
              onClick={handleQuickMatch}
              disabled={isSearching || isJoining}
              className="group relative px-12 py-6 bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] text-xl font-bold rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-brand-teal/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden w-full md:w-auto"
            >
              <span className="relative z-10 flex items-center gap-3">
                {isSearching ? (
                  <>
                    <div className="w-6 h-6 border-2 border-[#0a0e1a] border-t-transparent rounded-full animate-spin" />
                    {t('pvp.searching')}
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    {t('pvp.quickMatch')}
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-brand-cyan transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            </button>

            <div className="text-slate-500 font-bold hidden md:block">OR</div>

            <form 
              onSubmit={handleJoinRoom}
              className="flex gap-2 w-full md:w-auto"
            >
              <input
                type="text"
                placeholder={t('pvp.enterRoomCode')}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="px-6 py-6 bg-white/5 border border-white/10 rounded-2xl text-white text-xl font-mono focus:outline-none focus:border-brand-teal transition-all w-full md:w-64 text-center uppercase"
              />
              <button
                type="submit"
                disabled={isJoining || isSearching || !roomCodeInput}
                className="px-8 py-6 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all disabled:opacity-50"
              >
                {isJoining ? t('pvp.joining') : t('pvp.joinRoom')}
              </button>
            </form>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <Clock className="w-8 h-8 text-brand-teal mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">{t('pvp.realtime')}</h3>
              <p className="text-slate-400 text-sm">
                {t('pvp.realtimeDesc')}
              </p>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <Target className="w-8 h-8 text-brand-teal mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">{t('pvp.skillBased')}</h3>
              <p className="text-slate-400 text-sm">
                {t('pvp.skillBasedDesc')}
              </p>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <Trophy className="w-8 h-8 text-brand-teal mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">{t('pvp.ranked')}</h3>
              <p className="text-slate-400 text-sm">
                {t('pvp.rankedDesc')}
              </p>
            </div>

            {/* Prerequisites Info - Only shown to onboarded users */}
            {user && user.onboardingCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 text-center col-span-1 md:col-span-3 max-w-2xl mx-auto"
              >
                <div className="flex items-center justify-center gap-2 text-brand-cyan mb-2">
                  <Trophy className="w-5 h-5" />
                  <span className="font-semibold uppercase tracking-wider text-xs">Học để mở khóa</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Càng hoàn thành nhiều chương học, bạn càng mở khóa được nhiều thử thách hóc búa hơn. 
                  Hãy tiếp tục lộ trình học tập của mình nhé!
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
      </div>
    </>
  )
}

export default PvPLobbyPage
