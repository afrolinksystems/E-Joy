import { Loader2, RefreshCw } from 'lucide-react'
import { PrintRetryResult } from './components/PrintRetryResult'
import { usePrintRetryTool } from './hooks/usePrintRetryTool'

export function OperationsPage() {
  const retry = usePrintRetryTool()

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold">Print retry tool</h2>
      <p className="mt-1 text-sm text-slate-500">Run the platform print retry cycle globally or for one shop.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input value={retry.shopId} onChange={(event) => retry.setShopId(event.target.value)} placeholder="Optional shop id" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={() => void retry.execute()} disabled={retry.loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {retry.loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          Run retry
        </button>
      </div>
      <PrintRetryResult result={retry.result} />
    </section>
  )
}
