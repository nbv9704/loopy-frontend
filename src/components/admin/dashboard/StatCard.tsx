import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'teal' | 'cyan' | 'blue' | 'purple' | 'green' | 'yellow' | 'amber' | 'slate'
}

const colorClasses = {
  teal: 'bg-teal-50 text-teal-700 ring-teal-100',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  purple: 'bg-purple-50 text-purple-700 ring-purple-100',
  green: 'bg-green-50 text-green-700 ring-green-100',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  slate: 'bg-slate-50 text-slate-700 ring-slate-100',
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, trend, color = 'teal' }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
      <div className={`mb-5 inline-flex rounded-lg p-3 ring-1 ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>

      <p className="mb-2 text-sm font-bold text-slate-500">{label}</p>

      <div className="flex items-end justify-between gap-3">
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{value}</h3>

        {trend && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-black ${
              trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  )
}

export default StatCard
