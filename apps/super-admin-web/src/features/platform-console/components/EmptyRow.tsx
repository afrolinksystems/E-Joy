type EmptyRowProps = {
  colSpan: number
  label: string
}

export function EmptyRow({ colSpan, label }: EmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-slate-500">
        {label}
      </td>
    </tr>
  )
}
