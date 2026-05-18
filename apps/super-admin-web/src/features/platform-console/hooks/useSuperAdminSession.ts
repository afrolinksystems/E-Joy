import { useMutation, useQuery } from '@apollo/client/react'
import { useEffect, useState } from 'react'
import { PLATFORM_ME, REFRESH_SESSION } from '../../../graphql/session'
import {
  apolloClient,
  clearSuperAdminAccessToken,
  setSuperAdminAccessToken,
} from '../../../lib/apollo'
import type { PlatformMe } from '../platform-console.types'

export function useSuperAdminSession() {
  const [hasToken, setHasToken] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null)
  const [refreshSession] = useMutation<{
    refreshSession?: { accessToken?: string; expiresAt?: string }
  }>(REFRESH_SESSION)
  const me = useQuery<{ platformMe: PlatformMe }>(PLATFORM_ME, {
    skip: !hasToken,
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    let alive = true
    async function restore() {
      try {
        const result = await refreshSession()
        const token = result.data?.refreshSession?.accessToken
        if (token) {
          setSuperAdminAccessToken(token)
          if (alive) setAccessExpiresAt(result.data?.refreshSession?.expiresAt ?? null)
          if (alive) setHasToken(true)
        }
      } catch {
        clearSuperAdminAccessToken()
        if (alive) setHasToken(false)
      } finally {
        if (alive) setBootstrapped(true)
      }
    }
    void restore()
    return () => {
      alive = false
    }
  }, [refreshSession])

  useEffect(() => {
    function handleAuthExpired() {
      clearSuperAdminAccessToken()
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
          setSuperAdminAccessToken(session.accessToken)
          setAccessExpiresAt(session.expiresAt ?? null)
          setHasToken(true)
        })
        .catch(() => {
          clearSuperAdminAccessToken()
          void apolloClient.clearStore()
          setAccessExpiresAt(null)
          setHasToken(false)
        })
    }, refreshInMs)
    return () => window.clearTimeout(timer)
  }, [accessExpiresAt, hasToken, refreshSession])

  function markLoggedIn(expiresAt: string) {
    setAccessExpiresAt(expiresAt)
    setHasToken(true)
  }

  function markLoggedOut() {
    setHasToken(false)
    setAccessExpiresAt(null)
  }

  return {
    bootstrapped,
    hasToken,
    markLoggedIn,
    markLoggedOut,
    me,
  }
}
