import { readOnboardingCatalog, readPathPreview } from './catalogResponse'
import { api } from '../../lib/api'
import { isUserProfileSnapshot, type UserProfileSnapshot } from '../auth/profileSnapshot'
import type {
  LearningPath,
  OnboardingLanguage,
  OnboardingSelection,
  PathChapter,
} from './onboarding.types'

export async function loadOnboardingCatalog(signal: AbortSignal) {
  const [languages, paths] = await Promise.all([
    api.request<{ languages: OnboardingLanguage[] }>('/api/languages', { signal }),
    api.request<{ paths: LearningPath[] }>('/api/paths', { signal }),
  ])
  if (!languages.success || !languages.data)
    throw new Error(languages.error?.message || 'Không tải được danh sách ngôn ngữ.')
  if (!paths.success || !paths.data)
    throw new Error(paths.error?.message || 'Không tải được lộ trình.')
  return readOnboardingCatalog(languages.data.languages, paths.data.paths)
}

export async function loadPathChapters(
  pathId: string,
  signal: AbortSignal
): Promise<PathChapter[]> {
  const response = await api.request<{ chapters: PathChapter[] }>(
    `/api/paths/${encodeURIComponent(pathId)}`,
    {
      signal,
    }
  )
  if (!response.success || !response.data)
    throw new Error(response.error?.message || 'Không tải được bài học trong lộ trình.')
  return readPathPreview(response.data, pathId)
}

/** A successful HTTP envelope is insufficient: the saved account/selection must be acknowledged. */
export async function saveOnboarding(
  selection: OnboardingSelection,
  userId: string
): Promise<UserProfileSnapshot> {
  const response = await api.updateProfile({ ...selection, onboardingCompleted: true })
  if (!response.success)
    throw new Error(response.error?.message || 'Không lưu được lộ trình. Vui lòng thử lại.')
  const profile = (response.data as { profile?: unknown } | undefined)?.profile
  if (
    !isUserProfileSnapshot(profile) ||
    profile.id !== userId ||
    profile.onboardingCompleted !== true ||
    profile.preferredLanguage !== selection.preferredLanguage ||
    profile.currentPathId !== selection.currentPathId ||
    (profile.learningPath ?? profile.learningGoal) !== selection.learningGoal
  ) {
    throw new Error('Không xác nhận được lộ trình đã lưu. Vui lòng thử lại.')
  }
  return profile
}
