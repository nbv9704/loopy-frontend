export function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? ''
}

export function parseJsonField(value: string, fallback: unknown, label = 'Dữ liệu'): unknown {
  if (!value.trim()) return fallback
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`${label} phải là JSON hợp lệ. Chuỗi cần đặt trong dấu ngoặc kép.`)
  }
}

export function parseJsonArray(value: string, label: string): unknown[] {
  const parsed = parseJsonField(value, [], label)
  if (!Array.isArray(parsed)) throw new Error(`${label} phải là mảng JSON.`)
  return parsed
}

export function parseJsonObject(value: string, label: string): Record<string, unknown> {
  const parsed = parseJsonField(value, {}, label)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error(`${label} phải là object JSON.`)
  return parsed as Record<string, unknown>
}

const isScalarAnswer = (value: unknown) =>
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value))

export function hasUsableAnswerKey(value: unknown): boolean {
  const values = Array.isArray(value) ? value : [value]
  return values.every(isScalarAnswer) && values.some(item => String(item).trim().length > 0)
}

export function parseAnswerKey(value: string): unknown {
  const parsed = parseJsonField(value, null, 'Đáp án')
  if (
    parsed !== null &&
    !(Array.isArray(parsed) ? parsed.every(isScalarAnswer) : isScalarAnswer(parsed))
  )
    throw new Error('Đáp án phải là giá trị đơn hoặc mảng các đáp án đơn.')
  return parsed
}
