import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'

interface Confirmation {
  resolve: () => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

/** Ready is acknowledged by the server snapshot/event; an emitted packet alone is not confirmation. */
export function usePvPReady({
  scope,
  confirmed,
  connected,
  send,
  resync,
}: {
  scope: string
  confirmed: boolean
  connected: boolean
  send: () => void
  resync: () => void
}) {
  const { run, pending } = useAsyncAction(scope)
  const confirmation = useRef<Confirmation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fail = useCallback(
    (message: string) => confirmation.current?.reject(new Error(message)),
    []
  )
  useEffect(() => {
    if (confirmed) confirmation.current?.resolve()
    else if (!connected) fail('Kết nối đã mất. Hãy chờ kết nối lại rồi thử lại.')
  }, [confirmed, connected, fail])
  useLayoutEffect(
    () => () => {
      const current = confirmation.current
      if (current) {
        clearTimeout(current.timer)
        current.reject(new Error('Đã rời phòng'))
      }
    },
    [scope]
  )
  const request = () =>
    run(
      async isCurrent => {
        if (!connected) throw new Error('Hãy chờ kết nối vào phòng trước khi sẵn sàng.')
        if (confirmed) return
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
                    resync()
                  } catch {
                    /* Recovery is optional; the user can retry. */
                  }
                }
                reject(
                  new Error(
                    'Chưa nhận được xác nhận sẵn sàng. Đang đồng bộ lại phòng; bạn có thể thử lại.'
                  )
                )
              }, 5000),
            }
            confirmation.current = current
            send()
          })
        } finally {
          if (current) clearTimeout(current.timer)
          if (confirmation.current === current) confirmation.current = null
        }
      },
      {
        onSuccess: () => setError(null),
        onError: failure =>
          setError(
            failure instanceof Error ? failure.message : 'Không gửi được trạng thái sẵn sàng.'
          ),
      }
    )
  return { request, pending, error, fail }
}
