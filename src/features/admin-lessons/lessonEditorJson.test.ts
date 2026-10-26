import { expect, it } from 'vitest'
import {
  hasUsableAnswerKey,
  parseAnswerKey,
  parseJsonArray,
  parseJsonField,
  parseJsonObject,
  stringifyJson,
} from './lessonEditorJson'

it.each(['false', 'null', '42', '["a"]', 'line one\nline two', false, 0, ['yes', 'no']])(
  'round-trips the original JSON type/value (%j)',
  value => {
    expect(parseJsonField(stringifyJson(value), null)).toEqual(value)
  }
)

it('rejects malformed or wrongly shaped structural fields before a write', () => {
  expect(() => parseJsonArray('[', 'Options')).toThrow('Options phải là JSON hợp lệ')
  expect(() => parseJsonArray('{}', 'Options')).toThrow('Options phải là mảng JSON')
  expect(() => parseJsonObject('[]', 'Rules')).toThrow('Rules phải là object JSON')
  expect(() => parseAnswerKey('{"answer":"yes"}')).toThrow('Đáp án phải là giá trị đơn')
  expect(() => parseAnswerKey('[["yes"]]')).toThrow('Đáp án phải là giá trị đơn')
})

it('allows unfinished drafts while warning on an unusable answer key', () => {
  expect(parseAnswerKey('null')).toBeNull()
  expect(parseAnswerKey('[]')).toEqual([])
  expect(hasUsableAnswerKey(null)).toBe(false)
  expect(hasUsableAnswerKey([' '])).toBe(false)
  expect(hasUsableAnswerKey(false)).toBe(true)
  expect(hasUsableAnswerKey(0)).toBe(true)
})
