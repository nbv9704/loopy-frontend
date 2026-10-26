import { expect, it } from 'vitest'
import { mergeSavedDetail, nextDetailOrder } from './lessonDetails.model'

it('preserves order zero and derives the next order from sparse indices rather than row count', () => {
  const submitted = { id: 'first', order_index: 0 }
  const rows = mergeSavedDetail(
    [
      { id: 'first', order_index: 9 },
      { id: 'last', order_index: 20 },
    ],
    submitted,
    submitted,
    'lesson'
  )
  expect(rows[0].order_index).toBe(0)
  expect(nextDetailOrder(rows)).toBe(21)
  expect(nextDetailOrder([])).toBe(1)
})

it.each([
  { id: '', order_index: 0 },
  { id: 'other', order_index: 0 },
  { id: 'first', lesson_id: 'other', order_index: 0 },
  { id: 'first', order_index: -1 },
])('rejects a missing or mismatched saved row before resetting its draft (%j)', saved => {
  expect(() => mergeSavedDetail([], { id: 'first', order_index: 0 }, saved, 'lesson')).toThrow(
    'Chưa nhận được xác nhận lưu nội dung hợp lệ'
  )
})
