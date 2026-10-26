import type { AdminSubmission } from './submissions.service'

export default function SubmissionCard({ item }: { item: AdminSubmission }) {
  const submitted =
    item.submitted_at && Number.isFinite(Date.parse(item.submitted_at))
      ? new Date(item.submitted_at).toLocaleString('vi-VN')
      : 'Không rõ thời gian'
  return (
    <article className="grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_240px]">
      <div className="min-w-0">
        <p className="font-bold">
          {item.is_correct === null ? 'Chưa có kết quả' : item.is_correct ? 'Pass' : 'Fail'} ·{' '}
          {item.lessons?.chapters?.language_id || 'Không rõ ngôn ngữ'}
        </p>
        <h2 className="mt-2 break-words [overflow-wrap:anywhere] text-lg font-black">
          {item.lessons?.title || 'Lesson không còn thông tin'}
        </h2>
        <p className="break-words [overflow-wrap:anywhere] text-sm text-slate-600">
          {item.lessons?.lesson_id || item.lesson_id}
        </p>
        {item.feedback && (
          <p className="mt-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded bg-slate-50 p-3">
            {item.feedback}
          </p>
        )}
        {item.code === null ? (
          <p className="mt-3">Không có code được lưu.</p>
        ) : (
          <pre className="mt-3 max-h-64 max-w-full overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
            {item.code}
          </pre>
        )}
      </div>
      <dl className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
        <div>
          <dt>Thời gian xử lý đã lưu</dt>
          <dd className="font-bold">
            {item.execution_time == null ? 'Chưa có dữ liệu thời gian' : `${item.execution_time}ms`}
          </dd>
        </div>
        <div>
          <dt>Test score</dt>
          <dd>{item.test_score ?? 'Chưa có'}</dd>
        </div>
        <div>
          <dt>Final score</dt>
          <dd>{item.final_score ?? 'Chưa có'}</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{submitted}</dd>
        </div>
      </dl>
    </article>
  )
}
