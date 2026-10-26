import AdminButton from '../../components/admin/AdminButton'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import {
  Users,
  BookOpen,
  Code,
  TrendingUp,
  Zap,
  Award,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../../components/admin/dashboard/StatCard'
import { useDashboardStats } from '../../hooks/admin/useDashboardStats'

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, isFetching, error, refresh } = useDashboardStats()
  const navigate = useNavigate()

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100 shadow-sm" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm"
        >
          <h2 className="mb-2 text-2xl font-black text-slate-950">Lỗi tải dữ liệu</h2>
          <p className="font-medium text-slate-500">{error}</p>
          <AdminButton className="mt-4" onClick={refresh}>
            Thử lại
          </AdminButton>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const actionCards = [
    {
      title: 'Quản lý bài học',
      description: 'Lọc theo chapter, rà nội dung thiếu và mở editor.',
      icon: BookOpen,
      action: () => navigate('/admin/lessons'),
      tone: 'teal',
      meta: 'Content manager',
    },
    {
      title: 'Bulk import',
      description: 'Nhập nhiều lesson và test case bằng JSON.',
      icon: Upload,
      action: () => navigate('/admin/import'),
      tone: 'cyan',
      meta: 'Content ops',
    },
    {
      title: 'Xem public site',
      description: 'Mở website learner để kiểm tra trải nghiệm thật.',
      icon: ExternalLink,
      action: () => window.open('/', '_blank', 'noopener,noreferrer'),
      tone: 'amber',
      meta: 'QA check',
    },
  ]

  const healthItems = [
    {
      label: 'Lesson content',
      value: `${stats.totalLessons} bài`,
      status: stats.totalLessons > 0 ? 'ok' : 'warn',
    },
    {
      label: 'Learner activity',
      value: `${stats.submissionsThisWeek} bài nộp / 7 ngày`,
      status: stats.submissionsThisWeek > 0 ? 'ok' : 'warn',
    },
    {
      label: 'Tỷ lệ bài nộp đúng',
      value: stats.completionRate === null ? 'Chưa có bài nộp' : `${stats.completionRate}% đúng`,
      status: (stats.completionRate ?? 0) > 0 ? 'ok' : 'warn',
    },
  ]

  const contentChecks = [
    {
      label: 'Lesson thiếu trường nội dung code',
      value: stats.contentQuality.lessonsMissingRequiredFields,
      detail: 'Rà title, starter code, task và solution; lesson concept cần được xem riêng.',
      filter: 'missing-required-fields',
    },
    {
      label: 'Lesson thiếu test case',
      value: stats.contentQuality.lessonsWithoutTestCases,
      detail: 'Checker deterministic cần test case hoặc rule rõ ràng trước khi publish.',
      filter: 'missing-test-case',
    },
    {
      label: 'Lesson chưa có hint',
      value: stats.contentQuality.lessonsWithoutHint,
      detail: 'Hint giúp người mới sửa lỗi mà không cần đoán mò.',
      filter: 'missing-hint',
    },
  ]

  const iconTone: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-100',
    cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  }

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Dashboard"
        eyebrow="Tổng quan vận hành"
        description="Theo dõi nội dung học, bài nộp và các công việc cần xử lý."
        actions={
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">
              Dữ liệu đọc gần nhất
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-950">
              <RefreshCw className={`h-4 w-4 text-teal-700 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching
                ? 'Đang tải...'
                : new Date(stats.generatedAt).toLocaleString('vi-VN', { timeZone: stats.timeZone })}
            </div>
            <AdminButton className="mt-2" onClick={refresh} disabled={isFetching}>
              Tải lại thống kê
            </AdminButton>
            <p className="mt-1 text-xs text-slate-500">
              Mốc ngày Việt Nam. Các truy vấn không cùng một snapshot.
            </p>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Tổng số người dùng"
          value={stats.totalUsers.toLocaleString()}
          color="teal"
        />

        <StatCard
          icon={BookOpen}
          label="Bài học đã xuất bản"
          value={stats.totalLessons.toLocaleString()}
          color="cyan"
        />

        <StatCard
          icon={BookOpen}
          label="Bài học nháp"
          value={stats.draftLessons.toLocaleString()}
          color="amber"
        />

        <StatCard
          icon={BookOpen}
          label="Bài học lưu trữ"
          value={stats.archivedLessons.toLocaleString()}
          color="slate"
        />

        <StatCard
          icon={Code}
          label="Tổng số bài nộp"
          value={stats.totalSubmissions.toLocaleString()}
          color="blue"
        />

        <StatCard
          icon={TrendingUp}
          label="Bài nộp hôm nay"
          value={stats.submissionsToday.toLocaleString()}
          color="purple"
        />

        <StatCard
          icon={TrendingUp}
          label="Bài nộp 7 ngày qua"
          value={stats.submissionsThisWeek.toLocaleString()}
          color="green"
        />

        <StatCard
          icon={Award}
          label="Tỷ lệ bài nộp đúng"
          value={stats.completionRate === null ? 'Chưa có dữ liệu' : `${stats.completionRate}%`}
          color="yellow"
        />

        <StatCard
          icon={Zap}
          label="Trận PvP"
          value={stats.totalPvPMatches.toLocaleString()}
          color="teal"
        />

        <StatCard
          icon={Award}
          label="Thực thi TB (bài nộp đúng)"
          value={
            stats.averageExecutionTime === null
              ? 'Chưa có dữ liệu'
              : `${stats.averageExecutionTime}ms (${stats.executionSamples} mẫu)`
          }
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actionCards.map(card => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              onClick={card.action}
              className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50/30"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className={`rounded-lg p-3 ring-1 ${iconTone[card.tone]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-teal-700" />
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                {card.meta}
              </div>
              <div className="mt-2 text-lg font-black text-slate-950">{card.title}</div>
              <div className="mt-1 text-sm font-medium leading-6 text-slate-600">
                {card.description}
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Việc nên kiểm tra</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Tất cả trạng thái lesson. Đây là tín hiệu rà nội dung, không phải kết luận đủ điều
                kiện xuất bản.
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-teal-700" />
          </div>

          <div className="space-y-3">
            {contentChecks.map(item => (
              <button
                key={item.label}
                onClick={() => navigate(`/admin/lessons?filter=${item.filter}&status=all`)}
                className="flex w-full items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/30"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {item.value > 0 ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                  )}
                  <div>
                    <p className="break-words text-sm font-semibold leading-6 text-slate-800 [overflow-wrap:anywhere]">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium leading-6 text-slate-500">{item.detail}</p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                    item.value > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                  }`}
                >
                  {item.value}
                </span>
              </button>
            ))}
          </div>

          <AdminButton className="mt-5" onClick={() => navigate('/admin/lessons')}>
            Mở danh sách lesson
            <ArrowRight className="h-4 w-4" />
          </AdminButton>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-950">Tín hiệu hoạt động</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Tín hiệu nhanh từ dữ liệu hiện có.
            </p>
          </div>

          <div className="space-y-3">
            {healthItems.map(item => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-4"
              >
                <div>
                  <div className="text-sm font-black text-slate-950">{item.label}</div>
                  <div className="mt-1 text-sm font-medium text-slate-500">{item.value}</div>
                </div>
                {item.status === 'ok' ? (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-black text-green-700">
                    OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Check
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Hoạt động gần đây</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Các bài học được chỉnh sửa hoặc thêm mới gần nhất.
              </p>
            </div>
            <Clock className="h-6 w-6 text-teal-700" />
          </div>
          <div className="space-y-3">
            {stats.recentLessons?.length > 0 ? (
              stats.recentLessons.map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => navigate(`/admin/lessons/${lesson.id}`)}
                  className="flex w-full items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/30"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                    <div>
                      <p className="break-words text-sm font-semibold leading-6 text-slate-800 [overflow-wrap:anywhere]">
                        {lesson.title}
                      </p>
                      <p className="break-words text-xs font-medium text-slate-500 [overflow-wrap:anywhere]">
                        ID: {lesson.lesson_id}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-400">
                    {lesson.updated_at && Number.isFinite(Date.parse(lesson.updated_at))
                      ? new Date(lesson.updated_at).toLocaleDateString('vi-VN')
                      : 'Không rõ thời gian'}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-sm font-medium text-slate-500">
                Chưa có bài học nào được cập nhật gần đây.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Bài nộp lỗi gần nhất</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Các bài nộp chưa đúng gần nhất; không suy ra người học đang mắc kẹt.
              </p>
            </div>
            <XCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="space-y-3">
            {stats.recentFailedSubmissions?.length > 0 ? (
              stats.recentFailedSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-left"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Code className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="break-words text-sm font-semibold leading-6 text-slate-800 [overflow-wrap:anywhere]">
                        {sub.lessons?.title || 'Unknown Lesson'}
                      </p>
                      <p className="break-words text-xs font-medium text-slate-500 [overflow-wrap:anywhere]">
                        User: {sub.user_id?.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-400">
                    {new Date(sub.submitted_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm font-medium text-slate-500">
                Không có bài nộp lỗi nào gần đây.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
