import { api } from '../lib/api'
import type { PracticeSet, PracticeAttempt, PracticeDifficulty, PracticeQuestion, PracticeSubmissionResult } from '../types/practice.types'

export interface ListPracticeSetsParams {
  languageId?: string
  difficulty?: PracticeDifficulty
  topic?: string
  keyword?: string
  includeQuestions?: boolean
  mine?: boolean
  official?: boolean
  limit?: number
  offset?: number
}

export interface CreatePracticeSetPayload {
  title: string
  description?: string
  topic?: string
  languageId?: string
  difficulty?: PracticeDifficulty
  visibility?: 'public' | 'private' | 'unlisted' | 'official'
  status?: 'draft' | 'published'
  requirements?: {
    type?: 'completed_lessons_count'
    languageId?: string
    count?: number
  }
  questions: Array<{
    type: 'true_false' | 'multiple_choice' | 'multiple_select' | 'fill_blank'
    title?: string
    prompt: string
    options?: string[]
    correctAnswer?: string
    explanation?: string
    points?: number
  }>
}

export const practiceService = {
  async listSets(params: ListPracticeSetsParams = {}): Promise<{
    items: PracticeSet[]
    total: number
    limit: number
    offset: number
  }> {
    const query = new URLSearchParams()
    if (params.languageId) query.set('languageId', params.languageId)
    if (params.difficulty) query.set('difficulty', params.difficulty)
    if (params.topic) query.set('topic', params.topic)
    if (params.keyword) query.set('keyword', params.keyword)
    if (params.includeQuestions !== undefined) query.set('includeQuestions', String(params.includeQuestions))
    if (params.mine !== undefined) query.set('mine', String(params.mine))
    if (params.official !== undefined) query.set('official', String(params.official))
    if (params.limit) query.set('limit', String(params.limit))
    if (params.offset !== undefined) query.set('offset', String(params.offset))

    const response = await api.request<any>(`/api/practice/sets?${query.toString()}`, {
      suppressAuthToast: true,
    })

    if (!response.success || !response.data) {
      return {
        items: [],
        total: 0,
        limit: params.limit || 20,
        offset: params.offset || 0,
      }
    }

    return response.data
  },

  async getSet(setId: string): Promise<PracticeSet> {
    const response = await api.request<any>(`/api/practice/sets/${setId}`)
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Practice set not found')
    }
    return response.data
  },

  async searchQuestions(keyword: string): Promise<Array<{ set: PracticeSet; question: PracticeQuestion }>> {
    const trimmed = keyword.trim()
    if (!trimmed) return []

    const result = await this.listSets({
      keyword: trimmed,
      includeQuestions: true,
      limit: 20,
    })

    return result.items.flatMap((set) =>
      (set.questions || []).slice(0, 20).map((question) => ({ set, question }))
    ).slice(0, 20)
  },

  async createSet(payload: CreatePracticeSetPayload): Promise<PracticeSet> {
    const response = await api.request<any>('/api/practice/sets', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to create practice set')
    }
    return response.data
  },

  async updateSet(setId: string, payload: CreatePracticeSetPayload): Promise<PracticeSet> {
    const response = await api.request<any>(`/api/practice/sets/${setId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to update practice set')
    }
    return response.data
  },

  async deleteSet(setId: string): Promise<void> {
    const response = await api.request<any>(`/api/practice/sets/${setId}`, {
      method: 'DELETE',
    })
    if (!response.success) {
      throw new Error(response.error?.message || 'Unable to delete practice set')
    }
  },

  async startAttempt(setId: string): Promise<PracticeAttempt> {
    const response = await api.request<any>(`/api/practice/sets/${setId}/attempts`, {
      method: 'POST',
    })
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to start practice attempt')
    }
    return response.data
  },

  async submitAnswer(
    attemptId: string,
    questionId: string,
    payload: { selectedAnswer?: string; code?: string }
  ): Promise<PracticeSubmissionResult> {
    const response = await api.request<any>(`/api/practice/attempts/${attemptId}/questions/${questionId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Unable to submit practice answer')
    }
    return response.data
  },
}
