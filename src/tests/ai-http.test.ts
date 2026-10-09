import { describe, expect, it } from 'vitest'
import { readAiResponse } from '@/ai/http'

describe('AI HTTP responses', () => {
  it('shows an actionable error for an HTML 413 response', async () => {
    const response = new Response('<!DOCTYPE html><html>Error</html>', { status: 413, headers: { 'Content-Type': 'text/html' } })
    await expect(readAiResponse(response)).rejects.toThrow(/too large/i)
  })
  it('handles malformed JSON and other non-JSON server errors', async () => {
    await expect(readAiResponse(new Response('{', { status: 502, headers: { 'Content-Type': 'application/json' } }))).rejects.toThrow(/HTTP 502/)
    await expect(readAiResponse(new Response('<html>bad gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }))).rejects.toThrow(/HTTP 502/)
    await expect(readAiResponse(new Response('<html>unexpected</html>', { status: 200, headers: { 'Content-Type': 'text/html' } }))).rejects.toThrow(/unreadable response/)
  })
  it('uses a safe JSON error and accepts a normal tool response', async () => {
    await expect(readAiResponse(new Response(JSON.stringify({ error: 'Invalid cooking context.' }), { status: 400, headers: { 'Content-Type': 'application/json' } }))).rejects.toThrow('Invalid cooking context.')
    const result = await readAiResponse(new Response(JSON.stringify({ sessionId: 'session', calls: [{ id: 'one', name: 'next_step', args: {} }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    expect(result.calls?.[0].name).toBe('next_step')
  })
})
