export interface ContentItem {
  id: string
  categoryId: string
  key: string
  language: 'vi' | 'en'
  value: string
  description?: string
  type: 'text' | 'markdown' | 'html'
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}
const prefix = 'loopy_content_cache_'
const revisionKey = 'loopy_content_revision'
let revision = 0
const listeners = new Set<() => void>()
const notify = () => {
  revision++
  listeners.forEach(listener => listener())
}
export const getContentCacheRevision = () => revision
export const getServerContentCacheRevision = () => 0
const changed = (event: StorageEvent) => {
  // A cache fill/removal is not a CMS edit. clearContentCache broadcasts one revision.
  if (event.key === null || event.key === revisionKey) notify()
}
// Keep invalidations while no page consumes CMS text (e.g. navigating through admin).
if (typeof window !== 'undefined') window.addEventListener('storage', changed)
export function subscribeContentCache(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function getCacheKey(category?: string, language?: string) {
  return [
    prefix,
    ...(category ? [`cat_${category}`] : []),
    ...(language ? [`lang_${language}`] : []),
  ].join('_')
}
export function getCachedContent(key: string): ContentItem[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const cached = JSON.parse(raw)
    const age = Date.now() - cached.timestamp
    if (
      !Number.isFinite(cached.timestamp) ||
      age < 0 ||
      age > 5 * 60 * 1000 ||
      !Array.isArray(cached.data) ||
      !cached.data.every((item: unknown) => {
        if (!item || typeof item !== 'object') return false
        const row = item as Record<string, unknown>
        return (
          ['id', 'categoryId', 'key', 'value', 'createdAt', 'updatedAt'].every(
            field => typeof row[field] === 'string'
          ) &&
          ['vi', 'en'].includes(row.language as string) &&
          ['text', 'markdown', 'html'].includes(row.type as string)
        )
      })
    ) {
      localStorage.removeItem(key)
      return null
    }
    return cached.data
  } catch {
    return null
  }
}
export function setCachedContent(key: string, data: ContentItem[], owner = revision) {
  if (owner !== revision) return
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    /* Storage is optional. */
  }
}
export function clearContentCache() {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .forEach(key => localStorage.removeItem(key))
    // Also wakes other tabs when there were no cached rows to remove.
    localStorage.setItem(revisionKey, `${Date.now()}:${Math.random()}`)
  } catch {
    /* In-memory invalidation still works when storage is unavailable. */
  }
  notify()
}
