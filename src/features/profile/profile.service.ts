import { isUserProfileSnapshot } from '../auth/profileSnapshot'
import { z } from 'zod'
import { readProgressSnapshot } from '../progress/progressResponse'
import { api } from '../../lib/api'
import { normalizeAvatarUrl } from './profileAvatar'
import { toProfileStats } from './profile.model'
import type { AccountProfile, ProfileDraft } from './profile.types'

const profileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().nullish(),
  bio: z.string().nullish(),
  avatarUrl: z.string().nullish(),
})
type ProfileResponse = z.infer<typeof profileSchema>

function readProfile(profile: unknown, ownerId: string): AccountProfile {
  const parsed = profileSchema.safeParse(profile)
  if (!parsed.success || parsed.data.id !== ownerId || !isUserProfileSnapshot(profile))
    throw new Error('Không xác nhận được hồ sơ của tài khoản hiện tại.')
  return {
    id: parsed.data.id,
    snapshot: profile,
    displayName: parsed.data.displayName ?? '',
    bio: parsed.data.bio ?? '',
    avatarUrl: normalizeAvatarUrl(parsed.data.avatarUrl),
  }
}

export const profileService = {
  async getStats(signal?: AbortSignal) {
    const response = await api.request<unknown>('/api/progress/me', {
      signal,
      suppressAuthToast: true,
    })
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Không tải được tiến độ học. Vui lòng thử lại.')
    }
    return toProfileStats(readProgressSnapshot(response.data))
  },
  async getAccount(ownerId: string, signal?: AbortSignal) {
    const response = await api.request<{ profile: ProfileResponse }>('/api/profile/me', {
      signal,
      suppressAuthToast: true,
    })
    if (!response.success)
      throw new Error(response.error?.message || 'Không tải được hồ sơ. Vui lòng thử lại.')
    return readProfile(response.data?.profile, ownerId)
  },
  async saveAccount(ownerId: string, draft: ProfileDraft) {
    // Learning preferences must use onboarding's validated language/goal/path selection.
    const payload: ProfileDraft = {
      displayName: draft.displayName.trim(),
      bio: draft.bio,
      avatarUrl: draft.avatarUrl,
    }
    if (payload.displayName.length < 2 || payload.displayName.length > 50)
      throw new Error('Tên hiển thị cần từ 2 đến 50 ký tự.')
    if (payload.bio.length > 500) throw new Error('Giới thiệu không được vượt quá 500 ký tự.')
    const response = await api.request<{ profile: ProfileResponse }>('/api/profile/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!response.success)
      throw new Error(response.error?.message || 'Không lưu được hồ sơ. Vui lòng thử lại.')
    const saved = readProfile(response.data?.profile, ownerId)
    if (
      saved.displayName !== payload.displayName ||
      saved.bio !== payload.bio ||
      saved.avatarUrl !== normalizeAvatarUrl(payload.avatarUrl)
    )
      throw new Error(
        'Chưa xác nhận được các thay đổi hồ sơ đã lưu. Bản nháp vẫn được giữ để bạn kiểm tra và thử lại.'
      )
    return saved
  },
}
