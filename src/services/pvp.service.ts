/**
 * PvP Service
 * HTTP API calls for PvP system
 */

import axios from 'axios'
import type { PvPMatch, PvPQuestion, PvPUserStats } from '../types/pvp.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
  async createMatch(request: CreateMatchRequest, token: string): Promise<PvPMatch> {
    const response = await axios.post(`${API_BASE_URL}/api/pvp/matches`, request, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.data.match
  },

  /**
   * Get match details
   */
  async getMatch(matchId: string, token: string): Promise<PvPMatch> {
    const response = await axios.get(`${API_BASE_URL}/api/pvp/matches/${matchId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.data.match
  },

  /**
   * Find or create a match (matchmaking)
   */
  async findMatch(request: FindMatchRequest, token: string): Promise<PvPMatch> {
    const response = await axios.post(`${API_BASE_URL}/api/pvp/matchmaking`, request, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.data.match
  },

  /**
   * Get current question for match
   */
  async getCurrentQuestion(matchId: string, token: string): Promise<PvPQuestion> {
    const response = await axios.get(`${API_BASE_URL}/api/pvp/matches/${matchId}/question`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.data.question
  },

  /**
   * Get match history
   */
  async getMatchHistory(
    token: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PvPMatch[]> {
    const response = await axios.get(`${API_BASE_URL}/api/pvp/history`, {
      params: { limit, offset },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.data.matches
  },

  /**
   * Get user stats
   */
  async getUserStats(token: string, userId?: string): Promise<PvPUserStats> {
    const url = userId
      ? `${API_BASE_URL}/api/pvp/stats/${userId}`
      : `${API_BASE_URL}/api/pvp/stats`

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.data.stats
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    token: string,
    limit: number = 50,
    sortBy: 'rating' | 'matches_won' | 'accuracy_rate' = 'rating'
  ): Promise<Array<PvPUserStats & { display_name: string; avatar_url: string }>> {
    const response = await axios.get(`${API_BASE_URL}/api/pvp/leaderboard`, {
      params: { limit, sort_by: sortBy },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.data.leaderboard
  },
}
