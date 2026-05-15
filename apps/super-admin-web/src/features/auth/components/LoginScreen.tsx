import { Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { usePlatformLogin } from '../hooks/usePlatformLogin'

type LoginScreenProps = {
  error?: string
  onLoggedIn: (expiresAt: string) => void
}

export function LoginScreen({ error, onLoggedIn }: LoginScreenProps) {
  const login = usePlatformLogin({ error, onLoggedIn })

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form onSubmit={(event) => void login.submit(event)} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <ShieldCheck size={23} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">Super admin login</h1>
            <p className="text-sm text-slate-500">Platform operations for E-Joy.</p>
          </div>
        </div>
        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Email or phone
          <input value={login.identifier} onChange={(event) => login.setIdentifier(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Password
          <input type="password" value={login.password} onChange={(event) => login.setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        {login.formError ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{login.formError}</div> : null}
        <button disabled={login.disabled} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {login.loading ? <Loader2 className="animate-spin" size={17} /> : <LogIn size={17} />}
          Sign in
        </button>
      </form>
    </main>
  )
}
