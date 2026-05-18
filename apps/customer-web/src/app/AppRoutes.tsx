import { Route, Routes } from 'react-router-dom'
import { CustomerOrderingPage } from '../features/customer-ordering/CustomerOrderingPage'
import { MockTelebirrRoute } from '../features/mock-payment/MockTelebirrRoute'
import { OrderDetailRoute } from '../features/order-detail/OrderDetailRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/mock-telebirr" element={<MockTelebirrRoute />} />
      <Route path="/orders/:orderId" element={<OrderDetailRoute />} />
      <Route path="/*" element={<CustomerOrderingPage />} />
    </Routes>
  )
}
