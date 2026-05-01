import React from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />
}

// Documentation Card Skeleton
export const DocCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
      <Skeleton className="w-12 h-12 rounded-lg mb-6" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="w-4 h-4 rounded" />
      </div>
    </div>
  )
}

// Feature Card Skeleton
export const FeatureCardSkeleton: React.FC = () => {
  return (
    <div className="relative">
      <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8">
        <Skeleton className="w-12 h-12 rounded-lg mb-6" />
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

// Stat Card Skeleton
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 mb-6">
        <Skeleton className="w-10 h-10 rounded" />
      </div>
      <Skeleton className="h-12 w-32 mx-auto mb-2" />
      <Skeleton className="h-6 w-40 mx-auto" />
    </div>
  )
}

// Language Card Skeleton
export const LanguageCardSkeleton: React.FC = () => {
  return (
    <div className="relative">
      <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8">
        <Skeleton className="w-16 h-16 rounded-2xl mb-6" />
        <Skeleton className="h-8 w-2/3 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

// How It Works Step Skeleton
export const HowItWorksStepSkeleton: React.FC = () => {
  return (
    <div className="relative">
      <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8">
        <Skeleton className="h-16 w-24 mb-4" />
        <Skeleton className="w-12 h-12 rounded-lg mb-6" />
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

// Navigation Item Skeleton
export const NavItemSkeleton: React.FC = () => {
  return <Skeleton className="h-10 w-24 rounded-xl" />
}

// Footer Link Skeleton
export const FooterLinkSkeleton: React.FC = () => {
  return <Skeleton className="h-4 w-20 mb-3" />
}
