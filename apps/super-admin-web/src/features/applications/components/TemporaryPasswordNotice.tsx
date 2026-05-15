type TemporaryPasswordNoticeProps = {
  password: string
}

export function TemporaryPasswordNotice({ password }: TemporaryPasswordNoticeProps) {
  if (!password) return null

  return (
    <div className="mx-4 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      Temporary manager password: <strong>{password}</strong>
    </div>
  )
}
