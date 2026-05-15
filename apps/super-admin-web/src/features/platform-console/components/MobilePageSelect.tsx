import type { NavItem, Page } from '../platform-console.types'

type MobilePageSelectProps = {
  nav: NavItem[]
  onSelect: (page: Page) => void
  page: Page
}

export function MobilePageSelect({ nav, onSelect, page }: MobilePageSelectProps) {
  return (
    <select value={page} onChange={(event) => onSelect(event.target.value as Page)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
      {nav.map(([key, , label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  )
}
