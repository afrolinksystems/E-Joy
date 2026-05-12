import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react";
import "./index.css";
import App from "./App.tsx";
import { orderServiceApollo } from "./lib/apollo-client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApolloProvider client={orderServiceApollo}>
      <App />
    </ApolloProvider>
  </StrictMode>,
);
