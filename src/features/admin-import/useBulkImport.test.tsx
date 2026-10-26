// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBulkImport } from './useBulkImport'
import { bulkImportService } from './import.service'

vi.mock('./import.service', () => ({ bulkImportService: { bulkImport: vi.fn() } }))
const source = JSON.stringify({
  chapterId: '11111111-1111-4111-8111-111111111111',
  lessons: [{ lessonId: 'intro', title: 'Intro', lessonType: 'concept', orderIndex: 0 }],
})
const success = {
  lessonsCreated: 1,
  testCasesCreated: 0,
  testCasesReplaced: 0,
  stepsCreated: 0,
  stepsReplaced: 0,
  errors: [],
}

afterEach(cleanup)

describe('bulk import form lifetime', () => {
  beforeEach(() => vi.resetAllMocks())
  it('requires review, deduplicates writes synchronously and blocks repeat after success', async () => {
    let release!: (value: typeof success) => void
    const response = new Promise<typeof success>(resolve => {
      release = resolve
    })
    vi.mocked(bulkImportService.bulkImport).mockReturnValue(response)
    const { result } = renderHook(() => useBulkImport())
    act(() => result.current.edit(source))
    act(() => result.current.submit())
    expect(bulkImportService.bulkImport).not.toHaveBeenCalled()
    act(() => result.current.setReviewed(true))
    act(() => {
      result.current.submit()
      result.current.submit()
    })
    expect(bulkImportService.bulkImport).toHaveBeenCalledTimes(1)
    expect(result.current.pending).toBe(true)
    await act(async () => release(success))
    act(() => result.current.submit())
    expect(bulkImportService.bulkImport).toHaveBeenCalledTimes(1)
    expect(result.current.result).toEqual(success)
    act(() => result.current.edit(source + ' '))
    expect(result.current.reviewed).toBe(false)
    expect(result.current.result).toBeNull()
  })
  it('keeps a failed draft and the backend error for an explicit retry', async () => {
    vi.mocked(bulkImportService.bulkImport).mockRejectedValue({
      response: { data: { error: { message: 'Database chưa sẵn sàng' } } },
    })
    const { result } = renderHook(() => useBulkImport())
    act(() => result.current.edit(source))
    act(() => result.current.setReviewed(true))
    await act(async () => result.current.submit())
    expect(result.current.source).toBe(source)
    expect(result.current.error).toBe('Database chưa sẵn sàng')
    expect(result.current.result).toBeNull()
    expect(result.current.pending).toBe(false)
  })
  it('ignores an old response after unmount and reopening the form', async () => {
    let release!: (value: typeof success) => void
    vi.mocked(bulkImportService.bulkImport).mockReturnValue(
      new Promise(resolve => {
        release = resolve
      })
    )
    const first = renderHook(() => useBulkImport())
    act(() => first.result.current.edit(source))
    act(() => first.result.current.setReviewed(true))
    act(() => first.result.current.submit())
    first.unmount()
    const next = renderHook(() => useBulkImport())
    act(() => next.result.current.edit(source + ' '))
    await act(async () => release(success))
    expect(next.result.current.result).toBeNull()
    expect(next.result.current.source).toBe(source + ' ')
  })
})
