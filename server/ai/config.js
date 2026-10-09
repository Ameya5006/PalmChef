export function aiListenConfig(env = process.env) {
  const port = Number(env.PORT || env.AI_PORT || 3001)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid AI service port')
  return { port, host: env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost' }
}

export function aiAllowedOrigin(env = process.env) {
  const origin = env.AI_ALLOWED_ORIGIN || (env.NODE_ENV === 'production' ? '' : 'http://localhost:5173')
  let parsed
  try { parsed = new URL(origin) } catch { throw new Error('AI_ALLOWED_ORIGIN must be an exact HTTP(S) origin') }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin || parsed.username || parsed.password) {
    throw new Error('AI_ALLOWED_ORIGIN must be an exact HTTP(S) origin')
  }
  return origin
}
