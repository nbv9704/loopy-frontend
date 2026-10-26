import type { FinalScore, PvPMatch } from '../../types/pvp.types'

/** Old matches may have no persisted ranks. Do not manufacture first place for them. */
export function finalScoresForMatch(match: PvPMatch): FinalScore[] | null {
  const players = match.participants
  if (
    !players?.length ||
    players.some(
      player =>
        !Number.isSafeInteger(player.final_rank) ||
        player.final_rank! < 1 ||
        !Number.isSafeInteger(player.total_score) ||
        player.total_score < 0
    )
  )
    return null
  return players
    .map(player => ({
      userId: player.user_id,
      displayName: player.display_name || 'Anonymous',
      score: player.total_score,
      rank: player.final_rank!,
    }))
    .sort((a, b) => a.rank - b.rank)
}
