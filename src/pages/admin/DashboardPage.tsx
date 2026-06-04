import {
  Users,
  BookOpen,
  Code,
  TrendingUp,
  Zap,
  Award,
  Upload,
  ExternalLink,
  Activity,
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
  const { data: stats, isLoading, isFetching, error } = useDashboardStats()
  const navigate = useNavigate()

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100 shadow-sm" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-2xl font-black text-slate-950">Lỗi tải dữ liệu</h2>
          <p className="font-medium text-slate-500">Không thể tải thống kê dashboard</p>
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
      action: () => window.open('/', '_blank'),
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
      label: 'Completion quality',
      value: `${stats.completionRate}% đúng`,
      status: stats.completionRate > 0 ? 'ok' : 'warn',
    },
  ]

  const contentChecks = [
    {
      label: 'Lesson thiếu field bắt buộc',
      value: stats.contentQuality.lessonsMissingRequiredFields,
      detail: 'Cần có title, starter code, task description và solution code.',
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
    <div className="space-y-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-700">
            <Activity className="h-3.5 w-3.5" />
            Admin command center
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
            Theo dõi nội dung học, import, submissions và các việc vận hành cần xử lý tiếp theo.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Background sync</div>
          <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-950">
            <RefreshCw className={`h-4 w-4 text-teal-700 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Đang đồng bộ...' : 'Tự cập nhật mỗi 30 giây'}
          </div>
        </div>
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
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">{card.meta}</div>
              <div className="mt-2 text-lg font-black text-slate-950">{card.title}</div>
              <div className="mt-1 text-sm font-medium leading-6 text-slate-600">{card.description}</div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          value={stats.draftLessons?.toLocaleString() || '0'}
          color="amber"
        />

        <StatCard
          icon={BookOpen}
          label="Bài học lưu trữ"
          value={stats.archivedLessons?.toLocaleString() || '0'}
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
          label="Bài nộp tuần này"
          value={stats.submissionsThisWeek.toLocaleString()}
          color="green"
        />

        <StatCard
          icon={Award}
          label="Tỷ lệ hoàn thành"
          value={`${stats.completionRate}%`}
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
          label="Thời gian thực thi TB"
          value={`${stats.averageExecutionTime ?? stats.averageAIScore}ms`}
          color="cyan"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Việc nên kiểm tra</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Checklist ngắn sau mỗi lần cập nhật nội dung hoặc import.
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-teal-700" />
          </div>

          <div className="space-y-3">
            {contentChecks.map(item => (
              <button
                key={item.label}
                onClick={() => navigate(`/admin/lessons?filter=${item.filter}`)}
                className="flex w-full items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/30"
              >
                <div className="flex items-start gap-3">
                  {item.value > 0 ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                  )}
                  <div>
                    <p className="text-sm font-black leading-6 text-slate-800">{item.label}</p>
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

          <button
            onClick={() => navigate('/admin/lessons')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50"
          >
            Mở danh sách lesson
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-950">Health snapshot</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Tín hiệu nhanh từ dữ liệu hiện có.</p>
          </div>

          <div className="space-y-3">
            {healthItems.map(item => (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-4">
                <div>
                  <div className="text-sm font-black text-slate-950">{item.label}</div>
                  <div className="mt-1 text-sm font-medium text-slate-500">{item.value}</div>
                </div>
                {item.status === 'ok' ? (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-black text-green-700">OK</span>
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

      <div className="grid gap-5 lg:grid-cols-2">
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
                  <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                    <div>
                      <p className="text-sm font-black leading-6 text-slate-800">{lesson.title}</p>
                      <p className="text-xs font-medium text-slate-500">ID: {lesson.lesson_id}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-400">
                    {new Date(lesson.updated_at).toLocaleDateString('vi-VN')}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-sm font-medium text-slate-500">Chưa có bài học nào được cập nhật gần đây.</div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">Bài nộp lỗi gần nhất</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Learner đang kẹt ở các bài học này.
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
                  <div className="flex items-start gap-3">
                    <Code className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-black leading-6 text-slate-800">
                        {sub.lessons?.title || 'Unknown Lesson'}
                      </p>
                      <p className="text-xs font-medium text-slate-500">User: {sub.user_id?.substring(0, 8)}...</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-400">
                    {new Date(sub.submitted_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm font-medium text-slate-500">Không có bài nộp lỗi nào gần đây.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
