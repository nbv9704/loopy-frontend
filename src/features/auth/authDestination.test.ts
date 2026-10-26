import { expect, it } from 'vitest'
import { getAuthDestination } from './authDestination'

it('preserves the complete internal return location', () => {
  expect(
    getAuthDestination({ pathname: '/practice/sets/new', search: '?topic=loops', hash: '#draft' })
  ).toBe('/practice/sets/new?topic=loops#draft')
})

it('accepts an internal path string and defaults missing locations to home', () => {
  expect(getAuthDestination('/learn/python?lesson=one')).toBe('/learn/python?lesson=one')
  expect(getAuthDestination()).toBe('/')
})

it('does not use external or relative destinations as an auth return path', () => {
  for (const from of ['https://example.test', '//example.test', '/\\example.test', 'relative'])
    expect(getAuthDestination(from)).toBe('/')
})
