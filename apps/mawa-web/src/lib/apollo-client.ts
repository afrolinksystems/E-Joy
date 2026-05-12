import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const uri =
  import.meta.env.VITE_GRAPHQL_URL?.trim() || "http://localhost:9602/graphql";

export const orderServiceApollo = new ApolloClient({
  link: new HttpLink({ uri, credentials: "include" }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "network-only" },
    query: { fetchPolicy: "network-only" },
  },
});

export const defaultShopId =
  import.meta.env.VITE_DEFAULT_SHOP_ID?.trim() || "test-shop-001";
