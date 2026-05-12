/** order-service base URL (REST upload + GraphQL). */
export const ORDER_SERVICE_ORIGIN =
  import.meta.env.VITE_ORDER_SERVICE_ORIGIN ?? 'http://localhost:9602'

/** Upload an image via order-service → Cloudinary; returns HTTPS URL (secure_url). */
export async function uploadPublicImage(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const token =
    sessionStorage.getItem('ejoy_admin_access_token')?.trim() ||
    import.meta.env.VITE_ADMIN_BEARER_TOKEN?.trim()
  const res = await fetch(`${ORDER_SERVICE_ORIGIN}/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  const data = (await res.json()) as { url?: string }
  if (!data?.url) throw new Error('Response missing url field')
  return data.url
}
