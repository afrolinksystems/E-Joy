import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { SubmittedApplication } from '../application.types'

type ApplicationSuccessProps = {
  application: SubmittedApplication
}

export function ApplicationSuccess({ application }: ApplicationSuccessProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-lg place-items-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-green-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Application submitted</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We received the application for {application.shopName}. A platform admin will review it and contact {application.contactName}.
          </p>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="font-semibold">Reference</div>
            <div className="mt-1 font-mono text-xs text-slate-500">{application.id}</div>
            <div className="mt-3 font-semibold">Status</div>
            <div className="mt-1 text-slate-600">{application.status}</div>
          </div>
          <Link to="/" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">
            Go to merchant login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
