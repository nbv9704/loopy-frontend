import { Users, BookOpen, Code, TrendingUp, Zap, Award } from 'lucide-react'
import StatCard from '../../components/admin/dashboard/StatCard'
import { useDashboardStats } from '../../hooks/admin/useDashboardStats'
import FullscreenLoader from '../../components/common/FullscreenLoader'

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return <FullscreenLoader message="Đang tải dashboard..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-slate-400">Không thể tải thống kê dashboard</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Tổng quan hệ thống và các chỉ số quan trọng</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Tổng số người dùng"
          value={stats.totalUsers.toLocaleString()}
          color="teal"
        />

        <StatCard
          icon={BookOpen}
          label="Tổng số bài học"
          value={stats.totalLessons.toLocaleString()}
          color="cyan"
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
          value={`${stats.averageAIScore}ms`}
          color="cyan"
        />
      </div>

      {/* TODO: Add charts in Phase 2 */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Biểu đồ & Phân tích</h2>
        <p className="text-slate-400 text-center py-8">
          Biểu đồ chi tiết sẽ được thêm vào Phase 2
        </p>
      </div>
    </div>
  )
}

export default DashboardPage
