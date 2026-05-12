import { Navigate, useNavigate, useParams } from 'react-router-dom'
import OrderDetailPage from '../pages/OrderDetailPage'

export function OrderDetailRoute() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  if (!orderId?.trim()) {
    return <Navigate to="/" replace />
  }
  return (
    <OrderDetailPage
      orderId={orderId}
      onBack={() => {
        if (window.history.length > 1) navigate(-1)
        else navigate('/', { replace: true })
      }}
    />
  )
}
