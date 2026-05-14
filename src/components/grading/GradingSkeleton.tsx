/**
 * GradingSkeleton Component
 *
 * Shows a skeleton placeholder while grading is in progress.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'

const GradingSkeleton: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="space-y-4 animate-pulse">
      {/* Score Overview Skeleton */}
      <div className="bg-bg-elevated rounded-xl border border-brand-teal/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Circle skeleton */}
            <div className="w-20 h-20 rounded-full bg-white/5 border-4 border-white/10" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-white/5 rounded-md" />
              <div className="h-6 w-24 bg-white/5 rounded-full" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="h-4 w-32 bg-white/5 rounded-md ml-auto" />
            <div className="h-3 w-16 bg-white/5 rounded-md ml-auto" />
          </div>
        </div>

        {/* Score cards skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map(i => (
            <div key={i} className="bg-bg-primary rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-white/5" />
                <div className="h-4 w-20 bg-white/5 rounded-md" />
              </div>
              <div className="h-8 w-16 bg-white/5 rounded-md mb-2" />
              <div className="h-1.5 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis Skeleton */}
      <div className="bg-bg-elevated rounded-xl border border-brand-teal/10 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-4 rounded-full bg-white/5" />
          <div className="h-4 w-28 bg-white/5 rounded-md" />
          <div className="h-4 w-16 bg-white/5 rounded-md ml-auto" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-3 w-24 bg-white/5 rounded-md" />
                <div className="h-3 w-8 bg-white/5 rounded-md" />
              </div>
              <div className="h-2 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Shimmer overlay */}
      <div className="text-center py-2">
        <p className="text-sm text-brand-cyan/60 animate-pulse">{t('gradingUI.analyzing')}</p>
      </div>
    </div>
  )
}

export default GradingSkeleton
