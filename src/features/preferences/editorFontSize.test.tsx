// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setEditorFontSize, useEditorFontSize } from './editorFontSize'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browserStorage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  setEditorFontSize(14)
})

describe('optional browser persistence', () => {
  it.each(['localStorage', 'sessionStorage'] as const)('tolerates a blocked %s getter', area => {
    vi.spyOn(window, area, 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    expect(readBrowserStorage('test', area)).toBeNull()
    expect(writeBrowserStorage('test', 'value', area)).toBe(false)
  })

  it('updates every editor in the same page even when storage quota is exhausted', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })
    const first = renderHook(useEditorFontSize)
    const second = renderHook(useEditorFontSize)
    act(() => setEditorFontSize(18))
    expect(first.result.current).toBe(18)
    expect(second.result.current).toBe(18)
  })

  it.each(['NaN', '99', '12px', '13.5', '', null])(
    'resets invalid cross-tab font size %j',
    value => {
      const { result } = renderHook(useEditorFontSize)
      act(() => setEditorFontSize(18))
      act(() =>
        window.dispatchEvent(
          new StorageEvent('storage', { key: 'editor_font_size', newValue: value })
        )
      )
      expect(result.current).toBe(14)
    }
  )

  it('handles cross-tab preference changes, deletion and storage clear', () => {
    const { result } = renderHook(useEditorFontSize)
    act(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: 'editor_font_size', newValue: '20' }))
    )
    expect(result.current).toBe(20)
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })))
    expect(result.current).toBe(14)
  })
})
