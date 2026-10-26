const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

/** Preview only; the backend remains responsible for validating submitted content. */
export function findModerationKeywords(
  values: readonly string[],
  keywords: readonly string[]
): string[] {
  const text = normalize(values.filter(Boolean).join(' '))
  if (!text.trim()) return []
  return keywords.filter(keyword => {
    const normalized = normalize(keyword).trim()
    if (!normalized) return false
    const literal = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z0-9])${literal}([^a-z0-9]|$)`, 'i').test(text)
  })
}
