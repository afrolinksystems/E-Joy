type DashboardHeaderProps = {
  shopId: string
}

export function DashboardHeader({ shopId }: DashboardHeaderProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
      <p className="mt-1 text-sm text-slate-500">
        Shop <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">{shopId}</code>
        {' Â· '}Refreshes every minute
      </p>
    </div>
  )
}
