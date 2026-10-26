import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../lib/api'
import { loadLearningJourney, selectedCurriculumPath } from './curriculum.service'
import { buildJourney } from './journey.model'

vi.mock('../../lib/api', () => ({ api: { getCurriculum: vi.fn(), getUserProgress: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

it('orders by chapter then lesson, skips completed lessons and never invents duration', async () => {
  vi.mocked(api.getCurriculum).mockResolvedValue({
    success: true,
    data: {
      chapters: [
        { id: 'b', orderIndex: 2 },
        { id: 'a', orderIndex: 1 },
      ],
      lessons: [
        { id: 'b1', lessonId: 'b1', chapterId: 'b', orderIndex: 1 },
        { id: 'a2', lessonId: 'a2', chapterId: 'a', orderIndex: 2, estimatedTime: 5 },
        { id: 'a1', lessonId: 'a1', chapterId: 'a', orderIndex: 1 },
      ],
    },
  } as never)
  vi.mocked(api.getUserProgress).mockResolvedValue({
    success: true,
    data: {
      progress: [
        { lessonId: 'a1', status: 'completed' },
        { lessonId: 'foreign', status: 'completed' },
      ],
    },
  } as never)
  const data = await loadLearningJourney('python', 'path', 'learner', new AbortController().signal)
  expect(data.lessons.map(lesson => lesson.id)).toEqual(['a1', 'a2', 'b1'])
  const journey = buildJourney(data, data.completedLessons)
  expect(journey.chapters.flatMap(chapter => chapter.lessons.map(lesson => lesson.state))).toEqual([
    'done',
    'current',
    'next',
  ])
  expect(journey.chapters[0].lessons[0].minutes).toBeUndefined()
  expect(journey.chapters[0].lessons[1].minutes).toBe(5)
  expect(journey.progress).toBe(33)
})

it('uses the selected path only for its own language', () => {
  const user = { preferredLanguage: 'python', currentPathId: 'path' }
  expect(selectedCurriculumPath(user, 'python')).toBe('path')
  expect(selectedCurriculumPath(user, 'javascript')).toBeUndefined()
  expect(selectedCurriculumPath(null, 'python')).toBeUndefined()
})

it('allows guests to preview without requesting private progress', async () => {
  vi.mocked(api.getCurriculum).mockResolvedValue({
    success: true,
    data: { chapters: [], lessons: [] },
  } as never)
  const data = await loadLearningJourney(
    'python',
    undefined,
    undefined,
    new AbortController().signal
  )
  expect(api.getUserProgress).not.toHaveBeenCalled()
  expect(buildJourney(data, data.completedLessons)).toMatchObject({ complete: false, progress: 0 })
})

it.each([{ chapters: [] }, { chapters: {}, lessons: [] }, { chapters: [], lessons: null }])(
  'rejects an incomplete curriculum response (%j)',
  async data => {
    vi.mocked(api.getCurriculum).mockResolvedValue({ success: true, data } as never)
    await expect(
      loadLearningJourney('python', undefined, undefined, new AbortController().signal)
    ).rejects.toThrow('Dữ liệu bài học chưa sẵn sàng')
  }
)

it('does not accept missing progress data as zero completion', async () => {
  vi.mocked(api.getCurriculum).mockResolvedValue({
    success: true,
    data: { chapters: [], lessons: [] },
  } as never)
  vi.mocked(api.getUserProgress).mockResolvedValue({ success: true, data: {} } as never)
  await expect(
    loadLearningJourney('python', undefined, 'learner', new AbortController().signal)
  ).rejects.toThrow('Không tải được tiến độ')
})
