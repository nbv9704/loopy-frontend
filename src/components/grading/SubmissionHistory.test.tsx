// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import SubmissionHistory from './SubmissionHistory'
import type { SubmissionHistoryData, SubmissionSummary } from '../../types/grading.types'
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
afterEach(cleanup)
const row = (id: string, score: number | null): SubmissionSummary => ({
  id,
  code: '',
  finalScore: score,
  testScore: score,
  aiScore: null,
  gradeLevel: null,
  gradingMethod: null,
  gradedAt: null,
  submittedAt: '',
})
function show(submissions: SubmissionSummary[], bestScore: number | null) {
  const history: SubmissionHistoryData = {
    submissions,
    bestScore,
    averageScore: bestScore,
    totalAttempts: submissions.length,
    page: 1,
    limit: 10,
  }
  render(<SubmissionHistory history={history} />)
}
it('does not mark an ungraded submission as best or print a fabricated zero average', () => {
  show([row('unknown', null)], null)
  expect(screen.queryByText('Best')).toBeNull()
  expect(screen.getByText('grading.average').nextElementSibling?.textContent).toBe('—')
})
it('preserves a genuine zero and selects it over an ungraded attempt', () => {
  show([row('unknown', null), row('zero', 0)], 0)
  expect(screen.getByText('grading.average').nextElementSibling?.textContent).toBe('0')
  expect(screen.getByText('Best').closest('button')?.textContent).toContain('0')
})
it('does not label the best score on this page as the all-time best when it is elsewhere', () => {
  show([row('local-best', 50)], 100)
  expect(screen.queryByText('Best')).toBeNull()
})
