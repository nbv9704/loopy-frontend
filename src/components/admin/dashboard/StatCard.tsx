import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'teal' | 'cyan' | 'blue' | 'purple' | 'green' | 'yellow'
}

const colorClasses = {
  teal: 'from-brand-teal/20 to-brand-teal/5 text-brand-teal',
  cyan: 'from-brand-cyan/20 to-brand-cyan/5 text-brand-cyan',
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
  purple: 'from-purple-500/20 to-purple-500/5 text-purple-400',
  green: 'from-green-500/20 to-green-500/5 text-green-400',
  yellow: 'from-yellow-500/20 to-yellow-500/5 text-yellow-400',
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, trend, color = 'teal' }) => {
  return (
    <div className="relative group">
      {/* Glow effect on hover */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${colorClasses[color]} rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300`}
      />

      {/* Card content */}
      <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
        {/* Icon */}
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} mb-4`}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Label */}
        <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>

        {/* Value */}
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-bold text-white">{value}</h3>

          {/* Trend (optional) */}
          {trend && (
            <span
              className={`text-sm font-semibold ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatCard
