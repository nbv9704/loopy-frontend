import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
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
          completedLessons: data.completed_lessons || 0,
          totalLessons: data.total_lessons || 99,
          currentStreak: data.current_streak || 0,
          longestStreak: data.longest_streak || 0,
        })

        // Extract completion dates for heatmap
        const dates: string[] = []
        if (Array.isArray(data.progress)) {
          for (const p of data.progress) {
            if (p.completed_at) dates.push(p.completed_at)
            if (p.updated_at) dates.push(p.updated_at)
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

      {/* Activity Heatmap */}
      <div className="mb-8">
        <ActivityHeatmap activityDates={activityDates} totalActivities={activityDates.length} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/3 border border-brand-teal/10 rounded-card p-6 text-center">
          <p className="text-brand-teal font-bold text-4xl">{progressStats.completedLessons}</p>
          <p className="text-slate-500 text-xs font-medium mt-2">
            {t('settings.completedLessons')}
          </p>
          <p className="text-slate-600 text-xs mt-1">
            {t('settings.totalLessonsOf', { count: progressStats.totalLessons })}
          </p>
        </div>
        <div className="bg-white/3 border border-brand-teal/10 rounded-card p-6 text-center">
          <p className="text-green-400 font-bold text-4xl">
            {progressStats.totalLessons > 0
              ? Math.round((progressStats.completedLessons / progressStats.totalLessons) * 100)
              : 0}
            %
          </p>
          <p className="text-slate-500 text-xs font-medium mt-2">{t('settings.completionRate')}</p>
          <p className="text-slate-600 text-xs mt-1">{t('settings.keepItUp')}</p>
        </div>
      </div>

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
