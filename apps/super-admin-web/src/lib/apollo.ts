import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

export const SUPER_ADMIN_TOKEN_KEY = 'ejoy_super_admin_access_token'

const httpUri = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:9602/graphql'
const httpLink = new HttpLink({ uri: httpUri })

const authLink = setContext((_, { headers }) => {
  const token = sessionStorage.getItem(SUPER_ADMIN_TOKEN_KEY)?.trim()
  if (!token) return { headers }
  return {
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})
