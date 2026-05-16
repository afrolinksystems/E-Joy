import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'

type CustomerQrSampleProps = {
  shopId: string
}

export function CustomerQrSample({ shopId }: CustomerQrSampleProps) {
  const qrUrl = `http://localhost:9601/?shopId=${encodeURIComponent(shopId)}&table=Hall%20A1`

  return (
    <Alert>
      <AlertTitle>Customer QR URL sample</AlertTitle>
      <AlertDescription className="break-all font-mono">{qrUrl}</AlertDescription>
    </Alert>
  )
}
