import { expect, it } from 'vitest'
import { readCurriculum } from './curriculumResponse'

const base = () => ({
  chapters: [{ id: 'chapter', languageId: 'python', title: 'Chapter', orderIndex: 0 }],
  lessons: [
    { id: 'lesson', chapterId: 'chapter', lessonId: 'intro', title: 'Lesson', orderIndex: 0 },
  ],
})

it.each([null, {}, { chapters: [null], lessons: [] }, { chapters: [], lessons: [null] }])(
  'rejects malformed collection %j',
  value => {
    expect(() => readCurriculum(value, 'python')).toThrow('Dữ liệu bài học')
  }
)
it.each(['title', 'starterCode', 'taskDescription', 'hint'])(
  'rejects a non-text %s before React or the editor receives it',
  field => {
    const value = base()
    Object.assign(value.lessons[0], { [field]: { unexpected: true } })
    expect(() => readCurriculum(value, 'python')).toThrow('chưa sẵn sàng')
  }
)
it.each(['foreign-chapter', 'foreign-language', 'duplicate-chapter', 'duplicate-lesson'])(
  'rejects inconsistent %s instead of silently dropping rows',
  mode => {
    const value = base()
    if (mode === 'foreign-chapter') value.lessons[0].chapterId = 'other'
    if (mode === 'foreign-language') value.chapters[0].languageId = 'javascript'
    if (mode === 'duplicate-chapter') value.chapters.push(value.chapters[0])
    if (mode === 'duplicate-lesson') value.lessons.push(value.lessons[0])
    expect(() => readCurriculum(value, 'python')).toThrow('không nhất quán')
  }
)
it('uses canonical IDs for colliding slugs and removes private grading fields', () => {
  const value = base()
  value.lessons.push({ ...value.lessons[0], id: 'second' })
  Object.assign(value.lessons[0], {
    solutionCode: 'private solution',
    validationRules: { answer: 'private' },
  })
  const result = readCurriculum(value, 'python')
  expect(result.lessons.map(item => item.lessonId)).toEqual(['lesson', 'second'])
  expect(result.lessons[0]).not.toHaveProperty('solutionCode')
  expect(result.lessons[0]).not.toHaveProperty('validationRules')
})
it('keeps a slug from shadowing the canonical ID of another lesson', () => {
  const value = base()
  value.lessons.push({ ...value.lessons[0], id: 'intro', lessonId: 'another' })
  expect(readCurriculum(value, 'python').lessons[0].lessonId).toBe('lesson')
})
it('preserves lessonSteps returned by the backend and validates their owner and order', () => {
  const value = base()
  Object.assign(value.lessons[0], {
    lessonSteps: [{ id: 'step', lessonId: 'lesson', type: 'note', prompt: 'Read', orderIndex: 0 }],
  })
  expect(readCurriculum(value, 'python').lessons[0].lessonSteps?.[0].prompt).toBe('Read')
  Object.assign(value.lessons[0], {
    lessonSteps: [{ id: 'step', lessonId: 'other', type: 'note', prompt: 'Read' }],
  })
  expect(() => readCurriculum(value, 'python')).toThrow('không nhất quán')
})
