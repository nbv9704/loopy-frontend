import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../lib/api'
import { saveOnboarding } from './onboarding.service'

vi.mock('../../lib/api', () => ({ api: { updateProfile: vi.fn() } }))
const selection = {
  preferredLanguage: 'python',
  learningGoal: 'beginner',
  experienceLevel: 'beginner',
  currentPathId: 'path',
}
const profile = {
  id: 'learner',
  preferredLanguage: 'python',
  learningPath: 'beginner',
  currentPathId: 'path',
  onboardingCompleted: true,
}
beforeEach(() => vi.resetAllMocks())

it('returns the confirmed profile and sends the complete selection in one write', async () => {
  vi.mocked(api.updateProfile).mockResolvedValue({ success: true, data: { profile } })
  await expect(saveOnboarding(selection, 'learner')).resolves.toEqual(profile)
  expect(api.updateProfile).toHaveBeenCalledTimes(1)
  expect(api.updateProfile).toHaveBeenCalledWith({ ...selection, onboardingCompleted: true })
})

it.each([
  {},
  { profile: { ...profile, id: 'another' } },
  { profile: { ...profile, currentPathId: 'another-path' } },
  { profile: { ...profile, onboardingCompleted: false } },
])('does not treat an incomplete or mismatched acknowledgement as completed (%j)', async data => {
  vi.mocked(api.updateProfile).mockResolvedValue({ success: true, data })
  await expect(saveOnboarding(selection, 'learner')).rejects.toThrow('xác nhận')
})

it('keeps the backend failure message so the caller can preserve the selection for retry', async () => {
  vi.mocked(api.updateProfile).mockResolvedValue({
    success: false,
    error: { code: 'DATABASE_ERROR', message: 'Please retry later' },
  })
  await expect(saveOnboarding(selection, 'learner')).rejects.toThrow('Please retry later')
})
