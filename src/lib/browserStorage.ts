/** Preferences and diagnostics must never prevent the application from starting. */
export function readBrowserStorage(
  key: string,
  area: 'localStorage' | 'sessionStorage' = 'localStorage'
): string | null {
  try {
    return window[area].getItem(key)
  } catch {
    return null
  }
}

export function writeBrowserStorage(
  key: string,
  value: string,
  area: 'localStorage' | 'sessionStorage' = 'localStorage'
): boolean {
  try {
    window[area].setItem(key, value)
    return true
  } catch {
    return false
  }
}
