import { Loader2, LogIn } from 'lucide-react'
import { useMerchantLogin } from '../hooks/useMerchantLogin'

type LoginScreenProps = {
  error?: string
  onLoggedIn: (expiresAt: string) => void
}

export function LoginScreen({ error, onLoggedIn }: LoginScreenProps) {
  const login = useMerchantLogin({ error, onLoggedIn })

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={(event) => void login.submit(event)} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-100 text-orange-700">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">Merchant login</h1>
            <p className="text-sm text-slate-500">Sign in to your restaurant console.</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input value={login.phone} onChange={(event) => login.setPhone(event.target.value)} autoComplete="username" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input type="password" value={login.password} onChange={(event) => login.setPassword(event.target.value)} autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:border-orange-500 focus:ring-2" />
          </label>
        </div>
        {login.formError ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{login.formError}</div> : null}
        <button type="submit" disabled={login.disabled} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50">
          {login.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>
      </form>
    </main>
  )
}
