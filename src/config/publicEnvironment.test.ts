import { expect, it } from 'vitest'
import { PUBLIC_ENV_KEYS, resolveApiOrigin, validatePublicEnvironment } from './publicEnvironment'

it('normalizes the same API origin for REST and Socket.IO', () => {
  expect(resolveApiOrigin(' https://api.example.test/ ', true)).toBe('https://api.example.test')
  expect(resolveApiOrigin(undefined, false)).toBe('http://localhost:3000')
  expect(resolveApiOrigin('http://127.0.0.1:4319', true)).toBe('http://127.0.0.1:4319')
})
it.each([
  undefined,
  '',
  'not a url',
  'ftp://api.example.test',
  'https://user:secret@api.example.test',
  'https://api.example.test/api',
  'https://api.example.test?key=secret',
  'https://api.example.test/#x',
  'http://api.example.test',
])('rejects unusable deployment API configuration %# before a bundle is built', value => {
  expect(() => resolveApiOrigin(value, true)).toThrow('VITE_API_URL')
})
it('does not print credential values in a configuration error', () => {
  expect(() => resolveApiOrigin('https://user:private-password@api.example.test', true)).toThrow()
  try {
    resolveApiOrigin('https://user:private-password@api.example.test', true)
  } catch (error) {
    expect(String(error)).not.toContain('private-password')
  }
})
it('blocks private or undocumented VITE settings instead of embedding them', () => {
  expect(() =>
    validatePublicEnvironment(
      { VITE_API_URL: 'https://api.example.test', VITE_SERVICE_KEY: 'private-value' },
      true
    )
  ).toThrow('VITE_SERVICE_KEY')
})
it('recognizes obsolete public Supabase settings without exposing them through Vite', () => {
  expect(
    validatePublicEnvironment(
      {
        VITE_API_URL: 'https://api.example.test',
        VITE_SUPABASE_URL: 'https://legacy.example.test',
        VITE_SUPABASE_ANON_KEY: 'legacy-public-key',
      },
      true
    )
  ).toBe('https://api.example.test')
  expect(PUBLIC_ENV_KEYS).not.toContain('VITE_SUPABASE_URL')
  expect(PUBLIC_ENV_KEYS).not.toContain('VITE_SUPABASE_ANON_KEY')
})
it.each(['true', 'yes'])('refuses dev login setting %s during production build', value => {
  expect(() =>
    validatePublicEnvironment(
      { VITE_API_URL: 'https://api.example.test', VITE_ENABLE_DEV_LOGIN: value },
      true
    )
  ).toThrow('VITE_ENABLE_DEV_LOGIN')
})
