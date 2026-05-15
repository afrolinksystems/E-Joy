type CustomerQrSampleProps = {
  shopId: string
}

export function CustomerQrSample({ shopId }: CustomerQrSampleProps) {
  const qrUrl = `http://localhost:9601/?shopId=${encodeURIComponent(shopId)}&table=Hall%20A1`

  return (
    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      Customer QR URL sample: <span className="break-all font-mono">{qrUrl}</span>
    </div>
  )
}
