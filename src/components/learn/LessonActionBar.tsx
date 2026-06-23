import { FiAlertCircle, FiCheckCircle, FiPlay } from 'react-icons/fi'

export type LessonFlowStep = 'see' | 'change' | 'run' | 'fix' | 'build'

type ContentMap = Record<string, string | null | undefined>

interface LessonActionBarProps {
  currentStep: LessonFlowStep
  isLoading: boolean
  hasPassedChangeCheck: boolean
  hasPassedDebugCheck: boolean
  onPrimaryAction: () => void
  onShowHint: () => void
  content?: ContentMap
}

const fallbackActionCopy: Record<LessonFlowStep, { label: string; helper: string; icon: 'play' | 'check' | 'alert' }> = {
  see: {
    label: 'Chạy code mẫu',
    helper: 'Quan sát output trước khi sửa. Editor đang khóa ở bước này.',
    icon: 'play',
  },
  change: {
    label: 'Kiểm tra thay đổi',
    helper: 'Loopy dùng checker deterministic để xác nhận bạn sửa đúng yêu cầu.',
    icon: 'check',
  },
  run: {
    label: 'Chạy thử output',
    helper: 'Chỉ execute code để xem kết quả, không chấm điểm ở bước này.',
    icon: 'play',
  },
  fix: {
    label: 'Kiểm tra sửa lỗi',
    helper: 'Đọc terminal, sửa lỗi runtime rồi kiểm tra lại.',
    icon: 'alert',
  },
  build: {
    label: 'Lưu hoàn thành',
    helper: 'Progress chỉ được lưu sau khi backend xác nhận completeLesson thành công.',
    icon: 'check',
  },
}

const iconByName = {
  play: FiPlay,
  check: FiCheckCircle,
  alert: FiAlertCircle,
}

const getContent = (content: ContentMap | undefined, key: string, fallback: string) => content?.[key] || fallback

const LessonActionBar: React.FC<LessonActionBarProps> = ({
  currentStep,
  isLoading,
  hasPassedChangeCheck,
  hasPassedDebugCheck,
  onPrimaryAction,
  onShowHint,
  content,
}) => {
  const fallbackCopy = fallbackActionCopy[currentStep]
  const copy = {
    ...fallbackCopy,
    label: getContent(content, `learn.action.${currentStep}.label`, fallbackCopy.label),
    helper: getContent(content, `learn.action.${currentStep}.helper`, fallbackCopy.helper),
  }
  const Icon = iconByName[copy.icon]
  const canShowHint = currentStep === 'change' || currentStep === 'fix'

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-xl shadow-black/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal">
            {getContent(content, 'learn.action.current_step', 'Bước hiện tại')}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-300">{copy.helper}</p>
          {currentStep === 'run' && hasPassedChangeCheck && (
            <p className="mt-1 text-xs font-bold text-green-300">
              {getContent(content, 'learn.action.change_passed', '✓ Thay đổi đã pass checker chính.')}
            </p>
          )}
          {currentStep === 'build' && hasPassedDebugCheck && (
            <p className="mt-1 text-xs font-bold text-green-300">
              {getContent(content, 'learn.action.debug_passed', '✓ Debug đã xong, có thể lưu tiến độ.')}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canShowHint && (
            <button
              onClick={onShowHint}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition-all hover:-translate-y-0.5 hover:border-brand-teal/30 hover:text-brand-teal"
            >
              {getContent(content, 'learn.action.hint_button', 'Cần gợi ý')}
            </button>
          )}
          <button
            onClick={onPrimaryAction}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_4px_0_#0b889c] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-1 active:shadow-[0_1px_0_#0b889c]"
          >
            <Icon className="h-4 w-4" />
            {isLoading ? getContent(content, 'learn.action.processing', 'Đang xử lý...') : copy.label}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LessonActionBar
