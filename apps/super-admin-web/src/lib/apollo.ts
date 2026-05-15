import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { setContext } from '@apollo/client/link/context'
import { ErrorLink } from '@apollo/client/link/error'
import { Observable } from '@apollo/client/utilities'
import { captureFrontendException } from './tracking'

let superAdminAccessToken = ''

export function setSuperAdminAccessToken(token: string) {
  superAdminAccessToken = token
}

export function clearSuperAdminAccessToken() {
  superAdminAccessToken = ''
}

const httpUri = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:9602/graphql'
const httpLink = new HttpLink({ uri: httpUri, credentials: 'include' })

const refreshMutation = `
  mutation RefreshSession {
    refreshSession {
      accessToken
      expiresAt
    }
  }
`

type RefreshedSession = {
  accessToken: string
  expiresAt?: string
}

let refreshPromise: Promise<RefreshedSession | null> | null = null

function notifyAuthExpired() {
  clearSuperAdminAccessToken()
  window.dispatchEvent(new CustomEvent('ejoy-auth-expired'))
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(httpUri, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: refreshMutation, operationName: 'RefreshSession' }),
    })
      .then(async (response) => {
        if (!response.ok) return null
        const payload = (await response.json()) as {
          data?: { refreshSession?: { accessToken?: string; expiresAt?: string } }
          errors?: unknown[]
        }
        if (payload.errors?.length) return null
        const session = payload.data?.refreshSession
        return session?.accessToken
          ? { accessToken: session.accessToken, expiresAt: session.expiresAt }
          : null
      })
      .then((session) => {
        if (session) {
          setSuperAdminAccessToken(session.accessToken)
          window.dispatchEvent(
            new CustomEvent('ejoy-auth-refreshed', {
              detail: { expiresAt: session.expiresAt },
            }),
          )
          return session
        }
        notifyAuthExpired()
        return null
      })
      .catch(() => {
        notifyAuthExpired()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function isUnauthenticated(error: unknown) {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some(
      (err) =>
        err.extensions?.code === 'UNAUTHENTICATED' ||
        err.message.toLowerCase() === 'unauthorized',
    )
  }
  const statusCode = (error as { statusCode?: number })?.statusCode
  return statusCode === 401
}

const refreshOnAuthErrorLink = new ErrorLink(({ error, operation, forward }) => {
  const alreadyRetried = operation.getContext().authRetry === true
  const operationName = operation.operationName ?? ''
  const isAuthOperation = ['PlatformLogin', 'RefreshSession', 'Logout'].includes(operationName)
  if (alreadyRetried || isAuthOperation || !isUnauthenticated(error)) {
    return
  }

  return new Observable((observer) => {
    void refreshAccessToken().then((session) => {
      if (!session) {
        observer.error(error)
        return
      }
      operation.setContext(({ headers = {} }) => ({
        authRetry: true,
        headers: {
          ...headers,
          Authorization: `Bearer ${session.accessToken}`,
        },
      }))
      forward(operation).subscribe(observer)
    })
  })
})

const captureGraphqlErrorLink = new ErrorLink(({ error, operation }) => {
  const operationName = operation.operationName ?? 'anonymous'
  if (['PlatformLogin', 'RefreshSession'].includes(operationName)) return
  captureFrontendException(error, {
    operationName,
    graphQLErrors: CombinedGraphQLErrors.is(error)
      ? error.errors.map((err) => ({
          message: err.message,
          code: err.extensions?.code,
          path: err.path?.join('.'),
        }))
      : undefined,
  })
})

const authLink = setContext((_, { headers }) => {
  const token = superAdminAccessToken
  if (!token) return { headers }
  return {
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  }
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    refreshOnAuthErrorLink,
    captureGraphqlErrorLink,
    authLink,
    httpLink,
  ]),
  cache: new InMemoryCache(),
})
