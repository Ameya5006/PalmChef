// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { aiAllowedOrigin, aiListenConfig } from './config.js'
import { createAiApp } from './app.js'

describe('AI Web Service deployment configuration', () => {
  it('uses Render PORT and production host, with local fallbacks', () => {
    expect(aiListenConfig({ NODE_ENV: 'production', PORT: '10000', AI_PORT: '3001' })).toEqual({ port: 10000, host: '0.0.0.0' })
    expect(aiListenConfig({ AI_PORT: '3002' })).toEqual({ port: 3002, host: 'localhost' })
    expect(aiListenConfig({})).toEqual({ port: 3001, host: 'localhost' })
    expect(() => aiListenConfig({ PORT: 'invalid' })).toThrow(/port/i)
  })

  it('requires an exact configured origin in production and keeps the local default', () => {
    expect(aiAllowedOrigin({})).toBe('http://localhost:5173')
    expect(aiAllowedOrigin({ NODE_ENV: 'production', AI_ALLOWED_ORIGIN: 'https://frontend.example' })).toBe('https://frontend.example')
    expect(() => aiAllowedOrigin({ NODE_ENV: 'production' })).toThrow(/origin/i)
    expect(() => aiAllowedOrigin({ NODE_ENV: 'production', AI_ALLOWED_ORIGIN: '*' })).toThrow(/origin/i)
    expect(() => aiAllowedOrigin({ NODE_ENV: 'production', AI_ALLOWED_ORIGIN: 'https://frontend.example/path' })).toThrow(/origin/i)
  })

  it('serves health checks and permits only the configured browser origin', async () => {
    const server = createAiApp({ allowedOrigin: 'https://frontend.example', gemini: {} }).listen(0)
    await new Promise(resolve => server.once('listening', resolve))
    const base = `http://127.0.0.1:${server.address().port}`
    try {
      const health = await fetch(`${base}/healthz`)
      expect(health.status).toBe(200)
      expect(await health.json()).toEqual({ status: 'ok' })
      const allowed = await fetch(`${base}/healthz`, { headers: { Origin: 'https://frontend.example' } })
      expect(allowed.headers.get('access-control-allow-origin')).toBe('https://frontend.example')
      const rejected = await fetch(`${base}/api/ai/turn`, { method: 'OPTIONS', headers: { Origin: 'https://frontend.example.evil' } })
      expect(rejected.status).toBe(403)
      expect(rejected.headers.get('access-control-allow-origin')).toBeNull()
      expect((await rejected.json()).error).toBe('Origin not allowed')
    } finally { await new Promise(resolve => server.close(resolve)) }
  })

  it('never returns provider details in API JSON errors', async () => {
    const server = createAiApp({ allowedOrigin: 'https://frontend.example', gemini: { generate: async () => { throw Error('secret-key and private request data') } } }).listen(0)
    await new Promise(resolve => server.once('listening', resolve))
    const base = `http://127.0.0.1:${server.address().port}`
    try {
      const response = await fetch(`${base}/api/ai/turn`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://frontend.example' }, body: JSON.stringify({ text: 'Help', context: { recipe: null, stepIndex: null, timer: { remainingSeconds: 0, active: false, paused: false, label: '' } } }) })
      expect(response.status).toBe(502)
      expect(response.headers.get('content-type')).toContain('application/json')
      const body = await response.json()
      expect(body.error).toMatch(/AI is unavailable/)
      expect(JSON.stringify(body)).not.toMatch(/secret-key|private request data|stack/i)
    } finally { await new Promise(resolve => server.close(resolve)) }
  })
})
