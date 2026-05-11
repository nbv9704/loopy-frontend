/**
 * ActivityHeatmap — GitHub-style contribution heatmap for learning activity.
 *
 * Built from scratch (no external heatmap library) to keep bundle small.
 * Renders a grid of the last 365 days colored by activity level.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface ActivityHeatmapProps {
  /** Array of ISO date strings (YYYY-MM-DD) when user completed lessons */
  activityDates: string[]
}

const CELL_SIZE = 13
const GAP = 3
const TOTAL = CELL_SIZE + GAP
const WEEKS = 53
const DAYS_PER_WEEK = 7

const MONTH_LABELS = [
  'Th1',
  'Th2',
  'Th3',
  'Th4',
  'Th5',
  'Th6',
  'Th7',
  'Th8',
  'Th9',
  'Th10',
  'Th11',
  'Th12',
]

const LEVEL_COLORS = [
  'bg-slate-800/60', // 0 activities
  'bg-emerald-900/70', // 1
  'bg-emerald-700/80', // 2
  'bg-emerald-500', // 3
  'bg-emerald-400', // 4+
]

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ activityDates }) => {
  const { grid, monthPositions, totalActivities } = useMemo(() => {
    // Count activities per date
    const dateCount = new Map<string, number>()
    for (const d of activityDates) {
      const key = d.split('T')[0] // Normalize to YYYY-MM-DD
      dateCount.set(key, (dateCount.get(key) || 0) + 1)
    }

    // Build grid: 53 weeks × 7 days, ending today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cells: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = []
    const months: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    // Calculate start date (53 weeks ago, aligned to Sunday)
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - (WEEKS * 7 - 1) - startDate.getDay())

    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS_PER_WEEK; d++) {
        const cellDate = new Date(startDate)
        cellDate.setDate(cellDate.getDate() + w * 7 + d)

        if (cellDate > today) continue

        const dateStr = cellDate.toISOString().split('T')[0]
        const month = cellDate.getMonth()

        if (month !== lastMonth) {
          months.push({ label: MONTH_LABELS[month], weekIndex: w })
          lastMonth = month
        }

        cells.push({
          date: dateStr,
          count: dateCount.get(dateStr) || 0,
          dayOfWeek: d,
          weekIndex: w,
        })
      }
    }

    return {
      grid: cells,
      monthPositions: months,
      totalActivities: activityDates.length,
    }
  }, [activityDates])

  const svgWidth = WEEKS * TOTAL + 30
  const svgHeight = DAYS_PER_WEEK * TOTAL + 28

  return (
    <div className="bg-white/3 border border-brand-teal/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Hoạt động học tập</h3>
        <span className="text-slate-500 text-xs">
          {totalActivities} bài hoàn thành trong năm qua
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="block">
          {/* Month labels */}
          {monthPositions.map((m, i) => (
            <text
              key={i}
              x={m.weekIndex * TOTAL + 30}
              y={10}
              className="fill-slate-500"
              fontSize={10}
            >
              {m.label}
            </text>
          ))}

          {/* Day cells */}
          {grid.map((cell, i) => {
            const level = getLevel(cell.count)
            const colorClass = LEVEL_COLORS[level]
            // We use foreignObject to leverage Tailwind classes
            return (
              <foreignObject
                key={i}
                x={cell.weekIndex * TOTAL + 30}
                y={cell.dayOfWeek * TOTAL + 16}
                width={CELL_SIZE}
                height={CELL_SIZE}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.0008, duration: 0.2 }}
                  className={`w-full h-full rounded-[3px] ${colorClass} border border-white/5`}
                  title={`${cell.date}: ${cell.count} bài`}
                />
              </foreignObject>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-slate-600 text-[10px] mr-1">Ít</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            className={`w-[11px] h-[11px] rounded-[2px] ${color} border border-white/5`}
          />
        ))}
        <span className="text-slate-600 text-[10px] ml-1">Nhiều</span>
      </div>
    </div>
  )
}

export default ActivityHeatmap
