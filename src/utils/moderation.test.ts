import { expect, it } from 'vitest'
import { findModerationKeywords } from './moderation'

it('treats regex punctuation as literal keyword text', () => {
  expect(findModerationKeywords(['c++ [blocked] a.b'], ['c++', '[blocked]', 'a.b'])).toEqual([
    'c++',
    '[blocked]',
    'a.b',
  ])
  expect(findModerationKeywords(['axb blocked c'], ['c++', '[blocked]', 'a.b'])).toEqual([])
})

it('normalizes Vietnamese accents and đ on both sides while retaining the display keyword', () => {
  expect(findModerationKeywords(['  DỮ LIỆU ĐỎ  '], [' đỏ ', 'Dữ liệu'])).toEqual([
    ' đỏ ',
    'Dữ liệu',
  ])
})

it('ignores empty legacy keywords and empty content', () => {
  expect(findModerationKeywords(['hello world'], ['', '   ', '\t'])).toEqual([])
  expect(findModerationKeywords(['', '  '], ['hello'])).toEqual([])
})

it('does not match a word inside another word', () => {
  expect(findModerationKeywords(['classroom'], ['class'])).toEqual([])
  expect(findModerationKeywords(['a class.'], ['class'])).toEqual(['class'])
})
