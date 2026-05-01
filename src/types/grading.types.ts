/**
 * Grading System Types (Frontend)
 *
 * TypeScript types for the auto-grading system UI components.
 */

// ============================================================================
// Core Types
// ============================================================================

export type GradingMethod = 'test' | 'ai' | 'both'

export type GradingDepth = 'quick' | 'careful' | 'thorough'

export type GradeLevel = 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor'

export interface GradingResult {
  submissionId: string
  testScore: number
  aiScore: number | null
  finalScore: number
  gradeLevel: GradeLevel
  feedback: GradingFeedback
  gradedAt: string
  executionTime: number
}

export interface GradingFeedback {
  testResults: TestRunResult | null
  aiAnalysis: AIAnalysis | null
  overallFeedback: string
}

// ============================================================================
// Test Results
// ============================================================================

export interface TestRunResult {
  testScore: number
  results: TestCaseResult[]
  totalExecutionTime: number
}

export interface TestCaseResult {
  testCaseId: string
  passed: boolean
  actualOutput: any
  expectedOutput: any
  executionTime: number
  error: string | null
  description: string
}

// ============================================================================
// AI Analysis
// ============================================================================

export interface AIAnalysis {
  aiScore: number
  scores: {
    codeQuality: number
    bestPractices: number
    complexity: number
    security: number
  }
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  feedback: string
}

// ============================================================================
// Submission History
// ============================================================================

export interface SubmissionHistoryData {
  submissions: SubmissionSummary[]
  bestScore: number
  averageScore: number
  totalAttempts: number
  page: number
  limit: number
}

export interface SubmissionSummary {
  id: string
  code: string
  testScore: number | null
  aiScore: number | null
  finalScore: number | null
  gradeLevel: GradeLevel | null
  gradingMethod: GradingMethod
  gradedAt: string | null
  submittedAt: string
}

// ============================================================================
// Submission Detail
// ============================================================================

export interface SubmissionDetail {
  id: string
  code: string
  testScore: number | null
  aiScore: number | null
  finalScore: number | null
  gradeLevel: GradeLevel | null
  testResults: TestRunResult | null
  aiAnalysis: AIAnalysis | null
  feedback: string | null
  gradingMethod: GradingMethod
  gradedAt: string | null
  submittedAt: string
  executionTime: number
}

// ============================================================================
// Grade Level Helpers
// ============================================================================

export const GRADE_LABELS: Record<GradeLevel, string> = {
  excellent: 'Xuất sắc',
  good: 'Tốt',
  satisfactory: 'Đạt',
  needs_improvement: 'Cần cải thiện',
  poor: 'Chưa đạt',
}

export const GRADE_COLORS: Record<GradeLevel, string> = {
  excellent: '#10b981',
  good: '#3b82f6',
  satisfactory: '#f59e0b',
  needs_improvement: '#f97316',
  poor: '#ef4444',
}
