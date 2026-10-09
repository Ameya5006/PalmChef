import type { ToolCall } from './tools'

export type AiResponse = { message?: string; sessionId?: string; calls?: ToolCall[]; error?: string }

export async function readAiResponse(response: Response): Promise<AiResponse> {
  const contentType = response.headers.get('content-type') || ''
  let body: unknown
  if (/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(contentType)) {
    try { body = await response.json() } catch { /* A proxy or server may send invalid JSON. */ }
  }
  const parsed = body && typeof body === 'object' && !Array.isArray(body) ? body as AiResponse : null
  if (!response.ok) {
    if (typeof parsed?.error === 'string' && parsed.error) throw new Error(parsed.error)
    if (response.status === 413) throw new Error('AI request is too large. Shorten the recipe or request and try again.')
    throw new Error(`AI request failed (HTTP ${response.status}). Please try again.`)
  }
  if (!parsed) throw new Error('AI returned an unreadable response. Please try again.')
  return parsed
}
