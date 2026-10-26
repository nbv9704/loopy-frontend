import { expect, it } from 'vitest'
import { PUBLIC_ENV_KEYS, resolveApiOrigin, validatePublicEnvironment } from './publicEnvironment'

// Reproduce the platform metadata reported by the production build, independently
// of the validator's allowlist. None of these details is application config.
const vercelBuildMetadata = {
  VITE_VERCEL_BRANCH_URL: 'preview.example.test',
  VITE_VERCEL_DEPLOYMENT_ID: 'deployment-fixture',
  VITE_VERCEL_ENV: 'production',
  VITE_VERCEL_GIT_COMMIT_AUTHOR_LOGIN: 'author-fixture',
  VITE_VERCEL_GIT_COMMIT_AUTHOR_NAME: 'Author fixture',
  VITE_VERCEL_GIT_COMMIT_MESSAGE: 'Build fixture',
  VITE_VERCEL_GIT_COMMIT_REF: 'master',
  VITE_VERCEL_GIT_COMMIT_SHA: 'commit-fixture',
  VITE_VERCEL_GIT_PREVIOUS_SHA: 'previous-fixture',
  VITE_VERCEL_GIT_PROVIDER: 'github',
  VITE_VERCEL_GIT_PULL_REQUEST_ID: '',
  VITE_VERCEL_GIT_REPO_ID: 'repo-fixture',
  VITE_VERCEL_GIT_REPO_OWNER: 'owner-fixture',
  VITE_VERCEL_GIT_REPO_SLUG: 'app-fixture',
  VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG: '{"fixture":true}',
  VITE_VERCEL_PROJECT_ID: 'project-fixture',
  VITE_VERCEL_PROJECT_PRODUCTION_URL: 'production.example.test',
  VITE_VERCEL_TARGET_ENV: 'production',
  VITE_VERCEL_URL: 'deployment.example.test',
}

it('accepts Vercel build metadata while keeping every metadata key outside client envPrefix', () => {
  expect(
    validatePublicEnvironment(
      {
        ...vercelBuildMetadata,
        VITE_API_URL: 'https://api.example.test',
      },
      true
    )
  ).toBe('https://api.example.test')
  for (const key of Object.keys(vercelBuildMetadata))
    expect(
      PUBLIC_ENV_KEYS.some(prefix => key.startsWith(prefix)),
      key
    ).toBe(false)
})

it.each(['VITE_VERCEL_SERVICE_KEY', 'VITE_VERCEL_OIDC_TOKEN', 'VITE_API_URL_PRIVATE_KEY'])(
  'still rejects undocumented sensitive settings mixed with platform metadata: %s',
  key => {
    expect(() =>
      validatePublicEnvironment(
        {
          ...vercelBuildMetadata,
          VITE_API_URL: 'https://api.example.test',
          [key]: 'do-not-expose-this-value',
        },
        true
      )
    ).toThrow(key)
  }
)

it('does not let deployment metadata replace the required production API origin', () => {
  expect(() => validatePublicEnvironment(vercelBuildMetadata, true)).toThrow('VITE_API_URL')
})

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
