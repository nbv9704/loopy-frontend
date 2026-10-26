import { expect, it } from 'vitest'
import { isUserProfileSnapshot } from './profileSnapshot'
import { mergeProfileSnapshot, profileToUser } from './userProfile'

it('prefers the saved canonical learningPath over a stale legacy learningGoal', () => {
  expect(
    profileToUser(
      { id: 'learner', learningPath: 'new', learningGoal: 'old' },
      'learner@example.test'
    ).learningGoal
  ).toBe('new')
})
it('merges personal acknowledgements without erasing learning, role, points or streak state', () => {
  const user = {
    id: 'learner',
    email: 'learner@example.test',
    onboardingCompleted: true,
    learningGoal: 'beginner',
    preferredLanguage: 'python',
    currentPathId: 'path',
    points: 100,
    currentStreak: 2,
    isAdmin: true,
  }
  expect(mergeProfileSnapshot(user, { id: 'learner', displayName: 'Saved' })).toEqual({
    ...user,
    displayName: 'Saved',
  })
  expect(
    mergeProfileSnapshot(user, {
      id: 'learner',
      points: 0,
      onboardingCompleted: false,
      isAdmin: false,
    })
  ).toMatchObject({ points: 0, onboardingCompleted: false, isAdmin: false })
})
it('does not merge another account into the current identity', () => {
  const user = { id: 'alice', email: 'alice@example.test', points: 100 }
  expect(mergeProfileSnapshot(user, { id: 'bob', points: 999 })).toBe(user)
})
it.each([
  { displayName: {} },
  { avatarUrl: 12 },
  { points: -1 },
  { currentStreak: NaN },
  { onboardingCompleted: 'yes' },
  { isAdmin: 'true' },
])('rejects invalid profile values before auth or forms consume them (%#)', patch => {
  expect(isUserProfileSnapshot({ id: 'learner', ...patch })).toBe(false)
})
