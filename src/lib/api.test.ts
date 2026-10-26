import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api'
import toast from 'react-hot-toast'

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }))

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('API error and session handling', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.mocked(toast.error).mockClear()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it.each([401, 403, 404, 500])(
    'allows optional CMS reads to handle HTTP %i without global toasts or refresh',
    async status => {
      fetchMock.mockResolvedValue(
        json({ error: { code: 'CMS_ERROR', message: 'CMS unavailable' } }, status)
      )
      expect(
        await api.request('/api/content/batch', {
          method: 'POST',
          suppressErrorToast: true,
          skipAuthRefresh: true,
        })
      ).toMatchObject({ success: false, error: { code: 'CMS_ERROR', status } })
      expect(toast.error).not.toHaveBeenCalled()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('suppressErrorToast')
    }
  )
  it('does not refresh the session for an already abandoned request', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementationOnce(async () => {
      controller.abort()
      return json({ error: { code: 'EXPIRED' } }, 401)
    })
    await api.request('/api/profile/me', { signal: controller.signal })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('does not replay an abandoned request after a shared session refresh finishes', async () => {
    const controller = new AbortController()
    let finish!: (response: Response) => void
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: 'EXPIRED' } }, 401))
      .mockImplementationOnce(
        () =>
          new Promise<Response>(resolve => {
            finish = resolve
          })
      )
    const pending = api.request('/api/profile/me', { signal: controller.signal })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    controller.abort()
    finish(json({ success: true }))
    await pending
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each([400, 401, 403, 429, 500])(
    'preserves backend error details for HTTP %i',
    async status => {
      const serverError = {
        code: 'DOMAIN_ERROR',
        message: 'Thông báo từ backend',
        details: [{ field: 'code' }],
      }
      fetchMock.mockResolvedValue(json({ success: false, error: serverError }, status))
      const response = await api.request('/api/test', { skipAuthRefresh: true })
      expect(response).toEqual({ success: false, error: { ...serverError, status } })
    }
  )

  it('keeps the HTTP status for a legacy message-only error', async () => {
    fetchMock.mockResolvedValue(json({ message: 'Invalid credentials' }, 401))
    expect(await api.request('/api/auth/login')).toMatchObject({
      success: false,
      error: { code: 'HTTP_401', message: 'Invalid credentials', status: 401 },
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps HTTP classification when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('upstream unavailable', { status: 502 }))
    expect(await api.request('/api/test')).toMatchObject({
      error: { code: 'HTTP_502', status: 502 },
    })
  })

  it('uses NETWORK_ERROR for a failed fetch', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await api.request('/api/test')).toEqual({
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Failed to fetch' },
    })
  })

  it.each(['login', 'signup'] as const)('preserves password whitespace during %s', async method => {
    fetchMock.mockResolvedValue(json({ success: true }))
    await api[method]('  Learner@Example.test ', '  exact password  ')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      email: 'learner@example.test',
      password: '  exact password  ',
    })
  })

  it.each([429, 503])(
    'retains refresh HTTP %i without replaying the protected write',
    async status => {
      fetchMock
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(
          json({ error: { code: 'AUTH_UNAVAILABLE', message: 'Retry later' } }, status)
        )
      expect(await api.request('/api/profile/me', { method: 'PUT' })).toMatchObject({
        success: false,
        error: { status, code: 'AUTH_UNAVAILABLE' },
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(toast.error).not.toHaveBeenCalled()
    }
  )

  it.each([{}, { success: false }, null])(
    'rejects malformed refresh acknowledgement %j',
    async body => {
      fetchMock.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(json(body))
      expect(await api.request('/api/profile/me', { method: 'PUT' })).toMatchObject({
        success: false,
        error: { code: 'AUTH_INVALID_RESPONSE', status: 502 },
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    }
  )

  it('shares proactive and reactive refresh operations', async () => {
    let resolve!: (value: Response) => void
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/api/auth/refresh'))
        return new Promise<Response>(done => {
          resolve = done
        })
      return fetchMock.mock.calls.length < 3 ? json({}, 401) : json({ success: true })
    })
    const scheduled = api.refreshToken()
    const request = api.request('/api/profile/me')
    await new Promise(done => setTimeout(done, 0))
    resolve(json({ success: true }))
    expect((await scheduled).success).toBe(true)
    expect((await request).success).toBe(true)
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/auth/refresh'))).toHaveLength(
      1
    )
  })

  it('retries once after refreshing and retains the retry error', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { message: 'Expired' } }, 401))
      .mockResolvedValueOnce(json({ success: true }))
      .mockResolvedValueOnce(
        json({ error: { code: 'LESSON_NOT_READY', message: 'Not ready' } }, 409)
      )
    expect(
      await api.request('/api/lessons/test/check', { method: 'POST', body: '{}' })
    ).toMatchObject({ error: { code: 'LESSON_NOT_READY', message: 'Not ready', status: 409 } })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/refresh')
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'POST',
      body: '{}',
      credentials: 'include',
    })
  })

  it('returns the original 401 when refresh fails', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: 'AUTH_REQUIRED', message: 'Expired' } }, 401))
      .mockResolvedValueOnce(json({ success: false }, 401))
    expect(await api.request('/api/profile/me')).toMatchObject({
      error: { code: 'AUTH_REQUIRED', status: 401 },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('shares one refresh across concurrent expired requests', async () => {
    let refreshCalls = 0
    const attempts = new Map<string, number>()
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/api/auth/refresh')) {
        refreshCalls++
        await new Promise(resolve => setTimeout(resolve, 0))
        return json({ success: true })
      }
      const attempt = attempts.get(url) || 0
      attempts.set(url, attempt + 1)
      return attempt === 0
        ? json({ error: { code: 'EXPIRED' } }, 401)
        : json({ success: true, data: url })
    })
    const results = await Promise.all([
      api.request('/api/profile/me'),
      api.request('/api/progress/me'),
    ])
    expect(results.every(result => result.success)).toBe(true)
    expect(refreshCalls).toBe(1)
    expect([...attempts.values()]).toEqual([2, 2])
  })
})
