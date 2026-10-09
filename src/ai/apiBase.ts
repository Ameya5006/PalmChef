export function resolveAiApiBase(value: string, production: boolean): string {
  const configured = value.trim()
  if (!configured) {
    if (production) throw new Error('AI service URL is missing from this frontend build.')
    return '' // Local Vite proxy.
  }
  let url: URL
  try { url = new URL(configured) } catch { throw new Error('AI service URL must be a full origin.') }
  const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
  if ((url.protocol !== 'https:' && (production || !localHttp)) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('AI service URL must be an HTTPS origin without /api/ai or other paths.')
  }
  return url.origin
}
