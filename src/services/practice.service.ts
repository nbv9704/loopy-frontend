import { api } from '../lib/api'
import {
  normalizePracticeWrite,
  confirmPracticeWrite,
  unconfirmedPracticeId,
} from '../features/practice/practiceWrite'
import {
  readPracticePage,
  readPracticeSet,
  readStartedAttempt,
  readSubmittedAnswer,
} from '../features/practice/practiceResponse'
import type {
  PracticeSet,
  PracticeAttempt,
  PracticeDifficulty,
  PracticeQuestion,
  PracticeSubmissionResult,
} from '../types/practice.types'

export class PracticeRequestError extends Error {
  readonly code?: string
  readonly status?: number
  readonly details?: unknown
  constructor(
    error: { code?: string; message?: string; status?: number; details?: unknown } | undefined,
    fallback: string
  ) {
    super(error?.message || fallback)
    this.name = 'PracticeRequestError'
    this.code = error?.code
    this.status = error?.status
    this.details = error?.details
  }
}

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
  status?: PracticeSet['status']
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
  async listSets(
    params: ListPracticeSetsParams = {},
    signal?: AbortSignal
  ): Promise<{
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
    if (params.includeQuestions !== undefined)
      query.set('includeQuestions', String(params.includeQuestions))
    if (params.mine !== undefined) query.set('mine', String(params.mine))
    if (params.official !== undefined) query.set('official', String(params.official))
    if (params.limit) query.set('limit', String(params.limit))
    if (params.offset !== undefined) query.set('offset', String(params.offset))

    const response = await api.request<unknown>(`/api/practice/sets?${query.toString()}`, {
      suppressAuthToast: true,
      signal,
    })

    if (!response.success || !response.data) {
      throw new PracticeRequestError(response.error, 'Không tải được bộ bài tập. Vui lòng thử lại.')
    }

    return readPracticePage(response.data, {
      ...params,
      includeQuestions: Boolean(params.includeQuestions || params.keyword),
    })
  },

  async getSet(setId: string, signal?: AbortSignal): Promise<PracticeSet> {
    const response = await api.request<unknown>(`/api/practice/sets/${encodeURIComponent(setId)}`, {
      signal,
    })
    if (!response.success || !response.data) {
      throw new PracticeRequestError(response.error, 'Practice set not found')
    }
    return readPracticeSet(response.data, setId, true)
  },

  async searchQuestions(
    keyword: string
  ): Promise<Array<{ set: PracticeSet; question: PracticeQuestion }>> {
    const trimmed = keyword.trim()
    if (!trimmed) return []

    const result = await this.listSets({
      keyword: trimmed,
      includeQuestions: true,
      limit: 20,
    })

    const needle = trimmed.toLocaleLowerCase()
    return result.items
      .flatMap(set =>
        (set.questions || [])
          .filter(question =>
            [set.title, set.description, set.topic, question.title, question.prompt].some(
              value => typeof value === 'string' && value.toLocaleLowerCase().includes(needle)
            )
          )
          .map(question => ({ set, question }))
      )
      .slice(0, 20)
  },

  async createSet(payload: CreatePracticeSetPayload): Promise<PracticeSet> {
    const normalized = normalizePracticeWrite(payload)
    const response = await api.request<unknown>('/api/practice/sets', {
      method: 'POST',
      body: JSON.stringify(normalized),
    })
    if (!response.success || !response.data) {
      throw new PracticeRequestError(response.error, 'Unable to create practice set')
    }
    try {
      const saved = readPracticeSet(response.data, undefined, true)
      confirmPracticeWrite(saved, normalized)
      return saved
    } catch (error) {
      const setId = unconfirmedPracticeId(response.data)
      if (setId)
        throw new PracticeRequestError(
          { code: 'PRACTICE_SAVE_UNCONFIRMED', details: { setId } },
          'Chưa xác nhận được kết quả bộ bài đã lưu.'
        )
      throw error
    }
  },

  async updateSet(setId: string, payload: CreatePracticeSetPayload): Promise<PracticeSet> {
    const normalized = normalizePracticeWrite(payload)
    const response = await api.request<unknown>(`/api/practice/sets/${encodeURIComponent(setId)}`, {
      method: 'PUT',
      body: JSON.stringify(normalized),
    })
    if (!response.success || !response.data) {
      throw new PracticeRequestError(response.error, 'Unable to update practice set')
    }
    try {
      const saved = readPracticeSet(response.data, setId, true)
      confirmPracticeWrite(saved, normalized, setId)
      return saved
    } catch (error) {
      if (unconfirmedPracticeId(response.data, setId))
        throw new PracticeRequestError(
          { code: 'PRACTICE_SAVE_UNCONFIRMED', details: { setId } },
          'Chưa xác nhận được kết quả bộ bài đã lưu.'
        )
      throw error
    }
  },

  async deleteSet(setId: string, expectedStatus?: PracticeSet['status']): Promise<void> {
    const query = expectedStatus ? `?${new URLSearchParams({ expectedStatus })}` : ''
    const response = await api.request<{ id: string; status: string }>(
      `/api/practice/sets/${encodeURIComponent(setId)}${query}`,
      {
        method: 'DELETE',
      }
    )
    if (!response.success) {
      throw new PracticeRequestError(response.error, 'Unable to delete practice set')
    }
    if (response.data?.id !== setId || response.data.status !== 'archived')
      throw new Error('Chưa xác nhận đúng bộ bài đã lưu trữ. Hãy tải lại danh sách.')
  },

  async startAttempt(setId: string, userId: string): Promise<PracticeAttempt> {
    const response = await api.request<unknown>(
      `/api/practice/sets/${encodeURIComponent(setId)}/attempts`,
      {
        method: 'POST',
      }
    )
    if (!response.success || !response.data) {
      throw new PracticeRequestError(response.error, 'Unable to start practice attempt')
    }
    return readStartedAttempt(response.data, setId, userId)
  },

  async submitAnswer(
    attemptId: string,
    questionId: string,
    payload: { selectedAnswer?: string; code?: string },
    context: { attempt: PracticeAttempt; question: PracticeQuestion }
  ): Promise<PracticeSubmissionResult> {
    if (
      context.attempt.id !== attemptId ||
      context.question.id !== questionId ||
      context.question.setId !== context.attempt.setId
    )
      throw new Error('Lượt làm bài hoặc câu hỏi đã thay đổi. Vui lòng tải lại.')
    const response = await api.request<unknown>(
      `/api/practice/attempts/${encodeURIComponent(attemptId)}/questions/${encodeURIComponent(questionId)}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )
    if (!response.success || !response.data) {
      throw new PracticeRequestError(response.error, 'Unable to submit practice answer')
    }
    return readSubmittedAnswer(response.data, context.attempt, context.question)
  },
}
