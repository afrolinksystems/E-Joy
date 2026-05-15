import { Download, Printer, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { TableRow } from '../../../graphql/tables'
import { QR_SIZE, buildCustomerTableLink } from '../tables.utils'

type TableQRCodeModalProps = {
  open: boolean
  table: TableRow | null
  onClose: () => void
}

export function TableQRCodeModal({
  open,
  table,
  onClose,
}: TableQRCodeModalProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const link = useMemo(() => (table ? buildCustomerTableLink(table) : ''), [table])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const downloadPng = useCallback(() => {
    const svg = wrapRef.current?.querySelector('svg')
    if (!svg || !table) return

    const source = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = QR_SIZE
      canvas.height = QR_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, QR_SIZE, QR_SIZE)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url)
        if (!pngBlob) return
        const anchor = document.createElement('a')
        const safe = table.tableNumber.replace(/[^\w.-]+/g, '_')
        anchor.download = `table-${safe}-qr.png`
        anchor.href = URL.createObjectURL(pngBlob)
        anchor.click()
        URL.revokeObjectURL(anchor.href)
      }, 'image/png')
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }, [table])

  const printQr = useCallback(() => {
    const svg = wrapRef.current?.querySelector('svg')
    if (!svg || !table || !link) return

    const svgHtml = new XMLSerializer().serializeToString(svg)
    const iframe = document.createElement('iframe')
    iframe.setAttribute(
      'style',
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none',
    )
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    if (!doc) {
      document.body.removeChild(iframe)
      return
    }
    const safeLink = link
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    doc.open()
    doc.write(`<!DOCTYPE html><html><head><title>Table QR code</title></head>
<body style="margin:0;padding:24px;text-align:center;font-family:system-ui,sans-serif;">
<h1 style="font-size:18px;margin:0 0 16px;">Scan to order</h1>
<div style="display:inline-block;">${svgHtml}</div>
<p style="margin-top:16px;font-size:11px;color:#64748b;word-break:break-all;">${safeLink}</p>
</body></html>`)
    doc.close()
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 500)
  }, [link, table])

  if (!open || !table) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="qr-modal-title" className="text-lg font-semibold text-slate-900">
              Table QR code
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Table {table.tableNumber} · Shop {table.shopId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {!link ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Set <span className="font-mono">VITE_CUSTOMER_WEB_URL</span> in{' '}
            <span className="font-mono">.env.local</span> and restart the dev
            server.
          </p>
        ) : (
          <>
            <div className="mt-6 flex justify-center rounded-xl border border-slate-100 bg-white p-4">
              <div ref={wrapRef} className="inline-block">
                <QRCodeSVG value={link} size={QR_SIZE} />
              </div>
            </div>
            <p className="mt-3 break-all text-center text-xs text-slate-500">
              {link}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={downloadPng}
                disabled={!link}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                type="button"
                onClick={printQr}
                disabled={!link}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

