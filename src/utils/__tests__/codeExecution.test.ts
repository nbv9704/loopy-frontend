import { describe, it, expect } from 'vitest'
import { formatError } from '../codeExecution'

describe('formatError utility', () => {
  it('should format unexpected token error friendly', () => {
    const error = 'Unexpected token )'
    const result = formatError(error)
    expect(result).toContain('thiếu hoặc thừa một dấu ngoặc đơn')
  })

  it('should format variable is not defined error friendly', () => {
    const error = 'x is not defined'
    const result = formatError(error)
    expect(result).toContain('Máy tính không biết `x` là gì')
  })

  it('should return original error if no custom friendly message matches', () => {
    const error = 'Some unknown database connection issue'
    const result = formatError(error)
    expect(result).toContain('Some unknown database connection issue')
  })
})
