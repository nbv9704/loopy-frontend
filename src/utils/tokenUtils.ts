/**
 * Token Utilities — JWT decode and expiry checking for admin auth.
 */

interface JwtPayload {
  exp?: number
  iat?: number
  sub?: string
  [key: string]: any
}

/**
 * Decode a JWT token payload without verification.
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Check if a JWT token is expiring within the given threshold (default 5 minutes).
 */
export function isTokenExpiringSoon(token: string, thresholdMs: number = 5 * 60 * 1000): boolean {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  const expiresAt = payload.exp * 1000
  return Date.now() >= expiresAt - thresholdMs
}

/**
 * Check if a JWT token has expired.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return Date.now() >= payload.exp * 1000
}
