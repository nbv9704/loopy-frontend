import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Clock, Lock, Target, Trophy, Users, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePvPLobby } from './usePvPLobby'

interface Props {
  scope: string
  content: Record<string, string | null | undefined>
  eligibility: { eligible: boolean; onboardingCompleted: boolean; hasCompletedLesson: boolean }
  languageId?: string
}

export default function PvPLobbyView({ scope, content, eligibility, languageId }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const text = (key: string, fallback: string) => content[key] || fallback
  const onMatched = useCallback(
    (roomCode: string) => {
      toast.success(t('pvp.matchFound'))
      navigate(`/practice/compete/match/${roomCode}`)
    },
    [navigate, t]
  )
  const form = usePvPLobby({ scope, eligible: eligibility.eligible, languageId, onMatched })
  const journey = eligibility.onboardingCompleted
    ? languageId
      ? `/library/${languageId}`
      : '/languages'
    : '/onboarding'

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      {!eligibility.eligible && (
        <section className="mb-8 rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-6 text-center sm:p-8">
          <Lock className="mx-auto mb-4 h-10 w-10 text-brand-teal" />
          <h2 className="loopy-heading mb-2 text-xl font-bold">
            {eligibility.onboardingCompleted
              ? text('pvp.unlock.title', 'Hoàn thành bài học đầu tiên để mở khóa thử thách.')
              : 'Hoàn tất lựa chọn lộ trình trước khi tham gia PvP.'}
          </h2>
          <p className="loopy-body mx-auto mb-6 max-w-md text-sm">
            {text(
              'pvp.locked.desc',
              'Hãy hoàn thành ít nhất một bài học để có nền tảng trước khi đấu cùng người khác.'
            )}
          </p>
          <button
            onClick={() => navigate(journey)}
            className="rounded-xl bg-brand-teal px-6 py-3 font-bold text-slate-950"
          >
            <BookOpen className="mr-2 inline h-4 w-4" />
            {text('pvp.locked.btn', 'Tiếp tục lộ trình')}
          </button>
        </section>
      )}

      <header className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-brand-teal">
          <Zap className="h-5 w-5" />
          <span className="text-sm font-black uppercase tracking-widest">
            {text('pvp.challenge_hub', 'Challenge Hub')}
          </span>
        </div>
        <h1 className="loopy-heading mb-5 text-4xl font-black md:text-6xl">
          {text('pvp.header.title', 'Thử thách nhanh sau bài học.')}
        </h1>
        <p className="loopy-body mx-auto max-w-2xl text-lg leading-8 sm:text-xl">
          {text('pvp.subtitle', 'Luyện phản xạ và củng cố kiến thức sau bài học đầu tiên.')}
        </p>
      </header>

      <fieldset disabled={form.pending || !eligibility.eligible} className="min-w-0">
        <legend className="sr-only">Thiết lập và tham gia PvP</legend>
        <section className="mb-10">
          <h2 className="loopy-heading mb-6 text-center text-2xl font-bold">
            {text('pvp.mode.title', 'Chọn kiểu thử thách')}
          </h2>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-brand-teal bg-brand-teal/10 p-6 text-center">
              <Users className="mx-auto mb-4 h-10 w-10 text-brand-teal" />
              <h3 className="loopy-heading mb-2 text-xl font-bold">{t('pvp.duel')}</h3>
              <p className="loopy-body text-sm">
                {text('pvp.mode.1v1.desc', 'Một vòng nhanh để luyện lại kiến thức vừa học.')}
              </p>
            </div>
            <div className="loopy-card-soft rounded-2xl border-2 p-6 text-center opacity-60">
              <Trophy className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <h3 className="loopy-heading mb-2 text-xl font-bold">
                {text('pvp.mode.br.title', 'Battle Royale')}
              </h3>
              <p className="loopy-body text-sm">
                {text('pvp.mode.br.desc', 'Sắp có. Hiện tại bạn có thể tham gia thử thách 1v1.')}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 id="pvp-difficulty" className="loopy-heading mb-6 text-center text-2xl font-bold">
            {text('pvp.diff.title', 'Độ khó đề xuất')}
          </h2>
          <div
            role="group"
            aria-labelledby="pvp-difficulty"
            className="flex flex-wrap justify-center gap-3"
          >
            {(['easy', 'medium', 'hard'] as const).map(difficulty => (
              <button
                key={difficulty}
                type="button"
                aria-pressed={form.difficulty === difficulty}
                onClick={() => form.setDifficulty(difficulty)}
                className={`rounded-xl px-5 py-3 font-semibold transition-colors ${form.difficulty === difficulty ? 'bg-brand-teal text-slate-950' : 'loopy-subtle-button border'}`}
              >
                {t(`pvp.${difficulty}`)}
              </button>
            ))}
          </div>
        </section>

        {form.error && (
          <div
            role="alert"
            className="mx-auto mb-6 max-w-2xl rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center loopy-heading"
          >
            {form.error}
          </div>
        )}
        <div className="mb-12 flex flex-col items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => void form.find()}
            disabled={form.pending || !eligibility.eligible}
            aria-busy={form.pending && form.action === 'search'}
            className="flex w-full max-w-lg items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-cyan px-6 py-5 text-lg font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap className="h-6 w-6 shrink-0" />
            {form.pending && form.action === 'search'
              ? t('pvp.searching')
              : text('pvp.btn.start1v1', 'Bắt đầu thử thách 1v1')}
          </button>
          <span className="text-sm font-bold loopy-muted">{text('pvp.or', 'HOẶC')}</span>
          <form
            onSubmit={event => {
              event.preventDefault()
              void form.join()
            }}
            className="flex w-full max-w-lg flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="pvp-room-code">
              Mã phòng
            </label>
            <input
              id="pvp-room-code"
              type="text"
              autoComplete="off"
              placeholder={text('pvp.input.code', 'Mã phòng 6 ký tự')}
              value={form.roomCode}
              onChange={event => form.setRoomCode(event.target.value.toUpperCase())}
              maxLength={6}
              className="loopy-surface min-w-0 flex-1 rounded-2xl border loopy-border px-5 py-4 text-center font-mono text-xl uppercase text-[color:var(--loopy-text)]"
            />
            <button
              type="submit"
              disabled={form.pending || !form.canJoin || !eligibility.eligible}
              aria-busy={form.pending && form.action === 'join'}
              className="loopy-subtle-button rounded-2xl px-6 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {form.pending && form.action === 'join' ? t('pvp.joining') : t('pvp.joinRoom')}
            </button>
          </form>
        </div>
      </fieldset>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            icon: Clock,
            title: text('pvp.feat1.title', 'Realtime'),
            description: text(
              'pvp.feat1.desc',
              'Vòng chơi ngắn với thời gian và điểm được xác nhận từ server.'
            ),
          },
          {
            icon: Target,
            title: text('pvp.feat2.title', 'Theo kỹ năng'),
            description: text('pvp.feat2.desc', 'Chọn độ khó phù hợp với kiến thức vừa học.'),
          },
          {
            icon: Trophy,
            title: text('pvp.feat3.title', 'Xem kết quả'),
            description: text(
              'pvp.feat3.desc',
              'Xem điểm và số câu đúng sau trận để biết phần cần luyện thêm.'
            ),
          },
        ].map(item => (
          <article key={item.title} className="loopy-card rounded-xl border p-6">
            <item.icon className="mb-3 h-8 w-8 text-brand-teal" />
            <h3 className="loopy-heading mb-2 text-lg font-bold">{item.title}</h3>
            <p className="loopy-body text-sm">{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
