import { Search } from 'lucide-react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../../../components/ui/input-group'

type SearchBoxProps = {
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

export function SearchBox({ onChange, placeholder = 'Search', value }: SearchBoxProps) {
  return (
    <InputGroup className="w-64">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </InputGroup>
  )
}
