import { api } from './api'
import { getContentCacheRevision } from './contentCache'
import { isUntranslatedContent } from '../i18n/contentText'

interface Entry {
  value: string | null
  error: string | null
  expires: number
}
interface Group {
  keys: Set<string>
  promise: Promise<void>
}
interface Scope {
  language: string
  entries: Map<string, Entry>
  pending: Map<string, Promise<void>>
  queued?: Group
  failure: string | null
  retryAt: number
}
interface Batch {
  items: Record<string, string>
  ambiguousKeys?: string[]
}
export interface ContentKeyResult {
  items: Record<string, string | null>
  error: string | null
}
const ttl = 5 * 60 * 1000
const cooldown = 30 * 1000
let generation = -1
const scopes = new Map<string, Scope>()
const unavailable = 'Không tải được nội dung CMS. Đang dùng bản dịch dự phòng.'

/** Synchronous read prevents a second loading screen for already prepared page copy. */
export function readContentKeys(
  keys: string[],
  language: string,
  owner: number
): ContentKeyResult | null {
  if (generation !== owner || owner !== getContentCacheRevision()) return null
  const scope = scopes.get(language)
  if (!scope) return null
  const now = Date.now()
  const items: ContentKeyResult['items'] = Object.create(null)
  let error: string | null = null
  for (const key of keys) {
    const entry = scope.entries.get(key)
    if (!entry || entry.expires <= now) {
      if (!scope.failure || scope.retryAt <= now) return null
      items[key] = null
      error ??= scope.failure
    } else {
      items[key] = entry.value
      error ??= entry.error
    }
  }
  return { items, error }
}

/** Prepared interface copy stays ready for this tab until an explicit CMS revision/reload. */
export function retainPreparedContent(keys: string[], language: string, owner: number) {
  if (generation !== owner || owner !== getContentCacheRevision()) return
  const scope = scopes.get(language)
  if (!scope || keys.some(key => !scope.entries.has(key))) return
  for (const key of keys) scope.entries.get(key)!.expires = Infinity
}

async function fetchGroup(scope: Scope, keys: string[]) {
  try {
    for (let offset = 0; offset < keys.length; offset += 200) {
      const batch = keys.slice(offset, offset + 200)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      let response
      try {
        response = await api.request<Batch>('/api/content/batch', {
          method: 'POST',
          body: JSON.stringify({ keys: batch, language: scope.language }),
          signal: controller.signal,
          skipAuthRefresh: true,
          suppressErrorToast: true,
        })
      } finally {
        clearTimeout(timeout)
      }
      const data = response.data
      if (
        !response.success ||
        !data ||
        !data.items ||
        typeof data.items !== 'object' ||
        Array.isArray(data.items) ||
        (data.ambiguousKeys !== undefined &&
          (!Array.isArray(data.ambiguousKeys) ||
            !data.ambiguousKeys.every(key => typeof key === 'string' && batch.includes(key)))) ||
        batch.some(
          key =>
            Object.prototype.hasOwnProperty.call(data.items, key) &&
            typeof data.items[key] !== 'string'
        )
      )
        throw new Error(response.error?.message || unavailable)

      const ambiguous = new Set(data.ambiguousKeys)
      for (const key of batch) {
        const value = Object.prototype.hasOwnProperty.call(data.items, key) ? data.items[key] : null
        const untranslated = value !== null && isUntranslatedContent(key, value)
        scope.entries.set(key, {
          value: !ambiguous.has(key) && !untranslated ? value : null,
          error: ambiguous.has(key)
            ? 'CMS có key trùng; đang dùng bản dịch dự phòng.'
            : untranslated
              ? 'CMS còn nội dung mẫu; đang dùng bản dịch dự phòng.'
              : null,
          expires: Date.now() + ttl,
        })
      }
    }
  } catch (error) {
    // One failing batch must not fan out to N GETs or retry on every navigation.
    scope.failure = error instanceof Error ? error.message : unavailable
    scope.retryAt = Date.now() + cooldown
  } finally {
    for (const key of keys) scope.pending.delete(key)
  }
}

/** Shared only for public text: never cache account-specific data here. */
export async function loadContentKeys(keys: string[], language: string, owner: number) {
  if (owner !== getContentCacheRevision()) throw new DOMException('Aborted', 'AbortError')
  if (generation !== owner) {
    scopes.clear()
    generation = owner
  }
  let scope = scopes.get(language)
  if (!scope) {
    scope = { language, entries: new Map(), pending: new Map(), failure: null, retryAt: 0 }
    scopes.set(language, scope)
  }
  const current = scope
  for (const [key, entry] of current.entries)
    if (entry.expires <= Date.now()) current.entries.delete(key)
  const waits = new Set<Promise<void>>()
  for (const key of keys) {
    if (current.entries.has(key)) continue
    const pending = current.pending.get(key)
    if (pending) {
      waits.add(pending)
      continue
    }
    if (current.retryAt > Date.now()) continue
    if (!current.queued) {
      const group: Group = { keys: new Set(), promise: Promise.resolve() }
      group.promise = Promise.resolve().then(async () => {
        current.queued = undefined
        await fetchGroup(current, [...group.keys])
      })
      current.queued = group
    }
    current.queued.keys.add(key)
    current.pending.set(key, current.queued.promise)
    waits.add(current.queued.promise)
  }
  await Promise.all(waits)
  if (owner !== getContentCacheRevision()) throw new DOMException('Aborted', 'AbortError')
  const items: Record<string, string | null> = Object.create(null)
  let error: string | null = null
  for (const key of keys) {
    const entry = current.entries.get(key)
    items[key] = entry?.value ?? null
    error ??= entry ? entry.error : current.failure
  }
  return { items, error }
}
