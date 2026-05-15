// apps/customer-web/src/lib/apollo.ts
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { captureFrontendException } from './tracking';

const demoToken =
  import.meta.env.VITE_DEMO_BEARER_TOKEN?.trim() || '';

// HTTP link (default port 9602)
const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:9602/graphql',
});

const captureGraphqlErrorLink = new ErrorLink(({ error, operation }) => {
  captureFrontendException(error, {
    operationName: operation.operationName ?? 'anonymous',
    graphQLErrors: CombinedGraphQLErrors.is(error)
      ? error.errors.map((err) => ({
          message: err.message,
          code: err.extensions?.code,
          path: err.path?.join('.'),
        }))
      : undefined,
  });
});

/** Injects Bearer on every GraphQL request (not only at first init). */
const authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    ...(demoToken ? { authorization: `Bearer ${demoToken}` } : {}),
  },
}));

const httpLinkWithAuth = ApolloLink.from([
  captureGraphqlErrorLink,
  authLink,
  httpLink,
]);

// WebSocket link (default port 9602)
const wsLink = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_GRAPHQL_WS_URL ?? 'ws://localhost:9602/graphql',
    connectionParams: () => ({
      ...(demoToken ? { Authorization: `Bearer ${demoToken}` } : {}),
    }),
  }),
);

// Split: subscriptions use wsLink; queries/mutations use authenticated HTTP.
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLinkWithAuth,
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
