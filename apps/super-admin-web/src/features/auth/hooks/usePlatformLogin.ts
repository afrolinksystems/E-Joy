import { useMutation } from '@apollo/client/react'
import { useState, type FormEvent } from 'react'
import { PLATFORM_LOGIN } from '../../../graphql/session'
import { apolloClient, setSuperAdminAccessToken } from '../../../lib/apollo'
import type { PlatformLoginResult } from '../auth.types'

const DEFAULT_IDENTIFIER = 'owner@ejoy.local'
const FALLBACK_SESSION_MS = 15 * 60_000

type UsePlatformLoginOptions = {
  error?: string
  onLoggedIn: (expiresAt: string) => void
}

export function usePlatformLogin({ error, onLoggedIn }: UsePlatformLoginOptions) {
  const [identifier, setIdentifier] = useState(DEFAULT_IDENTIFIER)
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState(error ?? '')
  const [login, loginState] = useMutation<PlatformLoginResult>(PLATFORM_LOGIN)
  const disabled = loginState.loading || !identifier.trim() || !password.trim()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    try {
      const result = await login({ variables: { identifier: identifier.trim(), password } })
      const token = result.data?.platformLogin.accessToken
      const expiresAt = result.data?.platformLogin.expiresAt
      if (!token) throw new Error('Login failed')
      setSuperAdminAccessToken(token)
      await apolloClient.resetStore()
      onLoggedIn(expiresAt ?? new Date(Date.now() + FALLBACK_SESSION_MS).toISOString())
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return {
    disabled,
    formError,
    identifier,
    loading: loginState.loading,
    password,
    setIdentifier,
    setPassword,
    submit,
  }
}
