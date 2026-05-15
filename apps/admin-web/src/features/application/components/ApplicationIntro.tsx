import { ArrowRight, ClipboardList, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ApplicationIntro() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-100 text-orange-700">
        <ClipboardList className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-3xl font-black tracking-normal">Register your restaurant</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
        Submit your restaurant details for E-Joy review. After approval, your manager account and temporary password will be issued by the platform team.
      </p>
      <div className="mt-6 space-y-3 text-sm text-slate-600">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <span>Applications are reviewed before any merchant access is created.</span>
        </div>
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
          <span>Approved restaurants receive a dedicated manager login.</span>
        </div>
      </div>
      <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800">
        Already approved? Sign in
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
