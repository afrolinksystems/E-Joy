import { ApolloProvider } from '@apollo/client/react'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { apolloClient } from '../lib/apollo'
import { AppErrorBoundary } from '../lib/errorTracking'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </ApolloProvider>
    </AppErrorBoundary>
  )
}
