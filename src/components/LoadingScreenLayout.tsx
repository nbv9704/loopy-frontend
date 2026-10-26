import React from 'react'

interface LoadingScreenLayoutProps {
  message: React.ReactNode
  className?: string
  screenRef?: React.Ref<HTMLDivElement>
}

/** Shared, hook-free skeleton for the initial HTML and React loading states. */
export const LoadingScreenLayout: React.FC<LoadingScreenLayoutProps> = ({
  message,
  className = '',
  screenRef,
}) => {
  return (
    <div
      ref={screenRef}
      className={`loopy-loading-screen loopy-page flex h-screen flex-col overflow-hidden ${className}`}
    >
      {/* Hero Section Skeleton - Takes up most of viewport */}
      <section className="relative flex flex-1 items-center overflow-hidden px-4 py-8 md:px-6">
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-teal/20 blur-3xl animate-v2-loading-glow" />
        <div className="absolute right-[-6rem] bottom-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl animate-v2-loading-glow [animation-delay:0.7s]" />
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
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
      <div className="flex shrink-0 items-center justify-center px-4 py-4">
        <p className="loopy-loading-message text-center text-[13px] leading-6">{message}</p>
      </div>
    </div>
  )
}
