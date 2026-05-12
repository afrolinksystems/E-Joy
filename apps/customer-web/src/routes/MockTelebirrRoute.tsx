import { useMutation } from '@apollo/client/react'
import { ArrowLeft, Check, Loader2, X } from 'lucide-react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CONFIRM_MOCK_TELEBIRR_PAYMENT,
  type ConfirmMockTelebirrPaymentData,
} from '../graphql/confirmMockTelebirrPayment'

function formatEtb(amountCent: number): string {
  return (amountCent / 100).toFixed(2)
}

export function MockTelebirrRoute() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const orderId = params.get('orderId')?.trim() ?? ''
  const amountCent = Number(params.get('amount') ?? '0')
  const amount = Number.isFinite(amountCent) && amountCent > 0 ? amountCent : 0
  const serviceFeeCent = amount > 0 ? 100 : 0
  const payableCent = amount + serviceFeeCent
  const [confirm, confirmState] =
    useMutation<ConfirmMockTelebirrPaymentData>(CONFIRM_MOCK_TELEBIRR_PAYMENT)

  if (!orderId) {
    return <Navigate to="/" replace />
  }

  async function completePayment() {
    await confirm({ variables: { orderId } })
  }

  return (
    <main className="telebirr-page">
      <section className="telebirr-phone">
        <header className="telebirr-status">
          <span>Ethio telecom</span>
          <strong>5:13 PM</strong>
          <span>67%</span>
        </header>
        <div className="telebirr-topbar">
          <button type="button" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={23} />
          </button>
        </div>
        <div className="telebirr-backdrop" />
        {confirmState.data?.confirmMockTelebirrPayment ? (
          <section className="telebirr-success">
            <div className="telebirr-check">
              <Check size={40} />
            </div>
            <p>Successful</p>
            <strong>- {formatEtb(payableCent)}</strong>
            <span>(ETB)</span>
            <button type="button" onClick={() => navigate('/order-success', { replace: true })}>
              OK
            </button>
          </section>
        ) : (
          <section className="telebirr-sheet">
            <button className="telebirr-close" type="button" onClick={() => navigate(-1)}>
              <X size={28} />
            </button>
            <h1>Pay to Merchant</h1>
            <div className="telebirr-amount">
              {formatEtb(payableCent)}
              <span>ETB</span>
            </div>
            <div className="telebirr-summary">
              <div>
                <span>Original Amount</span>
                <strong>{formatEtb(amount)}ETB</strong>
              </div>
              <div>
                <span>Service fee</span>
                <strong>{formatEtb(serviceFeeCent)}ETB</strong>
              </div>
            </div>
            <div className="telebirr-methods">
              <h2>Payment Method</h2>
              <label>
                <span className="telebirr-wallet">▣</span>
                <span>
                  <strong>Balance</strong>
                  <small>(Available Balance: 908.00ETB)</small>
                </span>
                <b>✓</b>
              </label>
              <label className="disabled">
                <span className="telebirr-wallet reward">◆</span>
                <span>
                  <strong>Reward Balance</strong>
                  <small>(0.00ETB Not sufficient)</small>
                </span>
              </label>
            </div>
            {confirmState.error ? (
              <p className="telebirr-error">{confirmState.error.message}</p>
            ) : null}
            <button
              className="telebirr-send"
              type="button"
              disabled={confirmState.loading}
              onClick={() => void completePayment()}
            >
              {confirmState.loading ? <Loader2 className="spin" size={20} /> : null}
              Send
            </button>
            <div className="telebirr-pin">
              <p>Enter PIN</p>
              <div>
                {Array.from({ length: 6 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
