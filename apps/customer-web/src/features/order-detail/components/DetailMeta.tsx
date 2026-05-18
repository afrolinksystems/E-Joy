type DetailMetaProps = {
  label: string
  value: string
}

export function DetailMeta({ label, value }: DetailMetaProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 text-right font-bold">{value}</dd>
    </div>
  )
}
