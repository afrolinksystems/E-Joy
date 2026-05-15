import { Store } from 'lucide-react'

type ShopSettingsHeaderProps = {
  shopId: string | null
}

export function ShopSettingsHeader({ shopId }: ShopSettingsHeaderProps) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600">
        <Store className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Shop settings</h2>
        <p className="text-sm text-slate-500">
          Shop{' '}
          <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">
            {shopId}
          </code>
        </p>
      </div>
    </div>
  )
}

