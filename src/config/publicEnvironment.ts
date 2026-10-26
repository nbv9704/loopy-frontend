export const PUBLIC_ENV_KEYS = ['VITE_API_URL', 'VITE_ENABLE_DEV_LOGIN', 'VITE_USE_BACKEND_API']

/** Shared by Vite's build preflight and every HTTP/Socket.IO client. */
export function resolveApiOrigin(value: string | undefined, production: boolean): string {
  const input = value?.trim()
  if (!input && production) throw new Error('VITE_API_URL is required before a production build.')
  try {
    const url = new URL(input || 'http://localhost:3000')
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      (production && url.protocol !== 'https:' && !local)
    )
      throw new Error()
    return url.origin
  } catch {
    throw new Error(
      'VITE_API_URL must be an HTTP(S) origin without credentials, path or query; use HTTPS for deployment.'
    )
  }
}

export function validatePublicEnvironment(
  env: Record<string, string | undefined>,
  production: boolean
) {
  // Recognize obsolete public Supabase settings without embedding them in the client bundle.
  const allowed = new Set([...PUBLIC_ENV_KEYS, 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'])
  const unexpected = Object.keys(env).filter(key => key.startsWith('VITE_') && !allowed.has(key))
  if (unexpected.length)
    throw new Error(
      `Undocumented public environment variables: ${unexpected.sort().join(', ')}. Remove them before building.`
    )
  if (env.VITE_ENABLE_DEV_LOGIN && !['true', 'false'].includes(env.VITE_ENABLE_DEV_LOGIN))
    throw new Error('VITE_ENABLE_DEV_LOGIN must be true or false.')
  if (production && env.VITE_ENABLE_DEV_LOGIN === 'true')
    throw new Error('VITE_ENABLE_DEV_LOGIN must be false in production builds.')
  return resolveApiOrigin(env.VITE_API_URL, production)
}
