/**
 * Content Types
 *
 * Simplified types for static content (previously CMS-managed).
 * These types match the data shapes in constants/content.ts and hooks/useContent.ts.
 */

// ============================================================================
// Documentation Types
// ============================================================================

/**
 * Documentation technology card displayed on the Docs page
 */
export interface DocumentationTechnology {
  id: string
  name: string
  icon: string
  description: string
  /** Programming language label (e.g. "Modern JavaScript (ES6+)") */
  language?: string
  /** Category for filtering */
  category?: string
  /** Number of resource links */
  linkCount: number
}

/**
 * Documentation link within a technology
 */
export interface DocumentationLink {
  id: string
  title: string
  url: string
  /** Link type for icon display */
  type?: 'docs' | 'video' | 'article'
  description?: string | null
}

// ============================================================================
// Landing Page Content Types
// ============================================================================

/**
 * Feature card on the landing page
 */
export interface LandingFeature {
  id: string
  icon: string
  title: string
  description: string
  /** Color theme key (e.g. 'cyan', 'blue', 'yellow') */
  color: string
}

/**
 * Statistic displayed on the landing page
 */
export interface LandingStat {
  id: string
  icon: string
  value: string
  label: string
}

/**
 * Programming language card on the landing page
 */
export interface LandingLanguage {
  id: string
  name: string
  icon: string
  description: string
  color: string
  lessonCount: number
}

/**
 * "How It Works" step on the landing page
 */
export interface LandingHowItWorks {
  id: string
  stepNumber: number
  title: string
  description: string
  icon: string
}

// ============================================================================
// API Response Types (shared)
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data: T
}
