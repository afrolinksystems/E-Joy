import { Route, Routes } from 'react-router-dom'
import { RestaurantApplicationPage } from '../features/application/RestaurantApplicationPage'
import { ProtectedAdminRoutes } from '../features/merchant-session/ProtectedAdminRoutes'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/apply" element={<RestaurantApplicationPage />} />
      <Route path="/*" element={<ProtectedAdminRoutes />} />
    </Routes>
  )
}
