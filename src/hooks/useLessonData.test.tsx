// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLessonData } from './useLessonData'
import { api } from '../lib/api'

vi.mock('../lib/api', () => ({ api: { getCurriculum: vi.fn(), getUserProgress: vi.fn() } }))
const curriculum = (id: string) => ({
  success: true,
  data: {
    lessons: [{ id, lessonId: id, chapterId: 'chapter', title: id }],
    chapters: [{ id: 'chapter', orderIndex: 0 }],
  },
})
const progress = (id: string) => ({
  success: true,
  data: { progress: [{ lessonId: id, status: 'completed' }] },
})
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => {
    resolve = done
  })
  return { promise, resolve }
}

describe('lesson data identity and request lifecycle', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.getCurriculum).mockResolvedValue(curriculum('lesson-a') as never)
    vi.mocked(api.getUserProgress).mockResolvedValue(progress('lesson-a') as never)
  })
  afterEach(cleanup)

  it('clears completed progress when the learner signs out', async () => {
    const { result, rerender } = renderHook(
      ({ userId }) => useLessonData('javascript', undefined, userId),
      {
        initialProps: { userId: 'user-a' as string | undefined },
      }
    )
    await waitFor(() => expect(result.current.completedLessons.has('lesson-a')).toBe(true))
    rerender({ userId: undefined })
    await waitFor(() => expect(result.current.completedLessons.size).toBe(0))
  })

  it('ignores an old user progress response after switching accounts', async () => {
    const old = deferred<ReturnType<typeof progress>>()
    vi.mocked(api.getUserProgress)
      .mockReturnValueOnce(old.promise as never)
      .mockResolvedValue(progress('lesson-b') as never)
    vi.mocked(api.getCurriculum)
      .mockResolvedValueOnce(curriculum('lesson-a') as never)
      .mockResolvedValue(curriculum('lesson-b') as never)
    const { result, rerender } = renderHook(
      ({ userId }) => useLessonData('javascript', undefined, userId),
      {
        initialProps: { userId: 'user-a' },
      }
    )
    await waitFor(() => expect(api.getUserProgress).toHaveBeenCalledTimes(1))
    rerender({ userId: 'user-b' })
    await waitFor(() => expect(result.current.completedLessons.has('lesson-b')).toBe(true))
    await act(async () => {
      old.resolve(progress('lesson-a'))
    })
    expect([...result.current.completedLessons]).toEqual(['lesson-b'])
  })

  it('ignores a slow previous curriculum and resets the selected lesson', async () => {
    const old = deferred<ReturnType<typeof curriculum>>()
    vi.mocked(api.getCurriculum)
      .mockReturnValueOnce(old.promise as never)
      .mockResolvedValue(curriculum('python-lesson') as never)
    const { result, rerender } = renderHook(({ language }) => useLessonData(language), {
      initialProps: { language: 'javascript' },
    })
    await waitFor(() => expect(api.getCurriculum).toHaveBeenCalledTimes(1))
    rerender({ language: 'python' })
    await waitFor(() => expect(result.current.activeTab).toBe('python-lesson'))
    await act(async () => {
      old.resolve(curriculum('javascript-lesson'))
    })
    expect(result.current.lessons[0].id).toBe('python-lesson')
  })

  it('exposes a retryable error rather than pretending the catalog is empty', async () => {
    vi.mocked(api.getCurriculum).mockResolvedValueOnce({
      success: false,
      error: { message: 'Offline' },
    } as never)
    const { result } = renderHook(() => useLessonData('javascript'))
    await waitFor(() => expect(result.current.error).toBe('Offline'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.activeTab).toBe('lesson-a'))
    expect(result.current.error).toBeNull()
  })

  it('requires a successful progress read before opening a lesson and retries it', async () => {
    vi.mocked(api.getUserProgress).mockResolvedValueOnce({
      success: false,
      error: { message: 'Progress offline' },
    } as never)
    const { result } = renderHook(() => useLessonData('javascript', undefined, 'learner'))
    await waitFor(() => expect(result.current.error).toBe('Progress offline'))
    expect(result.current.lessons).toEqual([])
    expect(result.current.activeTab).toBe('')
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.completedLessons.has('lesson-a')).toBe(true))
    expect(result.current.error).toBeNull()
  })

  it('does not count completed lessons from another curriculum', async () => {
    vi.mocked(api.getUserProgress).mockResolvedValue(progress('unrelated') as never)
    const { result } = renderHook(() => useLessonData('javascript', undefined, 'learner'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.completedLessons.size).toBe(0)
    expect(result.current.activeTab).toBe('lesson-a')
  })

  it('aborts a previous selected path and clears its active lesson even with equal lesson counts', async () => {
    const old = deferred<ReturnType<typeof curriculum>>()
    vi.mocked(api.getCurriculum)
      .mockReturnValueOnce(old.promise as never)
      .mockResolvedValue(curriculum('new-path-lesson') as never)
    const { result, rerender } = renderHook(
      ({ path }) => useLessonData('javascript', undefined, 'learner', path),
      { initialProps: { path: 'old' } }
    )
    await waitFor(() => expect(api.getCurriculum).toHaveBeenCalledTimes(1))
    const signal = vi.mocked(api.getCurriculum).mock.calls[0][2]
    rerender({ path: 'new' })
    expect(signal?.aborted).toBe(true)
    expect(result.current.activeTab).toBe('')
    await waitFor(() => expect(result.current.activeTab).toBe('new-path-lesson'))
    await act(async () => old.resolve(curriculum('old-path-lesson')))
    expect(result.current.activeTab).toBe('new-path-lesson')
    expect(api.getCurriculum).toHaveBeenLastCalledWith('javascript', 'new', expect.any(AbortSignal))
  })

  it('follows a changed lesson URL without refetching the curriculum', async () => {
    vi.mocked(api.getCurriculum).mockResolvedValue({
      success: true,
      data: {
        chapters: [{ id: 'chapter' }],
        lessons: [
          { id: 'first', lessonId: 'intro', chapterId: 'chapter' },
          { id: 'second', lessonId: 'variables', chapterId: 'chapter' },
        ],
      },
    } as never)
    const { result, rerender } = renderHook(({ id }) => useLessonData('javascript', id), {
      initialProps: { id: 'intro' },
    })
    await waitFor(() => expect(result.current.activeTab).toBe('first'))
    rerender({ id: 'variables' })
    await waitFor(() => expect(result.current.activeTab).toBe('second'))
    expect(api.getCurriculum).toHaveBeenCalledTimes(1)
  })

  it('reports a missing lesson instead of silently displaying a different lesson', async () => {
    const { result } = renderHook(() => useLessonData('javascript', 'missing'))
    await waitFor(() =>
      expect(result.current.error).toBe('Bài học này không có trong lộ trình hiện tại.')
    )
    expect(result.current.activeTab).toBe('')
  })

  it('does not inherit locally saved completion when the account changes', async () => {
    vi.mocked(api.getUserProgress).mockResolvedValue({
      success: true,
      data: { progress: [] },
    } as never)
    const { result, rerender } = renderHook(
      ({ userId }) => useLessonData('javascript', undefined, userId),
      { initialProps: { userId: 'a' } }
    )
    await waitFor(() => expect(result.current.activeTab).toBe('lesson-a'))
    const oldSave = result.current.setCompletedLessons
    act(() => oldSave(previous => new Set(previous).add('lesson-a')))
    expect(result.current.completedLessons.has('lesson-a')).toBe(true)
    rerender({ userId: 'b' })
    expect(result.current.completedLessons.size).toBe(0)
    await waitFor(() => expect(result.current.activeTab).toBe('lesson-a'))
    act(() => result.current.setCompletedLessons(previous => new Set(previous).add('lesson-a')))
    act(() => oldSave(previous => new Set(previous).add('lesson-a')))
    expect(result.current.completedLessons.has('lesson-a')).toBe(true)
  })
})
