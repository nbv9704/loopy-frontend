import { expect, it } from 'vitest'
import { getStudyDateKey } from '../../utils/studyDate'
import { toProfileStats } from './profile.model'

it('preserves explicit zero totals instead of replacing them with legacy counts', () => {
  expect(
    toProfileStats({
      completedLessons: 0,
      completed_lessons: 5,
      currentStreak: 0,
      current_streak: 7,
      totalPoints: 0,
      total_points: 100,
      progress: [{ status: 'completed' }],
    })
  ).toMatchObject({ completedLessons: 0, currentStreak: 0, totalPoints: 0 })
})

it('counts completed activity using the same Vietnamese study day as the backend', () => {
  const result = toProfileStats(
    {
      progress: [
        { status: 'completed', completedAt: '2026-10-21T18:00:00Z' },
        { status: 'completed', completed_at: '2026-10-22T00:30:00+07:00' },
        { status: 'completed', completedAt: '2026-10-21T15:00:00Z' },
        { status: 'in_progress', completedAt: '2026-10-22T00:30:00+07:00' },
        { status: 'completed', completedAt: 'invalid' },
      ],
    },
    new Date('2026-10-21T20:00:00Z')
  )
  expect(result.completedToday).toBe(2)
  expect(result.completedLessons).toBe(4)
})

it('keeps date-only study keys and rejects invalid timestamps', () => {
  expect(getStudyDateKey('2026-10-22')).toBe('2026-10-22')
  expect(getStudyDateKey('2026-10-21T18:00:00Z')).toBe('2026-10-22')
  expect(getStudyDateKey('bad-date')).toBeNull()
})
