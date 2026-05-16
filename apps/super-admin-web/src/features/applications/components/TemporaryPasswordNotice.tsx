import { Alert, AlertDescription } from '../../../components/ui/alert'

type TemporaryPasswordNoticeProps = {
  password: string
}

export function TemporaryPasswordNotice({ password }: TemporaryPasswordNoticeProps) {
  if (!password) return null

  return (
    <Alert className="mx-4 mb-3 border-amber-200 bg-amber-50 text-amber-900">
      <AlertDescription>
        Temporary manager password: <strong>{password}</strong>
      </AlertDescription>
    </Alert>
  )
}
