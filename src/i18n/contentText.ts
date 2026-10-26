/** Recognize seed markers only; authored CMS copy remains authoritative. */
export function isUntranslatedContent(key: string, value: string): boolean {
  const text = value.trim()
  return text === key ||
    ['VI', 'EN'].some(locale => text === `${key.toUpperCase()} ${locale}`)
}
