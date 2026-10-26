interface QuestionStep {
  id?: string
  type: string
  orderIndex?: number
}
const questionTypes = new Set(['multiple_choice', 'true_false', 'fill_blank', 'short_answer'])

export function answerOptions(
  type: string,
  options: unknown[] = []
): { value: string; label: string }[] {
  if (type === 'true_false' && options.length === 0)
    return [
      { value: 'true', label: 'Đúng' },
      { value: 'false', label: 'Sai' },
    ]
  return options.map(option => ({ value: String(option), label: String(option) }))
}

/** Uses only public fields; keep the same ordering/selection contract as the backend checker. */
export function selectPrimaryAnswerStep<T extends QuestionStep>(
  steps: T[],
  lessonType: string
): T | undefined {
  const ordered = [...steps].sort(
    (a, b) =>
      (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || (a.id || '').localeCompare(b.id || '', 'en')
  )
  return (
    ordered.find(step => questionTypes.has(step.type)) ||
    (lessonType === 'code_output' ? ordered.find(step => step.type === 'code_prompt') : undefined)
  )
}
