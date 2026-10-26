import { expect, it } from 'vitest'
import { readOnboardingCatalog, readPathPreview } from './catalogResponse'

const languages = [{ id: 'python', name: 'Python' }]
const path = { id: 'path', languageId: 'python', goalId: 'beginner', title: 'Beginner' }
it.each([
  { rows: [null] },
  { rows: [{ id: 'python', name: {} }] },
  { rows: [languages[0], languages[0]] },
])('rejects malformed or duplicate language rows (%#)', ({ rows }) => {
  expect(() => readOnboardingCatalog(rows, [path])).toThrow('Không đọc được')
})
it.each([
  { ...path, languageId: 'unknown' },
  { ...path, goalId: undefined },
  { ...path, language_id: 'javascript' },
])('rejects ambiguous path ownership (%#)', item => {
  expect(() => readOnboardingCatalog(languages, [item])).toThrow('không nhất quán')
})
it('supports legacy field names while rejecting duplicate language-goal pairs', () => {
  expect(
    readOnboardingCatalog(languages, [
      { id: 'path', language_id: 'python', goal_id: 'beginner', title: 'Beginner' },
    ]).paths
  ).toHaveLength(1)
  expect(() => readOnboardingCatalog(languages, [path, { ...path, id: 'another' }])).toThrow(
    'không nhất quán'
  )
})
it.each([
  { chapters: [null] },
  { chapters: [{ id: 'chapter', title: 'Chapter', lessonCount: -1 }] },
  { path: { id: 'another' }, chapters: [] },
  { chapters: [{ id: 'chapter', title: 'Chapter', lessonCount: 1, lesson_count: 2 }] },
])('rejects an invalid preview instead of enabling a save (%#)', value => {
  expect(() => readPathPreview(value, 'path')).toThrow('Không đọc được')
})
it('preserves confirmed empty paths and valid zero counts', () => {
  expect(readPathPreview({ path: { id: 'path' }, chapters: [] }, 'path')).toEqual([])
  expect(
    readPathPreview({ chapters: [{ id: 'chapter', title: 'Chapter', lessonCount: 0 }] }, 'path')[0]
      .lessonCount
  ).toBe(0)
})
