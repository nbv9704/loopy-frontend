import { FiCheckCircle, FiHelpCircle } from 'react-icons/fi'

export type LessonStepType = 'note' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'code_prompt'

export interface LessonStepItem {
  id: string
  type: LessonStepType
  title?: string
  prompt: string
  options?: unknown[]
  correctAnswer?: unknown
  explanation?: string
  hint?: string
  isRequired?: boolean
  orderIndex: number
}

export interface LessonStepFeedback {
  passed: boolean
  message: string
}

const stepTypeLabel: Record<LessonStepType, string> = {
  note: 'Ghi nhớ',
  multiple_choice: 'Câu hỏi nhanh',
  true_false: 'Đúng / Sai',
  fill_blank: 'Điền vào chỗ trống',
  short_answer: 'Trả lời ngắn',
  code_prompt: 'Thử nghĩ bằng code',
}

interface LessonStepCardProps {
  step: LessonStepItem
  answer?: string
  feedback?: LessonStepFeedback
  onAnswerChange: (stepId: string, value: string) => void
  onCheck: (step: LessonStepItem) => void
}

const LessonStepCard: React.FC<LessonStepCardProps> = ({
  step,
  answer = '',
  feedback,
  onAnswerChange,
  onCheck,
}) => {
  const options = Array.isArray(step.options) ? step.options : []
  const requiresTypedAnswer = ['fill_blank', 'short_answer'].includes(step.type)
  const usesOptions = ['multiple_choice', 'true_false'].includes(step.type) && options.length > 0

  return (
    <article className="group loopy-surface-soft rounded-2xl border loopy-border p-4 shadow-sm transition-colors hover:border-brand-teal/40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-teal">
          <FiHelpCircle className="h-3.5 w-3.5" /> {stepTypeLabel[step.type] || 'Checkpoint'}
        </div>
        {step.isRequired && (
          <span className="rounded-full border border-amber-300/40 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            nên làm
          </span>
        )}
      </div>

      {step.title && <h3 className="mb-2 text-base font-black">{step.title}</h3>}
      <p className="text-sm leading-6 loopy-muted">{step.prompt}</p>

      {usesOptions && (
        <div className="mt-4 space-y-2">
          {options.map(option => {
            const value = String(option)
            const selected = answer === value
            return (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all ${
                  selected
                    ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                    : 'loopy-border loopy-surface text-[color:var(--loopy-text-muted)] hover:border-brand-teal/30 hover:bg-brand-teal/5'
                }`}
              >
                <input
                  type="radio"
                  name={`lesson-step-${step.id}`}
                  value={value}
                  checked={selected}
                  onChange={event => onAnswerChange(step.id, event.target.value)}
                  className="accent-brand-teal"
                />
                <span>{value}</span>
              </label>
            )
          })}
        </div>
      )}

      {requiresTypedAnswer && (
        <input
          value={answer}
          onChange={event => onAnswerChange(step.id, event.target.value)}
          className="mt-4 w-full rounded-xl border loopy-border loopy-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-teal"
          placeholder="Nhập câu trả lời của bạn"
        />
      )}

      <button
        onClick={() => onCheck(step)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-teal/30 bg-brand-teal/5 px-3 py-2 text-xs font-black text-brand-teal transition-colors hover:bg-brand-teal/10"
      >
        <FiCheckCircle className="h-3.5 w-3.5" />
        {step.type === 'note' || step.type === 'code_prompt' ? 'Đã hiểu bước này' : 'Kiểm tra nhanh'}
      </button>

      {feedback && (
        <div className={`mt-3 rounded-xl border p-3 text-xs font-bold leading-5 ${feedback.passed ? 'border-green-400/30 bg-green-50 text-green-700' : 'border-amber-400/30 bg-amber-50 text-amber-700'}`}>
          {feedback.message}
        </div>
      )}
    </article>
  )
}

export default LessonStepCard
