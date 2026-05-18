import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TopDishChartRow } from '../dashboard.types'

type TopDishesChartProps = {
  rows: TopDishChartRow[]
}

export function TopDishesChart({ rows }: TopDishesChartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Top 5 items (line items)</h3>
      <p className="mt-1 text-xs text-slate-500">By count of line items on paid or completed orders placed today.</p>
      <div className="mt-4 h-72 w-full min-w-0">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No data to chart yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-28} textAnchor="end" height={56} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as TopDishChartRow
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
                    <div className="font-medium text-slate-900">{row.fullName}</div>
                    <div className="text-slate-600">{row.count} line items</div>
                  </div>
                )
              }} />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
