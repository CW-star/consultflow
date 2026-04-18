'use client'
import { formatCurrency } from '@/lib/utils'

interface Stat {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}

export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className={cn(
          "rounded-xl p-4 border",
          s.highlight
            ? "bg-red-50 border-red-200"
            : "bg-white border-gray-100"
        )}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
          <p className="text-2xl font-semibold mt-1 text-gray-900">{s.value}</p>
          {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
        </div>
      ))}
    </div>
  )
}

function cn(...c: (string | boolean | undefined)[]) {
  return c.filter(Boolean).join(' ')
}