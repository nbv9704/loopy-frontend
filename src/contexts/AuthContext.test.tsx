// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from '../lib/api'
import { StrictMode, type ReactNode } from 'react'

vi.mock('../lib/api', () => ({
  api: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    getMyProfile: vi.fn(),
    refreshToken: vi.fn(),
  },
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('../components/LoadingScreen', () => ({ LoadingScreen: () => null }))

const profile = (id: string) => ({ id, learningPath: 'first_steps', isAdmin: false, points: 100 })
const authResponse = (id: string) => ({
  success: true,
  data: { user: { id, email: `${id}@example.test`, profile: profile(id) } },
})
const deferred = () => {
  let resolve!: (value: any) => void
  const promise = new Promise<any>(done => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.getCurrentUser).mockResolvedValue(authResponse('alice'))
  vi.mocked(api.logout).mockResolvedValue({ success: true })
  vi.mocked(api.login).mockResolvedValue(authResponse('bob'))
  vi.mocked(api.getMyProfile).mockResolvedValue({
    success: true,
    data: { profile: profile('bob') },
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('learner identity and refresh', () => {
  it('keeps an unavailable bootstrap distinct from an anonymous session and supports retry', async () => {
    vi.mocked(api.getCurrentUser).mockResolvedValueOnce({
      success: false,
      error: { code: 'AUTH_UNAVAILABLE', message: 'Retry auth', status: 503 },
    })
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.authError).toBe('Retry auth'))
    expect(result.current.user).toBeNull()
    act(() => result.current.retryAuth())
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    expect(result.current.authError).toBeNull()
    expect(api.getCurrentUser).toHaveBeenCalledTimes(2)
  })

  it('rejects a bootstrap profile belonging to a different account', async () => {
    vi.mocked(api.getCurrentUser).mockResolvedValueOnce({
      success: true,
      data: { user: { id: 'alice', email: 'alice@example.test', profile: profile('bob') } },
    })
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.authError).toContain('không khớp'))
    expect(result.current.user).toBeNull()
  })

  it.each(['signIn', 'signUp'] as const)(
    'rejects a malformed successful %s response',
    async method => {
      const { result } = renderHook(useAuth, { wrapper: AuthProvider })
      await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
      vi.mocked(api.login).mockResolvedValueOnce({ success: true, data: {} })
      vi.mocked(api.signup).mockResolvedValueOnce({ success: true, data: {} })
      await act(async () => {
        await expect(result.current[method]('bob@example.test', 'password')).rejects.toThrow(
          'không hợp lệ'
        )
      })
      expect(result.current.user?.id).toBe('alice')
    }
  )

  it('shares repeated logout clicks and clears identity after confirmed local-cookie clearing', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    const pending = deferred()
    vi.mocked(api.logout).mockReturnValueOnce(pending.promise)
    await act(async () => {
      const first = result.current.signOut()
      const second = result.current.signOut()
      expect(first).toBe(second)
      pending.resolve({
        success: false,
        error: { code: 'AUTH_LOGOUT_FAILED', message: 'Revocation pending', status: 502 },
      })
      expect(await first).toEqual({ warning: 'Revocation pending' })
    })
    expect(api.logout).toHaveBeenCalledOnce()
    expect(result.current.user).toBeNull()
  })

  it('shares one bootstrap read when StrictMode replays the mount effect', async () => {
    const { result } = renderHook(useAuth, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <StrictMode>
          <AuthProvider>{children}</AuthProvider>
        </StrictMode>
      ),
    })
    await waitFor(() => expect(result.current.user?.id).toBe('alice'))
    expect(api.getCurrentUser).toHaveBeenCalledTimes(1)
  })
  it('expires a login whose profile response arrives after logout so callers cannot continue its writes', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    const pending = deferred()
    vi.mocked(api.getMyProfile).mockReturnValueOnce(pending.promise)
    let signingIn!: Promise<unknown>
    act(() => {
      signingIn = result.current.signIn('bob@example.test', 'test-only')
    })
    await waitFor(() => expect(result.current.user?.id).toBe('bob'))
    await act(async () => {
      await result.current.signOut()
    })
    await act(async () => {
      pending.resolve({ success: true, data: { profile: profile('bob') } })
      await expect(signingIn).rejects.toThrow('hết hiệu lực')
    })
    expect(result.current.user).toBeNull()
  })
  it('applies a confirmed profile for the current account without another read', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    const earlierRefresh = result.current.refreshUser
    await act(() => result.current.signIn('bob@example.test', 'test-only'))
    vi.mocked(api.getMyProfile).mockClear()
    await act(() => earlierRefresh({ ...profile('bob'), points: 300, onboardingCompleted: true }))
    expect(result.current.user).toMatchObject({
      id: 'bob',
      email: 'bob@example.test',
      points: 300,
      onboardingCompleted: true,
    })
    expect(api.getMyProfile).not.toHaveBeenCalled()
  })

  it('ignores an acknowledgement belonging to another account', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    await act(() => result.current.refreshUser({ ...profile('bob'), points: 999 }))
    expect(result.current.user).toMatchObject({ id: 'alice', points: 100 })
    expect(api.getMyProfile).not.toHaveBeenCalled()
  })

  it('does not accept another cookie account profile as the account that just signed in', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    vi.mocked(api.getMyProfile).mockResolvedValueOnce({
      success: true,
      data: { profile: profile('alice') },
    })
    await act(() => result.current.signIn('bob@example.test', 'test-only'))
    expect(result.current.user).toMatchObject({ id: 'bob', email: 'bob@example.test' })
  })
  it('refreshes the current account even when the callback was captured before a new login', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    const earlierRefresh = result.current.refreshUser
    await act(() => result.current.signIn('bob@example.test', 'test-only'))
    vi.mocked(api.getMyProfile).mockResolvedValueOnce({
      success: true,
      data: { profile: { ...profile('bob'), points: 200, onboardingCompleted: true } },
    })
    await act(() => earlierRefresh())
    expect(result.current.user).toMatchObject({ id: 'bob', points: 200, onboardingCompleted: true })
  })
  it('does not restore a pending profile after automatic session expiry', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    vi.useFakeTimers()
    await act(() => result.current.signIn('bob@example.test', 'test-only'))
    const pending = deferred()
    vi.mocked(api.getMyProfile).mockReturnValueOnce(pending.promise)
    let refreshing!: Promise<void>
    act(() => {
      refreshing = result.current.refreshUser()
    })
    vi.mocked(api.refreshToken).mockResolvedValue({
      success: false,
      error: { status: 401, code: 'AUTH_REQUIRED', message: 'expired' },
    })
    await act(() => vi.advanceTimersByTimeAsync(14 * 60 * 1000))
    expect(result.current.user).toBeNull()
    await act(async () => {
      pending.resolve({ success: true, data: { profile: profile('bob') } })
      await refreshing
    })
    expect(result.current.user).toBeNull()
  })

  it('keeps identity and allows logout retry when the server was unreachable', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    vi.useFakeTimers()
    vi.mocked(api.logout).mockRejectedValueOnce(new Error('offline'))
    await act(async () => {
      await result.current.signOut().catch(() => {})
    })
    expect(result.current.user?.id).toBe('alice')
    await act(async () => {
      await result.current.signOut()
    })
    expect(result.current.user).toBeNull()
    await act(() => vi.advanceTimersByTimeAsync(14 * 60 * 1000))
    expect(api.refreshToken).not.toHaveBeenCalled()
  })
  it('normalizes the profile on initial session restoration', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    expect(result.current.user?.learningGoal).toBe('first_steps')
  })

  it('does not restore a profile response arriving after logout', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    const pending = deferred()
    vi.mocked(api.getMyProfile).mockReturnValueOnce(pending.promise)
    let refreshing!: Promise<void>
    act(() => {
      refreshing = result.current.refreshUser()
    })
    await act(async () => {
      await result.current.signOut()
    })
    await act(async () => {
      pending.resolve({ success: true, data: { profile: profile('alice') } })
      await refreshing
    })
    expect(result.current.user).toBeNull()
  })

  it('keeps the authenticated user during a temporary refresh transport failure', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    vi.useFakeTimers()
    await act(() => result.current.signIn('bob@example.test', 'test-only'))
    vi.mocked(api.refreshToken).mockResolvedValue({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'offline' },
    })
    await act(() => vi.advanceTimersByTimeAsync(14 * 60 * 1000))
    expect(api.refreshToken).toHaveBeenCalledOnce()
    expect(result.current.user?.id).toBe('bob')
  })

  it('ignores a failed refresh belonging to a previous login', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    vi.useFakeTimers()
    await act(() => result.current.signIn('alice@example.test', 'test-only'))
    const pending = deferred()
    vi.mocked(api.refreshToken).mockReturnValueOnce(pending.promise)
    act(() => {
      vi.advanceTimersByTime(14 * 60 * 1000)
    })
    await act(async () => {
      await result.current.signOut()
    })
    await act(() => result.current.signIn('bob@example.test', 'test-only'))
    await act(async () => {
      pending.resolve({ success: false, error: { status: 401 } })
      await Promise.resolve()
    })
    expect(result.current.user?.id).toBe('bob')
  })

  it('clears the user when the current refresh is explicitly unauthorized', async () => {
    const { result } = renderHook(useAuth, { wrapper: AuthProvider })
    await waitFor(() => expect(result.current?.user?.id).toBe('alice'))
    vi.useFakeTimers()
    await act(() => result.current.signIn('bob@example.test', 'test-only'))
    vi.mocked(api.refreshToken).mockResolvedValue({
      success: false,
      error: { status: 401, code: 'AUTH_REQUIRED', message: 'expired' },
    })
    await act(() => vi.advanceTimersByTimeAsync(14 * 60 * 1000))
    expect(result.current.user).toBeNull()
  })
})
