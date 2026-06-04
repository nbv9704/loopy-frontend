/**
 * PvP Service
 * HTTP API calls for PvP system
 */

import { api } from '../lib/api'
import type { PvPMatch, PvPQuestion, PvPUserStats } from '../types/pvp.types'

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
  /**
   * Create a new match
   */
  async createMatch(request: CreateMatchRequest): Promise<PvPMatch> {
    const response = await api.request<any>('/api/pvp/matches', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    if (!response.success) throw new Error(response.error?.message || 'Failed to create match')
    return response.data.match
  },

  /**
   * Get match details
   */
  async getMatch(matchId: string): Promise<PvPMatch> {
    const response = await api.request<any>(`/api/pvp/matches/${matchId}`)
    if (!response.success) throw new Error(response.error?.message || 'Failed to get match')
    return response.data.match
  },

  /**
   * Join a specific match
   */
  async joinMatch(matchId: string): Promise<PvPMatch> {
    const response = await api.request<any>(`/api/pvp/matches/${matchId}/join`, {
      method: 'POST',
    })
    if (!response.success) throw new Error(response.error?.message || 'Failed to join match')
    return response.data.match
  },

  /**
   * Find or create a match (matchmaking)
   */
  async findMatch(request: FindMatchRequest): Promise<PvPMatch> {
    const response = await api.request<any>('/api/pvp/matchmaking', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    if (!response.success) throw new Error(response.error?.message || 'Failed to find match')
    return response.data.match
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
