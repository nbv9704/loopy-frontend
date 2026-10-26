import { interfaceTranslations } from './resources'

function textKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([name, child]) => {
    const key = prefix ? `${prefix}.${name}` : name
    return typeof child === 'string' ? [key] : textKeys(child, key)
  })
}

/** All interface copy, including keys used by pages that have not been mounted yet. */
export const interfaceContentKeys = [
  ...new Set(Object.values(interfaceTranslations).flatMap(locale => textKeys(locale))),
].sort()
