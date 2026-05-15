import { Search } from 'lucide-react'

type SearchBoxProps = {
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

export function SearchBox({ onChange, placeholder = 'Search', value }: SearchBoxProps) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-64 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
      />
    </div>
  )
}
