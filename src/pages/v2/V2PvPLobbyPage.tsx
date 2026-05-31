/**
 * V2 PvP Lobby Page - Light Theme
 * Matchmaking and match creation
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Lock, Target, Trophy, Users, Zap } from 'lucide-react'
import { V2PublicShell } from '../../components/v2/V2PublicShell'
import { useAuth } from '../../contexts/AuthContext'
import { pvpService } from '../../services/pvp.service'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import { pageMetadata } from '../../utils/seo'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { LoadingScreen } from '../../components/v2/LoadingScreen'

const V2PvPLobbyPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { t, i18n } = useTranslation()

  // Define all content keys needed for this page (including header)
  const contentKeys = [
    // Header content
    'nav.learn',
    'nav.playground',
    'nav.pvp',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    // PvP page content
    'pvp.title',
    'pvp.subtitle',
    'pvp.locked.title',
    'pvp.locked.desc',
    'pvp.locked.btn',
    'pvp.mode.title',
    'pvp.mode.1v1.desc',
    'pvp.mode.br.title',
    'pvp.mode.br.desc',
    'pvp.diff.title',
    'pvp.btn.start1v1',
    'pvp.or',
    'pvp.input.code',
    'pvp.feat1.title',
    'pvp.feat1.desc',
    'pvp.feat2.title',
    'pvp.feat2.desc',
    'pvp.feat3.title',
    'pvp.feat3.desc',
    'pvp.unlock.badge',
    'pvp.unlock.desc',
    'pvp.header.title',
    // Footer content
    'footer.aboutLoopy',
    'footer.about',
    'footer.team',
    'footer.contact',
    'footer.resources',
    'footer.docs',
    'footer.blog',
    'footer.faq',
    'footer.description',
    'footer.allRightsReserved',
    'footer.privacy',
    'footer.terms',
  ]

  // Preload all content at once
  const { content, loading } = useContentPreloader(contentKeys, i18n.language)

  // State hooks - MUST be before any early returns
  const [isSearching, setIsSearching] = useState(false)
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'1v1' | 'battle_royale'>('1v1')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  // Effect hook - MUST be before any early returns
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth', { state: { from: location } })
      } else if (!user.onboardingCompleted) {
        navigate('/onboarding')
      }
    }
  }, [user, authLoading, navigate, location])

  // Show loading screen while content is being fetched
  if (loading) {
    return <LoadingScreen message="Loading PvP lobby..." />
  }

  // Extract header content
  const headerContent = {
    'nav.learn': content['nav.learn'],
    'nav.playground': content['nav.playground'],
    'nav.pvp': content['nav.pvp'],
    'nav.docs': content['nav.docs'],
    'nav.settings': content['nav.settings'],
    'nav.logout': content['nav.logout'],
  }

  // Extract footer content
  const footerContent = {
    'footer.aboutLoopy': content['footer.aboutLoopy'],
    'footer.about': content['footer.about'],
    'footer.team': content['footer.team'],
    'footer.contact': content['footer.contact'],
    'footer.resources': content['footer.resources'],
    'footer.docs': content['footer.docs'],
    'footer.blog': content['footer.blog'],
    'footer.faq': content['footer.faq'],
    'footer.description': content['footer.description'],
    'footer.allRightsReserved': content['footer.allRightsReserved'],
    'footer.privacy': content['footer.privacy'],
    'footer.terms': content['footer.terms'],
  }

  // Extract content values with fallbacks
  const pvpSubtitle = content['pvp.subtitle'] || 'PvP giúp bạn luyện phản xạ và củng cố kiến thức sau khi đã có chiến thắng học tập đầu tiên.'
  const pvpLockedDesc = content['pvp.locked.desc'] || 'Bạn cần nắm vững kiến thức cơ bản trước khi đấu trí với người chơi khác. Hãy hoàn thành ít nhất 1 bài học nhé!'
  const pvpLockedBtn = content['pvp.locked.btn'] || 'Hoàn thành bài đầu tiên'
  const pvpModeTitle = content['pvp.mode.title'] || 'Chọn kiểu thử thách'
  const pvpMode1v1Desc = content['pvp.mode.1v1.desc'] || 'Một vòng nhanh để luyện lại kiến thức vừa học.'
  const pvpModeBrTitle = content['pvp.mode.br.title'] || 'Battle Royale'
  const pvpModeBrDesc = content['pvp.mode.br.desc'] || 'Sắp có. Hiện tại Loopy tập trung vào 1v1 để giữ vòng chơi ngắn và dễ học.'
  const pvpDiffTitle = content['pvp.diff.title'] || 'Độ khó đề xuất'
  const pvpBtnStart1v1 = content['pvp.btn.start1v1'] || 'Bắt đầu thử thách 1v1'
  const pvpOr = content['pvp.or'] || 'HOẶC'
  const pvpInputCode = content['pvp.input.code'] || 'Mã phòng 6 ký tự'
  const pvpFeat1Title = content['pvp.feat1.title'] || 'Realtime'
  const pvpFeat1Desc = content['pvp.feat1.desc'] || 'Vòng chơi ngắn, phản hồi nhanh, không làm gián đoạn lộ trình học.'
  const pvpFeat2Title = content['pvp.feat2.title'] || 'Theo kỹ năng'
  const pvpFeat2Desc = content['pvp.feat2.desc'] || 'Chọn độ khó phù hợp với bài bạn vừa học.'
  const pvpFeat3Title = content['pvp.feat3.title'] || 'Ôn sau trận'
  const pvpFeat3Desc = content['pvp.feat3.desc'] || 'Kết quả nên giúp bạn biết cần ôn lại phần nào trong Journey Map.'
  const pvpUnlockBadge = content['pvp.unlock.badge'] || 'Học để mở khóa'
  const pvpUnlockDesc = content['pvp.unlock.desc'] || 'Càng hoàn thành nhiều chương học, bạn càng mở khóa được nhiều thử thách hóc búa hơn. Hãy tiếp tục lộ trình học tập của mình nhé!'
  const pvpHeaderTitle = content['pvp.header.title'] || 'Thử thách nhanh sau bài học.'

  const canPlay = Boolean(user?.points && user.points > 0)
  const preferredLang = user?.preferredLanguage || (user?.learningGoal === 'build_web' ? 'javascript' : user?.learningGoal === 'school_work' ? 'cpp' : 'python')

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

    if (!canPlay) {
      toast.error('Hoàn thành bài học đầu tiên để mở khóa PvP')
      navigate(`/library/${preferredLang}`)
      return
    }

    setIsJoining(true)
    try {
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

    if (!canPlay) {
      toast.error('Hoàn thành bài học đầu tiên để mở khóa PvP')
      navigate(`/library/${preferredLang}`)
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
      <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
        <div className="relative flex-1 overflow-hidden">
          {/* Ambient background - light theme */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[120px] animate-pulse" />
            <div
              className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-brand-cyan/5 rounded-full blur-[100px] animate-pulse"
              style={{ animationDelay: '1.5s' }}
            />
          </div>

          <main className="flex-grow pt-32 pb-16 relative z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {user && !canPlay && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 bg-gradient-to-r from-brand-teal/10 via-brand-cyan/5 to-brand-teal/10 border border-brand-teal/30 rounded-2xl p-8 text-center"
              >
                <Lock className="mx-auto mb-4 h-10 w-10 text-brand-teal" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Hoàn thành bài học đầu tiên để mở khóa thử thách.
                </h3>
                <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">{pvpLockedDesc}</p>
                <button
                  onClick={() => {
                    navigate(`/library/${preferredLang}`)
                  }}
                  className="px-6 py-3 bg-brand-teal text-white font-bold rounded-xl cursor-pointer hover:scale-105 transition-all"
                >
                  <BookOpen className="mr-2 inline h-4 w-4" /> {pvpLockedBtn}
                </button>
              </motion.div>
            )}
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-3 mb-6 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-brand-teal">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-widest">Challenge Hub</span>
              </div>
              <h1 className="mb-5 text-4xl font-black text-slate-900 md:text-6xl">{pvpHeaderTitle}</h1>
              <p className="text-slate-600 text-xl max-w-2xl mx-auto leading-8">
                {pvpSubtitle}
              </p>
            </motion.div>

            {/* Mode Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">{pvpModeTitle}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* 1v1 Mode */}
                <button
                  onClick={() => setSelectedMode('1v1')}
                  className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                    selectedMode === '1v1'
                      ? 'bg-brand-teal/10 border-brand-teal shadow-lg shadow-brand-teal/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Users className="w-12 h-12 text-brand-teal mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t('pvp.duel')}</h3>
                  <p className="text-slate-600 text-sm">
                    {pvpMode1v1Desc}
                  </p>
                </button>

                {/* Battle Royale Mode */}
                <button
                  onClick={() => setSelectedMode('battle_royale')}
                  disabled
                  className="p-8 rounded-2xl border-2 bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                >
                  <Trophy className="w-12 h-12 text-slate-400 mb-4 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{pvpModeBrTitle}</h3>
                  <p className="text-slate-600 text-sm">
                    {pvpModeBrDesc}
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
              <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">{pvpDiffTitle}</h2>
              <div className="flex gap-4 justify-center">
                {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      selectedDifficulty === difficulty
                        ? 'bg-brand-teal text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
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
                disabled={isSearching || isJoining || !canPlay}
                className="group relative px-12 py-6 bg-gradient-to-r from-brand-teal to-brand-cyan text-white text-xl font-bold rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-brand-teal/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden w-full md:w-auto"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {isSearching ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('pvp.searching')}
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6" />
                      {pvpBtnStart1v1}
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-brand-cyan transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              </button>

              <div className="text-slate-500 font-bold hidden md:block">{pvpOr}</div>

              <form 
                onSubmit={handleJoinRoom}
                className="flex gap-2 w-full md:w-auto"
              >
                <input
                  type="text"
                  placeholder={pvpInputCode}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="px-6 py-6 bg-white border border-slate-200 rounded-2xl text-slate-900 text-xl font-mono focus:outline-none focus:border-brand-teal transition-all w-full md:w-64 text-center uppercase"
                />
                <button
                  type="submit"
                  disabled={isJoining || isSearching || !roomCodeInput || !canPlay}
                  className="px-8 py-6 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50"
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
              <div className="p-6 bg-white border border-slate-200 rounded-xl">
                <Clock className="w-8 h-8 text-brand-teal mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{pvpFeat1Title}</h3>
                <p className="text-slate-600 text-sm">
                  {pvpFeat1Desc}
                </p>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-xl">
                <Target className="w-8 h-8 text-brand-teal mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{pvpFeat2Title}</h3>
                <p className="text-slate-600 text-sm">
                  {pvpFeat2Desc}
                </p>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-xl">
                <Trophy className="w-8 h-8 text-brand-teal mb-3" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{pvpFeat3Title}</h3>
                <p className="text-slate-600 text-sm">
                  {pvpFeat3Desc}
                </p>
              </div>

              {/* Prerequisites Info - Only shown to onboarded users */}
              {user && user.onboardingCompleted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-12 p-6 rounded-2xl bg-white border border-slate-200 text-center col-span-1 md:col-span-3 max-w-2xl mx-auto"
                >
                  <div className="flex items-center justify-center gap-2 text-brand-teal mb-2">
                    <Trophy className="w-5 h-5" />
                    <span className="font-semibold uppercase tracking-wider text-xs">{pvpUnlockBadge}</span>
                  </div>
                  <p className="text-slate-600 text-sm">{pvpUnlockDesc}</p>
                </motion.div>
              )}
            </motion.div>
          </div>
          </main>
        </div>
      </V2PublicShell>
    </>
  )
}

export default V2PvPLobbyPage
