import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Trophy, Star, Award } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { ProgressStats as ProgressStatsType } from '../../types/common'
import LoadingSpinner from '../common/LoadingSpinner'
import ActivityHeatmap from './ActivityHeatmap'

const ProgressStats = () => {
  const { t } = useTranslation()
  const [progressStats, setProgressStats] = useState<ProgressStatsType>({
    completedLessons: 0,
    totalLessons: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0,
    badges: [],
  })
  const [activityDates, setActivityDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgressStats()
  }, [])

  const loadProgressStats = async () => {
    try {
      const response = await api.getUserProgress()
      if (response.success && response.data) {
        const data = response.data as any
        setProgressStats({
          completedLessons: data.completedLessons || data.completed_lessons || 0,
          totalLessons: data.totalLessons || data.total_lessons || 99,
          currentStreak: data.currentStreak || data.current_streak || 0,
          longestStreak: data.longestStreak || data.longest_streak || 0,
          totalPoints: data.totalPoints || data.total_points || 0,
          badges: data.badges || [],
        })

        // Extract completion dates for heatmap
        const dates: string[] = []
        if (Array.isArray(data.progress)) {
          for (const p of data.progress) {
            if (p.completedAt || p.completed_at) dates.push(p.completedAt || p.completed_at)
            if (p.updatedAt || p.updated_at) dates.push(p.updatedAt || p.updated_at)
          }
        }
        setActivityDates(dates)
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-white font-bold text-2xl mb-8">{t('settings.progressTitle')}</h2>

      {/* Streak Info */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-brand-teal" />
          <p className="text-slate-400 text-sm font-medium">
            {t('settings.learningStreak', { count: progressStats.currentStreak })}
          </p>
        </div>
        <div className="h-8 bg-slate-900 border border-brand-teal/20 rounded overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((progressStats.currentStreak / 30) * 100, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-brand-teal to-brand-cyan"
          ></motion.div>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          {t('settings.longestStreak', { count: progressStats.longestStreak })}
        </p>
      </div>

      <div className="mb-8">
        <ActivityHeatmap activityDates={activityDates} totalActivities={activityDates.length} />
      </div>

      {/* Points & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-brand-teal/20 to-brand-cyan/20 border border-brand-teal/30 rounded-card p-6 text-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Star className="w-24 h-24 text-brand-teal" />
          </div>
          <p className="text-white font-bold text-4xl mb-1">{progressStats.totalPoints}</p>
          <p className="text-brand-teal text-xs font-bold uppercase tracking-wider">
            {t('settings.learningPoints')}
          </p>
        </div>

        <div className="bg-white/3 border border-brand-teal/10 rounded-card p-6 text-center">
          <p className="text-white font-bold text-4xl mb-1">{progressStats.completedLessons}</p>
          <div className="flex flex-col">
            <p className="text-slate-500 text-xs font-medium">
              {t('settings.completedLessons')}
            </p>
            <p className="text-slate-600 text-[10px] mt-1">
              {t('settings.totalLessonsOf', { count: progressStats.totalLessons })}
            </p>
          </div>
        </div>

        <div className="bg-white/3 border border-brand-teal/10 rounded-card p-6 text-center">
          <p className="text-green-400 font-bold text-4xl mb-1">
            {progressStats.totalLessons > 0
              ? Math.round((progressStats.completedLessons / progressStats.totalLessons) * 100)
              : 0}
            %
          </p>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{t('settings.completionRate')}</p>
        </div>
      </div>

      {/* Badges Section */}
      {progressStats.badges && progressStats.badges.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-white font-semibold">{t('settings.achievements')}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {progressStats.badges.map((badge) => (
              <div 
                key={badge.id}
                className="bg-white/3 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/5 transition-colors cursor-help group relative"
                title={badge.description}
              >
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-white text-xs font-bold leading-tight">{badge.name}</p>
                <p className="text-slate-500 text-[10px] mt-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white/3 border border-brand-teal/10 rounded-card p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-400 text-sm font-medium">{t('settings.overallProgress')}</p>
          <p className="text-brand-teal font-semibold">
            {progressStats.completedLessons}/{progressStats.totalLessons}
          </p>
        </div>
        <div className="h-4 bg-slate-900 border border-brand-teal/20 rounded overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${progressStats.totalLessons > 0 ? (progressStats.completedLessons / progressStats.totalLessons) * 100 : 0}%`,
            }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-brand-teal via-green-400 to-brand-cyan"
          ></motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProgressStats
