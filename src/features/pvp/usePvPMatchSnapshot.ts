import { useCallback } from 'react'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { pvpService } from '../../services/pvp.service'

/** Loading a room is read-only. Membership/connection is acknowledged by the socket join. */
export function usePvPMatchSnapshot(roomCode: string | undefined, userId: string | undefined) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const match = await pvpService.getMatch(roomCode!, signal)
      if (
        ['completed', 'cancelled'].includes(match.status) &&
        !match.participants?.some(player => player.user_id === userId)
      )
        throw new Error('Bạn không thuộc phòng PvP này.')
      return match
    },
    [roomCode, userId]
  )
  return useAsyncResource(roomCode && userId ? `${userId}:${roomCode}` : null, load)
}
