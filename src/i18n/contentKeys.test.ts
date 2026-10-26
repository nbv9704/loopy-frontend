import ts from 'typescript'
import { createInstance } from 'i18next'
import { describe, expect, it } from 'vitest'
import { interfaceContentKeys } from './contentKeys'
import { interfaceTranslations } from './resources'
import { interfaceLanguage } from './language'

it('uses English by default, preserving only an explicit supported preference', () => {
  for (const value of [null, undefined, '', 'invalid', 'en', 'en-US'])
    expect(interfaceLanguage(value)).toBe('en')
  expect(interfaceLanguage('vi')).toBe('vi')
})

describe.each(['en', 'vi'] as const)('%s prepared copy', language => {
  it('resolves every prepared UI key without another language or CMS', async () => {
    const i18n = createInstance()
    await i18n.init({
      lng: language,
      fallbackLng: false,
      resources: { [language]: { translation: interfaceTranslations[language] } },
    })
    for (const key of interfaceContentKeys) {
      expect(i18n.exists(key), key).toBe(true)
      expect(typeof i18n.t(key), key).toBe('string')
      expect(i18n.t(key), key).not.toBe(key)
    }
  })
})

it('prepares static interface keys from all pages/components, including routes not visited yet', () => {
  const requested = new Set(interfaceContentKeys)
  const namespaces = new Set(interfaceContentKeys.map(key => key.split('.')[0]))
  const missing = new Set<string>()
  const sources = import.meta.glob<string>('/src/**/*.{ts,tsx}', {
    eager: true,
    query: '?raw',
    import: 'default',
  })
  for (const [file, text] of Object.entries(sources)) {
    if (!file.includes('test-utils') && !/\.(test|spec)\./.test(file)) {
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
      function visit(node: ts.Node) {
        if (
          (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
          /^[a-z][\w]*(?:\.[\w]+)+$/.test(node.text) &&
          namespaces.has(node.text.split('.')[0]) &&
          !requested.has(node.text)
        )
          missing.add(node.text)
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
  }
  expect([...missing]).toEqual([])
})
