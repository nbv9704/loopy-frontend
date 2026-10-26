import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { practiceService } from '../../services/practice.service'
import type { PracticeAttempt, PracticeSubmissionResult } from '../../types/practice.types'

/** Attempt state belongs to one mounted account/set. Writes share a synchronous lock. */
export function usePracticeAttempt(setId: string, userId: string) {
  const [attempt, setAttempt] = useState<PracticeAttempt | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submissions, setSubmissions] = useState<
    Record<string, PracticeSubmissionResult['submission']>
  >({})
  const { pending, run } = useAsyncAction(JSON.stringify([setId, userId]))
  const question = attempt?.questions?.[activeIndex]

  const start = (
    onSuccess: (value: PracticeAttempt) => void,
    onError: (error: unknown) => void
  ) => {
    if (!setId || !userId || attempt) return
    return run(() => practiceService.startAttempt(setId, userId), {
      onSuccess: value => {
        setAttempt(value)
        setActiveIndex(0)
        setAnswers({})
        setSubmissions({})
        onSuccess(value)
      },
      onError,
    })
  }
  const submit = (
    value: string,
    onSuccess: (result: PracticeSubmissionResult) => void,
    onError: (error: unknown) => void
  ) => {
    if (!attempt || !question || submissions[question.id] || attempt.status !== 'in_progress')
      return
    return run(
      () =>
        practiceService.submitAnswer(
          attempt.id,
          question.id,
          { selectedAnswer: value },
          { attempt, question }
        ),
      {
        onSuccess: result => {
          setAttempt({ ...result.attempt, questions: attempt.questions })
          setSubmissions(current => ({ ...current, [question.id]: result.submission }))
          onSuccess(result)
        },
        onError,
      }
    )
  }
  const setAnswer = (questionId: string, value: string) => {
    if (
      pending ||
      !attempt ||
      submissions[questionId] ||
      !attempt.questions?.some(row => row.id === questionId)
    )
      return
    setAnswers(current => ({ ...current, [questionId]: value }))
  }
  const selectQuestion = (index: number) => {
    if (
      !pending &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < (attempt?.questions?.length ?? 0)
    )
      setActiveIndex(index)
  }
  const reset = () => {
    if (pending) return
    setAttempt(null)
    setActiveIndex(0)
    setAnswers({})
    setSubmissions({})
  }
  return {
    attempt,
    activeIndex,
    answers,
    submissions,
    pending,
    start,
    submit,
    setAnswer,
    selectQuestion,
    reset,
  }
}
