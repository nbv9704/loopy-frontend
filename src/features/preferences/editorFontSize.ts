import { useSyncExternalStore } from 'react'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browserStorage'

const KEY = 'editor_font_size'
const EVENT = 'fontSizeChanged'
const DEFAULT_SIZE = 14
const parseSize = (value: unknown): number => {
  const number = typeof value === 'string' && value.trim() ? Number(value) : value
  return typeof number === 'number' && Number.isInteger(number) && number >= 12 && number <= 20
    ? number
    : DEFAULT_SIZE
}

// Retain the current preference for this page even when browser persistence is unavailable.
let currentSize = parseSize(readBrowserStorage(KEY))
const getSnapshot = () => currentSize
const subscribe = (notify: () => void) => {
  const onChange = () => notify()
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return
    currentSize = parseSize(event.newValue)
    notify()
  }
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function setEditorFontSize(size: number): void {
  currentSize = parseSize(size)
  writeBrowserStorage(KEY, String(currentSize))
  window.dispatchEvent(new Event(EVENT))
}

export function useEditorFontSize(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SIZE)
}
