import { ApolloProvider } from '@apollo/client/react'
import type { ReactNode } from 'react'
import { apolloClient } from '../lib/apollo'
import { AppErrorBoundary } from '../lib/errorTracking'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppErrorBoundary>
      <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
    </AppErrorBoundary>
  )
}
