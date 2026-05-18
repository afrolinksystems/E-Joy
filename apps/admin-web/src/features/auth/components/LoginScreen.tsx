import { Loader2, LogIn } from 'lucide-react'
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
import { useMerchantLogin } from '../hooks/useMerchantLogin'

type LoginScreenProps = {
  error?: string
  onLoggedIn: (expiresAt: string) => void
}

export function LoginScreen({ error, onLoggedIn }: LoginScreenProps) {
  const login = useMerchantLogin({ error, onLoggedIn })

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl">
        <form onSubmit={(event) => void login.submit(event)}>
          <CardHeader className="grid-cols-[auto_1fr] items-center gap-x-3">
            <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <LogIn />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Merchant login</CardTitle>
              <CardDescription>Sign in to your restaurant console.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="merchant-phone">Phone</FieldLabel>
                <Input
                  id="merchant-phone"
                  value={login.phone}
                  onChange={(event) => login.setPhone(event.target.value)}
                  autoComplete="username"
                  className="h-10"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="merchant-password">Password</FieldLabel>
                <Input
                  id="merchant-password"
                  type="password"
                  value={login.password}
                  onChange={(event) => login.setPassword(event.target.value)}
                  autoComplete="current-password"
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
              {login.loading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
              Sign in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
