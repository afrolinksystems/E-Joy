import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { createClient } from 'graphql-ws'

/** GraphQL HTTP endpoint (default: order-service :9602) */
const httpUri = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:9602/graphql'

const wsUri =
  import.meta.env.VITE_GRAPHQL_WS_URL ??
  (httpUri.startsWith('https')
    ? httpUri.replace(/^https/, 'wss')
    : httpUri.replace(/^http/, 'ws'))

const httpLink = new HttpLink({ uri: httpUri })

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUri,
    connectionParams: () => {
      const token =
        sessionStorage.getItem('ejoy_admin_access_token')?.trim() ||
        import.meta.env.VITE_ADMIN_BEARER_TOKEN?.trim()
      if (!token) {
        return {}
      }
      return { Authorization: `Bearer ${token}` }
    },
  }),
)

/**
 * Bearer auth for admin GraphQL. Merchant logins store the short-lived JWT in
 * sessionStorage; env token remains local-dev fallback only.
 */
const authLink = setContext((_, { headers }) => {
  const token =
    sessionStorage.getItem('ejoy_admin_access_token')?.trim() ||
    import.meta.env.VITE_ADMIN_BEARER_TOKEN?.trim()
  if (!token) {
    return { headers }
  }
  return {
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  }
})

const httpChain = authLink.concat(httpLink)

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query)
    return (
      def.kind === 'OperationDefinition' && def.operation === 'subscription'
    )
  },
  wsLink,
  httpChain,
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
