import { beforeEach, expect, it, vi } from 'vitest'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import apiClient from './apiClient'

const state = vi.hoisted(() => ({ sessionRevision: 1, clearAuth: vi.fn() }))
vi.mock('../../store/admin/authStore', () => ({ useAuthStore: { getState: () => state } }))
vi.mock('../ErrorLogger', () => ({ errorLogger: { logApiError: vi.fn() } }))
beforeEach(() => {
  state.sessionRevision = 1
  vi.clearAllMocks()
})

it('does not let an old data request invalidate a newer admin session', async () => {
  let fail!: () => void
  const adapter = vi.fn(
    (config: InternalAxiosRequestConfig) =>
      new Promise<AxiosResponse>((_resolve, reject) => {
        fail = () =>
          reject(Object.assign(new Error('Unauthorized'), { config, response: { status: 401 } }))
      })
  )
  const pending = apiClient.get('/api/admin/lessons', { adapter }).catch(error => error)
  await vi.waitFor(() => expect(adapter).toHaveBeenCalledOnce())
  state.sessionRevision = 2
  fail()
  await pending
  expect(state.clearAuth).not.toHaveBeenCalled()
})

it('invalidates the current session when its privileged request is unauthorized', async () => {
  const adapter = vi.fn(async config => {
    throw Object.assign(new Error('Unauthorized'), { config, response: { status: 401 } })
  })
  await expect(apiClient.get('/api/admin/lessons', { adapter })).rejects.toThrow('Unauthorized')
  expect(state.clearAuth).toHaveBeenCalledOnce()
})

it('preserves an adapter/network error even if Axios has no request config', async () => {
  await expect(
    apiClient.get('/api/admin/lessons', {
      adapter: async () => {
        throw new Error('Offline')
      },
    })
  ).rejects.toThrow('Offline')
  expect(state.clearAuth).not.toHaveBeenCalled()
})
