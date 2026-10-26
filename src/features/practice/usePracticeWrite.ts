import { useRef, useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import {
  practiceRecoveryReference,
  confirmPracticeWrite,
  unconfirmedPracticeId,
  type NormalizedPracticeWrite,
} from './practiceWrite'

export function usePracticeWrite(scope: string) {
  const { pending, run } = useAsyncAction(scope)
  type Recovery = { scope: string; id: string; expected: NormalizedPracticeWrite; message: string }
  const [recoveryState, setRecoveryState] = useState<Recovery | null>(null)
  const recoveryRef = useRef<Recovery | null>(null)
  const setRecovery = (next: Recovery | null) => {
    recoveryRef.current = next
    setRecoveryState(next)
  }
  const recovery = recoveryState?.scope === scope ? recoveryState : null
  const save = (
    write: () => Promise<unknown>,
    expected: NormalizedPracticeWrite,
    expectedId: string | undefined,
    onSuccess: (id: string) => void,
    onError: (error: unknown) => void
  ) => {
    if (recoveryRef.current?.scope === scope) return
    let response: unknown
    return run(
      async () => {
        response = await write()
        return confirmPracticeWrite(response, expected, expectedId)
      },
      {
        onSuccess: saved => onSuccess(saved.id),
        onError: error => {
          const reference = practiceRecoveryReference(error, expectedId)
          const id = reference?.id ?? unconfirmedPracticeId(response, expectedId)
          if (id)
            setRecovery({
              scope,
              id,
              expected,
              message: reference?.committed
                ? 'Bộ bài đã được lưu, nhưng chưa tải lại được kết quả. Hãy tải lại kết quả; thao tác này không gửi lại lệnh lưu.'
                : 'Chưa xác nhận được kết quả khớp bản nháp. Hãy tải lại kết quả trước khi gửi lại lệnh lưu.',
            })
          else onError(error)
        },
      }
    )
  }
  const recover = (read: (id: string) => Promise<unknown>, onSuccess: (id: string) => void) => {
    if (!recovery) return
    return run(
      async () => confirmPracticeWrite(await read(recovery.id), recovery.expected, recovery.id),
      {
        onSuccess: saved => {
          setRecovery(null)
          onSuccess(saved.id)
        },
        onError: error => {
          const current = recoveryRef.current
          if (current?.scope === scope)
            setRecovery({
              ...current,
              message: error instanceof Error ? error.message : 'Chưa tải lại được kết quả.',
            })
        },
      }
    )
  }
  return { pending, recovery, blocked: pending || Boolean(recovery), save, recover }
}
