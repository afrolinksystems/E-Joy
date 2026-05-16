import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import type { SubmittedApplication } from '../application.types'

type ApplicationSuccessProps = {
  application: SubmittedApplication
}

export function ApplicationSuccess({ application }: ApplicationSuccessProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-lg place-items-center">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <div className="grid size-14 place-items-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 />
            </div>
            <CardTitle className="mt-2 text-2xl font-bold">Application submitted</CardTitle>
            <CardDescription className="text-sm leading-6">
              We received the application for {application.shopName}. A platform admin will review it and contact {application.contactName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div className="font-semibold">Reference</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{application.id}</div>
              <div className="mt-3 font-semibold">Status</div>
              <Badge className="mt-1" variant="secondary">{application.status}</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button render={<Link to="/" />} className="h-10 w-full">
              Go to merchant login
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}
