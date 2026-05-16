import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import type { NavItem, Page } from '../platform-console.types'

type MobilePageSelectProps = {
  nav: NavItem[]
  onSelect: (page: Page) => void
  page: Page
}

export function MobilePageSelect({ nav, onSelect, page }: MobilePageSelectProps) {
  return (
    <NativeSelect value={page} onChange={(event) => onSelect(event.target.value as Page)}>
      {nav.map(([key, , label]) => (
        <NativeSelectOption key={key} value={key}>
          {label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
