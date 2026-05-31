import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Code2, RefreshCw, XCircle } from 'lucide-react'
import { AdminSubmission, contentService } from '../../services/admin/content.service'

type StatusFilter = 'all' | 'pass' | 'fail'

const SubmissionStatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-8 w-14 animate-pulse rounded bg-slate-100" />
      </div>
    ))}
  </div>
)

const SubmissionListSkeleton = () => (
  <>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="grid gap-4 p-5 lg:grid-cols-[1fr,280px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-6 w-60 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-36 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-16 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-3 h-24 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, metricIndex) => (
              <div key={metricIndex} className="flex justify-between gap-4">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </>
)

const SubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([])
  const [status, setStatus] = useState<StatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSubmissions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await contentService.getSubmissions({ status, limit: 75 })
      setSubmissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải submissions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [status])

  const passCount = submissions.filter(item => item.is_correct).length
  const failCount = submissions.length - passCount

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-blue-700">
            <Code2 className="h-3.5 w-3.5" />
            Submission monitor
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Submissions
          </h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
            Theo dõi bài nộp gần đây để phát hiện lesson khó hiểu, checker lỗi hoặc learner đang kẹt.
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && submissions.length === 0 ? (
        <SubmissionStatsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Đang xem</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{submissions.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Pass</p>
            <p className="mt-2 text-3xl font-black text-green-700">{passCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Fail</p>
            <p className="mt-2 text-3xl font-black text-red-700">{failCount}</p>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(['all', 'pass', 'fail'] as StatusFilter[]).map(option => (
              <button
                key={option}
                onClick={() => setStatus(option)}
                className={`rounded-md px-3 py-2 text-sm font-black capitalize transition-colors ${
                  status === option ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-slate-500">Tối đa 75 submission mới nhất</p>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading && <SubmissionListSkeleton />}

          {!isLoading && submissions.length === 0 && (
            <div className="p-10 text-center text-sm font-bold text-slate-500">
              Chưa có submission phù hợp.
            </div>
          )}

          {!isLoading &&
            submissions.map(submission => {
              const lesson = submission.lessons
              const chapter = lesson?.chapters

              return (
                <div key={submission.id} className="grid gap-4 p-5 lg:grid-cols-[1fr,280px]">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {submission.is_correct ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-black text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
                          <XCircle className="h-3.5 w-3.5" />
                          Fail
                        </span>
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {chapter?.language_id || 'unknown'}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-950">
                      {lesson?.title || 'Unknown lesson'}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {lesson?.lesson_id || submission.lesson_id}
                    </p>
                    {submission.feedback && (
                      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-medium leading-6 text-slate-700">
                        {submission.feedback}
                      </p>
                    )}
                    <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                      {submission.code}
                    </pre>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <Clock className="h-4 w-4" />
                      {submission.execution_time ?? 0}ms
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">Test score</dt>
                        <dd className="font-black text-slate-950">{submission.test_score ?? '-'}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">Final score</dt>
                        <dd className="font-black text-slate-950">{submission.final_score ?? '-'}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="font-bold text-slate-500">Submitted</dt>
                        <dd className="text-right font-bold text-slate-700">
                          {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '-'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )
            })}
        </div>
      </section>
    </div>
  )
}

export default SubmissionsPage
