import { TableCell, TableRow } from '../../../components/ui/table'

type EmptyRowProps = {
  colSpan: number
  label: string
}

export function EmptyRow({ colSpan, label }: EmptyRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  )
}
