import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { apolloClient } from './lib/apollo'
import { OrderDetailRoute } from './routes/OrderDetailRoute'
import { MockTelebirrRoute } from './routes/MockTelebirrRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/mock-telebirr" element={<MockTelebirrRoute />} />
          <Route path="/orders/:orderId" element={<OrderDetailRoute />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  </StrictMode>,
)
