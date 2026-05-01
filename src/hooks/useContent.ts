/**
 * Content Hooks - Static Content from Constants
 *
 * Previously fetched from CMS API, now returns static data from constants.
 * This is faster, simpler, and eliminates unnecessary API calls.
 *
 * Migration: All CMS endpoints have been deprecated.
 * Content is now managed in frontend/src/constants/content.ts
 */

import { LANDING, DOCUMENTATION } from '../constants/content'
import type {
  DocumentationTechnology,
  DocumentationLink,
  LandingFeature,
  LandingStat,
  LandingLanguage,
  LandingHowItWorks,
} from '../types/content.types'

/**
 * Get documentation technologies (static)
 */
export function useDocumentationTechnologies() {
  const data: DocumentationTechnology[] = DOCUMENTATION.technologies.map(tech => ({
    id: tech.id,
    name: tech.name,
    icon: tech.icon,
    description: tech.description,
    linkCount: tech.links.length,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
    refetch: () => {},
  }
}

/**
 * Get documentation links for a technology (static)
 */
export function useDocumentationLinks(technologyId: string) {
  const tech = DOCUMENTATION.technologies.find(t => t.id === technologyId)
  const data: DocumentationLink[] = tech
    ? tech.links.map((link, index) => ({
        id: `${technologyId}-${index}`,
        title: link.title,
        url: link.url,
      }))
    : []

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}

/**
 * Get landing page features (static)
 */
export function useLandingFeatures() {
  const data: LandingFeature[] = LANDING.features.map(feature => ({
    id: feature.id,
    icon: feature.icon,
    title: feature.title,
    description: feature.description,
    color: feature.color,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}

/**
 * Get landing page statistics (static)
 */
export function useLandingStats() {
  const data: LandingStat[] = LANDING.stats.map(stat => ({
    id: stat.id,
    label: stat.label,
    value: stat.value,
    icon: stat.icon,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}

/**
 * Get landing page languages (static)
 */
export function useLandingLanguages() {
  const data: LandingLanguage[] = LANDING.languages.map(lang => ({
    id: lang.id,
    name: lang.name,
    icon: lang.icon,
    description: lang.description,
    color: lang.color,
    lessonCount: lang.lessonCount,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}

/**
 * Get how-it-works steps (static)
 */
export function useHowItWorks() {
  const data: LandingHowItWorks[] = LANDING.howItWorks.map(step => ({
    id: step.id,
    stepNumber: step.step,
    title: step.title,
    description: step.description,
    icon: step.icon,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}
