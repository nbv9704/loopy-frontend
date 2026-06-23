/**
 * LoadingScreen Component - Show while content is loading
 *
 * Displays a skeleton loader or spinner while CMS content is being fetched.
 * Prevents fallback text flash by showing a proper loading state.
 * Fits exactly in viewport without scrolling at any resolution.
 */

import React from 'react'

interface LoadingScreenProps {
  /**
   * Optional custom message to display
   */
  message?: string
  /**
   * Optional custom className for styling
   */
  className?: string
}

/**
 * LoadingScreen Component
 *
 * Shows a loading state while content is being fetched from CMS.
 * Uses skeleton loaders to match the page layout.
 * Viewport-height only, no scrolling.
 *
 * @example
 * if (loading) return <LoadingScreen />
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading content...',
  className = '',
}) => {
  return (
    <div className={`loopy-page flex h-screen flex-col overflow-hidden ${className}`}>
      {/* Hero Section Skeleton - Takes up most of viewport */}
      <section className="relative flex flex-1 items-center overflow-hidden px-4 py-8 md:px-6">
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-teal/20 blur-3xl animate-v2-loading-glow" />
        <div className="absolute right-[-6rem] bottom-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl animate-v2-loading-glow [animation-delay:0.7s]" />
        <div className="relative mx-auto w-full max-w-7xl animate-v2-page-enter">
          <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            {/* Left Column */}
            <div className="space-y-3">
              {/* Badge Skeleton */}
              <div className="inline-flex rounded-full border loopy-border loopy-surface-soft px-3 py-1 shadow-sm">
                <div className="h-3 w-20 animate-pulse rounded loopy-skeleton" />
              </div>

              {/* Title Skeleton */}
              <div className="space-y-2">
                <div className="h-7 w-full animate-pulse rounded loopy-skeleton" />
                <div className="h-7 w-4/5 animate-pulse rounded loopy-skeleton" />
              </div>

              {/* Subtitle Skeleton */}
              <div className="space-y-1">
                <div className="h-3 w-full animate-pulse rounded loopy-skeleton" />
                <div className="h-3 w-5/6 animate-pulse rounded loopy-skeleton" />
              </div>

              {/* Buttons Skeleton */}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <div className="h-9 w-28 animate-pulse rounded-lg loopy-skeleton shadow-sm" />
                <div className="h-9 w-28 animate-pulse rounded-lg loopy-skeleton shadow-sm" />
              </div>

              {/* Languages Skeleton */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-7 w-16 animate-pulse rounded-full loopy-skeleton"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>

            {/* Right Column - Compact Product Mock Skeleton */}
            <div className="hidden rounded-2xl border loopy-border loopy-surface-soft p-2 shadow-2xl lg:block">
              <div className="h-40 animate-pulse rounded-xl bg-gradient-to-br from-brand-teal/10 via-brand-cyan/20 to-brand-teal/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Loading Message - Fixed at bottom */}
      <div className="loopy-surface-soft flex items-center justify-center border-t loopy-border py-4">
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-3 border-[color:var(--loopy-border)] border-t-brand-teal" />
          <p className="text-xs loopy-muted">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
