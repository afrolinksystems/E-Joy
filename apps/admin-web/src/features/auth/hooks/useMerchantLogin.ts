import { useMutation } from '@apollo/client/react'
import { useState, type FormEvent } from 'react'
import { STAFF_LOGIN, type StaffLoginData } from '../../../graphql/auth'
import { apolloClient, setAdminAccessToken } from '../../../lib/apollo'

const FALLBACK_SESSION_MS = 15 * 60_000

type UseMerchantLoginOptions = {
  error?: string
  onLoggedIn: (expiresAt: string) => void
}

export function useMerchantLogin({ error, onLoggedIn }: UseMerchantLoginOptions) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(error ?? null)
  const [login, { loading }] = useMutation<StaffLoginData>(STAFF_LOGIN)
  const disabled = loading || !phone.trim() || !password.trim()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    try {
      const result = await login({ variables: { phone: phone.trim(), password } })
      const token = result.data?.staffLogin.accessToken
      const expiresAt = result.data?.staffLogin.expiresAt
      if (!token) throw new Error('Login failed')
      setAdminAccessToken(token)
      await apolloClient.resetStore()
      onLoggedIn(expiresAt ?? new Date(Date.now() + FALLBACK_SESSION_MS).toISOString())
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return {
    disabled,
    formError,
    loading,
    password,
    phone,
    setPassword,
    setPhone,
    submit,
  }
}
