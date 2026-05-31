/**
 * Test file for sync-content-i18n.js script
 *
 * Tests the content sync script functionality:
 * - Converting flat content items to nested i18n structure
 * - Deep merging objects
 */

import { describe, expect, it } from 'vitest'

// Helper functions (copied from sync-content-i18n.js for testing)
function convertToI18nStructure(items) {
  const result = {}

  for (const item of items) {
    const keys = item.key.split('.')
    let current = result

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    }

    const lastKey = keys[keys.length - 1]
    current[lastKey] = item.value
  }

  return result
}

function deepMerge(target, source) {
  const result = { ...target }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], source[key])
      } else {
        result[key] = source[key]
      }
    }
  }

  return result
}

describe('sync-content-i18n helpers', () => {
  it('converts flat content items to nested i18n structure', () => {
    const items = [
      { id: '1', key: 'nav.learn', language: 'vi', value: 'Học tập', categoryId: 'nav', type: 'text' },
      { id: '2', key: 'nav.playground', language: 'vi', value: 'Sân chơi', categoryId: 'nav', type: 'text' },
      { id: '3', key: 'landing.hero.title', language: 'vi', value: 'Hành trình học code', categoryId: 'landing', type: 'text' },
    ]

    expect(convertToI18nStructure(items)).toEqual({
      nav: {
        learn: 'Học tập',
        playground: 'Sân chơi',
      },
      landing: {
        hero: {
          title: 'Hành trình học code',
        },
      },
    })
  })

  it('deep merges nested objects without dropping existing keys', () => {
    const target = {
      nav: {
        learn: 'Learn',
        playground: 'Playground',
      },
      footer: {
        copyright: '© 2024',
      },
    }

    const source = {
      nav: {
        learn: 'Học tập',
        docs: 'Tài liệu',
      },
      landing: {
        hero: {
          title: 'Hành trình học code',
        },
      },
    }

    expect(deepMerge(target, source)).toEqual({
      nav: {
        learn: 'Học tập',
        playground: 'Playground',
        docs: 'Tài liệu',
      },
      footer: {
        copyright: '© 2024',
      },
      landing: {
        hero: {
          title: 'Hành trình học code',
        },
      },
    })
  })

  it('returns an empty object for an empty items array', () => {
    expect(convertToI18nStructure([])).toEqual({})
  })

  it('handles single-level content keys', () => {
    const singleLevelItems = [
      { id: '1', key: 'home', language: 'vi', value: 'Trang chủ', categoryId: 'nav', type: 'text' },
      { id: '2', key: 'about', language: 'vi', value: 'Về chúng tôi', categoryId: 'nav', type: 'text' },
    ]

    expect(convertToI18nStructure(singleLevelItems)).toEqual({
      home: 'Trang chủ',
      about: 'Về chúng tôi',
    })
  })

  it('handles deeply nested content keys', () => {
    const deepItems = [
      { id: '1', key: 'a.b.c.d.e', language: 'vi', value: 'Deep value', categoryId: 'test', type: 'text' },
    ]

    expect(convertToI18nStructure(deepItems)).toEqual({
      a: {
        b: {
          c: {
            d: {
              e: 'Deep value',
            },
          },
        },
      },
    })
  })
})
