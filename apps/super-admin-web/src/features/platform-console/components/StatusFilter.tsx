import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import type { Status } from '../platform-console.types'

type StatusFilterProps = {
  onChange: (value: Status | '') => void
  value: Status | ''
}

export function StatusFilter({ onChange, value }: StatusFilterProps) {
  return (
    <NativeSelect value={value} onChange={(event) => onChange(event.target.value as Status | '')}>
      <NativeSelectOption value="">All</NativeSelectOption>
      <NativeSelectOption value="PENDING">Pending</NativeSelectOption>
      <NativeSelectOption value="APPROVED">Approved</NativeSelectOption>
      <NativeSelectOption value="REJECTED">Rejected</NativeSelectOption>
    </NativeSelect>
  )
}
