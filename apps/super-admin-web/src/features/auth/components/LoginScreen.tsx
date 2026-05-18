import { LogIn, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { Field, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Spinner } from '../../../components/ui/spinner'
import { usePlatformLogin } from '../hooks/usePlatformLogin'

type LoginScreenProps = {
  error?: string
  onLoggedIn: (expiresAt: string) => void
}

export function LoginScreen({ error, onLoggedIn }: LoginScreenProps) {
  const login = usePlatformLogin({ error, onLoggedIn })

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl">
        <form onSubmit={(event) => void login.submit(event)}>
          <CardHeader className="grid-cols-[auto_1fr] items-center gap-x-3">
            <div className="grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Super admin login</CardTitle>
              <CardDescription>Platform operations for E-Joy.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="platform-identifier">Email or phone</FieldLabel>
                <Input
                  id="platform-identifier"
                  value={login.identifier}
                  onChange={(event) => login.setIdentifier(event.target.value)}
                  className="h-10"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="platform-password">Password</FieldLabel>
                <Input
                  id="platform-password"
                  type="password"
                  value={login.password}
                  onChange={(event) => login.setPassword(event.target.value)}
                  className="h-10"
                />
              </Field>
            </FieldGroup>
            {login.formError ? (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Sign in failed</AlertTitle>
                <AlertDescription>{login.formError}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={login.disabled} className="h-10 w-full">
              {login.loading ? <Spinner data-icon="inline-start" /> : <LogIn data-icon="inline-start" />}
              Sign in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
