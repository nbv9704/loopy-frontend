interface OrderedDetail {
  id?: string
  order_index: number
  lesson_id?: string
}

export function nextDetailOrder(rows: OrderedDetail[]): number {
  return Math.max(0, ...rows.map(row => row.order_index)) + 1
}

export function mergeSavedDetail<T extends OrderedDetail>(
  rows: T[],
  submitted: T,
  saved: T,
  lessonId: string
): T[] {
  if (
    !saved ||
    typeof saved.id !== 'string' ||
    !saved.id.trim() ||
    (submitted.id && submitted.id !== saved.id) ||
    (saved.lesson_id && saved.lesson_id !== lessonId) ||
    !Number.isInteger(saved.order_index) ||
    saved.order_index < 0
  )
    throw new Error('Chưa nhận được xác nhận lưu nội dung hợp lệ. Vui lòng thử lại.')
  const next = rows.some(row => row.id === saved.id)
    ? rows.map(row => (row.id === saved.id ? saved : row))
    : [...rows, saved]
  return next.sort((a, b) => a.order_index - b.order_index)
}
