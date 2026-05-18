import { useMutation, useQuery } from '@apollo/client/react'
import { useEffect, useState } from 'react'
import {
  LOGOUT,
  MERCHANT_ME,
  REFRESH_SESSION,
  type MerchantMeData,
  type RefreshSessionData,
} from '../../../graphql/auth'
import {
  apolloClient,
  clearAdminAccessToken,
  setAdminAccessToken,
} from '../../../lib/apollo'

export function useMerchantSession() {
  const [hasToken, setHasToken] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null)
  const [refreshSession] = useMutation<RefreshSessionData>(REFRESH_SESSION)
  const [logoutMutation] = useMutation(LOGOUT)
  const me = useQuery<MerchantMeData>(MERCHANT_ME, {
    skip: !hasToken,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    let alive = true
    async function restoreSession() {
      try {
        const result = await refreshSession()
        const token = result.data?.refreshSession?.accessToken
        if (token) {
          setAdminAccessToken(token)
          if (alive) setAccessExpiresAt(result.data?.refreshSession?.expiresAt ?? null)
          if (alive) setHasToken(true)
        }
      } catch {
        clearAdminAccessToken()
        if (alive) setHasToken(false)
      } finally {
        if (alive) setBootstrapped(true)
      }
    }
    void restoreSession()
    return () => {
      alive = false
    }
  }, [refreshSession])

  useEffect(() => {
    function handleAuthExpired() {
      clearAdminAccessToken()
      void apolloClient.clearStore()
      setHasToken(false)
      setBootstrapped(true)
      setAccessExpiresAt(null)
    }
    window.addEventListener('ejoy-auth-expired', handleAuthExpired)
    return () => window.removeEventListener('ejoy-auth-expired', handleAuthExpired)
  }, [])

  useEffect(() => {
    function handleAuthRefreshed(event: Event) {
      const expiresAt = (event as CustomEvent<{ expiresAt?: string }>).detail?.expiresAt
      setAccessExpiresAt(expiresAt ?? null)
      setHasToken(Boolean(expiresAt))
    }
    window.addEventListener('ejoy-auth-refreshed', handleAuthRefreshed)
    return () => window.removeEventListener('ejoy-auth-refreshed', handleAuthRefreshed)
  }, [])

  useEffect(() => {
    if (!hasToken || !accessExpiresAt) return
    const expiresMs = new Date(accessExpiresAt).getTime()
    const refreshInMs = Math.max(0, expiresMs - Date.now() - 30_000)
    const timer = window.setTimeout(() => {
      void refreshSession()
        .then((result) => {
          const session = result.data?.refreshSession
          if (!session?.accessToken) throw new Error('Session expired')
          setAdminAccessToken(session.accessToken)
          setAccessExpiresAt(session.expiresAt)
          setHasToken(true)
        })
        .catch(() => {
          clearAdminAccessToken()
          void apolloClient.clearStore()
          setAccessExpiresAt(null)
          setHasToken(false)
        })
    }, refreshInMs)
    return () => window.clearTimeout(timer)
  }, [accessExpiresAt, hasToken, refreshSession])

  async function logout() {
    setHasToken(false)
    setAccessExpiresAt(null)
    clearAdminAccessToken()
    try {
      await logoutMutation()
    } catch (err) {
      void err
    }
    clearAdminAccessToken()
    await apolloClient.clearStore()
  }

  function markLoggedIn(expiresAt: string) {
    setAccessExpiresAt(expiresAt)
    setHasToken(true)
    void me.refetch()
  }

  return {
    bootstrapped,
    hasToken,
    logout,
    markLoggedIn,
    me,
  }
}
