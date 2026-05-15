import { ApplicationForm } from './components/ApplicationForm'
import { ApplicationIntro } from './components/ApplicationIntro'
import { ApplicationSuccess } from './components/ApplicationSuccess'
import { useRestaurantApplication } from './hooks/useRestaurantApplication'

export function RestaurantApplicationPage() {
  const application = useRestaurantApplication()

  if (application.submitted) {
    return <ApplicationSuccess application={application.submitted} />
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ApplicationIntro />
        <ApplicationForm
          form={application.form}
          formError={application.formError}
          loading={application.loading}
          setField={application.setField}
          onSubmit={application.submit}
        />
      </section>
    </main>
  )
}
