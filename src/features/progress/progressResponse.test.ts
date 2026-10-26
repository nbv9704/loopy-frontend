import { expect, it } from 'vitest'
import { readProgressSnapshot } from './progressResponse'

it.each([
  null,
  {},
  { progress: [null] },
  { progress: [{ status: 'unknown' }] },
  { progress: [], totalPoints: '10' },
  { progress: [], completedLessons: -1 },
  { progress: [], currentStreak: null },
])('rejects malformed progress %j instead of rendering zero/NaN', value => {
  expect(() => readProgressSnapshot(value)).toThrow('Không tải được tiến độ')
})
it('keeps explicit zero and supports legacy metric field names', () => {
  expect(readProgressSnapshot({ progress: [], totalPoints: 0, current_streak: 0 })).toMatchObject({
    totalPoints: 0,
    current_streak: 0,
  })
})
it('requires lesson identity for Journey and rejects duplicate completion records', () => {
  expect(() => readProgressSnapshot({ progress: [{ status: 'completed' }] }, true)).toThrow()
  expect(() =>
    readProgressSnapshot({
      progress: [
        { lessonId: 'same', status: 'completed' },
        { lessonId: 'same', status: 'completed' },
      ],
    })
  ).toThrow()
})
