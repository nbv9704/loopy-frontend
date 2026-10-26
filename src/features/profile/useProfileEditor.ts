import type { UserProfileSnapshot } from '../auth/profileSnapshot'
import { useCallback, useLayoutEffect, useRef, useState, type SetStateAction } from 'react'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { emptyProfile } from './profile.model'
import { profileService } from './profile.service'
import type { AccountProfile, ProfileDraft } from './profile.types'

/** Server profile is the initial value; drafts are tied to that exact account/load. */
export function useProfileEditor(
  userId: string,
  onSaved: (snapshot?: UserProfileSnapshot) => Promise<void>
) {
  const load = useCallback(
    (signal: AbortSignal) => profileService.getAccount(userId, signal),
    [userId]
  )
  const resource = useAsyncResource(`profile-account:${userId}`, load)
  const [draft, setDraft] = useState<{ source: AccountProfile | null; value: ProfileDraft }>({
    source: null,
    value: emptyProfile,
  })
  const [savingOwner, setSavingOwner] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<{ owner: string; message: string } | null>(null)
  const latestProfile = useRef(resource.data)
  latestProfile.current = resource.data
  const owner = useRef(userId)
  const active = useRef(false)
  const operation = useRef(0)
  const pendingOwner = useRef<string | null>(null)
  if (owner.current !== userId) {
    owner.current = userId
    ++operation.current
    pendingOwner.current = null
  }
  useLayoutEffect(() => {
    active.current = true
    pendingOwner.current = null
    setSavingOwner(null)
    return () => {
      active.current = false
      ++operation.current
      pendingOwner.current = null
    }
  }, [userId, resource.data])

  const profile = resource.data
  const value = profile ? (draft.source === profile ? draft.value : profile) : emptyProfile
  const setValue = (update: SetStateAction<ProfileDraft>) => {
    if (
      !profile ||
      !active.current ||
      owner.current !== userId ||
      latestProfile.current !== profile ||
      pendingOwner.current === userId
    )
      return
    setDraft(previous => {
      const currentValue = previous.source === profile ? previous.value : profile
      return {
        source: profile,
        value: typeof update === 'function' ? update(currentValue) : update,
      }
    })
  }
  const save = async (): Promise<boolean> => {
    if (
      !profile ||
      !active.current ||
      owner.current !== userId ||
      latestProfile.current !== profile ||
      pendingOwner.current === userId
    )
      return false
    const token = ++operation.current
    const current = () =>
      active.current &&
      owner.current === userId &&
      latestProfile.current === profile &&
      operation.current === token
    pendingOwner.current = userId
    setSavingOwner(userId)
    setSaveError(null)
    try {
      const saved = await profileService.saveAccount(userId, value)
      if (!current()) return false
      setDraft({ source: profile, value: saved })
      // The write has committed; a later refresh error must not claim it failed.
      try {
        await onSaved(saved.snapshot)
      } catch {
        /* Keep the confirmed saved profile. */
      }
      return current()
    } catch (error) {
      if (current())
        setSaveError({
          owner: userId,
          message: error instanceof Error ? error.message : 'Không lưu được hồ sơ.',
        })
      return false
    } finally {
      if (operation.current === token) pendingOwner.current = null
      if (active.current && operation.current === token) setSavingOwner(null)
    }
  }
  return {
    value,
    setValue,
    save,
    loading: resource.loading,
    loadError: resource.error,
    retry: resource.retry,
    saving: savingOwner === userId && pendingOwner.current === userId,
    saveError: saveError?.owner === userId ? saveError.message : null,
  }
}
