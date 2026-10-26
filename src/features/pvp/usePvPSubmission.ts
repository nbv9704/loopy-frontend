import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import type { UsePvPSocketReturn } from '../../hooks/usePvPSocket'
import type { PvPSubmission } from '../../types/pvp.types'
import { pvpSubmissionSchema } from './socketEvents'

interface Confirmation {
  resolve: () => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

/** A send is pending until a saved submission for this account, match and question is confirmed. */
export function usePvPSubmission({
  matchId,
  questionId,
  userId,
  socket,
  initial,
  onConfirmed,
}: {
  matchId: string
  questionId: string
  userId: string
  socket: UsePvPSocketReturn
  initial?: PvPSubmission | null
  onConfirmed: (submission: PvPSubmission) => void
}) {
  const scope = JSON.stringify([matchId, questionId, userId])
  const { pending, run } = useAsyncAction(scope)
  const [saved, setSaved] = useState<{ scope: string; value: PvPSubmission } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const confirmation = useRef<Confirmation | null>(null)
  const active = useRef(false)
  const seen = useRef(false)
  const callback = useRef(onConfirmed)
  callback.current = onConfirmed
  const valid = (value: unknown) => {
    const result = pvpSubmissionSchema.safeParse(value)
    return result.success &&
      result.data.match_id === matchId &&
      result.data.question_id === questionId &&
      result.data.user_id === userId
      ? result.data
      : null
  }
  const restored = valid(initial)
  const value = saved?.scope === scope ? saved.value : restored

  useLayoutEffect(() => {
    active.current = true
    seen.current = Boolean(restored || (saved?.scope === scope && saved.value))
    setError(null)
    return () => {
      active.current = false
      const current = confirmation.current
      if (current) {
        clearTimeout(current.timer)
        current.reject(new Error('Đã rời câu hỏi'))
      }
    }
  }, [scope])
  useLayoutEffect(() => {
    if (!restored) return
    seen.current = true
    confirmation.current?.resolve()
    setError(null)
  }, [initial, scope])
  useEffect(() => {
    if (!socket.isConnected)
      confirmation.current?.reject(
        new Error('Kết nối đã mất. Hãy kết nối lại để xác nhận bài đã gửi.')
      )
  }, [socket.isConnected])
  useLayoutEffect(() => {
    let subscribed = true
    const unsubscribe = socket.onSubmissionReceived(incoming => {
      if (!subscribed || !active.current) return
      const submission = valid(incoming)
      if (!submission) return
      setSaved({ scope, value: submission })
      setError(null)
      confirmation.current?.resolve()
      if (!seen.current) {
        seen.current = true
        callback.current(submission)
      }
    })
    const unsubscribeError = socket.onError(failure => {
      if (subscribed) confirmation.current?.reject(new Error(failure.message))
    })
    return () => {
      subscribed = false
      unsubscribe()
      unsubscribeError()
    }
  }, [scope, socket.socket, socket.onSubmissionReceived, socket.onError])

  const request = (send: () => boolean) => {
    if (value) return
    return run(
      async isCurrent => {
        if (!socket.isConnected) throw new Error('Hãy kết nối lại phòng trước khi gửi bài.')
        setError(null)
        let current: Confirmation | undefined
        try {
          await new Promise<void>((resolve, reject) => {
            current = {
              resolve,
              reject,
              timer: setTimeout(() => {
                if (isCurrent()) {
                  try {
                    socket.joinMatch(matchId)
                  } catch {
                    /* Retry is explicit after resync fails. */
                  }
                }
                reject(
                  new Error(
                    'Chưa xác nhận được bài đã lưu. Đang đồng bộ lại phòng; hãy kiểm tra rồi thử lại.'
                  )
                )
              }, 10000),
            }
            confirmation.current = current
            if (!send()) reject(new Error('Kết nối đã mất. Hãy kết nối lại phòng rồi thử lại.'))
          })
        } finally {
          if (current) clearTimeout(current.timer)
          if (confirmation.current === current) confirmation.current = null
        }
      },
      {
        onSuccess: () => setError(null),
        onError: failure =>
          setError(failure instanceof Error ? failure.message : 'Không gửi được bài.'),
      }
    )
  }
  return { request, pending, saved: value, error }
}
