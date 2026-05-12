/**
 * Telebirr sandbox redirect URL (same path as order-service `PaymentController` GET
 * and GraphQL `initiateMockPayment`). Built client-side so payment works even when
 * the GraphQL schema omits `initiateMockPayment` (e.g. stale server build).
 */
export function getOrderServiceHttpOrigin(): string {
  const fromGraphql = import.meta.env.VITE_GRAPHQL_URL?.trim()
  if (fromGraphql) {
    const origin = fromGraphql.replace(/\/graphql\/?$/i, '').replace(/\/$/, '')
    if (origin) return origin
  }
  const explicit = import.meta.env.VITE_ORDER_SERVICE_ORIGIN?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  return 'http://localhost:9602'
}

export function buildMockTelebirrRedirectUrl(
  orderId: string,
  amountCent?: number,
): string {
  const url = new URL('/mock-telebirr', window.location.origin)
  url.searchParams.set('orderId', orderId)
  if (typeof amountCent === 'number') {
    url.searchParams.set('amount', String(amountCent))
  }
  return url.toString()
}
