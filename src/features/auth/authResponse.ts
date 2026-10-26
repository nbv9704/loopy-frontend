import { isUserProfileSnapshot } from './profileSnapshot'
export interface AuthIdentity {
  id: string
  email: string
  profile?: Record<string, unknown>
}

/** Only the auth user establishes identity; an embedded profile cannot replace it. */
export function readAuthIdentity(data: unknown): AuthIdentity {
  const user = (data as { user?: AuthIdentity } | null)?.user
  if (
    !user ||
    typeof user.id !== 'string' ||
    !user.id.trim() ||
    typeof user.email !== 'string' ||
    !user.email.trim()
  )
    throw new Error('Phản hồi tài khoản không hợp lệ. Vui lòng thử lại.')
  if (
    user.profile !== undefined &&
    (!isUserProfileSnapshot(user.profile) || user.profile.id !== user.id)
  )
    throw new Error('Hồ sơ tài khoản không khớp. Vui lòng thử lại.')
  return user
}
