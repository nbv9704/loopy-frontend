import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { pvpService } from '../../services/pvp.service'
import { roomCodeSchema } from './pvpContracts'

/** A single mutation lifetime owns matchmaking and room entry; navigation invalidates callbacks. */
export function usePvPLobby({
  scope,
  eligible,
  languageId,
  onMatched,
}: {
  scope: string
  eligible: boolean
  languageId?: string
  onMatched: (roomCode: string) => void
}) {
  const [roomCode, setRoomCode] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [action, setAction] = useState<'search' | 'join' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { pending, run } = useAsyncAction(scope)
  const enter = (kind: 'search' | 'join') =>
    run(
      async () => {
        if (!eligible) throw new Error('Cần hoàn thành bài học đầu tiên trước khi tham gia PvP.')
        setAction(kind)
        setError(null)
        if (kind === 'search')
          return pvpService.findMatch({ mode: '1v1', difficulty, language_id: languageId })
        const parsed = roomCodeSchema.safeParse(roomCode)
        if (!parsed.success) throw new Error('Mã phòng cần đúng 6 chữ cái hoặc chữ số.')
        return pvpService.joinMatch(parsed.data)
      },
      {
        onSuccess: match => onMatched(match.room_code),
        onError: failure =>
          setError(
            failure instanceof Error ? failure.message : 'Không thể vào phòng. Vui lòng thử lại.'
          ),
      }
    )
  return {
    roomCode,
    setRoomCode,
    difficulty,
    setDifficulty,
    action,
    error,
    pending,
    canJoin: roomCodeSchema.safeParse(roomCode).success,
    find: () => enter('search'),
    join: () => enter('join'),
  }
}
