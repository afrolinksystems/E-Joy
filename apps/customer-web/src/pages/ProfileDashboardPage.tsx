import {
  ChevronRight,
  CreditCard,
  Info,
  Receipt,
  Ticket,
  User,
} from 'lucide-react'

const BRAND = '#e67e22'

export type ProfileDashboardPageProps = {
  onJoinFree?: () => void
  onMyCoupons?: () => void
  onMyOrders?: () => void
  onPersonalInfo?: () => void
  onMembershipCard?: () => void
  onAbout?: () => void
  onLogout?: () => void
  /** Dev / demo: switch Customer · Lobby · Admin */
  roleMode?: 'customer' | 'lobby_manager' | 'admin'
  onRoleModeChange?: (mode: 'customer' | 'lobby_manager' | 'admin') => void
}

function greetingLine(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Hey, Good Morning!'
  if (h >= 12 && h < 18) return 'Hey, Good Afternoon!'
  return 'Hey, Good Evening!'
}

export function ProfileDashboardPage({
  onJoinFree,
  onMyCoupons,
  onMyOrders,
  onPersonalInfo,
  onMembershipCard,
  onAbout,
  onLogout,
  roleMode = 'customer',
  onRoleModeChange,
}: ProfileDashboardPageProps) {
  const statItems = [
    { label: 'Balance', value: '**' },
    { label: 'Points', value: '**' },
    { label: 'Coupons', value: '**' },
    { label: 'Cards', value: '**' },
  ] as const

  const features = [
    { label: 'My Coupons', Icon: Ticket, onClick: onMyCoupons },
    { label: 'My Orders', Icon: Receipt, onClick: onMyOrders },
    { label: 'Personal Info', Icon: User, onClick: onPersonalInfo },
    { label: 'Membership Card', Icon: CreditCard, onClick: onMembershipCard },
  ] as const

  return (
    <div className="min-h-0 bg-gray-50 px-4 pb-6 pt-4">
      {/* Top card: header + stats */}
      <div
        className="rounded-xl border border-orange-100/60 bg-gradient-to-br from-white via-white to-orange-50/90 p-4 shadow-sm"
        style={{ fontFamily: 'Poppins, Inter, system-ui, sans-serif' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-14 w-14 shrink-0 rounded-full bg-gray-200 ring-2 ring-white"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{greetingLine()}</p>
            <p className="mt-0.5 text-xs text-gray-500">Welcome back</p>
          </div>
          <button
            type="button"
            onClick={onJoinFree}
            className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Join for Free
          </button>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 border-t border-orange-100/80 pt-4">
          {statItems.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[11px] font-medium text-gray-500">{s.label}</div>
              <div
                className="mt-1 text-base font-bold tabular-nums"
                style={{ color: BRAND }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Features */}
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">My Features</h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {features.map(({ label, Icon, onClick }) => (
            <li key={label}>
              <button
                type="button"
                onClick={onClick}
                className="flex w-full items-center gap-3 py-3.5 text-left transition hover:bg-gray-50/80"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <span className="flex-1 text-sm font-medium text-slate-800">{label}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* About */}
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={onAbout}
          className="flex w-full items-center gap-3 py-1 text-left transition hover:opacity-90"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="flex-1 text-sm font-medium text-slate-800">About</span>
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-4 w-full rounded-xl border border-orange-200 bg-orange-50 py-3.5 text-center text-sm font-semibold text-orange-900 transition hover:bg-orange-100/90"
      >
        Log Out
      </button>

      {onRoleModeChange ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {(
            [
              { id: 'customer' as const, label: 'Customer' },
              { id: 'lobby_manager' as const, label: 'Lobby' },
              { id: 'admin' as const, label: 'Admin' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onRoleModeChange(m.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                roleMode === m.id
                  ? 'border-transparent text-white'
                  : 'border-gray-200 bg-white text-slate-700'
              }`}
              style={
                roleMode === m.id ? { backgroundColor: BRAND } : undefined
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
