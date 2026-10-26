import { beforeEach, expect, it, vi } from 'vitest'
import { useAuthStore } from './authStore'
import { authApi } from '../../services/admin/authApi'
import type { AuthResponse } from '../../types/admin'

vi.mock('../../services/admin/authApi', () => ({
  authApi: { checkAuth: vi.fn(), login: vi.fn(), logout: vi.fn() },
}))
const user = (id: string) => ({ id, email: `${id}@example.test`, role: 'admin', is_admin: true })
const deferred = () => {
  let resolve!: (response: AuthResponse) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<AuthResponse>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}
const credentials = { email: 'admin@example.test', password: 'test-only-password' }
beforeEach(async () => {
  await Promise.resolve()
  useAuthStore.getState().clearAuth()
  vi.resetAllMocks()
})

it('does not restore a session from a pending check after logout', async () => {
  const pending = deferred()
  vi.mocked(authApi.checkAuth).mockReturnValue(pending.promise)
  const check = useAuthStore.getState().checkAuth()
  await useAuthStore.getState().logout()
  pending.resolve({ success: true, user: user('old') })
  await check
  expect(useAuthStore.getState().isAuthenticated).toBe(false)
})

it('ignores a pending login invalidated by clearing authentication', async () => {
  const pending = deferred()
  vi.mocked(authApi.login).mockReturnValue(pending.promise)
  const login = useAuthStore.getState().login(credentials)
  useAuthStore.getState().clearAuth()
  pending.resolve({ success: true, user: user('old') })
  await expect(login).rejects.toThrow()
  expect(useAuthStore.getState().user).toBeNull()
})

it('keeps the current editor session when a background check loses the network', async () => {
  useAuthStore.getState().setAuth(user('active'))
  vi.mocked(authApi.checkAuth).mockRejectedValue(new Error('Network Error'))
  await useAuthStore.getState().checkAuth()
  expect(useAuthStore.getState().user?.id).toBe('active')
  expect(useAuthStore.getState().isAuthenticated).toBe(true)
  expect(useAuthStore.getState().isLoading).toBe(false)
})

it('invalidates the current session on explicit 401', async () => {
  useAuthStore.getState().setAuth(user('expired'))
  vi.mocked(authApi.checkAuth).mockRejectedValue({ response: { status: 401 } })
  await useAuthStore.getState().checkAuth()
  expect(useAuthStore.getState().user).toBeNull()
})

it('does not let an old unauthorized check clear a newer login', async () => {
  useAuthStore.getState().setAuth(user('old'))
  const pending = deferred()
  vi.mocked(authApi.checkAuth).mockReturnValue(pending.promise)
  const check = useAuthStore.getState().checkAuth()
  vi.mocked(authApi.login).mockResolvedValue({ success: true, user: user('new') })
  await useAuthStore.getState().login(credentials)
  pending.reject({ response: { status: 401 } })
  await check
  expect(useAuthStore.getState().user?.id).toBe('new')
})

it('deduplicates simultaneous session checks', async () => {
  const pending = deferred()
  vi.mocked(authApi.checkAuth).mockReturnValue(pending.promise)
  const checks = [useAuthStore.getState().checkAuth(), useAuthStore.getState().checkAuth()]
  pending.resolve({ success: true, user: user('active') })
  await Promise.all(checks)
  expect(authApi.checkAuth).toHaveBeenCalledOnce()
})
it('rejects a duplicate login while credentials are already being submitted', async () => {
  const pending = deferred()
  vi.mocked(authApi.login).mockReturnValueOnce(pending.promise)
  const first = useAuthStore.getState().login(credentials)
  await expect(useAuthStore.getState().login(credentials)).rejects.toThrow('Vui lòng chờ')
  expect(authApi.login).toHaveBeenCalledTimes(1)
  pending.resolve({ success: true, user: user('active') })
  await first
  expect(useAuthStore.getState().user?.id).toBe('active')
})

it('preserves the backend login error message', async () => {
  vi.mocked(authApi.login).mockRejectedValue(
    Object.assign(new Error('Request failed with status code 401'), {
      response: { status: 401, data: { message: 'Invalid email or password' } },
    })
  )
  await expect(useAuthStore.getState().login(credentials)).rejects.toThrow(
    'Invalid email or password'
  )
  expect(useAuthStore.getState().error).toBe('Invalid email or password')
})

it('advances the session revision when a shared cookie now belongs to another admin', async () => {
  useAuthStore.getState().setAuth(user('first'))
  const revision = useAuthStore.getState().sessionRevision
  vi.mocked(authApi.checkAuth).mockResolvedValue({ success: true, user: user('second') })
  await useAuthStore.getState().checkAuth()
  expect(useAuthStore.getState().user?.id).toBe('second')
  expect(useAuthStore.getState().sessionRevision).toBeGreaterThan(revision)
})
