import { useQuery } from '@apollo/client/react'
import { Loader2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { GET_DASHBOARD_METRICS, type DashboardMetricsData } from '../graphql/dashboard'
import { useAdminSession } from '../lib/adminSession'

function truncateLabel(name: string, max = 20): string {
  const t = name.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function DashboardPage() {
  const { shopId } = useAdminSession()
  const { data, loading, error, refetch } = useQuery<DashboardMetricsData>(GET_DASHBOARD_METRICS, {
    variables: { shopId },
    pollInterval: 60_000,
    fetchPolicy: 'network-only',
  })

  const m = data?.getDashboardMetrics
  const chartRows =
    m?.topDishes.map((d) => ({
      label: truncateLabel(d.name),
      fullName: d.name,
      count: d.count,
    })) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Shop{' '}
          <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">{shopId}</code>
          · Refreshes every minute
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-medium">Could not load metrics.</span> {error.message}
          <button
            type="button"
            className="ml-3 text-orange-700 underline hover:text-orange-900"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading && !m ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-orange-500" />
          Loading dashboard…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Today&apos;s Revenue
              </div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                {m != null ? `${m.todayRevenue.toFixed(2)} Birr` : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Avg. Prep Time
              </div>
              <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                {m != null ? `${m.avgPrepMinutes.toFixed(1)} min` : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Top items (today)
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {m?.topDishes?.length
                  ? `${m.topDishes.length} dish${m.topDishes.length === 1 ? '' : 'es'} in ranking`
                  : 'No paid orders yet today'}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Top 5 items (line items)</h3>
            <p className="mt-1 text-xs text-slate-500">
              By count of line items on paid or completed orders placed today.
            </p>
            <div className="mt-4 h-72 w-full min-w-0">
              {chartRows.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No data to chart yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartRows}
                    margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval={0}
                      angle={-28}
                      textAnchor="end"
                      height={56}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const row = payload[0].payload as {
                          fullName: string
                          count: number
                        }
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
                            <div className="font-medium text-slate-900">{row.fullName}</div>
                            <div className="text-slate-600">{row.count} line items</div>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
