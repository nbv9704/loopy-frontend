/**
 * PvP Service
 * HTTP API calls for PvP system
 */

import { api } from '../lib/api'
import type { PvPMatch, PvPQuestion, PvPUserStats } from '../types/pvp.types'
import {
  matchReferenceSchema,
  pvpEligibilitySchema,
  pvpMatchSchema,
  PvPRequestError,
} from '../features/pvp/pvpContracts'

function checkedMatch(
  response: { success: boolean; data?: unknown; error?: { message?: string; code?: string } },
  expected?: string
): PvPMatch {
  if (!response.success)
    throw new PvPRequestError(
      response.error?.message || 'Không thể tải phòng PvP. Vui lòng thử lại.',
      response.error?.code
    )
  const parsed = pvpMatchSchema.safeParse((response.data as { match?: unknown } | undefined)?.match)
  if (!parsed.success)
    throw new PvPRequestError('Chưa nhận được thông tin phòng hợp lệ. Vui lòng thử lại.')
  if (
    expected &&
    parsed.data.id.toLowerCase() !== expected.toLowerCase() &&
    parsed.data.room_code !== expected.trim().toUpperCase()
  )
    throw new PvPRequestError('Phản hồi không khớp phòng đang mở. Vui lòng thử lại.')
  return parsed.data
}

function reference(value: string) {
  const parsed = matchReferenceSchema.safeParse(value)
  if (!parsed.success) throw new PvPRequestError('Mã phòng hoặc địa chỉ phòng không hợp lệ.')
  return encodeURIComponent(parsed.data)
}

export interface CreateMatchRequest {
  mode?: '1v1' | 'battle_royale'
  language_id?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  max_players?: number
  time_per_question?: number
  question_count?: number
}

export interface FindMatchRequest {
  language_id?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  mode?: '1v1' | 'battle_royale'
}

export const pvpService = {
  async getEligibility(signal?: AbortSignal) {
    const response = await api.request<unknown>('/api/pvp/eligibility', { signal })
    if (!response.success)
      throw new PvPRequestError(
        response.error?.message || 'Không tải được điều kiện tham gia PvP.',
        response.error?.code
      )
    const parsed = pvpEligibilitySchema.safeParse(response.data)
    if (!parsed.success)
      throw new PvPRequestError('Chưa xác nhận được điều kiện tham gia PvP. Vui lòng thử lại.')
    return parsed.data
  },
  /**
   * Create a new match
   */
  async createMatch(request: CreateMatchRequest): Promise<PvPMatch> {
    const response = await api.request<unknown>('/api/pvp/matches', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return checkedMatch(response)
  },

  /**
   * Get match details
   */
  async getMatch(matchId: string, signal?: AbortSignal): Promise<PvPMatch> {
    const response = await api.request<unknown>(`/api/pvp/matches/${reference(matchId)}`, {
      signal,
    })
    return checkedMatch(response, matchId)
  },

  /**
   * Join a specific match
   */
  async joinMatch(matchId: string): Promise<PvPMatch> {
    const response = await api.request<unknown>(`/api/pvp/matches/${reference(matchId)}/join`, {
      method: 'POST',
    })
    return checkedMatch(response, matchId)
  },

  /**
   * Find or create a match (matchmaking)
   */
  async findMatch(request: FindMatchRequest): Promise<PvPMatch> {
    const response = await api.request<unknown>('/api/pvp/matchmaking', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return checkedMatch(response)
  },

  /**
   * Get current question for match
   */
  async getCurrentQuestion(matchId: string): Promise<PvPQuestion> {
    const response = await api.request<any>(`/api/pvp/matches/${matchId}/question`)
    if (!response.success) throw new Error(response.error?.message || 'Failed to get question')
    return response.data.question
  },

  /**
   * Get match history
   */
  async getMatchHistory(limit: number = 10, offset: number = 0): Promise<PvPMatch[]> {
    const response = await api.request<any>(`/api/pvp/history?limit=${limit}&offset=${offset}`)
    if (!response.success) throw new Error(response.error?.message || 'Failed to get history')
    return response.data.matches
  },

  /**
   * Get user stats
   */
  async getUserStats(userId?: string): Promise<PvPUserStats> {
    const url = userId ? `/api/pvp/stats/${userId}` : '/api/pvp/stats'
    const response = await api.request<any>(url)
    if (!response.success) throw new Error(response.error?.message || 'Failed to get stats')
    return response.data.stats
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    limit: number = 50,
    sortBy: 'rating' | 'matches_won' | 'accuracy_rate' = 'rating'
  ): Promise<Array<PvPUserStats & { display_name: string; avatar_url: string }>> {
    const response = await api.request<any>(`/api/pvp/leaderboard?limit=${limit}&sort_by=${sortBy}`)
    if (!response.success) throw new Error(response.error?.message || 'Failed to get leaderboard')
    return response.data.leaderboard
  },
}
