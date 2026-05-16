import { ArrowRight, ClipboardList, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'

export function ApplicationIntro() {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
          <ClipboardList />
        </div>
        <CardTitle className="mt-2 text-3xl font-black">Register your restaurant</CardTitle>
        <CardDescription className="max-w-md text-sm leading-6">
          Submit your restaurant details for E-Joy review. After approval, your manager account and temporary password will be issued by the platform team.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary" />
          <span>Applications are reviewed before any merchant access is created.</span>
        </div>
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary" />
          <span>Approved restaurants receive a dedicated manager login.</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button render={<Link to="/" />} variant="link" className="px-0">
          Already approved? Sign in
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
