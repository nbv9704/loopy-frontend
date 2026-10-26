import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../lib/api'
import { profileService } from './profile.service'

vi.mock('../../lib/api', () => ({ api: { request: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

it.each([
  { displayName: '   ', bio: '', avatarUrl: '' },
  { displayName: 'x', bio: '', avatarUrl: '' },
  { displayName: 'x'.repeat(51), bio: '', avatarUrl: '' },
  { displayName: 'Name', bio: 'x'.repeat(501), avatarUrl: '' },
])('rejects an invalid personal draft before sending a write %#', async draft => {
  await expect(profileService.saveAccount('current', draft)).rejects.toThrow('ký tự')
  expect(api.request).not.toHaveBeenCalled()
})

it('does not present unavailable progress as an empty account', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: false,
    error: { code: 'OFFLINE', message: 'Try later' },
  })
  await expect(profileService.getStats()).rejects.toThrow('Try later')
})

it('requires the progress contract instead of silently accepting a malformed response', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: {} })
  await expect(profileService.getStats()).rejects.toThrow('Không tải được tiến độ')
})

it('does not load or confirm a profile belonging to another account', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: { profile: { id: 'other' } } })
  await expect(profileService.getAccount('current')).rejects.toThrow('tài khoản hiện tại')
  await expect(
    profileService.saveAccount('current', { displayName: 'Name', bio: '', avatarUrl: '' })
  ).rejects.toThrow('tài khoản hiện tại')
})

it('saves only personal fields and preserves the validated learning path', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: true,
    data: { profile: { id: 'current', displayName: 'Saved', bio: 'Hello', avatarUrl: '' } },
  })
  const draft = {
    displayName: 'Saved',
    bio: 'Hello',
    avatarUrl: '',
    preferredLanguage: 'python',
    learningGoal: 'explore',
    isAdmin: true,
  }
  await expect(profileService.saveAccount('current', draft)).resolves.toMatchObject({
    id: 'current',
    displayName: 'Saved',
  })
  expect(JSON.parse(vi.mocked(api.request).mock.calls[0][1]!.body as string)).toEqual({
    displayName: 'Saved',
    bio: 'Hello',
    avatarUrl: '',
  })
})

it('requires a saved profile acknowledgement before reporting success', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: {} })
  await expect(
    profileService.saveAccount('current', { displayName: 'Name', bio: '', avatarUrl: '' })
  ).rejects.toThrow()
})

it.each(['displayName', 'bio', 'avatarUrl'])(
  'rejects malformed %s before it reaches the profile form',
  async field => {
    vi.mocked(api.request).mockResolvedValue({
      success: true,
      data: { profile: { id: 'current', [field]: { invalid: true } } },
    })
    await expect(profileService.getAccount('current')).rejects.toThrow('xác nhận')
  }
)

it.each(['displayName', 'bio', 'avatarUrl'])(
  'does not confirm stale %s returned under the correct account ID',
  async field => {
    const draft = { displayName: 'New name', bio: 'New bio', avatarUrl: '/images/avatar/fox.webp' }
    vi.mocked(api.request).mockResolvedValue({
      success: true,
      data: { profile: { id: 'current', ...draft, [field]: 'stale' } },
    })
    await expect(profileService.saveAccount('current', draft)).rejects.toThrow('các thay đổi')
  }
)

it('returns a validated snapshot with the committed personal values so auth needs no extra read', async () => {
  const saved = {
    id: 'current',
    displayName: 'Saved',
    bio: '',
    avatarUrl: '',
    onboardingCompleted: true,
    points: 100,
  }
  vi.mocked(api.request).mockResolvedValue({ success: true, data: { profile: saved } })
  expect(
    (
      await profileService.saveAccount('current', {
        displayName: ' Saved ',
        bio: '',
        avatarUrl: '',
      })
    ).snapshot
  ).toEqual(saved)
  expect(JSON.parse(vi.mocked(api.request).mock.calls[0][1]!.body as string).displayName).toBe(
    'Saved'
  )
})
